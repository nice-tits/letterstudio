import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Stripe from 'stripe';
import { createApp } from '../src/app.js';
import { createStore } from '../src/store.js';
import { createMailer } from '../src/mailer.js';

const WEBHOOK_SECRET = 'whsec_test_lettermill';
const stripe = new Stripe('sk_test_webhook_unused');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'lettermill-webhook-'));
}

function mailLines(dataDir) {
  const file = path.join(dataDir, 'mail-log.jsonl');
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').filter((line) => line.trim());
}

function signedPayload(payload) {
  return Stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
}

function sessionCompletedPayload({ eventId, orderId, sessionId = 'cs_test_wh' }) {
  return JSON.stringify({
    id: eventId,
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        object: 'checkout.session',
        metadata: { orderId },
      },
    },
  });
}

async function listen(app) {
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const { port } = server.address();
  return {
    base: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    },
  };
}

function makeApp(dataDir, store) {
  return createApp({
    dataDir,
    stripeClient: stripe,
    webhookSecret: WEBHOOK_SECRET,
    mailer: createMailer({ dataDir }),
    store,
  });
}

async function postWebhook(base, { payload, signature }) {
  return fetch(`${base}/webhook`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'stripe-signature': signature,
    },
    body: payload,
  });
}

function seedGymOrder(store, email = 'buyer@example.com') {
  return store.createOrder({
    sku: 'gym-cancel',
    email,
    input: {
      fullName: 'Pat Rivera',
      memberId: 'M-9',
      clubName: 'Iron Temple',
      clubAddress: '1 Main St',
      cancelBy: '2026-09-01',
    },
  });
}

test('bad webhook signature returns 400', async () => {
  const dataDir = tmpDir();
  const store = createStore(dataDir);
  const { base, close } = await listen(makeApp(dataDir, store));
  try {
    const payload = sessionCompletedPayload({ eventId: 'evt_bad', orderId: 'nope' });
    const res = await postWebhook(base, {
      payload,
      signature: 't=1,v1=deadbeef',
    });
    assert.equal(res.status, 400);
    assert.equal(mailLines(dataDir).length, 0);
  } finally {
    await close();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});

test('same checkout.session.completed twice writes exactly one mail-log.jsonl line', async () => {
  const dataDir = tmpDir();
  const store = createStore(dataDir);
  const orderId = seedGymOrder(store);
  const payload = sessionCompletedPayload({ eventId: 'evt_idempotent', orderId });
  const signature = signedPayload(payload);
  const { base, close } = await listen(makeApp(dataDir, store));
  try {
    const first = await postWebhook(base, { payload, signature });
    assert.equal(first.status, 200);
    const second = await postWebhook(base, { payload, signature });
    assert.equal(second.status, 200);
    const body = await second.json();
    assert.equal(body.duplicate, true);
    assert.equal(mailLines(dataDir).length, 1);
    const record = JSON.parse(mailLines(dataDir)[0]);
    assert.equal(record.to, 'buyer@example.com');
    assert.equal(record.via, 'mock');
  } finally {
    await close();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});

test('payment_intent.succeeded is ignored', async () => {
  const dataDir = tmpDir();
  const store = createStore(dataDir);
  seedGymOrder(store);
  const payload = JSON.stringify({
    id: 'evt_pi_ignore',
    object: 'event',
    type: 'payment_intent.succeeded',
    data: { object: { id: 'pi_test_1' } },
  });
  const { base, close } = await listen(makeApp(dataDir, store));
  try {
    const res = await postWebhook(base, { payload, signature: signedPayload(payload) });
    assert.equal(res.status, 200);
    assert.equal(mailLines(dataDir).length, 0);
  } finally {
    await close();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});

test('checkout.session.completed with unknown order returns 400 and does not completeEvent', async () => {
  const dataDir = tmpDir();
  const store = createStore(dataDir);
  const payload = sessionCompletedPayload({
    eventId: 'evt_missing_order',
    orderId: 'does-not-exist',
  });
  const { base, close } = await listen(makeApp(dataDir, store));
  try {
    const res = await postWebhook(base, { payload, signature: signedPayload(payload) });
    assert.equal(res.status, 400);
    assert.equal(store.hasProcessedEvent('evt_missing_order'), false);
    assert.equal(store.claimEvent('evt_missing_order'), 'new', 'must not leave event inflight after unknown order');
    store.releaseEvent('evt_missing_order');
    assert.equal(mailLines(dataDir).length, 0);
  } finally {
    await close();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});
