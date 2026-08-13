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

test('free before-you-send checklist is live, unpaid, and not legal advice', async () => {
  const { base, close } = await listen();
  try {
    const res = await fetch(`${base}/guides/before-you-send`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /checklist/i);
    assert.match(html, /Member ID/i);
    assert.match(html, /not legal advice/i);
    assert.match(html, /No signup/i);
    assert.doesNotMatch(html, /timeshare/i);
    assert.match(html, /application\/ld\+json/);
    const index = await (await fetch(`${base}/guides`)).text();
    assert.match(index, /before-you-send/);
    assert.match(index, /Free/);
    const map = await (await fetch(`${base}/sitemap.xml`)).text();
    assert.match(map, /\/guides\/before-you-send/);
    const llms = await (await fetch(`${base}/llms.txt`)).text();
    assert.match(llms, /before-you-send/);
  } finally {
    await close();
  }
});

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

test('pages carry affiliate footer with disclosure and sponsored rel', async () => {
  const { base, close } = await listen();
  try {
    const html = await (await fetch(`${base}/`)).text();
    assert.match(html, /As an Amazon Associate I earn from qualifying purchases/);
    assert.match(html, /rel="sponsored nofollow"/);
    assert.match(html, /tag=openclam-20/);
    assert.match(html, /\/disclosure/);
    const gym = await (await fetch(`${base}/guides/gym-cancel`)).text();
    assert.match(gym, /certified\+mail/);
    assert.doesNotMatch(gym, /envelopes\+#/);
  } finally {
    await close();
  }
});

test('pages expose og image, breadcrumbs, and sitemap lastmod', async () => {
  const { base, close } = await listen();
  try {
    const home = await (await fetch(`${base}/`)).text();
    assert.match(home, /property="og:image"/);
    assert.match(home, /letterstudio\.net\/og\.png/);
    assert.match(home, /twitter:card/);
    assert.match(home, /og:site_name/);
    const guide = await (await fetch(`${base}/guides/eulogy`)).text();
    assert.match(guide, /BreadcrumbList/);
    assert.match(guide, /\/guides\/eulogy/);
    const legal = await (await fetch(`${base}/terms`)).text();
    assert.match(legal, /BreadcrumbList/);
    const map = await (await fetch(`${base}/sitemap.xml`)).text();
    assert.match(map, /<lastmod>2026-08-13<\/lastmod>/);
    assert.match(map, /\/terms/);
    const og = await fetch(`${base}/og.png`);
    assert.equal(og.status, 200);
    assert.match(og.headers.get('content-type') || '', /image\/png/);
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
