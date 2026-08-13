# Ops

- Site: https://letterstudio.net on tiny-tits `/opt/lettermill`
- Deploy: `rsync src tiny-tits:/opt/lettermill/ && ssh tiny-tits 'systemctl restart lettermill'`
- Vault: `/root/vault` on tiny-tits (keys). Do not copy secrets into git.
- CRM import: `python3 business/crm/import_mail_log.py`
- Tests: `./scripts/verify.sh`
- IndexNow key file: `/{INDEXNOW_KEY}.txt`
