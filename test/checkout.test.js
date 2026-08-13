import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { createStore } from '../src/store.js';
import { createMailer } from '../src/mailer.js';

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'lettermill-checkout-'));
}

function fakeStripe(sessionId = 'cs_test_gym') {
  const calls = [];
  return {
    calls,
    checkout: {
      sessions: {
        async create(params) {
          calls.push(params);
          return {
            id: sessionId,
            url: `https://checkout.stripe.com/c/pay/${sessionId}`,
          };
        },
      },
    },
  };
}

function makeApp({ dataDir, stripeClient, store }) {
  return createApp({
    dataDir,
    stripeClient,
    webhookSecret: 'whsec_unused',
    mailer: createMailer({ dataDir }),
    store,
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

async function postForm(base, fields) {
  return fetch(`${base}/checkout`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields).toString(),
    redirect: 'manual',
  });
}

function readOrders(dataDir) {
  const file = path.join(dataDir, 'pending-orders.json');
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const GYM_FIELDS = {
  sku: 'gym-cancel',
  email: 'pat@example.com',
  fullName: 'Pat Rivera',
  memberId: 'M-1001',
  clubName: 'Iron Temple',
  clubAddress: '1 Main St',
  cancelBy: '2026-09-01',
};

test('home lists both products at $19.00 and is not legal advice', async () => {
  const dataDir = tmpDir();
  const store = createStore(dataDir);
  const stripeClient = fakeStripe();
  const { base, close } = await listen(makeApp({ dataDir, stripeClient, store }));
  try {
    const res = await fetch(`${base}/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /Membership Cancellation Letter/);
    assert.match(html, /Diplomat/);
    assert.match(html, /\$19\.00/);
    assert.match(html, /not legal advice/i);
    assert.match(html, /you send it yourself/i);
  } finally {
    await close();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});

test('privacy page exists and says Stripe handles cards', async () => {
  const dataDir = tmpDir();
  const store = createStore(dataDir);
  const { base, close } = await listen(makeApp({ dataDir, stripeClient: fakeStripe(), store }));
  try {
    const res = await fetch(`${base}/privacy`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /Stripe collects card numbers/i);
    assert.match(html, /not legal advice/i);
    const terms = await (await fetch(`${base}/terms`)).text();
    assert.match(terms, /not legal advice/i);
    assert.match(terms, /do not mail/i);
    const disc = await (await fetch(`${base}/disclosure`)).text();
    assert.match(disc, /As an Amazon Associate I earn from qualifying purchases/);
    const refunds = await (await fetch(`${base}/refunds`)).text();
    assert.match(refunds, /inbox/i);
  } finally {
    await close();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});

for (const sku of ['kitchen-sink', 'timeshare', 'infidelity', 'onlyfans']) {
  test(`rejects ${sku}`, async () => {
    const dataDir = tmpDir();
    const store = createStore(dataDir);
    const stripeClient = fakeStripe();
    const { base, close } = await listen(makeApp({ dataDir, stripeClient, store }));
    try {
      const res = await postForm(base, { sku, email: 'x@example.com', message: 'x'.repeat(40) });
      assert.equal(res.status, 400);
      assert.equal(stripeClient.calls.length, 0);
    } finally {
      await close();
      fs.rmSync(dataDir, { recursive: true, force: true });
    }
  });
}

test('rejects short diplomat message', async () => {
  const dataDir = tmpDir();
  const store = createStore(dataDir);
  const stripeClient = fakeStripe();
  const { base, close } = await listen(makeApp({ dataDir, stripeClient, store }));
  try {
    const res = await postForm(base, {
      sku: 'diplomat',
      email: 'pat@example.com',
      message: 'too short',
    });
    assert.equal(res.status, 400);
    assert.equal(stripeClient.calls.length, 0);
  } finally {
    await close();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});

test('gym-cancel happy path: 303, 1900, LETTERMILL LETTER, order + stripeSessionId', async () => {
  const dataDir = tmpDir();
  const store = createStore(dataDir);
  const stripeClient = fakeStripe('cs_test_happy');
  const { base, close } = await listen(makeApp({ dataDir, stripeClient, store }));
  try {
    const res = await postForm(base, GYM_FIELDS);
    assert.equal(res.status, 303);
    assert.equal(res.headers.get('location'), 'https://checkout.stripe.com/c/pay/cs_test_happy');

    assert.equal(stripeClient.calls.length, 1);
    const params = stripeClient.calls[0];
    assert.equal(params.line_items[0].price_data.unit_amount, 1900);
    assert.equal(params.payment_intent_data.statement_descriptor, 'LETTERMILL LETTER');
    assert.deepEqual(params.metadata, { orderId: params.metadata.orderId });
    assert.equal(Object.keys(params.metadata).length, 1);
    assert.match(params.cancel_url, /session_id=\{CHECKOUT_SESSION_ID\}/);

    const orders = readOrders(dataDir);
    const order = Object.values(orders).find((row) => row.stripeSessionId === 'cs_test_happy');
    assert.ok(order, 'order must be persisted with stripeSessionId');
    assert.equal(order.sku, 'gym-cancel');
    assert.equal(order.email, 'pat@example.com');
    assert.equal(order.id, params.metadata.orderId);
    assert.equal(order.input.fullName, 'Pat Rivera');
  } finally {
    await close();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});

test('cancel discards diplomat message, is idempotent; bare /cancel does not say discarded', async () => {
  const dataDir = tmpDir();
  const store = createStore(dataDir);
  const sessionId = 'cs_test_diplomat_cancel';
  const stripeClient = fakeStripe(sessionId);
  const { base, close } = await listen(makeApp({ dataDir, stripeClient, store }));
  const message = 'THIS DISTINCTIVE DIPLOMAT DRAFT MUST VANISH AFTER CANCEL XYZ';
  try {
    const checkout = await postForm(base, {
      sku: 'diplomat',
      email: 'pat@example.com',
      message,
    });
    assert.equal(checkout.status, 303);
    assert.match(JSON.stringify(readOrders(dataDir)), new RegExp(message));
    assert.ok(
      !JSON.stringify(stripeClient.calls[0].metadata).includes(message),
      'diplomat text must not be stuffed into Stripe metadata',
    );

    const first = await fetch(`${base}/cancel?session_id=${sessionId}`);
    assert.equal(first.status, 200);
    assert.match(await first.text(), /discarded/);
    assert.ok(
      !JSON.stringify(readOrders(dataDir)).includes(message),
      'diplomat message must be gone from pending-orders.json',
    );

    const second = await fetch(`${base}/cancel?session_id=${sessionId}`);
    assert.equal(second.status, 200);
    assert.doesNotMatch(await second.text(), /discarded/);

    const bare = await fetch(`${base}/cancel`);
    assert.equal(bare.status, 200);
    assert.doesNotMatch(await bare.text(), /discarded/);
  } finally {
    await close();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});
