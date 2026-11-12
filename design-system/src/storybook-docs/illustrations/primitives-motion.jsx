import React from 'react';
import { PAINT, HAIRLINE } from './paint.js';
import { Rect } from './primitives.jsx';

/**
 * The primitives only motion drawings need: a chart axis and curve, a trail, a
 * tap ring and a pointer. Same contract as `primitives.jsx`: position, size and
 * `accent` (the one subject), 1 unit = 2px of product UI, no words.
 *
 * Each role paints from the token the real thing uses for that role. The map
 * stays here until `paint.js` becomes a role map; then these entries move there.
 */
const ds = (name) => `var(--ds-${name})`;

export const MOTION_PAINT = {
  // A chart's axis and gridlines: the charts' neutral-20 (dataviz/chartTheme.css).
  axis: ds('border'),
  // A chart's reference line, such as the target: the charts' neutral-40 (chartTheme.css).
  target: ds('border-bold'),
  // A plotted series: the data-viz neutral series, and the brand series for the subject.
  curve: ds('chart-neutral'),
  curveAccent: ds('chart-brand'),
  // A path a thing travels: the subtle stroke dividers use.
  trail: ds('border'),
  // A press: the ring the pressed and focused states draw (styles/_state.scss, plus-ring).
  tapRing: ds('border-focused'),
  // The pointer: body in the text ink, edged in the page surface so it reads on any fill.
  pointer: ds('text'),
  pointerEdge: ds('surface'),
};

/** The chart line's weight, from the stroke the charts draw a series with. */
const SERIES = { strokeWidth: 'var(--stroke-2)', strokeLinejoin: 'round', strokeLinecap: 'round' };
const RING = { strokeWidth: 'var(--focus-ring-width)' };

/**
 * A plot's frame: the time axis along the bottom and a dashed target line at
 * `target` (0..1 of the height above the axis).
 */
export const ChartAxis = ({ x, y, w, h, target = 0.8 }) => (
  <g>
    <line x1={x} x2={x} y1={y} y2={y + h} stroke={MOTION_PAINT.axis} style={HAIRLINE} />
    <line x1={x} x2={x + w} y1={y + h} y2={y + h} stroke={MOTION_PAINT.axis} style={HAIRLINE} />
    <line
      x1={x}
      x2={x + w}
      y1={y + h - h * target}
      y2={y + h - h * target}
      stroke={MOTION_PAINT.target}
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
        stroke={accent ? MOTION_PAINT.curveAccent : MOTION_PAINT.curve}
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
  const color = accent ? PAINT.accent : MOTION_PAINT.trail;
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
    <circle cx={x} cy={y} r={r} fill="none" stroke={MOTION_PAINT.tapRing} style={RING} />
    <circle cx={x} cy={y} r={1.75} fill={accent ? PAINT.accent : MOTION_PAINT.pointer} />
  </g>
);

/** The pointer, tip at (`x`, `y`). Accented when the hand is the subject. */
export const Pointer = ({ x, y, accent = false }) => (
  <path
    d={`M${x} ${y} l0 11 l2.6 -2.6 l2 4.4 l1.8 -0.8 l-2 -4.3 l3.6 0 z`}
    fill={accent ? PAINT.accent : MOTION_PAINT.pointer}
    stroke={MOTION_PAINT.pointerEdge}
    style={{ ...HAIRLINE, strokeLinejoin: 'round' }}
  />
);

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
];
