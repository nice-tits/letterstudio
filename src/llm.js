// LLM interface. Default implementation is a deterministic, template-based
// stub with no network access. An optional live provider can be selected with
// LLM_PROVIDER=openai (requires OPENAI_API_KEY), but the stub is the default
// and is what tests exercise.

// --- Diplomat heuristics (stub, deterministic, no network) ---

const PROFANITY = [
  'fuck', 'fucking', 'fucked', 'shit', 'shitty', 'damn', 'damned', 'hell',
  'asshole', 'bastard', 'bitch', 'crap', 'crappy', 'dick', 'piss', 'pissed',
  'idiot', 'stupid', 'moron', 'pathetic', 'loser', 'lying', 'liar', 'scam',
];

// Strip profanity/insults, tame excessive caps and exclamation runs, and
// collapse whitespace. Deterministic and deliberately crude — it is a stub.
function sanitize(text) {
  let t = String(text);
  t = t.replace(/([!?]){2,}/g, '$1'); // "!!!" -> "!", "??" -> "?"
  t = t.replace(/!/g, '.'); // remaining exclamations become flat statements
  for (const word of PROFANITY) {
    t = t.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  }
  // De-emphasize ALL-CAPS shouting (3+ letters, so "I" and "ID" survive).
  t = t.replace(/\b[A-Z]{3,}\b/g, (m) => m.toLowerCase());
  t = t.replace(/\.{2,}/g, '.');
  t = t.replace(/[ \t]{2,}/g, ' ');
  t = t.replace(/ *\n{3,} */g, '\n\n');
  return t.trim().replace(/^[\s.,;:]+|[\s,;:]+$/g, '');
}

function firstSentence(text) {
  const m = text.match(/^[^.?\n]+[.?]?/);
  return (m ? m[0] : text).trim();
}

function diplomatRewrite(message) {
  const core = sanitize(message);
  const gist = firstSentence(core);

  const firm = [
    'I want to address this directly and be clear about where I stand.',
    '',
    core,
    '',
    'Here is what I need from you: a straight answer and a concrete next step. Please respond so we can settle this and move on.',
  ].join('\n');

  const warm = [
    "Thanks for taking the time to read this — I know it's not an easy topic, and I appreciate you hearing me out.",
    '',
    core,
    '',
    "I'd really appreciate your help sorting this out. Whenever you have a moment, just let me know your thoughts and we'll find a way forward together.",
  ].join('\n');

  const greyRock = ['Noted.', '', gist, '', 'Thanks.'].join('\n');

  return { firm, warm, greyRock };
}

function stubGenerate({ kind, input }) {
  if (kind === 'gym-cancel') {
    const { fullName, memberId, clubName, clubAddress, cancelBy, cardLast4 } = input;
    const lines = [
      `${fullName}`,
      `Member ID: ${memberId}`,
      '',
      'To the membership office at:',
      `${clubName}`,
      `${clubAddress}`,
      '',
      `Subject: Request to cancel my membership (Member ID: ${memberId})`,
      '',
      'Dear Membership Office,',
      '',
      `I, ${fullName}, am writing to request the cancellation of my membership at ${clubName}, member ID ${memberId}.`,
      `Please process this cancellation effective on or before ${cancelBy}.`,
    ];
    if (cardLast4) {
      lines.push(`The card on file ends in ${cardLast4}. Please do not apply further membership charges to it after the cancellation takes effect.`);
    }
    lines.push(
      '',
      'Please send me written confirmation that my membership has been cancelled, along with the effective date of the cancellation.',
      '',
      'Thank you for your help.',
      '',
      'Sincerely,',
      `${fullName}`,
      '',
      '---',
      'This letter was drafted by a letter-writing service. It is not legal advice. You send it yourself.',
    );
    return lines.join('\n');
  }

  if (kind === 'diplomat') {
    const { message } = input;
    const { firm, warm, greyRock } = diplomatRewrite(message);
    return [
      '=== TONE 1: FIRM ===',
      firm,
      '',
      '=== TONE 2: WARM ===',
      warm,
      '',
      '=== TONE 3: GREY-ROCK ===',
      greyRock,
      '',
      '---',
      'Drafted by a letter-writing service. Not legal advice. You choose which version to send, and you send it yourself.',
    ].join('\n');
  }

  const footer = '\n\n---\nThis letter was drafted by a letter-writing service. It is not legal advice. You send it yourself.';

  if (kind === 'eulogy') {
    return [
      `A remembrance of ${input.deceasedName}`,
      `Shared by ${input.speakerName}, ${input.relationship}`,
      '',
      `We are here because ${input.deceasedName} mattered.`,
      '',
      sanitize(input.memories),
      '',
      `${input.deceasedName} will be missed. Thank you for letting me share these words.`,
      footer,
    ].join('\n');
  }

  if (kind === 'speech') {
    return [
      `${input.occasion} — a toast from ${input.speakerName}`,
      '',
      `To ${input.honoree}:`,
      '',
      sanitize(input.notes),
      '',
      `Please join me in celebrating ${input.honoree}.`,
      footer,
    ].join('\n');
  }

  if (kind === 'apology') {
    return [
      `Dear ${input.theirName},`,
      '',
      `I am sorry. I take responsibility for what happened.`,
      '',
      sanitize(input.whatHappened),
      '',
      `I will ${input.repair}.`,
      '',
      `I am not asking you to fix this for me. I wanted you to have a clear apology.`,
      '',
      `Sincerely,`,
      input.yourName,
      footer,
    ].join('\n');
  }

  if (kind === 'resignation') {
    const thanks = input.thanks ? `\n${input.thanks}\n` : '\n';
    return [
      `Dear ${input.managerName},`,
      '',
      `Please accept this letter as notice of my resignation from the position of ${input.jobTitle}. My last day will be ${input.lastDay}.`,
      thanks,
      `I will help with a clean handoff through that date.`,
      '',
      `Sincerely,`,
      input.fullName,
      footer,
    ].join('\n');
  }

  if (kind === 'neighbor') {
    return [
      `Hello,`,
      '',
      `I am writing as a neighbor. I would like to keep this simple and calm.`,
      '',
      sanitize(input.issue),
      '',
      `What I am asking: ${input.ask}`,
      '',
      `Thank you for reading this.`,
      '',
      input.yourName,
      footer,
    ].join('\n');
  }

  if (kind === 'complaint') {
    return [
      `To ${input.company},`,
      '',
      `I am writing about a problem I experienced. These are the facts as I understand them.`,
      '',
      sanitize(input.whatHappened),
      '',
      `What I am asking you to do: ${input.want}`,
      '',
      `Please reply in writing.`,
      '',
      `Sincerely,`,
      input.yourName,
      footer,
    ].join('\n');
  }

  throw new Error(`stub LLM: unknown kind "${kind}"`);
}

async function openaiGenerate({ kind, input }) {
  // Optional live provider. Only used when LLM_PROVIDER=openai and
  // OPENAI_API_KEY is set. Deliberately minimal: single chat completion.
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  const prompt =
    kind === 'diplomat'
      ? `Rewrite the following message in three tones labeled FIRM, WARM, and GREY-ROCK. No legal threats, no guarantees.\n\n${input.message}`
      : `Write a plain-text ${kind} letter from these facts as JSON. No legal advice, no guarantees, no threats, no "stop paying". The customer sends it themselves.\n\n${JSON.stringify(input)}`;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI request failed: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

export const llm = {
  async generate(opts) {
    if (process.env.LLM_PROVIDER === 'openai') {
      return openaiGenerate(opts);
    }
    return stubGenerate(opts);
  },
};
