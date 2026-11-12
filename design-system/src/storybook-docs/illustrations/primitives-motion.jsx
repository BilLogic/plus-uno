import React from 'react';
import { PAINT, HAIRLINE } from './paint.js';
import { Rect } from './primitives.jsx';

/**
 * The primitives only motion drawings need: a chart axis and curve, a trail, a
 * tap ring and a pointer. Same contract as `primitives.jsx`: position, size and
 * `accent` (the one subject), 1 unit = 2px of product UI, no words.
 *
 * Each paints from a role in `paint.js`, the token the real thing uses for it.
 */

/** The chart line's weight, from the stroke the charts draw a series with. */
const SERIES = { strokeWidth: 'var(--stroke-2)', strokeLinejoin: 'round', strokeLinecap: 'round' };
const RING = { strokeWidth: 'var(--focus-ring-width)' };

/**
 * A plot's frame: the time axis along the bottom and a dashed target line at
 * `target` (0..1 of the height above the axis).
 */
export const ChartAxis = ({ x, y, w, h, target = 0.8 }) => (
  <g>
    <line x1={x} x2={x} y1={y} y2={y + h} stroke={PAINT.axis} style={HAIRLINE} />
    <line x1={x} x2={x + w} y1={y + h} y2={y + h} stroke={PAINT.axis} style={HAIRLINE} />
    <line
      x1={x}
      x2={x + w}
      y1={y + h - h * target}
      y2={y + h - h * target}
      stroke={PAINT.target}
      strokeDasharray="3 3"
      style={HAIRLINE}
    />
  </g>
);

/**
 * A value over time inside a ChartAxis box. `values` are 0..1 samples spread
 * evenly across `w`; `scale` maps 1 to that share of the height (the axis's
 * `target`); `upTo` (0..1) draws only the first part, so a curve can grow as
 * its motion plays. Accented, it marks its head with the subject's dot.
 */
export const ChartCurve = ({ x, y, w, h, values, scale = 0.8, upTo = 1, accent = false }) => {
  const n = Math.max(1, Math.round((values.length - 1) * upTo));
  const pts = values.slice(0, n + 1).map((v, i) => [x + (w * i) / (values.length - 1), y + h - h * scale * v]);
  const [hx, hy] = pts[pts.length - 1];
  return (
    <g>
      <polyline
        points={pts.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' ')}
        fill="none"
        stroke={accent ? PAINT.accent : PAINT.curve}
        style={SERIES}
      />
      {accent && <circle cx={hx} cy={hy} r={2.5} fill={PAINT.accent} />}
    </g>
  );
};

/**
 * The path a thing travels, start to landing: a dot where it starts and an
 * arrowhead where it lands. A path that ends where it began draws one way only.
 */
export const Trail = ({ points, accent = false }) => {
  const color = accent ? PAINT.accent : PAINT.trail;
  const [sx, sy] = points[0];
  const [ex, ey] = points[points.length - 1];
  const [px, py] = points[points.length - 2] ?? points[0];
  const angle = Math.atan2(ey - py, ex - px);
  const head = (a, r) => `${(ex - r * Math.cos(angle + a)).toFixed(1)},${(ey - r * Math.sin(angle + a)).toFixed(1)}`;
  return (
    <g data-trail>
      <polyline
        points={points.map(([x, y]) => `${x},${y}`).join(' ')}
        fill="none"
        stroke={color}
        style={{ ...SERIES, strokeWidth: 'var(--stroke-1)' }}
      />
      <circle cx={sx} cy={sy} r={1.75} fill={color} />
      <polygon points={`${ex},${ey} ${head(0.5, 5)} ${head(-0.5, 5)}`} fill={color} />
    </g>
  );
};

/**
 * Where a press lands: the focus ring's color and width, opened to radius `r`
 * around a contact dot. The motion layer grows and fades it on springs.
 */
export const TapRing = ({ x, y, r = 6, opacity = 1, accent = false }) => (
  <g opacity={opacity}>
    <circle cx={x} cy={y} r={r} fill="none" stroke={PAINT.tapRing} style={RING} />
    <circle cx={x} cy={y} r={1.75} fill={accent ? PAINT.accent : PAINT.pointer} />
  </g>
);

/** The pointer, tip at (`x`, `y`). Accented when the hand is the subject. */
export const Pointer = ({ x, y, accent = false }) => (
  <path
    d={`M${x} ${y} l0 11 l2.6 -2.6 l2 4.4 l1.8 -0.8 l-2 -4.3 l3.6 0 z`}
    fill={accent ? PAINT.accent : PAINT.pointer}
    stroke={PAINT.pointerEdge}
    style={{ ...HAIRLINE, strokeLinejoin: 'round' }}
  />
);

/**
 * The timeline under a figure: one thin bar per part, each from when it starts
 * to when it lands, on a shared time axis. `lanes` are `{ start, end }` in
 * 0..1 of the axis; `now` (0..1) is the playhead, drawn as the target line.
 * Accented, the bars are the subject's color. Up to six lanes fit the height.
 */
export const SequenceStrip = ({ x, y, w, h = 14, lanes, now = 0, accent = false }) => {
  const rows = Math.max(1, lanes.length);
  const lane = (h - 2) / rows;
  const bar = Math.min(3, lane - 1);
  return (
    <g data-sequence-strip>
      <line x1={x} x2={x + w} y1={y + h} y2={y + h} stroke={PAINT.axis} style={HAIRLINE} />
      {lanes.map((l, i) => (
        <Rect
          key={i}
          x={x + w * l.start}
          y={y + 1 + i * lane}
          w={Math.max(1.5, w * (l.end - l.start))}
          h={bar}
          fill={accent ? PAINT.accent : PAINT.shape}
          corner="shape"
        />
      ))}
      <line x1={x + w * now} x2={x + w * now} y1={y} y2={y + h} stroke={PAINT.target} style={HAIRLINE} />
    </g>
  );
};

/**
 * A screen in a transition tree: a small block that lights in the subject's
 * brand color as `lit` runs 0..1. `done` marks it passed with the visited check,
 * for the steps of an ordered set. Painted from the shape and visited roles.
 */
export const TreeNode = ({ x, y, w = 16, h = 12, lit = 0, done = false, accent = false }) => (
  <g data-part="tree-node">
    <Rect x={x} y={y} w={w} h={h} fill={PAINT.shape} corner="shape" />
    {(lit > 0 || accent) && <Rect x={x} y={y} w={w} h={h} fill={PAINT.accent} corner="shape" opacity={accent ? 1 : lit} />}
    {done && (
      <path
        d={`M${x + w / 2 - 2.5} ${y + h / 2} L${x + w / 2 - 0.5} ${y + h / 2 + 2} L${x + w / 2 + 3} ${y + h / 2 - 2}`}
        fill="none"
        stroke={PAINT.trackerVisited}
        style={HAIRLINE}
      />
    )}
  </g>
);

/**
 * A link between two screens in a tree, from (`x1`, `y1`) to (`x2`, `y2`). The
 * neutral line is always there; `progress` (0..1) draws the subject's accent
 * line over it from the start, and its arrowhead lands once the line has arrived.
 */
export const TreeEdge = ({ x1, y1, x2, y2, progress = 0, accent = false }) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = (a) => `${(x2 - 5 * Math.cos(angle + a)).toFixed(1)},${(y2 - 5 * Math.sin(angle + a)).toFixed(1)}`;
  const px = x1 + (x2 - x1) * progress;
  const py = y1 + (y2 - y1) * progress;
  return (
    <g data-part="tree-edge">
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={MOTION_PAINT.trail} style={HAIRLINE} />
      {progress > 0 && <line x1={x1} y1={y1} x2={px} y2={py} stroke={PAINT.accent} style={SERIES} />}
      {accent && progress >= 0.999 && <polygon points={`${x2},${y2} ${head(0.5)} ${head(-0.5)}`} fill={PAINT.accent} />}
    </g>
  );
};

/**
 * Gallery entries, neutral then accented, in the kit gallery's 160 × 100 cell.
 * The gallery lists these after the static primitives.
 */
const DEMO_STEP = [0, 0.18, 0.45, 0.68, 0.82, 0.91, 0.96, 0.985, 1, 1, 1, 1];
export const MOTION_SETS = [
  [
    'Chart axis and curve',
    (a) => (
      <>
        <ChartAxis x={24} y={18} w={112} h={64} />
        <ChartCurve x={24} y={18} w={112} h={64} values={DEMO_STEP} accent={a} />
      </>
    ),
  ],
  [
    'Trail',
    (a) => (
      <>
        <Rect x={22} y={44} w={12} h={12} fill={PAINT.shape} corner="shape" />
        <Trail points={[[34, 50], [80, 34], [126, 50]]} accent={a} />
      </>
    ),
  ],
  [
    'Tap ring',
    (a) => (
      <>
        <Rect x={54} y={42} w={52} h={16} fill={PAINT.shape} corner="shape" />
        <TapRing x={80} y={50} r={9} accent={a} />
      </>
    ),
  ],
  ['Pointer', (a) => <Pointer x={76} y={42} accent={a} />],
  [
    'Sequence strip',
    (a) => (
      <>
        <Rect x={22} y={26} w={116} h={8} fill={PAINT.shape} corner="shape" />
        <SequenceStrip
          x={22}
          y={44}
          w={116}
          h={24}
          lanes={[{ start: 0, end: 0.3 }, { start: 0.12, end: 0.42 }, { start: 0.24, end: 0.54 }]}
          now={0.4}
          accent={a}
        />
      </>
    ),
  ],
  [
    'Tree node and edge',
    (a) => (
      <>
        <TreeEdge x1={80} y1={34} x2={80} y2={62} progress={a ? 1 : 0} accent={a} />
        <TreeNode x={72} y={22} lit={a ? 0.35 : 0} />
        <TreeNode x={72} y={62} lit={a ? 1 : 0} />
      </>
    ),
  ],
];
