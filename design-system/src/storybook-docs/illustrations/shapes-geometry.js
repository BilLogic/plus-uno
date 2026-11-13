/**
 * The arithmetic behind the kit's drawn shapes: the still spring trail, the
 * path's arrowhead, the exploded isometric plane and the waveform. Pure
 * functions, so the rules are tested without drawing anything.
 */

/**
 * A damped spring's position at time `t`, 0 at rest at the start and 1 at the
 * target. Under-damped (`z` < 1), so it overshoots and rings down.
 */
export const spring = (t, z = 0.38, w = 9) => {
  if (t <= 0) return 0;
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
};

/**
 * One thing sampled at equal time steps on its way to `to` from `from`: the
 * stills of a spring trail. Points are spaced evenly in time (`step` seconds
 * apart) and along the travel axis by the spring, so they bunch where it slows.
 * `advance` shifts each still that far along x, so time reads across the page
 * while the spring runs on y. `t` is 0..1 along the run, for fading the early stills.
 */
export const springStills = ({ n = 9, step = 0.08, from, to, z, w, advance = 0 }) =>
  Array.from({ length: n }, (_, i) => {
    const p = spring(i * step, z, w);
    return { x: from[0] + (to[0] - from[0]) * p + advance * i, y: from[1] + (to[1] - from[1]) * p, p, t: n === 1 ? 1 : i / (n - 1) };
  });

/**
 * Where a path stops when it lands in `rect`: the point on the rectangle's edge
 * where the line from `from` toward `aim` (the landing point, the rectangle's
 * center by default) enters it. A start already inside the rectangle returns
 * `from`.
 */
export const stopAtEdge = (from, rect, aim = [rect.x + rect.w / 2, rect.y + rect.h / 2]) => {
  const dx = aim[0] - from[0];
  const dy = aim[1] - from[1];
  if (onRect(from[0], from[1], rect)) return from;
  // Fractions of the way to `aim` at which the line crosses each side, kept to those that land on the rectangle.
  const ts = [];
  if (dx !== 0) ts.push((rect.x - from[0]) / dx, (rect.x + rect.w - from[0]) / dx);
  if (dy !== 0) ts.push((rect.y - from[1]) / dy, (rect.y + rect.h - from[1]) / dy);
  const hits = ts.filter((v) => v >= 0 && onRect(from[0] + dx * v, from[1] + dy * v, rect));
  if (!hits.length) return from;
  const t = Math.min(...hits);
  return [from[0] + dx * t, from[1] + dy * t];
};

const onRect = (x, y, r) => x >= r.x - 1e-9 && x <= r.x + r.w + 1e-9 && y >= r.y - 1e-9 && y <= r.y + r.h + 1e-9;

/**
 * The geometry of one path: a ring at `start`, a line, and an arrowhead whose
 * tip is at `tip` and points along `angle`. With a target `rect` the tip stops
 * at its edge, on the line toward `to`. The line ends where the head's base begins
 * (`headLength` back from the tip) so the stroke never pokes through the point.
 */
export const pathGeometry = (from, to, { rect, headLength = 5, spread = 0.5 } = {}) => {
  const tip = rect ? stopAtEdge(from, rect, to) : to;
  const angle = Math.atan2(tip[1] - from[1], tip[0] - from[0]);
  const back = (a) => [tip[0] - headLength * Math.cos(angle + a), tip[1] - headLength * Math.sin(angle + a)];
  const base = [tip[0] - headLength * Math.cos(angle) * 0.8, tip[1] - headLength * Math.sin(angle) * 0.8];
  return { start: from, tip, angle, lineEnd: base, head: [back(spread), back(-spread)] };
};

/**
 * The 2D matrix of a plane laid flat in the exploded isometric view: turned
 * `rotate` degrees, then squashed to `cos(tilt)` of its height. Returned as the
 * six numbers of an SVG `matrix(a b c d e f)`, about the origin.
 */
export const isoMatrix = ({ tilt = 58, rotate = -42 } = {}) => {
  const r = (rotate * Math.PI) / 180;
  const k = Math.cos((tilt * Math.PI) / 180);
  return [Math.cos(r), Math.sin(r) * k, -Math.sin(r), Math.cos(r) * k, 0, 0];
};

/** Bar heights for a waveform: an envelope (0..1 over the run) shaped by a fixed ripple. */
export const waveHeights = (n, env, { min = 0.12 } = {}) =>
  Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0 : i / (n - 1);
    const ripple = 0.55 + 0.45 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.63));
    return min + (1 - min) * Math.min(1, Math.max(0, env(t) * ripple));
  });

/** A struck sound: a fast attack, then a decay. */
export const chime = (t) => (t < 0.08 ? t / 0.08 : Math.exp(-(t - 0.08) * 2.6));

/** A short tap: a sharper attack than a chime and a quick fall. */
export const tap = (t) => (t < 0.05 ? t / 0.05 : Math.exp(-(t - 0.05) * 6));

/** A swell: rises to the middle and falls away, no strike. */
export const swell = (t) => Math.sin(Math.PI * t) ** 1.5;

/** Two struck notes: the second, a little lower, lands just under halfway. */
export const doubleChime = (t) => Math.max(chime(Math.min(1, t * 1.8)), t > 0.45 ? chime(Math.max(0, t - 0.45) * 1.8) * 0.9 : 0);
