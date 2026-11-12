import { describe, expect, it } from 'vitest';

import { SOUND_SPEC } from './spec.generated';
import { modeFor, soundStartFor, springT90 } from './timing';

// Hand-computed 90% times. A critically damped spring reaches 90% at
// x / sqrt(stiffness), where (1 + x) e^-x = 0.1, x = 3.88972. The Expressive
// spatial.default (stiffness 380, ratio 0.8) was solved by bisection on its
// underdamped step response: 0.15292 s.
const T90 = {
  'spatial.fast': 3.88972 / Math.sqrt(880), // 0.13112
  'spatial.default': 3.88972 / Math.sqrt(440), // 0.18544
  'spatial.slow': 3.88972 / Math.sqrt(190), // 0.28219
  'appearance.fast': 3.88972 / Math.sqrt(3800), // 0.06310
};
const MS = 0.001;

describe('springT90', () => {
  it.each(Object.entries(T90))('%s lands at its hand-computed 90%% time', (name, t90) => {
    expect(Math.abs(springT90(name) - t90)).toBeLessThan(MS);
  });

  it('reads the Expressive spring when asked', () => {
    expect(Math.abs(springT90('spatial.default', { mode: 'expressive' }) - 0.15292)).toBeLessThan(MS);
  });

  it('throws on a name that is not a motion token', () => {
    expect(() => springT90('spatial.medium')).toThrow(/spatial\.medium/);
  });
});

describe('soundStartFor', () => {
  it('is the spring 90% time minus the sound pickup', () => {
    expect(Math.abs(soundStartFor('spatial.default', 'notify') - (T90['spatial.default'] - SOUND_SPEC.pickup))).toBeLessThan(MS);
    expect(Math.abs(soundStartFor('spatial.slow', 'done.milestone') - (T90['spatial.slow'] - SOUND_SPEC.pickup))).toBeLessThan(MS);
  });

  it('uses the AI count as an AI sound pickup', () => {
    expect(Math.abs(soundStartFor('spatial.slow', 'ai.ready') - (T90['spatial.slow'] - SOUND_SPEC.aiCount.lead))).toBeLessThan(MS);
  });

  it('clamps at 0 when the pickup is longer than the motion', () => {
    expect(soundStartFor('spatial.fast', 'ai.strong')).toBe(0);
  });

  it('follows the Expressive spring', () => {
    expect(Math.abs(soundStartFor('spatial.default', 'done.step', { mode: 'expressive' }) - (0.15292 - SOUND_SPEC.pickup))).toBeLessThan(MS);
  });

  it('throws on a name that is not a sound token', () => {
    expect(() => soundStartFor('spatial.default', 'chime')).toThrow(/chime/);
  });
});

describe('modeFor', () => {
  it('names the spring mode a reduced setting lands in', () => {
    expect(modeFor(true)).toBe('reduced');
    expect(modeFor(false)).toBe('productive');
    expect(modeFor(undefined)).toBe('productive');
  });
});
