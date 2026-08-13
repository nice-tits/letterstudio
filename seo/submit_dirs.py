#!/usr/bin/env python3
"""Headed directory submissions for Letter Studio. Run on the desktop box:

    DISPLAY=:0 python3 seo/submit_dirs.py

Or over SSH from anywhere:

    ssh <this-host> 'cd /home/g/lettermill && DISPLAY=:0 python3 seo/submit_dirs.py'
"""

from __future__ import annotations

import csv
import datetime as dt
import os
import sys
from pathlib import Path

from playwright.sync_api import TimeoutError as PwTimeout
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
TRACKER = Path(__file__).resolve().parent / "backlink-tracker.csv"
LOGO = ROOT / "public" / "logos" / "primary-lockup-transparent-250.png"
PROFILE = Path.home() / ".local" / "share" / "letterstudio-browser"

SITE = "https://letterstudio.net"
NAME = "Letter Studio"
TAGLINE = "We write it. You send it."
EMAIL = "cuntyclam@gmail.com"
PERSON = "Fred"
DESC = (
    "AI drafts custom letters from your details — gym cancellations, eulogies, "
    "toasts, apologies, resignations. You send the letter yourself. Not legal advice."
)
GITHUB = "https://github.com/nice-tits/letterstudio"
CHROME = "/usr/bin/google-chrome-beta"


def log(directory: str, status: str, listing: str = "", notes: str = "") -> None:
    TRACKER.parent.mkdir(parents=True, exist_ok=True)
    new = not TRACKER.exists()
    with TRACKER.open("a", newline="") as f:
        w = csv.writer(f)
        if new:
            w.writerow(["date", "directory", "url", "tier", "status", "listing_url", "notes"])
        w.writerow([dt.date.today().isoformat(), directory, "", "", status, listing, notes])
    print(f"[{status}] {directory} {listing} {notes}".strip())


def future_tools(page) -> None:
    page.goto("https://www.futuretools.io/submit-a-tool", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(1500)
    page.get_by_label("Your Name").fill(PERSON)
    page.locator('input[name="tool-name"], input').filter(has_text="").first
    # labels from prior snapshot
    page.get_by_placeholder("Your Name").or_(page.get_by_label("Your Name")).first.fill(PERSON)
    try:
        page.get_by_label("Tool Name").fill(NAME)
        page.get_by_label("Tool URL").fill(SITE)
        page.get_by_label("Short Description").fill(DESC)
        page.get_by_label("Your Email").fill(EMAIL)
    except Exception:
        fields = page.locator("input[type=text], input[type=email], textarea")
        vals = [PERSON, NAME, SITE, DESC, EMAIL]
        for i, v in enumerate(vals):
            if i < fields.count():
                fields.nth(i).fill(v)
    try:
        page.get_by_label("Category").select_option(label="Writing")
    except Exception:
        pass
    try:
        page.get_by_text("Paid", exact=True).click()
    except Exception:
        pass
    # Cloudflare widget — headed chrome often auto-passes
    page.wait_for_timeout(4000)
    try:
        frame = page.frame_locator('iframe[title*="Cloudflare"], iframe[src*="challenges"]')
        box = frame.locator('input[type=checkbox], label').first
        if box.count():
            box.click(timeout=3000)
            page.wait_for_timeout(3000)
    except Exception:
        pass
    try:
        page.get_by_role("button", name="No thanks").click(timeout=2000)
    except Exception:
        pass
    page.locator('button[type=submit]').filter(has_text="Submit").first.click()
    page.wait_for_timeout(4000)
    url = page.url
    body = page.inner_text("body")[:400]
    ok = "thank" in body.lower() or "submitted" in body.lower() or "received" in body.lower()
    log("Future Tools", "submitted" if ok else "attempted", url, body.replace("\n", " ")[:180])


def uneed(page) -> None:
    page.goto("https://www.uneed.best/submit-a-tool", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(1500)
    inputs = page.locator("input[type=text], input:not([type])")
    if inputs.count() >= 2:
        inputs.nth(0).fill("letter-studio")
        inputs.nth(1).fill(SITE)
    page.get_by_role("button", name="Preview my product").click()
    page.wait_for_timeout(4000)
    btn = page.get_by_role("button", name="Create my account & continue")
    if btn.count():
        btn.click()
        page.wait_for_timeout(3000)
        log("Uneed", "previewed", page.url, "needs account/CF")
    else:
        log("Uneed", "attempted", page.url, page.inner_text("body")[:160].replace("\n", " "))


def dofollow(page) -> None:
    page.goto("https://dofollow.tools/submit", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(1500)
    page.locator('input[name="url"]').first.fill(SITE)
    page.get_by_label("Tool Name").fill(NAME)
    page.get_by_label("Tagline").fill(TAGLINE)
    page.get_by_label("Description").fill(DESC)
    try:
        page.get_by_label("GitHub Repository").fill(GITHUB)
    except Exception:
        pass
    if LOGO.exists():
        file_in = page.locator('input[type=file]').first
        if file_in.count():
            file_in.set_input_files(str(LOGO))
    try:
        page.get_by_text("Paid", exact=True).click()
    except Exception:
        pass
    page.get_by_role("button", name="Next").click()
    page.wait_for_timeout(3000)
    log("Dofollow.Tools", "attempted", page.url, page.inner_text("body")[:160].replace("\n", " "))


def main() -> int:
    if not os.environ.get("DISPLAY"):
        print("Set DISPLAY=:0 (desktop box). Over SSH: ssh host 'cd /home/g/lettermill && DISPLAY=:0 python3 seo/submit_dirs.py'", file=sys.stderr)
        return 2
    PROFILE.mkdir(parents=True, exist_ok=True)
    exe = CHROME if Path(CHROME).exists() else None
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            str(PROFILE),
            headless=False,
            executable_path=exe,
            args=["--disable-blink-features=AutomationControlled"],
            viewport={"width": 1280, "height": 900},
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        for fn in (future_tools, uneed, dofollow):
            try:
                fn(page)
            except PwTimeout as e:
                log(fn.__name__, "timeout", notes=str(e)[:180])
            except Exception as e:
                log(fn.__name__, "error", notes=str(e)[:180])
        ctx.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
