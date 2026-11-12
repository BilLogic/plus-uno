/**
 * The arithmetic behind a demo's trails. A scene lists one arrow per thing that
 * travels, each either a bare point list or `{ points, ghost }`, where `ghost`
 * is the rectangle the thing lands in. Pure functions, so the rules can be
 * tested without drawing anything.
 *
 * Unified direction: when several things move in one transition, their paths
 * head the same general way and never cross. A scene that shows the broken
 * version on purpose says `crossing: true`.
 */

/** An arrow's points, whichever form it was written in. */
export const pointsOf = (arrow) => (Array.isArray(arrow) ? arrow : arrow.points);

/** An arrow's landing rectangle, if it declares one. */
export const ghostOf = (arrow) => (Array.isArray(arrow) ? undefined : arrow.ghost);

/**
 * The arrow for a thing that lands in `rect` after starting `(dx, dy)` away
 * from it: centre to centre. `lane` moves the line sideways (an `x`) or up and
 * down (a `y`), so neighbors that share a centre still draw side by side.
 * `ghost: false` leaves out the landing outline, for a thing that leaves.
 */
export const travel = (rect, dx, dy, { lane, ghost = true } = {}) => {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const end = [lane?.x ?? cx, lane?.y ?? cy];
  return { points: [[end[0] + dx, end[1] + dy], end], ...(ghost ? { ghost: rect } : {}) };
};

const side = (a, b, c) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));

/**
 * Whether two segments cross: each one's ends lie strictly on opposite sides
 * of the other. Meeting at an end, or lying along one another, is not crossing.
 */
export const segmentsCross = (a, b, c, d) => {
  const [s1, s2, s3, s4] = [side(a, b, c), side(a, b, d), side(c, d, a), side(c, d, b)];
  return s1 * s2 < 0 && s3 * s4 < 0;
};

/** The pairs of arrows (by index) whose paths cross. */
export const crossings = (arrows = []) => {
  const paths = arrows.map(pointsOf);
  const pairs = [];
  for (let i = 0; i < paths.length; i++) {
    for (let j = i + 1; j < paths.length; j++) {
      const crossed = paths[i].slice(1).some((p, a) =>
        paths[j].slice(1).some((q, b) => segmentsCross(paths[i][a], p, paths[j][b], q)),
      );
      if (crossed) pairs.push([i, j]);
    }
  }
  return pairs;
};
