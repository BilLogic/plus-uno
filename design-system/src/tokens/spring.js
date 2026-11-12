/**
 * The spring maths behind the motion tokens (ADR-041): the analytic step
 * response of a mass-spring-damper, how long it takes, and a `linear()`
 * sample of it. Pure; the plan (`plan.mjs`) says which springs exist and
 * `scripts/lib/tokens/build.mjs` writes them out.
 */

/** Damping coefficient for a stiffness, ratio and mass: 2 x ratio x sqrt(stiffness x mass). */
export const dampingFor = ({ stiffness, ratio, mass = 1 }) => 2 * ratio * Math.sqrt(stiffness * mass);

/**
 * Position over time (seconds) of a spring released from 0 toward 1, at rest.
 * @returns {(t: number) => number}
 */
export function springStep({ stiffness, ratio, mass = 1 }) {
  const w = Math.sqrt(stiffness / mass);
  if (ratio === 0) return (t) => 1 - Math.cos(w * t);
  if (ratio < 1) {
    const wd = w * Math.sqrt(1 - ratio * ratio);
    return (t) => 1 - Math.exp(-ratio * w * t) * (Math.cos(wd * t) + ((ratio * w) / wd) * Math.sin(wd * t));
  }
  return (t) => 1 - Math.exp(-w * t) * (1 + w * t);
}

const STEP = 0.0005;

/**
 * Time to 90% and to settled (within 1% of the target for good), in seconds,
 * and the overshoot past the target as a fraction.
 */
export function measureSpring(config) {
  const y = springStep(config);
  const end = 12 / Math.sqrt(config.stiffness / (config.mass ?? 1));
  let t90 = null;
  let lastOutside = 0;
  let peak = 0;
  for (let t = 0; t <= end; t += STEP) {
    const v = y(t);
    if (t90 === null && v >= 0.9) t90 = t;
    if (Math.abs(v - 1) > 0.01) lastOutside = t;
    peak = Math.max(peak, v);
  }
  return { t90, settle: lastOutside + STEP, overshoot: Math.max(0, peak - 1) };
}

/**
 * Sample `f` over 0..1 into the fewest points whose straight lines stay within
 * `tolerance` of it: the worst-fitting spot gets a point until none is left.
 * The ends are pinned to 0 and 1.
 * @param {(x: number) => number} f
 * @returns {{x: number, y: number}[]}
 */
export function sampleLinear(f, { tolerance = 0.003, maxPoints = 40, grid = 2000 } = {}) {
  const xs = Array.from({ length: grid + 1 }, (_, i) => i / grid);
  const ys = xs.map(f);
  ys[0] = 0;
  ys[grid] = 1;
  const picked = [0, grid];
  for (;;) {
    let worst = -1;
    let worstError = tolerance;
    for (let k = 0; k < picked.length - 1; k++) {
      const [a, b] = [picked[k], picked[k + 1]];
      for (let i = a + 1; i < b; i++) {
        const lerp = ys[a] + ((ys[b] - ys[a]) * (i - a)) / (b - a);
        const error = Math.abs(lerp - ys[i]);
        if (error > worstError) [worst, worstError] = [i, error];
      }
    }
    if (worst < 0 || picked.length >= maxPoints) break;
    picked.push(worst);
    picked.sort((p, q) => p - q);
  }
  return picked.map((i) => ({ x: xs[i], y: ys[i] }));
}

const round = (n, places) => Number(n.toFixed(places));

/** CSS `linear()` easing text for sampled points. */
export function linearEasing(points) {
  const stops = points.map(({ x, y }, i) => {
    const value = String(round(y, 4));
    return i === 0 || i === points.length - 1 ? value : `${value} ${round(x * 100, 2)}%`;
  });
  return `linear(${stops.join(', ')})`;
}

/** The sine half cycle, 0 to 1, that a loop alternates over. */
export const sineEasing = () => sampleLinear((x) => (1 - Math.cos(Math.PI * x)) / 2);
