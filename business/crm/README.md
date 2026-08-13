# CRM

Buyers only. No letter bodies. No card data.

`contacts.csv` columns: email, sku, first_seen, source, do_not_email, notes

Import from the box (mail log, to-address only):

```
python3 business/crm/import_mail_log.py
```

Uses `ssh tiny-tits` and reads `/opt/lettermill/data/mail-log.jsonl` if present. Writes/merges this folder. Skips rows with `do_not_email=yes`.

Allowed use: delivery follow-up, refund, “draft missing fields.”
Not allowed: Amazon affiliate links in email, sold lists, cold promo to buyers unless they opted in.
