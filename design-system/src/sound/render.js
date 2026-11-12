/**
 * An offline render of a sound's score into samples, and its level as the
 * loudest 50 ms window. Pure, so the level test runs in Node, where there is
 * no OfflineAudioContext: it follows Web Audio's own maths for each node the
 * runtime uses (exponential gain ramps, a sine oscillator, a band-pass biquad
 * over one shared noise buffer).
 *
 * It renders the dry path only. The reverb send is the material's room (0.06)
 * through a wet level of 0.2 on a normalized convolver, about 47 dB under the
 * dry sound, so it moves no level by a measurable amount.
 */
import { ENVELOPE, scoreLength } from './score';

const RATE = 44100;
const NOISE_SECONDS = 0.2;
const { floor: FLOOR, knockRise: KNOCK_RISE, knockTail: KNOCK_TAIL, toneTail: TONE_TAIL, glideHold: GLIDE_HOLD } = ENVELOPE;
const WINDOW = 0.05;

/** A ramp from `from` to `to` over `span`, read `x` seconds in: Web Audio's exponentialRampToValueAtTime. */
const expRamp = (from, to, span, x) => from * (to / from) ** (x / span);

/** Deterministic white noise in -1..1 (mulberry32), so a render is repeatable. */
export function noiseBuffer(length, seed = 1) {
  let a = seed >>> 0;
  return Float32Array.from({ length }, () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  });
}

function addTone(out, rate, e) {
  const first = Math.ceil(e.at * rate);
  const last = Math.min(out.length, Math.ceil((e.at + e.end + TONE_TAIL) * rate));
  let phase = 0;
  for (let i = first; i < last; i++) {
    const x = i / rate - e.at;
    let hz = e.hz;
    if (e.toHz && x > GLIDE_HOLD) hz = x >= e.glide ? e.toHz : expRamp(e.hz, e.toHz, e.glide - GLIDE_HOLD, x - GLIDE_HOLD);
    let gain = FLOOR;
    if (x < e.attack) gain = expRamp(FLOOR, e.peak, e.attack, x);
    else if (x < e.end) gain = expRamp(e.peak, FLOOR, e.end - e.attack, x - e.attack);
    out[i] += Math.sin(phase) * gain;
    phase += (2 * Math.PI * hz) / rate;
  }
}

/** Band-pass biquad, Web Audio's form: unity gain at `hz`, width set by `q`. */
function bandPass(hz, q, rate) {
  const w = (2 * Math.PI * hz) / rate;
  const alpha = Math.sin(w) / (2 * q);
  const a0 = 1 + alpha;
  return { b0: alpha / a0, b2: -alpha / a0, a1: (-2 * Math.cos(w)) / a0, a2: (1 - alpha) / a0 };
}

function addKnock(out, rate, e, noise) {
  const { b0, b2, a1, a2 } = bandPass(e.hz, e.q, rate);
  const first = Math.ceil(e.at * rate);
  const last = Math.min(out.length, Math.ceil((e.at + e.decay + KNOCK_TAIL) * rate), first + noise.length);
  let [x1, x2, y1, y2] = [0, 0, 0, 0];
  for (let i = first; i < last; i++) {
    const x0 = noise[i - first];
    const y0 = b0 * x0 + b2 * x2 - a1 * y1 - a2 * y2;
    [x2, x1, y2, y1] = [x1, x0, y1, y0];
    const x = i / rate - e.at;
    let gain = FLOOR;
    if (x < KNOCK_RISE) gain = expRamp(FLOOR, e.peak, KNOCK_RISE, x);
    else if (x < e.decay) gain = expRamp(e.peak, FLOOR, e.decay - KNOCK_RISE, x - KNOCK_RISE);
    out[i] += y0 * gain;
  }
}

/**
 * @param {import('./score').Score} score
 * @returns {Float32Array} mono samples from the sound's start
 */
export function renderScore(score, { sampleRate = RATE, seed = 1 } = {}) {
  const out = new Float32Array(Math.ceil((scoreLength(score) + TONE_TAIL + WINDOW) * sampleRate));
  const noise = noiseBuffer(Math.round(sampleRate * NOISE_SECONDS), seed);
  for (const e of score.events) {
    if (e.kind === 'tone') addTone(out, sampleRate, e);
    else addKnock(out, sampleRate, e, noise);
  }
  return out;
}

/** @returns {number} the loudest 50 ms window's RMS, in dBFS */
export function loudestWindowDb(samples, sampleRate = RATE) {
  const w = Math.round(sampleRate * WINDOW);
  let sum = 0;
  let best = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
    if (i >= w) sum -= samples[i - w] * samples[i - w];
    if (i >= w - 1) best = Math.max(best, sum / w);
  }
  return 10 * Math.log10(best || 1e-12);
}
