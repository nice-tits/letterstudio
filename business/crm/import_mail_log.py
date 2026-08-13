#!/usr/bin/env python3
"""Merge buyer emails from tiny-tits mail-log into contacts.csv. No bodies."""

from __future__ import annotations

import csv
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CSV_PATH = ROOT / "contacts.csv"
REMOTE = "tiny-tits"
REMOTE_LOG = "/opt/lettermill/data/mail-log.jsonl"
FIELDS = ["email", "sku", "first_seen", "source", "do_not_email", "notes"]


def load_existing() -> dict[str, dict]:
    if not CSV_PATH.exists():
        return {}
    out = {}
    with CSV_PATH.open(newline="") as f:
        for row in csv.DictReader(f):
            email = (row.get("email") or "").strip().lower()
            if email:
                out[email] = row
    return out


def remote_lines() -> list[str]:
    p = subprocess.run(
        ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=8", REMOTE, f"test -f {REMOTE_LOG} && cat {REMOTE_LOG} || true"],
        capture_output=True,
        text=True,
        timeout=30,
    )
    if p.returncode != 0:
        raise SystemExit(p.stderr or "ssh failed")
    return [ln for ln in p.stdout.splitlines() if ln.strip()]


def main() -> None:
    rows = load_existing()
    added = 0
    for ln in remote_lines():
        try:
            rec = json.loads(ln)
        except json.JSONDecodeError:
            continue
        email = str(rec.get("to") or "").strip().lower()
        if not email or "@" not in email:
            continue
        if email in rows:
            continue
        rows[email] = {
            "email": email,
            "sku": "",
            "first_seen": rec.get("sentAt") or "",
            "source": "mail-log",
            "do_not_email": "",
            "notes": "",
        }
        added += 1
    with CSV_PATH.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        for email in sorted(rows):
            w.writerow({k: rows[email].get(k, "") for k in FIELDS})
    print(f"contacts={len(rows)} added={added}")


if __name__ == "__main__":
    main()
