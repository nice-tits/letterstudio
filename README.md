# Letter Studio

**Live: [https://letterstudio.net](https://letterstudio.net)**

We write it. You send it. Custom letter drafts from the details you type. Not legal advice.

Products: gym cancellation, diplomat rewrite, eulogy, toast, apology, resignation, neighbor note, company complaint.

Guides: [https://letterstudio.net/guides](https://letterstudio.net/guides)

## Local run

```bash
cp .env.example .env
# put your Stripe test keys in .env, then:
set -a && . ./.env && set +a
npm install
npm start
```

App listens on `http://localhost:3000` (`PORT` overrides).

## Stripe listen (real Checkout)

In another terminal, forward webhooks to the local app:

```bash
stripe listen --forward-to localhost:3000/webhook
```

Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET`, restart the server, then open `/`, fill a form, and pay with test card `4242 4242 4242 4242`.

After a successful payment the webhook drafts the letter and appends it here (mock mailer, no Resend key):

```bash
cat data/mail-log.jsonl
```

If `RESEND_API_KEY` is set, the same payload is POSTed to Resend instead.

## `stripe trigger` will not deliver

`stripe trigger checkout.session.completed` builds a fixture with **no** `metadata.orderId`. Lettermill will return **400** and will **not** send mail. Use a real Checkout session (or a signed fixture that includes `metadata.orderId` for an existing pending order).

## Tests

```bash
npm test
# or
./scripts/verify.sh
```

No live network. Checkout tests inject a fake Stripe client. Webhook tests sign payloads with `stripe.webhooks.generateTestHeaderString`.
