import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { createStore } from '../src/store.js';
import { createMailer } from '../src/mailer.js';
import { SKUS } from '../src/skus.js';

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'lettermill-guides-'));
}

async function listen() {
  const dataDir = tmpDir();
  const app = createApp({
    dataDir,
    stripeClient: { checkout: { sessions: { create: async () => ({ id: 'x', url: 'http://x' }) } } },
    webhookSecret: 'whsec_x',
    mailer: createMailer({ dataDir }),
    store: createStore(dataDir),
  });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    async close() {
      await new Promise((r) => server.close(r));
      fs.rmSync(dataDir, { recursive: true, force: true });
    },
  };
}

test('guides index lists every SKU and explains customization', async () => {
  const { base, close } = await listen();
  try {
    const res = await fetch(`${base}/guides`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /customize/i);
    assert.match(html, /not legal advice/i);
    for (const sku of Object.keys(SKUS)) {
      assert.match(html, new RegExp(`/guides/${sku}`));
    }
  } finally {
    await close();
  }
});

test('each product guide is 200, mentions customize, and is not legal advice', async () => {
  const { base, close } = await listen();
  try {
    for (const sku of Object.keys(SKUS)) {
      const res = await fetch(`${base}/guides/${sku}`);
      assert.equal(res.status, 200, sku);
      const html = await res.text();
      assert.match(html, /What we customize/i);
      assert.match(html, /not legal advice/i);
      assert.match(html, /application\/ld\+json/);
    }
    const missing = await fetch(`${base}/guides/timeshare`);
    assert.equal(missing.status, 404);
  } finally {
    await close();
  }
});

test('sitemap, robots, and llms.txt expose the guides', async () => {
  const { base, close } = await listen();
  try {
    const map = await (await fetch(`${base}/sitemap.xml`)).text();
    assert.match(map, /https:\/\/letterstudio\.net\/guides\/eulogy/);
    assert.match(map, /\/blog\/cancel-gym-membership-letter/);
    assert.match(map, /\/for\/quitting/);
    assert.match(map, /\/alternatives\/templates/);
    const robots = await (await fetch(`${base}/robots.txt`)).text();
    assert.match(robots, /sitemap.xml/i);
    const llms = await (await fetch(`${base}/llms.txt`)).text();
    assert.match(llms, /Letter Studio/);
    assert.match(llms, /Not legal advice/);
    assert.match(llms, /\/blog\//);
  } finally {
    await close();
  }
});

test('blog, dest, and alt pages are 200 with schema', async () => {
  const { base, close } = await listen();
  try {
    for (const path of [
      '/blog',
      '/blog/cancel-gym-membership-letter',
      '/blog/chatgpt-vs-letter-studio',
      '/for',
      '/for/quitting',
      '/for/neighbors',
      '/alternatives',
      '/alternatives/templates',
      '/alternatives/grammarly',
    ]) {
      const res = await fetch(`${base}${path}`);
      assert.equal(res.status, 200, path);
      const html = await res.text();
      assert.match(html, /not legal advice/i);
    }
    const post = await (await fetch(`${base}/blog/eulogy-from-your-notes`)).text();
    assert.match(post, /application\/ld\+json/);
    const missing = await fetch(`${base}/blog/timeshare-scam`);
    assert.equal(missing.status, 404);
  } finally {
    await close();
  }
});
