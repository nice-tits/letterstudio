import path from 'node:path';
import express from 'express';
import Stripe from 'stripe';
import { getSku } from './skus.js';
import { validateInput } from './validate.js';
import { createStore } from './store.js';
import { createMailer } from './mailer.js';
import { llm } from './llm.js';
import {
  homePage,
  privacyPage,
  simplePage,
  guidesIndexPage,
  guidePage,
  useCasePage,
  altPage,
  sitemapXml,
  robotsTxt,
  llmsTxt,
  PUBLIC,
} from './pages.js';
import { getGuide } from './guides.js';
import { USE_CASES, ALTS } from './dest.js';

export const INDEXNOW_KEY = '7c4e9b2a18d04f6e91c35a80b47d2f1e';

function defaultStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_not_configured');
}

function originOf(req) {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

function letterText(result) {
  if (typeof result === 'string') return result;
  if (result && typeof result.text === 'string') return result.text;
  return String(result ?? '');
}

function subjectFor(sku) {
  const name = getSku(sku)?.displayName;
  return name ? `Your ${name}` : 'Your Lettermill letter';
}

export function createApp({
  dataDir = path.join(process.cwd(), 'data'),
  stripeClient = defaultStripe(),
  webhookSecret = process.env.STRIPE_WEBHOOK_SECRET,
  mailer,
  store,
} = {}) {
  const resolvedStore = store ?? createStore(dataDir);
  const resolvedMailer = mailer ?? createMailer({ dataDir });
  const app = express();

  app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    let event;
    try {
      event = stripeClient.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'],
        webhookSecret,
      );
    } catch {
      return res.status(400).send('invalid signature');
    }

    if (event.type !== 'checkout.session.completed') {
      return res.status(200).json({ ignored: event.type });
    }

    const eventId = event.id;
    const claim = resolvedStore.claimEvent(eventId);
    if (claim === 'duplicate') {
      return res.status(200).json({ duplicate: true });
    }

    const orderId = event.data?.object?.metadata?.orderId;
    const order = orderId ? resolvedStore.getOrder(orderId) : null;
    // Release the inflight claim so a later retry can fulfill if the order
    // file appears. Do not completeEvent — that would swallow a real payment.
    if (!order) {
      resolvedStore.releaseEvent(eventId);
      return res.status(400).json({ error: 'unknown order' });
    }

    try {
      const generated = await llm.generate({ kind: order.sku, input: order.input });
      await resolvedMailer.send({
        to: order.email,
        subject: subjectFor(order.sku),
        text: letterText(generated),
      });
      resolvedStore.completeEvent(eventId);
      resolvedStore.deleteOrder(orderId);
      return res.status(200).json({ ok: true });
    } catch {
      resolvedStore.releaseEvent(eventId);
      return res.status(500).json({ error: 'fulfillment failed' });
    }
  });

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use('/logos', express.static(path.join(PUBLIC, 'logos'), { maxAge: '7d' }));

  app.get('/', (_req, res) => {
    res.type('html').send(homePage());
  });

  app.get('/privacy', (_req, res) => {
    res.type('html').send(privacyPage());
  });

  app.get('/guides', (_req, res) => {
    res.type('html').send(guidesIndexPage());
  });

  app.get('/guides/:slug', (req, res) => {
    const guide = getGuide(req.params.slug);
    if (!guide) return res.status(404).type('html').send(simplePage('Not found', 'No guide for that letter.'));
    return res.type('html').send(guidePage(guide));
  });

  app.get('/sitemap.xml', (_req, res) => {
    res.type('application/xml').send(sitemapXml());
  });

  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send(robotsTxt());
  });

  app.get('/' + INDEXNOW_KEY + '.txt', (_req, res) => {
    res.type('text/plain').send(INDEXNOW_KEY);
  });

  app.get('/llms.txt', (_req, res) => {
    res.type('text/plain').send(llmsTxt());
  });

  app.get('/for/:slug', (req, res) => {
    const page = USE_CASES[req.params.slug];
    if (!page) return res.status(404).type('html').send(simplePage('Not found', 'No page for that audience.'));
    return res.type('html').send(useCasePage(page));
  });

  app.get('/alternatives/:slug', (req, res) => {
    const page = ALTS[req.params.slug];
    if (!page) return res.status(404).type('html').send(simplePage('Not found', 'No comparison for that.'));
    return res.type('html').send(altPage(page));
  });

  app.get('/success', (_req, res) => {
    res
      .type('html')
      .send(simplePage('Thank you', 'Payment received. Your letter is on its way. You send it yourself.'));
  });

  app.get('/cancel', (req, res) => {
    const sessionId = req.query.session_id;
    let removedId = null;
    if (sessionId) {
      removedId = resolvedStore.deleteOrderBySessionId(String(sessionId));
    }
    const message = removedId
      ? 'Your draft was discarded. Nothing was charged.'
      : 'Checkout canceled. Your draft is unchanged.';
    res.type('html').send(simplePage('Canceled', message));
  });

  app.post('/checkout', async (req, res) => {
    const body = req.body || {};
    const product = getSku(body.sku);
    if (!product) {
      return res.status(400).send('unknown sku');
    }

    const email = typeof body.email === 'string' ? body.email.trim() : '';
    if (!email) {
      return res.status(400).send('email required');
    }

    const checked = validateInput(product.sku, body);
    if (!checked.ok) {
      return res.status(400).send(checked.error);
    }

    const orderId = resolvedStore.createOrder({
      sku: product.sku,
      email,
      input: checked.input,
    });

    const origin = originOf(req);
    try {
      const session = await stripeClient.checkout.sessions.create({
        mode: 'payment',
        customer_email: email,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: product.currency || 'usd',
              unit_amount: product.unitAmount,
              product_data: { name: product.displayName },
            },
          },
        ],
        metadata: { orderId },
        payment_intent_data: {
          statement_descriptor: product.descriptor,
        },
        success_url: `${origin}/success`,
        cancel_url: `${origin}/cancel?session_id={CHECKOUT_SESSION_ID}`,
      });
      resolvedStore.attachSession(orderId, session.id);
      return res.redirect(303, session.url);
    } catch {
      resolvedStore.deleteOrder(orderId);
      return res.status(500).send('checkout failed');
    }
  });

  return app;
}
