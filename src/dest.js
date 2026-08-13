export const USE_CASES = {
  'gym-members': {
    slug: 'gym-members',
    title: 'Cancellation letters for gym members who just want out',
    h1: 'For gym members who need a cancellation letter tonight',
    description:
      'Letter Studio writes a membership cancellation letter from your club, member ID, and date. You send it. Not legal advice.',
    body: 'You already paid. You already decided. You need a letter that has your real member ID and the date you want out — not a PDF template you have to edit in Word. Fill the form. We draft. You email or mail it.',
    cta: '/#gym-cancel',
  },
  'wedding-speakers': {
    slug: 'wedding-speakers',
    title: 'Toasts for people who are not speechwriters',
    h1: 'For best men, maids of honor, and anyone who has to stand up',
    description:
      'Give us the occasion, who it is for, and your stories. Letter Studio drafts the toast. You say it.',
    body: 'You have three stories and a deadline. We turn those notes into a toast you can actually read without sounding like ChatGPT at a microphone.',
    cta: '/#speech',
  },
  families: {
    slug: 'families',
    title: 'Eulogies written from the family’s own memories',
    h1: 'For families who have to speak and cannot face a blank page',
    description:
      'Name, relationship, memories. Letter Studio drafts a eulogy you can read. You remain the speaker.',
    body: 'The funeral is this week. You know what you would say if you could get it out. Type the memories. We shape them. You read them.',
    cta: '/#eulogy',
  },
};

export const ALTS = {
  chatgpt: {
    slug: 'chatgpt',
    title: 'Letter Studio vs ChatGPT for letters you actually send',
    h1: 'When to use Letter Studio instead of pasting into ChatGPT',
    description:
      'ChatGPT is free and general. Letter Studio is a checkout, a form, and a finished letter emailed to you. Honest comparison.',
    vs: [
      ['Price', 'ChatGPT: subscription or free. Letter Studio: $19–$49 per letter.'],
      ['Output', 'ChatGPT: a chat you copy. Letter Studio: a finished email after you pay.'],
      ['Customization', 'Both use what you type. We force the fields so the letter has the IDs and dates you need.'],
      ['When ChatGPT wins', 'You already write well and just need a nudge.'],
      ['When we win', 'You want a form, a card charge, and a file in your inbox in one shot.'],
    ],
  },
  'eulogy-expert': {
    slug: 'eulogy-expert',
    title: 'Letter Studio vs dedicated eulogy sites',
    h1: 'Eulogy drafts without a $40 “four versions” upsell maze',
    description:
      'Specialist eulogy sites exist. We are a letter shop that also writes remembrances from your notes. Here is the honest split.',
    vs: [
      ['Focus', 'They only do eulogies. We do eulogies plus cancellation, toasts, apologies.'],
      ['Price', 'Specialists often $40–$450. Ours is $49 for a remembrance draft.'],
      ['When they win', 'You want a long interview and a premium writer brand.'],
      ['When we win', 'You have notes, a deadline, and you will read it yourself.'],
    ],
  },
};
