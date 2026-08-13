# Lettermill module contract

Brand A only. SKUs: `gym-cancel` ($19), `diplomat` ($19).
Not legal advice. No Brand B. No guarantees. No "stop paying".

## src/skus.js
- `export const SKUS` map
- gym-cancel: displayName `Membership Cancellation Letter`, descriptor `LETTERMILL LETTER`, unitAmount 1900
- diplomat: displayName `Diplomat — Tone Rewrite`, same descriptor/price
- `export function getSku(sku)` → product or null (trim+lowercase). Unknown/Brand-B names return null.

## src/validate.js
- `export function validateInput(sku, body)` → `{ ok: true, input }` or `{ ok: false, error }`
- gym-cancel required: fullName, memberId, clubName, clubAddress, cancelBy (nonempty strings)
- optional cardLast4: exactly 4 digits or omit
- diplomat: `message` 20–8000 chars (trim length ≥ 20, raw length ≤ 8000)

## src/store.js
- `export function createStore(dataDir)`
- Files: `pending-orders.json`, `processed-events.json`
- Atomic writes (tmp + rename). POSIX `mkdir` lock on `data/.lock`. Stale lock > 5s broken.
- `createOrder({ sku, email, input })` → uuid
- `getOrder(id)`, `attachSession(id, sessionId)`, `deleteOrder(id)`
- `deleteOrderBySessionId(sessionId)` → id or null
- `sweepExpiredOrders(maxAgeMs = 48h, now = Date.now())` → count removed
- Event claim (inside lock, fixes TOCTOU):
  - `claimEvent(eventId)` → `'new'` | `'duplicate'`
    - `'duplicate'` if already done or inflight
    - `'new'` marks inflight
  - `completeEvent(eventId)` marks done (clears inflight)
  - `releaseEvent(eventId)` clears inflight on send failure so Stripe can retry
  - `hasProcessedEvent(eventId)` true only when **done** (not merely inflight)

## src/llm.js
- `export const llm = { async generate({ kind, input }) }`
- Default stub, no network. `LLM_PROVIDER=openai` optional live path.
- gym-cancel: letter includes name, member ID, club, clear cancel request. No "guarantee" / "stop paying".
- diplomat: MUST rewrite (sanitize profanity/caps/!!!). Three labeled blocks:
  `=== TONE 1: FIRM ===` / `=== TONE 2: WARM ===` / `=== TONE 3: GREY-ROCK ===`
  Tones differ from original and each other. No legal threats. Footer: not legal advice, you send it.

## src/mailer.js
- `export function createMailer({ dataDir, resendApiKey = process.env.RESEND_API_KEY })`
- No key: append JSONL to `dataDir/mail-log.jsonl` `{ to, subject, text, sentAt, via: 'mock' }`
- Key set: POST Resend API. `send({ to, subject, text })`

## src/pages.js
- `homePage()`, `privacyPage()`, `simplePage(title, message)`
- Home: both cards, $19.00, "not legal advice", you send it yourself
- Privacy: letter-writing, Stripe handles cards
- Forms POST `/checkout`. gym fields + diplomat `message` textarea.

## src/app.js
- `export function createApp({ dataDir, stripeClient, webhookSecret, mailer, store })`
- GET `/` `/privacy` `/success` `/cancel`
- POST `/webhook` raw body, `constructEvent`. Non-checkout → ignore 200.
  Unknown order → 400, do **not** completeEvent.
  claimEvent duplicate → 200 `{ duplicate: true }` no second email.
  claim new → generate + send → completeEvent + deleteOrder. On throw → releaseEvent, 500.
- POST `/checkout` urlencoded. Unknown sku 400. Validate. createOrder. Stripe session metadata **only** `{ orderId }`. statement_descriptor from sku. cancel_url includes `session_id={CHECKOUT_SESSION_ID}`. attachSession. 303 to session.url.
- GET `/cancel?session_id=` deletes by session. Say "discarded" **only** if a row was deleted.

## server.js
- createStore, sweepExpiredOrders at boot, hourly unref interval, createApp, listen PORT||3000

## Tests (node:test, no live network)
- letters, store (TTL + lock + claim/release), checkout (reject Brand-B, happy-path fake Stripe), webhook (bad sig, idempotent one email)

## Forbidden
Brand B SKUs, cloaking, dashboard, stuffing diplomat text into Stripe metadata.
