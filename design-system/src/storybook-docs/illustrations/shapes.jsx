import React, { useContext } from 'react';
import { PAINT, HAIRLINE } from './paint.js';
import { HeroGround, Rect, SkeletonBar } from './primitives.jsx';
import {
  BOX, CENTER, CIRCLES, CONSTRUCTION_RADII, CORNER_CENTERS, DIAGONALS, GRID, MARK_CORNER, PLUS_ARMS, PLUS_BOX, PLUS_CENTER,
} from '../../assets/Logo/logoConstructionGeometry.js';
import { chime, isoMatrix, pathGeometry, springStills, waveHeights } from './shapes-geometry.js';

/**
 * The shapes the docs covers need beyond the page primitives: a timeline, a
 * waveform, an exploded isometric stack, the Logo's construction, a still spring
 * trail and a path. Same contract as `primitives.jsx`: a position, a size and
 * `accent` (the one subject, in the brand color), 1 unit = 2px, no words, every
 * paint a role from `paint.js`. Where a shape would carry text it carries soft
 * skeleton bars. The arithmetic lives in `shapes-geometry.js`.
 */

/** A stroke that stays a hairline however its group is scaled or skewed. Non-scaling, so it is device px at any hero size and keeps the full stroke token. */
const FIXED = { strokeWidth: 'var(--stroke-1)', vectorEffect: 'non-scaling-stroke' };

/**
 * A timeline: two tracks, a clip on the first, keyframes along the second and a
 * playhead across both at `playhead` (0..1). Accented, the playhead and its
 * keyframes are the subject.
 */
export const Timeline = ({ x, y, w, h, accent = false, playhead = 0.55 }) => {
  const lane = (h - 8) / 2;
  const track = (ty) => <Rect x={x} y={ty} w={w} h={lane} fill={PAINT.frameSunken} corner="shape" />;
  const t1 = y + 4;
  const t2 = y + 4 + lane;
  const px = x + w * playhead;
  const mark = accent ? PAINT.accent : PAINT.annotation;
  const keys = [0.18, 0.4, 0.55, 0.82];
  const kc = t2 + lane / 2;
  const d = Math.min(3, lane / 3);
  return (
    <g data-shape="timeline">
      {track(t1)}
      {track(t2)}
      <Rect x={x + w * 0.1} y={t1 + 2} w={w * 0.5} h={lane - 4} fill={PAINT.shape} corner="shape" />
      <SkeletonBar x={x + w * 0.1 + 4} y={t1 + lane / 2 - 1.5} w={w * 0.28} h={3} />
      {keys.map((k) => (
        <path
          key={k}
          d={`M${x + w * k} ${kc - d} l${d} ${d} l${-d} ${d} l${-d} ${-d} z`}
          fill={accent && k === 0.55 ? PAINT.accent : PAINT.annotation}
        />
      ))}
      <line x1={px} x2={px} y1={y} y2={y + h} stroke={mark} style={HAIRLINE} />
      <path d={`M${px - 3} ${y - 3} h6 v3 l-3 3 l-3 -3 z`} fill={mark} />
    </g>
  );
};

/**
 * A waveform: one pill per sample, tall where the sound is loud, centered on the
 * box. `tone` is the paint of the pills when not accented (the shape role by
 * default; a heavier role where the wave must read on a bare ground).
 */
export const Waveform = ({ x, y, w, h, accent = false, n = 20, envelope = chime, tone = PAINT.shape }) => {
  const heights = waveHeights(n, envelope);
  const step = w / n;
  const bar = step * 0.55;
  return (
    <g data-shape="waveform">
      {heights.map((v, i) => (
        <Rect
          key={i}
          x={x + i * step + (step - bar) / 2}
          y={y + (h - h * v) / 2}
          w={bar}
          h={Math.max(bar, h * v)}
          fill={accent ? PAINT.accent : tone}
          corner="full"
        />
      ))}
    </g>
  );
};

/**
 * An exploded isometric stack: `layers` planes laid flat and tilted, the first
 * at the bottom, each lifted `lift` above the last. A plane is a surface with
 * skeleton bars; accented, the top one carries the subject's block.
 */
export const IsoStack = ({ x, y, w, h, accent = false, layers = 3 }) => {
  const [a, b, c, d] = isoMatrix();
  const planeEdge = useContext(HeroGround) ? PAINT.illustrationEdge : PAINT.axis;
  const size = Math.min(w, h * 1.6) * 0.5;
  const lift = h / (layers + 2);
  const cx = x + w / 2;
  const bottom = y + h - lift * 1.6;
  const plane = (i) => {
    const top = i === layers - 1;
    return (
      <g key={i} transform={`translate(${cx} ${bottom - i * lift}) matrix(${a} ${b} ${c} ${d} 0 0)`}>
        <Rect x={-size / 2} y={-size / 2} w={size} h={size} fill={PAINT.cardSurface} stroke={planeEdge} corner="section" />
        <SkeletonBar x={-size / 2 + size * 0.14} y={-size / 2 + size * 0.16} w={size * 0.5} h={size * 0.09} heading />
        <SkeletonBar x={-size / 2 + size * 0.14} y={-size / 2 + size * 0.34} w={size * 0.7} h={size * 0.07} />
        {top && accent && (
          <Rect x={size * 0.02} y={size * 0.1} w={size * 0.34} h={size * 0.16} fill={PAINT.accent} corner="button" />
        )}
      </g>
    );
  };
  return <g data-shape="iso-stack">{Array.from({ length: layers }, (_, i) => plane(i))}</g>;
};

/**
 * The Logo mark with its construction drawn over it: the 96 box, the r48 and
 * r36 circles, the diagonals, the four r16 corner circles and the plus box with
 * its center. Every number comes from `logoConstructionGeometry.js`, the same
 * file the Logo construction docs overlay reads. `size` is the drawn side.
 */
export const LogoConstruction = ({ x, y, size, accent = false, mark = false }) => {
  const k = size / BOX;
  const guide = accent ? PAINT.accent : PAINT.annotation;
  return (
    <g data-shape="logo-construction" transform={`translate(${x} ${y}) scale(${k})`}>
      {mark ? (
        <rect width={BOX} height={BOX} rx={MARK_CORNER} fill={PAINT.markTile} />
      ) : (
        <Rect x={0} y={0} w={BOX} h={BOX} fill={PAINT.shape} corner="card" />
      )}
      {GRID.map((n) => (
        <g key={n} stroke={PAINT.pageSurface} opacity={0.5}>
          <line x1={n} x2={n} y1={0} y2={BOX} style={FIXED} />
          <line x1={0} x2={BOX} y1={n} y2={n} style={FIXED} />
        </g>
      ))}
      {mark ? (
        <>
          <rect x={PLUS_BOX.x} y={PLUS_CENTER[1] - PLUS_ARMS.horizontal / 2} width={PLUS_ARMS.length} height={PLUS_ARMS.horizontal} rx={PLUS_ARMS.radius} fill={PAINT.pageSurface} />
          <rect x={PLUS_CENTER[0] - PLUS_ARMS.thick / 2} y={PLUS_BOX.y} width={PLUS_ARMS.thick} height={PLUS_ARMS.length} rx={PLUS_ARMS.radius} fill={PAINT.pageSurface} />
        </>
      ) : (
        <>
          <rect x={PLUS_BOX.x} y={PLUS_CENTER[1] - 2.8} width={PLUS_BOX.w} height={5.6} fill={PAINT.pageSurface} />
          <rect x={PLUS_CENTER[0] - 3} y={PLUS_BOX.y} width={6} height={PLUS_BOX.h} fill={PAINT.pageSurface} />
        </>
      )}
      <g fill="none" stroke={guide}>
        <rect width={BOX} height={BOX} style={FIXED} />
        {CIRCLES.map((c) => <circle key={c.r} cx={c.cx} cy={c.cy} r={c.r} style={FIXED} />)}
        {DIAGONALS.map(([x1, y1, x2, y2]) => <line key={`${x1}${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} style={FIXED} />)}
        {CORNER_CENTERS.map(([cx, cy]) => (
          <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={CONSTRUCTION_RADII.corner} strokeDasharray="3 3" style={FIXED} />
        ))}
        <rect x={PLUS_BOX.x} y={PLUS_BOX.y} width={PLUS_BOX.w} height={PLUS_BOX.h} style={FIXED} />
      </g>
      <circle cx={PLUS_CENTER[0]} cy={PLUS_CENTER[1]} r={1.4} fill={guide} />
      <circle cx={CENTER} cy={CENTER} r={1.4} fill={guide} />
    </g>
  );
};

/**
 * A spring caught at equal time steps: one still per step along a vertical run
 * from `from` to the dashed target line, fading in as it lands, so the gaps
 * show it fast, then overshooting, then settling. Accented, the last still is
 * the subject; `accentAll` paints every still in it, the fade carrying the
 * order. `advance` spreads the stills across x, one `advance` per step, so time
 * runs left to right; `step` is the seconds between stills.
 */
export const SpringTrail = ({ x, y, w, h, accent = false, accentAll = false, n = 9, still = 12, step = 0.075, advance = 0 }) => {
  const top = y + still / 2 + 4;
  const bottom = y + h - still / 2;
  const target = top + (bottom - top) * 0.25;
  const x0 = advance ? x + still / 2 : x + w / 2;
  const stills = springStills({ n, step, from: [x0, bottom], to: [x0, target], advance });
  const lastIndex = stills.length - 1;
  return (
    <g data-shape="spring-trail">
      <line x1={x} x2={x + w} y1={target} y2={target} stroke={PAINT.target} strokeDasharray="3 3" style={HAIRLINE} />
      {stills.map((s, i) => (
        <Rect
          key={i}
          x={s.x - still / 2}
          y={s.y - still / 2}
          w={still}
          h={still}
          fill={accent && (accentAll || i === lastIndex) ? PAINT.accent : PAINT.shape}
          corner="shape"
          opacity={0.4 + 0.6 * s.t}
        />
      ))}
    </g>
  );
};

/**
 * A path: a ring where it starts, a line, an arrowhead where it lands. Given
 * the `rect` it lands in, the head stops at that rectangle's edge. Several
 * paths in one drawing share one direction and never cross (`crossings` in
 * `trails.js` checks it).
 */
export const Path = ({ from, to, rect, accent = false }) => {
  const color = accent ? PAINT.accent : PAINT.trail;
  const g = pathGeometry(from, to, { rect });
  return (
    <g data-shape="path">
      <line x1={g.start[0]} y1={g.start[1]} x2={g.lineEnd[0]} y2={g.lineEnd[1]} stroke={color} style={HAIRLINE} />
      <circle cx={g.start[0]} cy={g.start[1]} r={2.5} fill={PAINT.pageSurface} stroke={color} style={HAIRLINE} />
      <polygon points={`${g.tip.join(',')} ${g.head.map((p) => p.join(',')).join(' ')}`} fill={color} />
    </g>
  );
};

/** Gallery entries, neutral then accented, in the kit gallery's 160 × 100 cell. */
export const SHAPE_SETS = [
  ['Timeline', (a) => <Timeline x={14} y={20} w={132} h={60} accent={a} />],
  ['Waveform', (a) => <Waveform x={16} y={24} w={128} h={52} accent={a} />],
  ['Isometric stack', (a) => <IsoStack x={20} y={4} w={120} h={92} accent={a} />],
  ['Logo construction', (a) => <LogoConstruction x={32} y={2} size={96} accent={a} />],
  ['Spring trail', (a) => <SpringTrail x={30} y={6} w={100} h={88} accent={a} />],
  [
    'Path',
    (a) => (
      <>
        <Rect x={104} y={30} w={36} h={40} fill={PAINT.shape} corner="shape" />
        <Path from={[22, 40]} to={[122, 40]} rect={{ x: 104, y: 30, w: 36, h: 40 }} accent={a} />
        <Path from={[22, 50]} to={[122, 50]} rect={{ x: 104, y: 30, w: 36, h: 40 }} />
        <Path from={[22, 60]} to={[122, 60]} rect={{ x: 104, y: 30, w: 36, h: 40 }} />
      </>
    ),
  ],
];
