import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { SKUS } from './skus.js';
import { GUIDES, SITE, TAGLINE, allGuides } from './guides.js';
import { USE_CASES, ALTS } from './dest.js';

const PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dollars(cents) {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

export { PUBLIC };

function layout(title, body, extra = {}) {
  const description =
    extra.description ||
    `${TAGLINE} Custom letters from the details you type. Not legal advice.`;
  const pagePath = extra.path || '/';
  const canonical = `${SITE}${pagePath}`;
  const blobs = extra.jsonLd == null ? [] : Array.isArray(extra.jsonLd) ? extra.jsonLd : [extra.jsonLd];
  const jsonLd = blobs
    .map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`)
    .join('\n  ');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} — Letter Studio</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:type" content="${extra.ogType || 'website'}">
  ${jsonLd}
  <style>
    :root { color: #1b1916; background: #f6f1e8; font-family: Georgia, "Times New Roman", serif; }
    body { max-width: 740px; margin: 2rem auto; padding: 0 1rem 3rem; line-height: 1.55; }
    a { color: #2c4a3a; }
    header p, .fine { color: #534b40; }
    .card { background: #fff; border: 1px solid #d9d0c2; padding: 1.2rem 1.4rem; margin: 1.2rem 0; }
    h1 { font-size: 1.7rem; margin-bottom: 0.4rem; }
    h2 { font-size: 1.25rem; margin: 0 0 0.35rem; }
    label { display: block; margin: 0.65rem 0 0.2rem; font-size: 0.95rem; }
    input, textarea { width: 100%; box-sizing: border-box; padding: 0.45rem 0.5rem; font: inherit; }
    textarea { min-height: 8rem; }
    button { margin-top: 0.9rem; padding: 0.5rem 0.95rem; font: inherit; cursor: pointer; }
    .price { font-weight: 700; }
    nav { margin-top: 1.5rem; font-size: 0.95rem; }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

export function simplePage(title, message) {
  return layout(
    title,
    `<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(message)}</p>
<nav><a href="/">Back home</a></nav>`,
  );
}

export function privacyPage() {
  return layout(
    'Privacy',
    `<h1>Privacy</h1>
<p>Lettermill is a letter-writing service. You fill in the details, we draft the letter, and you send it yourself.</p>
<p>Stripe handles cards. We never see or store your full card number. Optional last-four digits on the gym form are only for the letter text if you choose to include them.</p>
<p>Pending drafts are stored only until you pay, cancel, or they expire. Payment events are recorded so we do not email the same letter twice.</p>
<p>This is not legal advice.</p>
<nav><a href="/">Home</a></nav>`,
  );
}

function fieldHtml(sku, field) {
  const id = `${sku}-${field.name}`;
  const extra = [
    field.optional ? '' : 'required',
    field.maxlength ? `maxlength="${field.maxlength}"` : '',
    field.minlength ? `minlength="${field.minlength}"` : '',
    field.name === 'cardLast4' ? 'inputmode="numeric"' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const control =
    field.type === 'textarea'
      ? `<textarea id="${id}" name="${escapeHtml(field.name)}" ${extra}></textarea>`
      : `<input id="${id}" name="${escapeHtml(field.name)}" type="text" ${extra}>`;
  return `<label for="${id}">${escapeHtml(field.label)}</label>\n    ${control}`;
}

function cardHtml(product) {
  const fields = (product.fields || [])
    .map((field) => fieldHtml(product.sku, field))
    .join('\n    ');
  return `<section class="card" id="${escapeHtml(product.sku)}">
  <h2>${escapeHtml(product.displayName)}</h2>
  <p class="price">${dollars(product.unitAmount)}</p>
  <p class="fine">${escapeHtml(product.blurb)} You send it yourself.</p>
  <form method="POST" action="/checkout">
    <input type="hidden" name="sku" value="${escapeHtml(product.sku)}">
    <label for="${escapeHtml(product.sku)}-email">Email</label>
    <input id="${escapeHtml(product.sku)}-email" name="email" type="email" required>
    ${fields}
    <button type="submit">Checkout — ${dollars(product.unitAmount)}</button>
  </form>
</section>`;
}

export function homePage() {
  const cards = Object.values(SKUS)
    .map((p) => {
      const guide = GUIDES[p.sku];
      const how = guide
        ? `<p class="fine"><a href="/guides/${escapeHtml(p.sku)}">How we customize this</a></p>`
        : '';
      return cardHtml(p).replace('</section>', `${how}</section>`);
    })
    .join('\n');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'Letter Studio',
        url: SITE,
        description: `${TAGLINE} Custom letter drafts. Not legal advice.`,
        logo: `${SITE}/logos/primary-lockup-transparent-250.png`,
      },
      {
        '@type': 'WebSite',
        name: 'Letter Studio',
        url: SITE,
      },
    ],
  };
  return layout(
    'Letter Studio',
    `<header>
  <p><img src="/logos/primary-lockup-transparent-250.png" alt="Letter Studio" width="200" height="64"></p>
  <h1>Letter Studio</h1>
  <p><strong>${escapeHtml(TAGLINE)}</strong> Finished letters from the details you type. This is <strong>not legal advice</strong>.</p>
  <p class="fine"><a href="/guides">Read how each letter is customized</a></p>
</header>
${cards}
<p class="fine">Not legal advice. We draft. You send it yourself.</p>
<nav><a href="/guides">Guides</a> · <a href="/privacy">Privacy</a></nav>`,
    {
      path: '/',
      description: `${TAGLINE} Custom cancellation letters, eulogies, toasts, apologies, and more from your details.`,
      jsonLd,
    },
  );
}

export function guidesIndexPage() {
  const items = allGuides()
    .map((g) => {
      const product = SKUS[g.slug];
      return `<li><a href="/guides/${escapeHtml(g.slug)}">${escapeHtml(g.h1)}</a> — ${dollars(product.unitAmount)}</li>`;
    })
    .join('');
  return layout(
    'Guides',
    `<h1>How we customize each letter</h1>
<p>Every order is built from the fields you fill in. We do not paste a stock letter with your name at the top and call it done.</p>
<ul>${items}</ul>
<nav><a href="/">Order a letter</a> · <a href="/privacy">Privacy</a></nav>`,
    {
      path: '/guides',
      description: 'How Letter Studio customizes each letter from your details. Not legal advice.',
    },
  );
}

export function guidePage(guide) {
  const product = SKUS[guide.slug];
  const customize = guide.customize.map((c) => `<li>${escapeHtml(c)}</li>`).join('');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    datePublished: '2026-08-13',
    dateModified: '2026-08-13',
    author: { '@type': 'Organization', name: 'Letter Studio', url: SITE },
    publisher: { '@type': 'Organization', name: 'Letter Studio', url: SITE },
    mainEntityOfPage: `${SITE}/guides/${guide.slug}`,
  };
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What do you customize in a ${product.displayName.toLowerCase()}?`,
        acceptedAnswer: { '@type': 'Answer', text: guide.customize.join(' ') },
      },
      {
        '@type': 'Question',
        name: 'Is this legal advice?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Letter Studio drafts letters. You send them yourself. Not legal advice.',
        },
      },
    ],
  };
  return layout(
    guide.title,
    `<nav class="fine"><a href="/">Home</a> · <a href="/guides">Guides</a></nav>
<article>
  <h1>${escapeHtml(guide.h1)}</h1>
  <p><strong>${escapeHtml(TAGLINE)}</strong> ${escapeHtml(guide.what)}</p>
  <h2>What we customize for you</h2>
  <ul>${customize}</ul>
  <h2>What we do not do</h2>
  <p>${escapeHtml(guide.not)}</p>
  <p><a href="/#${escapeHtml(guide.slug)}">Order this letter — ${dollars(product.unitAmount)}</a></p>
</article>
<nav><a href="/guides">All guides</a> · <a href="/privacy">Privacy</a></nav>`,
    {
      path: `/guides/${guide.slug}`,
      description: guide.description,
      ogType: 'article',
      jsonLd: [jsonLd, faq],
    },
  );
}

export function useCasePage(page) {
  return layout(
    page.title,
    `<nav class="fine"><a href="/">Home</a></nav>
<h1>${escapeHtml(page.h1)}</h1>
<p>${escapeHtml(page.body)}</p>
<p><a href="${escapeHtml(page.cta)}">Write this letter</a></p>
<p class="fine">Not legal advice. You send it yourself.</p>`,
    { path: `/for/${page.slug}`, description: page.description },
  );
}

export function altPage(page) {
  const rows = page.vs.map((row) => `<tr><th>${escapeHtml(row[0])}</th><td>${escapeHtml(row[1])}</td></tr>`).join('');
  return layout(
    page.title,
    `<nav class="fine"><a href="/">Home</a></nav>
<h1>${escapeHtml(page.h1)}</h1>
<table>${rows}</table>
<p>We write it. You send it. Not legal advice.</p>
<p><a href="/">See letters</a></p>`,
    { path: `/alternatives/${page.slug}`, description: page.description },
  );
}

export function sitemapXml() {
  const urls = [
    '/',
    '/privacy',
    '/guides',
    ...allGuides().map((g) => `/guides/${g.slug}`),
    ...Object.keys(USE_CASES).map((s) => `/for/${s}`),
    ...Object.keys(ALTS).map((s) => `/alternatives/${s}`),
  ];
  const body = urls
    .map(
      (u) =>
        `  <url><loc>${SITE}${u}</loc><changefreq>weekly</changefreq></url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function robotsTxt() {
  return `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`;
}

export function llmsTxt() {
  const lines = [
    '# Letter Studio',
    TAGLINE,
    'Custom letter drafts from the customer’s own details. The customer sends the letter. Not legal advice.',
    '',
    '## Products',
    ...allGuides().map((g) => `- ${SITE}/guides/${g.slug} — ${g.title}`),
  ];
  return lines.join('\n') + '\n';
}
