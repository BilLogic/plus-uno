import { test } from 'vitest';
import assert from 'node:assert/strict';

import { dampingFor, figmaBounce, linearEasing, measureSpring, sampleLinear, sineEasing, springStep } from './spring.js';

const near = (actual, expected, tolerance, label) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} is not within ${tolerance} of ${expected}`);

test('damping = 2 x ratio x sqrt(stiffness x mass)', () => {
  near(dampingFor({ stiffness: 440, ratio: 1 }), 41.95, 0.01, 'spatial.default');
  near(dampingFor({ stiffness: 880, ratio: 1 }), 59.33, 0.01, 'spatial.fast');
  assert.equal(dampingFor({ stiffness: 27.4, ratio: 0 }), 0);
});

test('a critically damped spring starts at rest and ends at its target', () => {
  const y = springStep({ stiffness: 440, ratio: 1 });
  assert.equal(y(0), 0);
  near(y(1), 1, 1e-6, 'end');
});

test('measureSpring: spatial.default reads 185 ms to 90%, 317 ms settled, no overshoot', () => {
  const m = measureSpring({ stiffness: 440, ratio: 1 });
  near(m.t90 * 1000, 185, 2, 't90');
  near(m.settle * 1000, 317, 2, 'settle');
  assert.equal(m.overshoot, 0);
});

test('measureSpring: ratio 0.6 overshoots by about 9.5%', () => {
  near(measureSpring({ stiffness: 800, ratio: 0.6 }).overshoot, 0.095, 0.002, 'overshoot');
});

test('sampleLinear stays within 40 points and 1% of the spring, for every ratio', () => {
  for (const cfg of [
    { stiffness: 880, ratio: 1 },
    { stiffness: 3800, ratio: 1 },
    { stiffness: 380, ratio: 0.8 },
    { stiffness: 800, ratio: 0.6 },
  ]) {
    const { settle } = measureSpring(cfg);
    const y = springStep(cfg);
    const points = sampleLinear((t) => y(t * settle));
    assert.ok(points.length <= 40, `${points.length} points for ${JSON.stringify(cfg)}`);
    assert.deepEqual(points[0], { x: 0, y: 0 });
    assert.deepEqual(points.at(-1), { x: 1, y: 1 });
    for (let x = 0; x <= 1; x += 0.001) {
      const j = points.findIndex((p) => p.x >= x);
      const [a, b] = j <= 0 ? [points[0], points[0]] : [points[j - 1], points[j]];
      const lerp = b.x === a.x ? b.y : a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
      assert.ok(Math.abs(lerp - y(x * settle)) < 0.01, `error at ${x} for ${JSON.stringify(cfg)}`);
    }
  }
});

test('linearEasing writes a CSS linear() with stops in percent', () => {
  assert.equal(linearEasing([{ x: 0, y: 0 }, { x: 0.5, y: 0.75 }, { x: 1, y: 1 }]), 'linear(0, 0.75 50%, 1)');
});

test('sineEasing is one half cycle, 0 to 1, with a modest point count', () => {
  const points = sineEasing();
  assert.ok(points.length <= 40);
  assert.deepEqual(points[0], { x: 0, y: 0 });
  assert.deepEqual(points.at(-1), { x: 1, y: 1 });
  for (const { x, y } of points) near(y, (1 - Math.cos(Math.PI * x)) / 2, 0.001, `point at ${x}`);
});

test('figmaBounce: critical damping is 0 and ratio 0.6 is 0.4 (the Core probe values)', () => {
  assert.equal(figmaBounce(1), 0);
  assert.equal(figmaBounce(1.5), 0);
  assert.ok(Math.abs(figmaBounce(0.6) - 0.4) < 1e-9);
});
