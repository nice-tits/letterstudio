# Obligations we actually have to meet

Not legal advice. Operator checklist. Effective 2026-08-13.

## On the live site (must stay true)

- [x] Not legal advice — every customer page
- [x] We draft, customer sends — never claim we file/mail/serve
- [x] Brand A only — no timeshare, credit repair, ID theft, adult
- [x] Stripe collects cards — we do not store PAN
- [x] Privacy policy that matches collection
- [x] Terms of service
- [x] Refunds page matching delivery
- [x] Amazon Associates phrase on disclosure + next to links
- [x] Contact email on legal pages

## Payments (Stripe)

- Restricted businesses: do not add Brand B SKUs on this account
- Statement descriptor stays letter-shop, not “legal services”
- Webhook idempotency stays in place (no double-send)

## Amazon Associates

- Required: “As an Amazon Associate I earn from qualifying purchases.”
- Links `rel=sponsored nofollow`
- No Amazon marks as our logo
- No Amazon links in cold email
- No cloaking
- See `affiliate-compliance.md` (research worker)

## Letters

- Customer warrants facts are theirs
- No guarantee of outcome
- Do not retain letter bodies longer than needed to send
- CRM may store email + sku + date only

## Records

- Sales: Stripe dashboard is source of truth
- Affiliate: Amazon Associates reports
- Local ledger: `books/ledger.csv`
