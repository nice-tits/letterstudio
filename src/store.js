// JSON-file persistence:
// - pending-orders.json: checkout form input captured before payment
// - processed-events.json: Stripe event ids (done + inflight) for idempotency
//
// Writes are atomic (pid tmp + rename). All mutations run under a POSIX
// mkdir lock at dataDir/.lock. A lock older than 5s is treated as abandoned
// and broken. Wait up to 10s for a live lock, then throw.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const LOCK_STALE_MS = 5_000;
const LOCK_WAIT_MS = 10_000;
const DEFAULT_TTL_MS = 48 * 60 * 60 * 1000;

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}

function sleepSync(ms) {
  const sab = new SharedArrayBuffer(4);
  Atomics.wait(new Int32Array(sab), 0, 0, ms);
}

function withLock(lockDir, fn) {
  const deadline = Date.now() + LOCK_WAIT_MS;
  for (;;) {
    try {
      fs.mkdirSync(lockDir);
      break;
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
      try {
        if (Date.now() - fs.statSync(lockDir).mtimeMs > LOCK_STALE_MS) {
          fs.rmSync(lockDir, { recursive: true, force: true });
          continue;
        }
      } catch {
        continue; // lock vanished between checks; retry
      }
      if (Date.now() > deadline) {
        throw new Error(`Timed out waiting for store lock: ${lockDir}`);
      }
      sleepSync(10);
    }
  }
  try {
    return fn();
  } finally {
    fs.rmSync(lockDir, { recursive: true, force: true });
  }
}

function eventStatus(events, eventId) {
  const rec = events[eventId];
  if (!rec) return null;
  if (typeof rec === 'string') return rec;
  return rec.status ?? null;
}

export function createStore(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const ordersFile = path.join(dataDir, 'pending-orders.json');
  const eventsFile = path.join(dataDir, 'processed-events.json');
  const lockDir = path.join(dataDir, '.lock');
  const locked = (fn) => withLock(lockDir, fn);

  return {
    createOrder({ sku, email, input }) {
      return locked(() => {
        const orders = readJson(ordersFile, {});
        const id = crypto.randomUUID();
        orders[id] = { sku, email, input, id, createdAt: new Date().toISOString() };
        writeJson(ordersFile, orders);
        return id;
      });
    },

    getOrder(id) {
      return readJson(ordersFile, {})[id] ?? null;
    },

    attachSession(id, sessionId) {
      locked(() => {
        const orders = readJson(ordersFile, {});
        if (orders[id]) {
          orders[id].stripeSessionId = sessionId;
          writeJson(ordersFile, orders);
        }
      });
    },

    deleteOrder(id) {
      locked(() => {
        const orders = readJson(ordersFile, {});
        if (!(id in orders)) return;
        delete orders[id];
        writeJson(ordersFile, orders);
      });
    },

    deleteOrderBySessionId(sessionId) {
      return locked(() => {
        const orders = readJson(ordersFile, {});
        for (const [id, order] of Object.entries(orders)) {
          if (order.stripeSessionId === sessionId) {
            delete orders[id];
            writeJson(ordersFile, orders);
            return id;
          }
        }
        return null;
      });
    },

    // Invalid/missing createdAt counts as expired so abandoned PII cannot linger.
    sweepExpiredOrders(maxAgeMs = DEFAULT_TTL_MS, now = Date.now()) {
      return locked(() => {
        const orders = readJson(ordersFile, {});
        let removed = 0;
        for (const [id, order] of Object.entries(orders)) {
          const createdAt = Date.parse(order?.createdAt ?? '');
          if (!Number.isFinite(createdAt) || now - createdAt > maxAgeMs) {
            delete orders[id];
            removed += 1;
          }
        }
        if (removed > 0) writeJson(ordersFile, orders);
        return removed;
      });
    },

    // 'duplicate' if already done or inflight. 'new' marks inflight.
    claimEvent(eventId) {
      return locked(() => {
        const events = readJson(eventsFile, {});
        const status = eventStatus(events, eventId);
        if (status === 'done' || status === 'inflight') return 'duplicate';
        events[eventId] = { status: 'inflight' };
        writeJson(eventsFile, events);
        return 'new';
      });
    },

    // Marks done and clears inflight.
    completeEvent(eventId) {
      locked(() => {
        const events = readJson(eventsFile, {});
        events[eventId] = { status: 'done' };
        writeJson(eventsFile, events);
      });
    },

    // Clears inflight on send failure so Stripe can retry. Leaves done alone.
    releaseEvent(eventId) {
      locked(() => {
        const events = readJson(eventsFile, {});
        if (eventStatus(events, eventId) !== 'inflight') return;
        delete events[eventId];
        writeJson(eventsFile, events);
      });
    },

    // True only when done — not merely inflight.
    hasProcessedEvent(eventId) {
      return eventStatus(readJson(eventsFile, {}), eventId) === 'done';
    },
  };
}
