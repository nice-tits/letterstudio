import { test } from 'node:test';
import assert from 'node:assert/strict';
import { llm } from '../src/llm.js';

// Stub LLM is deterministic; force it in case the environment says otherwise.
delete process.env.LLM_PROVIDER;

test('gym-cancel letter contains name, member ID, club, and a clear cancel request', async () => {
  const letter = await llm.generate({
    kind: 'gym-cancel',
    input: {
      fullName: 'Jordan Example',
      memberId: 'MBR-12345',
      clubName: 'Iron Palace Fitness',
      clubAddress: '12 Barbell Ave, Springfield',
      cancelBy: '2026-09-01',
      cardLast4: '4242',
    },
  });

  assert.match(letter, /Jordan Example/);
  assert.match(letter, /MBR-12345/);
  assert.match(letter, /Iron Palace Fitness/);
  assert.match(letter, /12 Barbell Ave, Springfield/);
  assert.match(letter, /2026-09-01/);
  assert.match(letter, /4242/);
  assert.match(letter, /request the cancellation of my membership/i);
});

test('gym-cancel letter has no guarantee language and no "stop paying" advice', async () => {
  const letter = await llm.generate({
    kind: 'gym-cancel',
    input: {
      fullName: 'Jordan Example',
      memberId: 'MBR-12345',
      clubName: 'Iron Palace Fitness',
      clubAddress: '12 Barbell Ave, Springfield',
      cancelBy: '2026-09-01',
    },
  });
  const lower = letter.toLowerCase();
  for (const banned of ['guarantee', 'guaranteed', 'stop paying']) {
    assert.ok(!lower.includes(banned), `letter must not contain "${banned}"`);
  }
});

test('diplomat returns 3 labeled tones and adds no legal threats', async () => {
  const out = await llm.generate({
    kind: 'diplomat',
    input: { message: 'You never returned my drill and it has been three months. I am furious about this.' },
  });

  for (const label of ['TONE 1: FIRM', 'TONE 2: WARM', 'TONE 3: GREY-ROCK']) {
    assert.ok(out.includes(label), `missing label "${label}"`);
  }

  const lower = out.toLowerCase();
  for (const banned of ['sue', 'lawsuit', 'attorney', 'legal action', 'lawyer', 'court']) {
    assert.ok(!lower.includes(banned), `diplomat output must not contain "${banned}"`);
  }
  assert.match(out, /not legal advice/i);
  assert.match(out, /you send it yourself/i);
});

const ANGRY_MESSAGE =
  'You NEVER returned my drill, you lying asshole!! It has been THREE months and I am fucking furious!!! This is total crap. What the hell???';

function splitTones(out) {
  const [, firm, warm, greyRock] = out.split(/=== TONE \d: (?:FIRM|WARM|GREY-ROCK) ===/);
  return { firm: firm.trim(), warm: warm.trim(), greyRock: greyRock.split('\n---')[0].trim() };
}

test('diplomat stub genuinely rewrites: each tone differs from the original and from each other', async () => {
  const out = await llm.generate({ kind: 'diplomat', input: { message: ANGRY_MESSAGE } });
  const { firm, warm, greyRock } = splitTones(out);

  for (const [name, tone] of Object.entries({ firm, warm, greyRock })) {
    assert.ok(tone.length > 0, `${name} tone must not be empty`);
    assert.ok(!tone.includes(ANGRY_MESSAGE), `${name} tone must not parrot the original message`);
  }
  assert.notEqual(firm, warm);
  assert.notEqual(firm, greyRock);
  assert.notEqual(warm, greyRock);

  // Tone character: grey-rock is the minimal one, warm is the soft one.
  assert.ok(greyRock.length < firm.length, 'grey-rock should be shorter than firm');
  assert.match(warm, /I'd really appreciate/i);
});

test('eulogy and resignation stubs include names and no guarantee language', async () => {
  const eulogy = await llm.generate({
    kind: 'eulogy',
    input: {
      speakerName: 'Sam Reed',
      deceasedName: 'Alex Reed',
      relationship: 'sibling',
      memories: 'Alex taught me to drive and never once raised a voice in that car.',
    },
  });
  assert.match(eulogy, /Alex Reed/);
  assert.match(eulogy, /Sam Reed/);
  assert.ok(!/guarantee/i.test(eulogy));

  const resign = await llm.generate({
    kind: 'resignation',
    input: {
      fullName: 'Sam Reed',
      jobTitle: 'Clerk',
      managerName: 'Pat Lee',
      lastDay: '2026-09-30',
    },
  });
  assert.match(resign, /Sam Reed/);
  assert.match(resign, /2026-09-30/);
  assert.ok(!/guarantee/i.test(resign));
});

test('diplomat stub strips profanity, insults, caps-shouting and exclamation runs in every tone', async () => {
  const out = await llm.generate({ kind: 'diplomat', input: { message: ANGRY_MESSAGE } });
  const lower = out.toLowerCase();
  for (const banned of ['asshole', 'fuck', 'crap', 'hell', 'lying', 'shit', 'damn', 'bitch', 'bastard', 'idiot']) {
    assert.ok(!lower.includes(banned), `output must not contain "${banned}"`);
  }
  assert.ok(!/!{1,}/.test(out), 'no exclamation marks should survive');
  assert.ok(!/\bNEVER\b|\bTHREE\b/.test(out), 'caps-shouting should be normalized');
});
