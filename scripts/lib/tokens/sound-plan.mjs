/**
 * The sound plan (ADR-042): sound's primitives and its twelve semantic
 * tokens, as one file this repo owns, beside the token plan (`plan.mjs`) and
 * in its style. `scripts/generate-sound-spec.mjs` renders it into the
 * design system's sound-spec module; nothing here reads the network.
 *
 * Every value is ported from the Sound Lab's System tab, unchanged: the Detent
 * material, the just-intonation key, the per-sound trims that put each sound
 * on its level tier, and the AI count. A token sets its notes and its level,
 * nothing else; every sound shares the one material.
 *
 * A note is `{ r, t, d, g }`: a ratio over the token's base pitch, its onset
 * in seconds after the pickup, its length in seconds and its gain. `to` and
 * `gl` glide the note to another ratio over `gl` seconds.
 */

/** The key: C major in just intonation on C5. Milestone alone sits on G4. */
export const SOUND_KEY = {
  tonic: { note: 'C5', hz: 523.25 },
  milestone: { note: 'G4', hz: 392.0 },
};

/**
 * The material: Detent, a dry abacus bead. Each note is three sine partials
 * (`m` x the note's pitch, gain `g`, decay `k` x the note's length), struck
 * with a band-passed noise knock and a 5.2 kHz tick; three notch ticks
 * (`ratchet.at`, seconds before the first note, each a step higher and
 * louder) lead into it. `room` is how much of the
 * sound reaches the reverb, and `wet` the reverb's level.
 */
export const SOUND_MATERIAL = {
  name: 'detent',
  attack: 0.0006,
  room: 0.06,
  wet: 0.2,
  partials: [
    { m: 2, g: 1, k: 0.1 },
    { m: 5.52, g: 0.2, k: 0.04 },
    { m: 3.1, g: 0.1, k: 0.03 },
  ],
  noise: { fm: 5, q: 3, g: 0.7, d: 0.008 },
  tick: { f: 5200, q: 4, g: 0.5, d: 0.004 },
  ratchet: { at: [-0.06, -0.04, -0.02], rise: 0.06, gain: 0.32, gainStep: 0.08 },
};

/**
 * The output stage the Lab played through: its default volume (0.8 x 1.6) into
 * a gentle compressor. Levels are measured before it, at unity gain.
 */
export const SOUND_OUTPUT = {
  gain: 1.28,
  compressor: { threshold: -10, knee: 6, ratio: 8, attack: 0.003, release: 0.15 },
  reverb: { seconds: 1.8, decay: 3.2 },
};

/** Level tiers: the loudest 50 ms of a sound, rendered offline, in dBFS. */
export const SOUND_LEVELS = {
  soft: -26,
  standard: -24,
  fuller: -21.5,
};

/**
 * The pickup: how long before its first note a sound starts. The ratchet's
 * first notch sits 60 ms ahead of the note; an AI sound's count, 150 ms.
 */
export const SOUND_PICKUP = 0.06;

/** The AI count: six rising ticks over the 150 ms before an AI sound lands. */
export const SOUND_AI_COUNT = {
  lead: 0.15,
  ticks: [-0.15, -0.11, -0.078, -0.052, -0.032, -0.016],
  hz: 5000,
  rise: 0.07,
  gain: 0.18,
  gainStep: 0.06,
};

/** The AI feedback cadence every AI sound opens on: G4 + B4, resolving to C5. */
const AI_LEAD_IN = [
  { r: 3 / 4, t: 0, d: 0.18, g: 0.45 },
  { r: 15 / 16, t: 0, d: 0.18, g: 0.35 },
];

/**
 * Sound semantics: `sound.<name>`, read by name without the prefix. `trim` is
 * the dB that puts each sound on its `level`; `base` is the key note its
 * ratios sit on; `hero` plays at full gain (the others at 0.9).
 *
 * Trims are the Lab's, except four the Lab left more than 0.5 dB off their
 * tier when measured (its own `measureCue`, in Chromium): goal -24.9 dB,
 * done.sent -27.0, error -25.7 and ai.strong -23.4. Each is moved by exactly
 * that gap (goal -1.3 to -2.4, done.sent 0.7 to 1.7, error 3 to 4.7,
 * ai.strong -1.1 to -1.7); a trim shifts a sound's level one for one.
 */
export const SOUND_SEMANTICS = [
  {
    name: 'notify', family: 'Notify', base: 'tonic', level: 'standard', trim: -0.5,
    summary: 'G4, then C5 + E5',
    notes: [{ r: 3 / 4, t: 0, d: 0.16, g: 0.55 }, { r: 1, t: 0.11, d: 0.46, g: 0.75 }, { r: 5 / 4, t: 0.11, d: 0.4, g: 0.38 }],
  },
  {
    name: 'prompt', family: 'Prompt', base: 'tonic', level: 'standard', trim: 0,
    summary: 'C5 E5 D5, then A5 over C5',
    notes: [{ r: 1, t: 0, d: 0.14, g: 0.6 }, { r: 5 / 4, t: 0.11, d: 0.14, g: 0.62 }, { r: 9 / 8, t: 0.22, d: 0.14, g: 0.58 }, { r: 5 / 3, t: 0.33, d: 0.44, g: 0.72 }, { r: 1, t: 0.33, d: 0.44, g: 0.3 }],
  },
  {
    name: 'roster', family: 'Roster', base: 'tonic', level: 'soft', trim: -1.2,
    summary: 'A4 + E5, struck twice',
    notes: [{ r: 5 / 6, t: 0, d: 0.11, g: 0.55 }, { r: 5 / 4, t: 0, d: 0.11, g: 0.4 }, { r: 5 / 6, t: 0.13, d: 0.34, g: 0.5 }, { r: 5 / 4, t: 0.13, d: 0.34, g: 0.36 }],
  },
  {
    name: 'goal', family: 'Goal', base: 'tonic', level: 'soft', trim: -2.4,
    summary: 'G4 and G5 glide to C5, then C6 (shared)',
    notes: [{ r: 3 / 4, to: 1, t: 0, d: 0.62, g: 0.6, gl: 0.22 }, { r: 3 / 2, to: 1, t: 0, d: 0.62, g: 0.5, gl: 0.22 }, { r: 2, t: 0.27, d: 0.5, g: 0.38 }],
  },
  {
    name: 'commit', family: 'Commit', base: 'tonic', level: 'standard', trim: -0.7,
    summary: 'C5, then G5',
    notes: [{ r: 1, t: 0, d: 0.5, g: 0.85 }, { r: 3 / 2, t: 0.1, d: 0.48, g: 0.8 }],
  },
  {
    name: 'done.sent', family: 'Done', base: 'tonic', level: 'soft', trim: 1.7,
    summary: 'C6 dot',
    notes: [{ r: 2, t: 0, d: 0.14, g: 0.5 }],
  },
  {
    name: 'done.step', family: 'Done', base: 'tonic', level: 'standard', trim: 0.3,
    summary: 'C5 E5 G5',
    notes: [{ r: 1, t: 0, d: 0.7, g: 0.7 }, { r: 5 / 4, t: 0.06, d: 0.66, g: 0.6 }, { r: 3 / 2, t: 0.12, d: 0.62, g: 0.55 }],
  },
  {
    name: 'done.milestone', family: 'Done', base: 'milestone', level: 'fuller', trim: -0.3, hero: true,
    summary: 'G4 to B5, five notes',
    notes: [{ r: 1, t: 0, d: 1.2, g: 0.7 }, { r: 5 / 4, t: 0.07, d: 1.15, g: 0.6 }, { r: 3 / 2, t: 0.14, d: 1.1, g: 0.55 }, { r: 2, t: 0.21, d: 1.05, g: 0.5 }, { r: 5 / 2, t: 0.28, d: 1, g: 0.38 }],
  },
  {
    name: 'error', family: 'Concern', base: 'tonic', level: 'standard', trim: 4.7,
    summary: 'E5, then D5',
    notes: [{ r: 5 / 4, t: 0, d: 0.16, g: 0.45 }, { r: 9 / 8, t: 0.11, d: 0.34, g: 0.45 }],
  },
  {
    name: 'ai.ready', family: 'AI feedback', base: 'tonic', level: 'standard', trim: -1.6, ai: true,
    summary: 'count, then the C major cadence',
    notes: [...AI_LEAD_IN, { r: 1, t: 0.16, d: 0.55, g: 0.7 }, { r: 5 / 4, t: 0.16, d: 0.55, g: 0.55 }, { r: 3 / 2, t: 0.16, d: 0.55, g: 0.45 }],
  },
  {
    name: 'ai.strong', family: 'AI feedback', base: 'tonic', level: 'standard', trim: -1.7, ai: true,
    summary: 'count, then the cadence with E6 on top',
    notes: [...AI_LEAD_IN, { r: 1, t: 0.16, d: 0.55, g: 0.7 }, { r: 5 / 4, t: 0.16, d: 0.55, g: 0.55 }, { r: 3 / 2, t: 0.16, d: 0.55, g: 0.45 }, { r: 5 / 2, t: 0.27, d: 0.5, g: 0.3 }],
  },
  {
    name: 'ai.refine', family: 'AI feedback', base: 'tonic', level: 'standard', trim: -1, ai: true,
    summary: 'count, then a sus2 (C D G)',
    notes: [...AI_LEAD_IN, { r: 1, t: 0.16, d: 0.55, g: 0.62 }, { r: 9 / 8, t: 0.16, d: 0.55, g: 0.5 }, { r: 3 / 2, t: 0.16, d: 0.55, g: 0.42 }],
  },
];
