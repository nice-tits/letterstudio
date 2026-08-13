import { SKUS } from './skus.js';

export const SITE = 'https://letterstudio.net';
export const TAGLINE = 'We write it. You send it.';

export const GUIDES = {
  'gym-cancel': {
    slug: 'gym-cancel',
    title: 'How we write a gym cancellation letter from your membership details',
    h1: 'A cancellation letter that uses your club, member ID, and date',
    description:
      'Letter Studio drafts a membership cancellation letter from your name, member ID, club, address, and cancel-by date. You send it. Not legal advice.',
    keyword: 'membership cancellation letter',
    what: 'A plain-language letter you mail or email to the gym, asking them to cancel on or before the date you give us.',
    customize: [
      'Your legal name as you want it on the letterhead',
      'Member ID exactly as it appears on your card or app',
      'Club name and the address you write to',
      'The date you want the cancellation effective',
      'Optional last four of the card on file, only if you want that line in the letter',
    ],
    not: 'We do not contact the gym. We do not promise they will honor the date. We do not tell you to stop paying. This is not legal advice.',
  },
  diplomat: {
    slug: 'diplomat',
    title: 'How we rewrite an angry message into three sendable tones',
    h1: 'Three rewrites of your words: firm, warm, and grey-rock',
    description:
      'Paste the message you almost sent. Letter Studio returns three customized rewrites in your facts — firm, warm, and grey-rock. You pick one and send it.',
    keyword: 'rewrite angry email',
    what: 'A rewrite pack. Same facts you typed. Different temperature. You choose which version leaves your outbox.',
    customize: [
      'The exact situation in your draft — we do not invent a story',
      'Profanity and all-caps get cooled so the other person can actually read it',
      'Firm: direct ask and a next step',
      'Warm: same facts, less heat',
      'Grey-rock: shortest version that still records what happened',
    ],
    not: 'Not therapy. Not legal strategy. We will not add lawsuit language or threats.',
  },
  eulogy: {
    slug: 'eulogy',
    title: 'How we turn your memories into a eulogy you can read aloud',
    h1: 'A remembrance written from your stories, in your relationship to them',
    description:
      'Tell us who they were to you and a few memories. Letter Studio drafts a eulogy you can read. Customized to your notes. Not a stock speech.',
    keyword: 'eulogy writing service',
    what: 'A spoken-length remembrance using the name, your relationship, and the memories you provide.',
    customize: [
      'The person’s name, spelled as you want it said',
      'How you knew them — sibling, friend, coworker',
      'The specific stories you type. Those become the body. We do not pull a generic life story off the internet',
    ],
    not: 'We are not the funeral home. We do not deliver the eulogy. We do not write obituaries for newspaper placement unless you copy the draft there yourself.',
  },
  speech: {
    slug: 'speech',
    title: 'How we write a wedding or retirement toast from your notes',
    h1: 'A toast that sounds like you, built from the stories you actually have',
    description:
      'Occasion, who it is for, and your notes. Letter Studio drafts a toast you stand up and give. Customized. You send — or speak — it yourself.',
    keyword: 'wedding speech writer',
    what: 'A short toast for a wedding, best-man slot, or retirement, using your occasion and stories.',
    customize: [
      'Your name as the speaker',
      'The occasion (wedding, retirement, birthday)',
      'The person you are speaking about',
      'The anecdotes you paste. No stolen celebrity speech',
    ],
    not: 'We do not attend the event. We do not guarantee laughs. You edit anything that is not you.',
  },
  apology: {
    slug: 'apology',
    title: 'How we write an apology that owns it — no “but”',
    h1: 'An apology letter from what happened, the impact, and what you will do',
    description:
      'Letter Studio drafts an apology from your account of what happened and the repair you are offering. No excuses stacked on the end.',
    keyword: 'apology letter',
    what: 'A letter that names what you did, skips the dodge, and states the next step you already decided.',
    customize: [
      'Your name and theirs',
      'What happened, in your words',
      'The specific repair you will do — not a vague “I’ll be better”',
    ],
    not: 'Not a courtroom admission we control. Not couples counseling. You send it. You live with it.',
  },
  resignation: {
    slug: 'resignation',
    title: 'How we write a short resignation letter with your last day',
    h1: 'A resignation that names the role, the manager, and the date you leave',
    description:
      'Name, title, manager, last day. Optional thanks. Letter Studio drafts a clean resignation you send. Not HR advice.',
    keyword: 'resignation letter',
    what: 'A one-page notice. Professional. No drama unless you put it in the optional thanks (please don’t).',
    customize: [
      'Your name and job title as they appear at work',
      'Manager’s name',
      'Your last day',
      'Optional thank-you line if you actually mean it',
    ],
    not: 'Not employment-law advice. We do not file it with HR for you. We do not negotiate severance.',
  },
  neighbor: {
    slug: 'neighbor',
    title: 'How we write a calm neighbor note that does not start a war',
    h1: 'A neighbor or HOA note from the issue and the one thing you are asking',
    description:
      'Describe the noise, parking, or fence. Say what you want. Letter Studio drafts a calm note. You deliver it. Not a lawsuit.',
    keyword: 'noise complaint letter neighbor',
    what: 'A short letter you can leave, email, or read. Facts plus one ask.',
    customize: [
      'Your name',
      'The issue in your words',
      'The specific ask (quiet after 10, move the cans, etc.)',
    ],
    not: 'Not a legal demand. Not an HOA filing service. We will not threaten fines or lawyers.',
  },
  complaint: {
    slug: 'complaint',
    title: 'How we write a company complaint from what actually happened',
    h1: 'A complaint letter that uses your facts and the fix you want',
    description:
      'Company name, what happened, what you want done. Letter Studio drafts a factual complaint you send. True events only.',
    keyword: 'complaint letter to company',
    what: 'A letter to a business. Dates and facts you provide. A clear request.',
    customize: [
      'Your name',
      'The company',
      'What happened, as you tell it',
      'The remedy you want (refund, replacement, a written answer)',
    ],
    not: 'Not a class action. Not a review we post for you. Do not invent damages. We do not contact the company.',
  },
};

export function getGuide(slug) {
  if (typeof slug !== 'string') return null;
  return GUIDES[slug.trim().toLowerCase()] ?? null;
}

export function allGuides() {
  return Object.values(GUIDES);
}

// Free lead magnet — not a SKU. getGuide stays Brand-A product pages only.
export const FREE_GUIDES = {
  'before-you-send': {
    slug: 'before-you-send',
    title: 'Don’t send the letter until you have these facts',
    h1: 'A one-page checklist before you mail, email, or stand up',
    description:
      'Free checklist of the facts a cancellation, resignation, eulogy, toast, apology, neighbor note, or complaint actually needs. Not legal advice. You send it.',
    what: 'Fill the boxes for the letter you are about to send. If a box is empty, stop and find the fact. A polished letter with a blank member ID is a stall.',
    sections: [
      {
        heading: 'Every letter',
        items: [
          'Your name as you want it on the page',
          'Their name, spelled the way they spell it',
          'Today’s date and the date that matters (last day, cancel-by, the event)',
          'How you will send it — email, portal, certified mail, hand it over, or speak it. A desk chat is not a record',
          'A copy you keep',
        ],
      },
      {
        heading: 'Gym / membership cancel',
        items: [
          'Legal name on the account',
          'Member ID exactly as the card or app shows it. Do not guess',
          'Club name and the address you are writing to',
          'The date you want the membership to end',
          'The method the contract names. We do not tell you to stop paying',
        ],
      },
      {
        heading: 'Resignation',
        items: [
          'Your name and job title as they appear at work',
          'Manager’s name',
          'Last day. Two weeks is a custom in a lot of US jobs, not a statute — read your handbook',
          'Optional thanks only if you mean it. No vent. HR keeps the letter',
        ],
      },
      {
        heading: 'Eulogy',
        items: [
          'The name, spelled as you want it said',
          'Your relationship in the first sentence so you do not freeze',
          'Three memories you can see — a kitchen, a joke, a habit. Not a Wikipedia page',
          'Spoken length: four to seven minutes. Print large type',
        ],
      },
      {
        heading: 'Wedding or retirement toast',
        items: [
          'Your name and how you know them. The back tables cannot hear the MC',
          'Three stories: before the couple, the couple, a kind close',
          'A short wish. Sit down. Four minutes',
        ],
      },
      {
        heading: 'Apology',
        items: [
          'What you did, in your words. Not “sorry you felt”',
          'The impact, if you know it',
          'One specific repair. “I’ll be better” is not a next step',
          'No “but.” Everything after “but” is the real letter',
        ],
      },
      {
        heading: 'Neighbor / HOA note',
        items: [
          'Who you are',
          'One issue, with times if it is noise',
          'One ask',
          'A way they can reply. No lawyer threats in the first note',
        ],
      },
      {
        heading: 'Company complaint',
        items: [
          'Your name and the company',
          'What happened, with dates. Order or account numbers if you have them',
          'One remedy: refund, replacement, or a written answer',
          'True events only. Adjectives do not refund',
        ],
      },
      {
        heading: 'Tone rewrite (the message you almost sent)',
        items: [
          'Paste the draft you actually wrote. Do not invent a cleaner story',
          'Pick one temperature later: firm, warm, or grey-rock',
          'No lawsuit language',
        ],
      },
    ],
    not: 'Not legal advice. We do not send the letter. We do not promise anyone honors it. Do not invent facts. We will not write threats, credit-repair pitches, or harassment letters.',
  },
};

export function getFreeGuide(slug) {
  if (typeof slug !== 'string') return null;
  return FREE_GUIDES[slug.trim().toLowerCase()] ?? null;
}

export function allFreeGuides() {
  return Object.values(FREE_GUIDES);
}
