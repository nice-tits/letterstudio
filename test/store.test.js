import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createStore } from '../src/store.js';

let dataDir;
let store;

before(() => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lettermill-store-test-'));
  store = createStore(dataDir);
});

after(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
});

function ageOrder(id, ageMs) {
  const ordersPath = path.join(dataDir, 'pending-orders.json');
  const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
  orders[id].createdAt = new Date(Date.now() - ageMs).toISOString();
  fs.writeFileSync(ordersPath, JSON.stringify(orders));
}

function writeOrders(patch) {
  const ordersPath = path.join(dataDir, 'pending-orders.json');
  const orders = fs.existsSync(ordersPath)
    ? JSON.parse(fs.readFileSync(ordersPath, 'utf8'))
    : {};
  Object.assign(orders, patch);
  fs.writeFileSync(ordersPath, JSON.stringify(orders));
}

test('sweepExpiredOrders removes orders older than 48h (49h aged), keeps fresh ones', () => {
  const oldId = store.createOrder({
    sku: 'diplomat',
    email: 'old@example.com',
    input: { message: 'x'.repeat(30) },
  });
  const freshId = store.createOrder({
    sku: 'gym-cancel',
    email: 'new@example.com',
    input: { fullName: 'Fresh' },
  });

  ageOrder(oldId, 49 * 60 * 60 * 1000);

  const removed = store.sweepExpiredOrders();
  assert.equal(removed, 1);
  assert.equal(store.getOrder(oldId), null);
  assert.ok(store.getOrder(freshId), 'fresh order must survive the sweep');
  assert.equal(store.sweepExpiredOrders(), 0);
});

test('sweepExpiredOrders treats invalid or missing createdAt as expired', () => {
  writeOrders({
    'bad-missing': { sku: 'diplomat', email: 'm@example.com', input: {} },
    'bad-invalid': { sku: 'diplomat', email: 'i@example.com', input: {}, createdAt: 'not-a-date' },
  });

  const removed = store.sweepExpiredOrders();
  assert.ok(removed >= 2);
  assert.equal(store.getOrder('bad-missing'), null);
  assert.equal(store.getOrder('bad-invalid'), null);
});

test('attachSession + deleteOrderBySessionId round-trip', () => {
  const id = store.createOrder({
    sku: 'diplomat',
    email: 'a@example.com',
    input: { message: 'y'.repeat(30) },
  });
  store.attachSession(id, 'cs_test_roundtrip');
  assert.equal(store.getOrder(id).stripeSessionId, 'cs_test_roundtrip');
  assert.equal(store.deleteOrderBySessionId('cs_test_roundtrip'), id);
  assert.equal(store.getOrder(id), null);
  assert.equal(store.deleteOrderBySessionId('cs_test_nope'), null);
});

test('claimEvent twice is duplicate; inflight is not processed until completeEvent', () => {
  assert.equal(store.claimEvent('evt_claim_twice'), 'new');
  assert.equal(store.hasProcessedEvent('evt_claim_twice'), false, 'inflight must not count as processed');
  assert.equal(store.claimEvent('evt_claim_twice'), 'duplicate');
  assert.equal(store.hasProcessedEvent('evt_claim_twice'), false);

  store.completeEvent('evt_claim_twice');
  assert.equal(store.hasProcessedEvent('evt_claim_twice'), true);
  assert.equal(store.claimEvent('evt_claim_twice'), 'duplicate');
});

test('releaseEvent clears inflight so the event can be reclaimed', () => {
  assert.equal(store.claimEvent('evt_release'), 'new');
  assert.equal(store.hasProcessedEvent('evt_release'), false);
  store.releaseEvent('evt_release');
  assert.equal(store.hasProcessedEvent('evt_release'), false);
  assert.equal(store.claimEvent('evt_release'), 'new');

  store.completeEvent('evt_release');
  store.releaseEvent('evt_release');
  assert.equal(store.hasProcessedEvent('evt_release'), true, 'releaseEvent must not undo a completed event');
  assert.equal(store.claimEvent('evt_release'), 'duplicate');
});

test('a stale store lock is broken instead of deadlocking, and released after the op', () => {
  const lockDir = path.join(dataDir, '.lock');
  fs.mkdirSync(lockDir, { recursive: true });
  const longAgo = new Date(Date.now() - 60_000);
  fs.utimesSync(lockDir, longAgo, longAgo);

  const id = store.createOrder({
    sku: 'diplomat',
    email: 'lock@example.com',
    input: { message: 'z'.repeat(30) },
  });
  assert.ok(store.getOrder(id), 'operation must proceed after breaking the stale lock');
  assert.ok(!fs.existsSync(lockDir), 'lock must be released after the operation');
});
