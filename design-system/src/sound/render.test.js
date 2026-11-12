import { describe, expect, it } from 'vitest';

import { loudestWindowDb, renderScore } from './render';
import { scoreFor } from './score';
import { SOUND_SPEC } from './spec.generated';

// jsdom has no OfflineAudioContext, so a sound's level is measured on the pure
// render of its score, the same score the Web Audio runtime schedules.
describe('each sound token renders on its level tier', () => {
  it.each(Object.entries(SOUND_SPEC.tokens))('%s', (name, token) => {
    const db = loudestWindowDb(renderScore(scoreFor(name)));
    const tier = SOUND_SPEC.levels[token.level];
    expect(Math.abs(db - tier), `${name}: ${db.toFixed(2)} dB against ${token.level} ${tier} dB`).toBeLessThanOrEqual(0.5);
  });
});

describe('loudestWindowDb', () => {
  it('reads a full-scale sine as about -3 dBFS', () => {
    const rate = 44100;
    const samples = Float32Array.from({ length: rate / 2 }, (_, i) => Math.sin((2 * Math.PI * 440 * i) / rate));
    expect(loudestWindowDb(samples, rate)).toBeCloseTo(-3.01, 1);
  });

  it('finds the loudest 50 ms, not the average', () => {
    const rate = 44100;
    const samples = new Float32Array(rate);
    samples.fill(0.5, rate / 2, rate / 2 + rate * 0.05);
    expect(loudestWindowDb(samples, rate)).toBeCloseTo(20 * Math.log10(0.5), 1);
  });
});

describe('scoreFor', () => {
  it('starts on the pickup: the first ratchet notch at 0, the first note one pickup later', () => {
    const score = scoreFor('notify');
    expect(score.pickup).toBe(SOUND_SPEC.pickup);
    expect(Math.min(...score.events.map((e) => e.at))).toBeCloseTo(0, 9);
    expect(Math.min(...score.events.filter((e) => e.kind === 'tone').map((e) => e.at))).toBeCloseTo(SOUND_SPEC.pickup, 9);
  });

  it('leads an AI sound with the six-tick count instead of the ratchet', () => {
    const score = scoreFor('ai.ready');
    expect(score.pickup).toBe(SOUND_SPEC.aiCount.lead);
    const before = score.events.filter((e) => e.at < score.pickup);
    expect(before).toHaveLength(SOUND_SPEC.aiCount.ticks.length);
  });

  it('throws on a name that is not a sound token', () => {
    expect(() => scoreFor('chime')).toThrow(/chime/);
  });
});
