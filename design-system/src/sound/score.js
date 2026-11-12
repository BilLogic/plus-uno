/**
 * A sound token's score: every tone and knock it plays, in seconds from the
 * sound's start, ported from the Sound Lab's Detent `playCue` path. Pure; the
 * Web Audio runtime (`play.js`) schedules it and `render.js` renders it to
 * samples, so the two cannot drift.
 *
 * The sound starts on its pickup (the ratchet's first notch, or an AI sound's
 * count) and its first note lands one pickup later.
 */
import { SOUND_SPEC } from './spec.generated';

const FLOOR = 0.0001;

/**
 * The envelope timings both the runtime and the offline render follow, from
 * the Lab: the gain floor every ramp starts and ends on, a knock's rise and
 * the tail it keeps sounding after its decay, a tone's tail, and how long a
 * glide holds its first pitch.
 */
export const ENVELOPE = { floor: FLOOR, knockRise: 0.001, knockTail: 0.03, toneTail: 0.05, glideHold: 0.02 };

const MIN_PEAK = 0.0002;
const MAX_KNOCK_HZ = 12000;
// The Lab's per-strike and per-partial gain scales, and the shortest partial.
const KNOCK_SCALE = 0.6;
const PARTIAL_SCALE = 0.45;
const MIN_PARTIAL = 0.06;
const SUPPORT_GAIN = 0.9;

/**
 * @typedef {{kind: 'tone', at: number, hz: number, toHz?: number, glide?: number, peak: number, attack: number, end: number}} Tone
 *   a sine partial: up to `peak` over `attack`, down to the floor by `end` (seconds after `at`)
 * @typedef {{kind: 'knock', at: number, hz: number, q: number, peak: number, decay: number}} Knock
 *   band-passed noise centered on `hz`, gone after `decay` seconds
 * @typedef {{token: string, pickup: number, room: number, wet: number, events: (Tone|Knock)[]}} Score
 */

const knock = (hz, at, gain, { q, g, d }) => ({
  kind: 'knock',
  at,
  hz: Math.min(hz, MAX_KNOCK_HZ),
  q,
  peak: Math.max(MIN_PEAK, gain * g * KNOCK_SCALE),
  decay: d,
});

/** One struck note on the material: its knock, its tick and its partials. */
function voice(material, hz, at, length, gain, toHz, glide) {
  const { noise, tick, partials, attack } = material;
  return [
    knock(hz * noise.fm, at, gain, noise),
    knock(tick.f, at, gain, tick),
    ...partials.map((p) => ({
      kind: 'tone',
      at,
      hz: hz * p.m,
      ...(toHz ? { toHz: toHz * p.m, glide } : {}),
      peak: Math.max(MIN_PEAK, gain * p.g * PARTIAL_SCALE),
      attack,
      end: Math.max(MIN_PARTIAL, length * p.k),
    })),
  ];
}

/**
 * @param {string} name a sound token, without the `sound.` prefix
 * @returns {Score}
 */
export function scoreFor(name, spec = SOUND_SPEC) {
  const token = spec.tokens[name];
  if (!token) throw new Error(`"${name}" is not a sound token: ${Object.keys(spec.tokens).join(', ')}`);
  const { material, aiCount } = spec;
  const trim = 10 ** (token.trim / 20);
  const pickup = token.ai ? aiCount.lead : spec.pickup;
  const first = token.notes[0];
  const tick = material.tick;
  const events = [];

  if (token.ai) {
    aiCount.ticks.forEach((dt, i) => {
      events.push(knock(aiCount.hz * (1 + i * aiCount.rise), pickup + dt, first.g * trim * (aiCount.gain + i * aiCount.gainStep), tick));
    });
  } else {
    const { ratchet } = material;
    ratchet.at.forEach((dt, i) => {
      events.push(knock(tick.f * (1 + i * ratchet.rise), pickup + dt, first.g * trim * (ratchet.gain + i * ratchet.gainStep), tick));
    });
  }

  const support = token.hero ? 1 : SUPPORT_GAIN;
  token.notes
    .map((n, i) => ({ n, i }))
    .sort((a, b) => a.n.t - b.n.t || a.i - b.i)
    .forEach(({ n }) => {
      const toHz = n.to ? token.base * n.to : undefined;
      events.push(...voice(material, token.base * n.r, pickup + n.t, n.d, n.g * trim * support, toHz, n.gl ?? 0));
    });

  return { token: name, pickup, room: material.room, wet: material.wet, events };
}

/** @returns {number} seconds from the sound's start to its last partial falling silent */
export function scoreLength(score) {
  return Math.max(...score.events.map((e) => e.at + (e.kind === 'tone' ? e.end : e.decay)));
}
