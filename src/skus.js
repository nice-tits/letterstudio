// Brand-A catalog only. getSku returns null for timeshare, infidelity,
// onlyfans, flight, and any other Brand-B name.

export const SKUS = {
  'gym-cancel': {
    sku: 'gym-cancel',
    displayName: 'Membership Cancellation Letter',
    blurb: 'A plain cancellation letter with your name, member ID, club, and date.',
    descriptor: 'LETTERMILL LETTER',
    unitAmount: 1900,
    currency: 'usd',
    fields: [
      { name: 'fullName', label: 'Full name' },
      { name: 'memberId', label: 'Member ID' },
      { name: 'clubName', label: 'Club name' },
      { name: 'clubAddress', label: 'Club address' },
      { name: 'cancelBy', label: 'Cancel by' },
      { name: 'cardLast4', label: 'Card last 4 (optional)', optional: true, maxlength: 4 },
    ],
  },
  diplomat: {
    sku: 'diplomat',
    displayName: 'Diplomat — Tone Rewrite',
    blurb: 'Three rewrites of your message (firm, warm, grey-rock).',
    descriptor: 'LETTERMILL LETTER',
    unitAmount: 1900,
    currency: 'usd',
    fields: [{ name: 'message', label: 'Message', type: 'textarea', minlength: 20, maxlength: 8000 }],
  },
  eulogy: {
    sku: 'eulogy',
    displayName: 'Eulogy / Remembrance',
    blurb: 'A short eulogy from your notes. You read it yourself.',
    descriptor: 'LETTERMILL LETTER',
    unitAmount: 4900,
    currency: 'usd',
    fields: [
      { name: 'speakerName', label: 'Your name' },
      { name: 'deceasedName', label: 'Name of the person' },
      { name: 'relationship', label: 'Your relationship' },
      { name: 'memories', label: 'Memories / stories', type: 'textarea', minlength: 20, maxlength: 8000 },
    ],
  },
  speech: {
    sku: 'speech',
    displayName: 'Toast / Speech',
    blurb: 'Wedding, best-man, or retirement toast from your notes.',
    descriptor: 'LETTERMILL LETTER',
    unitAmount: 2900,
    currency: 'usd',
    fields: [
      { name: 'speakerName', label: 'Your name' },
      { name: 'occasion', label: 'Occasion' },
      { name: 'honoree', label: 'Who it is for' },
      { name: 'notes', label: 'Stories / notes', type: 'textarea', minlength: 20, maxlength: 8000 },
    ],
  },
  apology: {
    sku: 'apology',
    displayName: 'Apology Letter',
    blurb: 'A clean apology: what happened, the impact, what you will do. No “but.”',
    descriptor: 'LETTERMILL LETTER',
    unitAmount: 1900,
    currency: 'usd',
    fields: [
      { name: 'yourName', label: 'Your name' },
      { name: 'theirName', label: 'Their name' },
      { name: 'whatHappened', label: 'What happened', type: 'textarea', minlength: 20, maxlength: 8000 },
      { name: 'repair', label: 'What you will do next' },
    ],
  },
  resignation: {
    sku: 'resignation',
    displayName: 'Resignation Letter',
    blurb: 'Short, professional resignation. You send it.',
    descriptor: 'LETTERMILL LETTER',
    unitAmount: 1900,
    currency: 'usd',
    fields: [
      { name: 'fullName', label: 'Your name' },
      { name: 'jobTitle', label: 'Job title' },
      { name: 'managerName', label: 'Manager name' },
      { name: 'lastDay', label: 'Last day' },
      { name: 'thanks', label: 'Optional thanks', optional: true },
    ],
  },
  neighbor: {
    sku: 'neighbor',
    displayName: 'Neighbor / HOA Note',
    blurb: 'A calm note about noise, parking, or a fence. Not a lawsuit.',
    descriptor: 'LETTERMILL LETTER',
    unitAmount: 1900,
    currency: 'usd',
    fields: [
      { name: 'yourName', label: 'Your name' },
      { name: 'issue', label: 'The issue', type: 'textarea', minlength: 20, maxlength: 8000 },
      { name: 'ask', label: 'What you are asking' },
    ],
  },
  complaint: {
    sku: 'complaint',
    displayName: 'Company Complaint Letter',
    blurb: 'A factual letter to a company. True events only. You send it.',
    descriptor: 'LETTERMILL LETTER',
    unitAmount: 1900,
    currency: 'usd',
    fields: [
      { name: 'yourName', label: 'Your name' },
      { name: 'company', label: 'Company' },
      { name: 'whatHappened', label: 'What happened', type: 'textarea', minlength: 20, maxlength: 8000 },
      { name: 'want', label: 'What you want them to do' },
    ],
  },
};

export function getSku(sku) {
  if (typeof sku !== 'string') return null;
  return SKUS[sku.trim().toLowerCase()] ?? null;
}
