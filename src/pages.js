import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { SKUS } from './skus.js';
import { GUIDES, SITE, TAGLINE, allGuides, allFreeGuides } from './guides.js';
import { USE_CASES, ALTS } from './dest.js';
import { allPosts } from './blog.js';
import { amazonSearch, offersFor, footerOffers } from './ads.js';
import { LEGAL, CONTACT_EMAIL } from './legal.js';

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

function offerLink(offer) {
  return `<li><a href="${escapeHtml(amazonSearch(offer.q))}" rel="sponsored nofollow" target="_blank" referrerpolicy="origin">${escapeHtml(offer.label)}</a> — ${escapeHtml(offer.blurb)}</li>`;
}

function adsBlock(sku) {
  const extra = sku ? offersFor(sku) : [];
  const footer = footerOffers();
  const seen = new Set();
  const list = [];
  for (const o of [...extra, ...footer]) {
    if (seen.has(o.id)) continue;
    seen.add(o.id);
    list.push(o);
  }
  return `<aside class="ads">
  <h2>Send it yourself</h2>
  <p><strong>As an Amazon Associate I earn from qualifying purchases.</strong> Paid links (#ad). <a href="/disclosure">Full disclosure</a>.</p>
  <p>We write the letter. Supplies if you are mailing it:</p>
  <ul>${list.map(offerLink).join('')}</ul>
</aside>`;
}

const OG_IMAGE = `${SITE}/og.png`;
const OG_IMAGE_ALT = 'Letter Studio — We write it. You send it.';
const SITEMAP_LASTMOD = '2026-08-13';

const SECTION_CRUMB = {
  guides: ['Guides', '/guides'],
  blog: ['Writeups', '/blog'],
  for: ['Who it’s for', '/for'],
  alternatives: ['Comparisons', '/alternatives'],
  privacy: ['Privacy', '/privacy'],
  terms: ['Terms', '/terms'],
  refunds: ['Refunds', '/refunds'],
  disclosure: ['Affiliates', '/disclosure'],
};

function breadcrumbJsonLd(pagePath, leafName) {
  if (!pagePath || pagePath === '/') return null;
  const segs = pagePath.replace(/^\//, '').split('/').filter(Boolean);
  const items = [{ name: 'Home', item: `${SITE}/` }];
  const first = segs[0];
  if (SECTION_CRUMB[first]) {
    const [name, href] = SECTION_CRUMB[first];
    items.push({ name, item: `${SITE}${href}` });
  }
  if (segs[1]) {
    items.push({ name: leafName || segs[1], item: `${SITE}${pagePath}` });
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.item,
    })),
  };
}

function layout(title, body, extra = {}) {
  const description =
    extra.description ||
    `${TAGLINE} Custom letters from the details you type. Not legal advice.`;
  const pagePath = extra.path || '/';
  const canonical = `${SITE}${pagePath}`;
  const blobs = extra.jsonLd == null ? [] : Array.isArray(extra.jsonLd) ? extra.jsonLd : [extra.jsonLd];
  const crumbs = breadcrumbJsonLd(pagePath, extra.crumb);
  if (crumbs) blobs.push(crumbs);
  const jsonLd = blobs
    .map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`)
    .join('\n  ');
  const ogImage = extra.ogImage || OG_IMAGE;
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
  <meta property="og:site_name" content="Letter Studio">
  <meta property="og:locale" content="en_US">
  <meta property="og:image" content="${escapeHtml(ogImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(OG_IMAGE_ALT)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">
  <meta name="twitter:image:alt" content="${escapeHtml(OG_IMAGE_ALT)}">
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
    .ads { margin: 1.6rem 0 0; padding: 0.9rem 0 0; border-top: 1px solid #d9d0c2; font-size: 0.92rem; }
    .ads h2 { font-size: 1.05rem; }
    .ads ul { list-style: none; padding: 0; margin: 0.4rem 0 0; }
    .ads li { margin: 0.45rem 0; }
    .ads .fine { margin: 0.55rem 0 0; }
  </style>
</head>
<body>
${body}
${adsBlock(extra.sku)}
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

function legalPage(key) {
  const doc = LEGAL[key];
  const sections = doc.sections
    .map(([h, body]) => `<h2>${escapeHtml(h)}</h2>\n<p>${escapeHtml(body)}</p>`)
    .join('\n');
  return layout(
    doc.title,
    `<nav class="fine"><a href="/">Home</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/refunds">Refunds</a> · <a href="/disclosure">Affiliates</a></nav>
<h1>${escapeHtml(doc.h1)}</h1>
${sections}
<p class="fine"><a href="mailto:${escapeHtml(CONTACT_EMAIL)}">${escapeHtml(CONTACT_EMAIL)}</a>. Not legal advice.</p>`,
    { path: `/${key === 'disclosure' ? 'disclosure' : key}`, crumb: doc.h1 },
  );
}

export function privacyPage() {
  return legalPage('privacy');
}

export function termsPage() {
  return legalPage('terms');
}

export function disclosurePage() {
  return legalPage('disclosure');
}

export function refundsPage() {
  return legalPage('refunds');
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
  <p class="fine"><a href="/guides/before-you-send">Free checklist before you send</a> · <a href="/guides">How each letter is customized</a> · <a href="/blog">Writeups</a></p>
</header>
${cards}
<p class="fine">Not legal advice. We draft. You send it yourself.</p>
<nav>
  <a href="/guides">Guides</a> ·
  <a href="/guides/before-you-send">Checklist</a> ·
  <a href="/blog">Blog</a> ·
  <a href="/for/gym-members">Gym</a> ·
  <a href="/for/families">Eulogy</a> ·
  <a href="/for/quitting">Resign</a> ·
  <a href="/alternatives/chatgpt">Vs ChatGPT</a> ·
  <a href="/privacy">Privacy</a> ·
  <a href="/terms">Terms</a> ·
  <a href="/disclosure">Affiliates</a>
</nav>`,
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
<p class="card"><strong>Free.</strong> <a href="/guides/before-you-send">Don’t send the letter until you have these facts</a> — a one-page checklist. No signup.</p>
<ul>${items}</ul>
<p>Also: <a href="/blog">writeups</a> · <a href="/alternatives/chatgpt">vs ChatGPT</a> · <a href="/for/gym-members">use cases</a></p>
<nav><a href="/">Order a letter</a> · <a href="/privacy">Privacy</a></nav>`,
    {
      path: '/guides',
      description: 'How Letter Studio customizes each letter from your details. Free send-it checklist. Not legal advice.',
    },
  );
}

export function freeGuidePage(guide) {
  const sections = guide.sections
    .map((s) => {
      const items = s.items.map((c) => `<li>${escapeHtml(c)}</li>`).join('');
      return `<h2>${escapeHtml(s.heading)}</h2>\n<ul>${items}</ul>`;
    })
    .join('\n');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: guide.title,
    description: guide.description,
    step: guide.sections.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.heading,
      text: s.items.join(' '),
    })),
  };
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is this legal advice?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. This is a checklist of facts to gather before you send a letter. Not legal advice.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I have to pay or sign up?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. The checklist is free. If you want a draft assembled from those facts, the form is on the home page. You still send the letter.',
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
  ${sections}
  <h2>What this is not</h2>
  <p>${escapeHtml(guide.not)}</p>
  <p>No signup. If the boxes are full and you do not want to assemble the letter, <a href="/">the form is here</a>. You still send it.</p>
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
      sku: guide.slug,
      crumb: guide.h1,
      jsonLd: [jsonLd, faq],
    },
  );
}

function relatedList(links) {
  if (!links || !links.length) return '';
  const items = links.map(([href, label]) => `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`).join('');
  return `<h2>Related</h2><ul>${items}</ul>`;
}

export function useCasePage(page) {
  const more = (page.more || []).map((p) => `<p>${escapeHtml(p)}</p>`).join('');
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Do you send the letter?',
        acceptedAnswer: { '@type': 'Answer', text: 'No. We draft. You send it yourself. Not legal advice.' },
      },
      {
        '@type': 'Question',
        name: page.h1,
        acceptedAnswer: { '@type': 'Answer', text: page.body },
      },
    ],
  };
  return layout(
    page.title,
    `<nav class="fine"><a href="/">Home</a> · <a href="/blog">Blog</a> · <a href="/guides">Guides</a></nav>
<h1>${escapeHtml(page.h1)}</h1>
<p>${escapeHtml(page.body)}</p>
${more}
<p><a href="${escapeHtml(page.cta)}">Write this letter</a></p>
${relatedList(page.related)}
<p class="fine">Not legal advice. You send it yourself.</p>`,
    { path: `/for/${page.slug}`, description: page.description, sku: page.sku, crumb: page.h1, jsonLd: faq },
  );
}

export function altPage(page) {
  const rows = page.vs.map((row) => `<tr><th>${escapeHtml(row[0])}</th><td>${escapeHtml(row[1])}</td></tr>`).join('');
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.vs.slice(0, 3).map((row) => ({
      '@type': 'Question',
      name: row[0],
      acceptedAnswer: { '@type': 'Answer', text: row[1] },
    })),
  };
  return layout(
    page.title,
    `<nav class="fine"><a href="/">Home</a> · <a href="/alternatives/chatgpt">More comparisons</a></nav>
<h1>${escapeHtml(page.h1)}</h1>
<table>${rows}</table>
<p>We write it. You send it. Not legal advice.</p>
${relatedList(page.related)}
<p><a href="/">See letters</a></p>`,
    { path: `/alternatives/${page.slug}`, description: page.description, crumb: page.h1, jsonLd: faq },
  );
}

export function destIndexPage(kind) {
  const isFor = kind === 'for';
  const items = Object.values(isFor ? USE_CASES : ALTS)
    .map((p) => `<li><a href="/${isFor ? 'for' : 'alternatives'}/${escapeHtml(p.slug)}">${escapeHtml(p.h1)}</a></li>`)
    .join('');
  const title = isFor ? 'Who it’s for' : 'Comparisons';
  const path = isFor ? '/for' : '/alternatives';
  return layout(
    title,
    `<nav class="fine"><a href="/">Home</a></nav>
<h1>${escapeHtml(title)}</h1>
<ul>${items}</ul>
<p class="fine">Not legal advice. We draft. You send it.</p>`,
    { path, description: isFor ? 'Letter Studio use cases. We write it. You send it.' : 'Letter Studio vs ChatGPT, templates, Grammarly, Fiverr.' },
  );
}

export function blogIndexPage() {
  const items = allPosts()
    .map((p) => `<li><a href="/blog/${escapeHtml(p.slug)}">${escapeHtml(p.h1)}</a></li>`)
    .join('');
  return layout(
    'Writeups',
    `<nav class="fine"><a href="/">Home</a> · <a href="/guides">Guides</a></nav>
<h1>Writeups</h1>
<p>How to actually write the letter. Then, if you want, we draft it from your fields. Not legal advice.</p>
<ul>${items}</ul>
<nav><a href="/">Order a letter</a></nav>`,
    { path: '/blog', description: 'How to write cancellation letters, eulogies, resignations, apologies. Letter Studio drafts. You send it.' },
  );
}

export function blogPostPage(post) {
  const sections = post.sections
    .map(([h, body]) => `<h2>${escapeHtml(h)}</h2>\n<p>${escapeHtml(body)}</p>`)
    .join('\n');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Organization', name: 'Letter Studio', url: SITE },
    publisher: { '@type': 'Organization', name: 'Letter Studio', url: SITE },
    mainEntityOfPage: `${SITE}/blog/${post.slug}`,
  };
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.sections.slice(0, 2).map(([h, body]) => ({
      '@type': 'Question',
      name: h,
      acceptedAnswer: { '@type': 'Answer', text: body },
    })),
  };
  const order = post.sku ? `<p><a href="/#${escapeHtml(post.sku)}">Order this letter</a> · <a href="/guides/${escapeHtml(post.sku)}">How we customize it</a></p>` : '';
  return layout(
    post.title,
    `<nav class="fine"><a href="/">Home</a> · <a href="/blog">Writeups</a></nav>
<article>
  <h1>${escapeHtml(post.h1)}</h1>
  <p class="fine">${escapeHtml(post.date)}</p>
  ${sections}
  ${order}
</article>
<nav><a href="/blog">All writeups</a> · <a href="/privacy">Privacy</a></nav>`,
    {
      path: `/blog/${post.slug}`,
      description: post.description,
      ogType: 'article',
      sku: post.sku,
      crumb: post.h1,
      jsonLd: [jsonLd, faq],
    },
  );
}

export function sitemapXml() {
  const urls = [
    '/',
    '/privacy',
    '/terms',
    '/refunds',
    '/disclosure',
    '/guides',
    '/blog',
    '/for',
    '/alternatives',
    ...allFreeGuides().map((g) => `/guides/${g.slug}`),
    ...allGuides().map((g) => `/guides/${g.slug}`),
    ...Object.keys(USE_CASES).map((s) => `/for/${s}`),
    ...Object.keys(ALTS).map((s) => `/alternatives/${s}`),
    ...allPosts().map((p) => `/blog/${p.slug}`),
  ];
  const postDates = Object.fromEntries(allPosts().map((p) => [`/blog/${p.slug}`, p.date]));
  const body = urls
    .map((u) => {
      const lastmod = postDates[u] || SITEMAP_LASTMOD;
      return `  <url><loc>${SITE}${u}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq></url>`;
    })
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
    '## Free',
    ...allFreeGuides().map((g) => `- ${SITE}/guides/${g.slug} — ${g.title}`),
    '',
    '## Products',
    ...allGuides().map((g) => `- ${SITE}/guides/${g.slug} — ${g.title}`),
    '',
    '## For',
    ...Object.values(USE_CASES).map((p) => `- ${SITE}/for/${p.slug} — ${p.title}`),
    '',
    '## Alternatives',
    ...Object.values(ALTS).map((p) => `- ${SITE}/alternatives/${p.slug} — ${p.title}`),
    '',
    '## Writeups',
    ...allPosts().map((p) => `- ${SITE}/blog/${p.slug} — ${p.title}`),
  ];
  return lines.join('\n') + '\n';
}
