// Email delivery. If RESEND_API_KEY is set, mail goes out through the Resend
// HTTP API. Otherwise a mock adapter appends every message to
// <DATA_DIR>/mail-log.jsonl so deliveries are inspectable locally and in
// tests (tests always use the mock — no network).

import fs from 'node:fs';
import path from 'node:path';

export function createMailer({ dataDir, resendApiKey = process.env.RESEND_API_KEY }) {
  const logPath = path.join(dataDir, 'mail-log.jsonl');

  async function sendMock({ to, subject, text }) {
    fs.mkdirSync(dataDir, { recursive: true });
    const record = { to, subject, text, sentAt: new Date().toISOString(), via: 'mock' };
    fs.appendFileSync(logPath, JSON.stringify(record) + '\n');
    return { id: `mock-${Date.now()}`, via: 'mock' };
  }

  async function sendResend({ to, subject, text }) {
    const from = process.env.MAIL_FROM || 'Lettermill <letters@example.com>';
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({ from, to, subject, text }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend send failed: ${res.status} ${body}`);
    }
    return res.json();
  }

  return {
    logPath,
    send: resendApiKey ? sendResend : sendMock,
  };
}
