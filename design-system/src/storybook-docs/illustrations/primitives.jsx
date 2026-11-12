import React from 'react';
import { PAINT, CORNER, HAIRLINE } from './paint.js';

/**
 * The illustration kit: plain components that return SVG fragments. Each takes
 * a position (`x`, `y`), a size (`w`, `h`) and `accent`, which paints the one
 * subject of a drawing in the brand color. One scale per set: 1 unit is 2px of
 * product UI. No primitive draws text; skeleton bars stand in for it.
 */

/**
 * A corner token, held to half the shape's shorter side. SVG draws a corner
 * larger than that as an ellipse, so the clamp keeps every rect a rounded
 * rectangle however small it is.
 */
const clampedCorner = (token, w, h) => (token ? `min(${token}, ${Math.min(w, h) / 2}px)` : undefined);

const Rect = ({ x, y, w, h, fill, stroke, corner = 'xs', opacity }) => {
  const radius = clampedCorner(CORNER[corner], w, h);
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      fill={fill}
      stroke={stroke}
      opacity={opacity}
      style={{ ...(stroke ? HAIRLINE : null), rx: radius, ry: radius }}
    />
  );
};

const Rule = ({ x1, y1, x2, y2, stroke = PAINT.line, dash }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeDasharray={dash} style={HAIRLINE} />
);

/** A line of placeholder text: a pill, so its corner is half its own height. */
export const SkeletonBar = ({ x, y, w, h = 4, accent = false, tone }) => (
  <rect
    x={x}
    y={y}
    width={w}
    height={h}
    rx={h / 2}
    ry={h / 2}
    fill={tone ?? (accent ? PAINT.accent : PAINT.skeleton)}
  />
);

/** Elevation without a literal: a neutral underlay offset below the layer, then its border. */
const Lift = ({ x, y, w, h, corner, accent, children }) => (
  <g>
    <Rect x={x} y={y + 2} w={w} h={h} fill={PAINT.neutral} corner={corner} />
    <Rect x={x} y={y} w={w} h={h} fill={PAINT.overlay} stroke={accent ? PAINT.accent : PAINT.ink} corner={corner} />
    {children}
  </g>
);

export const Frame = ({ x, y, w, h, accent = false }) => (
  <g>
    <Rect x={x} y={y} w={w} h={h} fill={PAINT.surface} stroke={accent ? PAINT.accent : PAINT.line} corner="md" />
    <Rect x={x} y={y} w={w} h={12} fill={PAINT.sunken} corner="md" />
    <Rect x={x} y={y + 6} w={w} h={6} fill={PAINT.sunken} corner="none" />
    {[0, 1, 2].map((i) => (
      <circle key={i} cx={x + 8 + i * 7} cy={y + 6} r={2} fill={PAINT.neutral} />
    ))}
    <SkeletonBar x={x + 34} y={y + 4} w={w * 0.35} tone={PAINT.neutral} />
    <Rule x1={x} x2={x + w} y1={y + 12} y2={y + 12} />
  </g>
);

export const Sidebar = ({ x, y, w, h, accent = false }) => (
  <g>
    <Rect x={x} y={y} w={w} h={h} fill={accent ? PAINT.accentTint : PAINT.sunken} corner="none" />
    <Rule x1={x + w} x2={x + w} y1={y} y2={y + h} />
    <Rect x={x + 6} y={y + 8} w={10} h={10} fill={accent ? PAINT.accent : PAINT.neutral} corner="md" />
    {[0, 1, 2, 3, 4].map((i) => {
      const yy = y + 28 + i * 12;
      return (
        <React.Fragment key={i}>
          {i === 1 && (
            <Rect x={x + 4} y={yy - 3} w={w - 8} h={10} fill={accent ? PAINT.accent : PAINT.neutral} corner="sm" opacity={accent ? 0.25 : 1} />
          )}
          <Rect x={x + 8} y={yy} w={4} h={4} fill={PAINT.skeleton} corner="xs" />
          <SkeletonBar x={x + 16} y={yy} w={w - 28} />
        </React.Fragment>
      );
    })}
  </g>
);

export const PageHeader = ({ x, y, w, accent = false }) => (
  <g>
    <SkeletonBar x={x} y={y} w={w * 0.4} h={6} tone={accent ? PAINT.accent : PAINT.ink} />
    <SkeletonBar x={x} y={y + 12} w={w * 0.6} />
    <Rect x={x + w - 30} y={y} w={30} h={10} fill={accent ? PAINT.accent : PAINT.neutral} corner="sm" />
  </g>
);

export const Section = ({ x, y, w, h, accent = false, rows = 3 }) => (
  <g>
    <Rect x={x} y={y} w={w} h={h} fill={PAINT.raised} stroke={accent ? PAINT.accent : PAINT.line} corner="sm" />
    <SkeletonBar x={x + 8} y={y + 8} w={w * 0.3} h={5} tone={accent ? PAINT.accent : PAINT.ink} />
    {Array.from({ length: rows }, (_, i) => (
      <SkeletonBar key={i} x={x + 8} y={y + 22 + i * 9} w={w * (0.8 - i * 0.15)} />
    ))}
  </g>
);

export const Card = ({ x, y, w, h, accent = false }) => (
  <g>
    <Rect x={x} y={y} w={w} h={h} fill={PAINT.raised} stroke={accent ? PAINT.accent : PAINT.line} corner="sm" />
    <Rect x={x + 6} y={y + 6} w={w - 12} h={h * 0.4} fill={accent ? PAINT.accentTint : PAINT.sunken} corner="xs" />
    <SkeletonBar x={x + 6} y={y + h * 0.4 + 12} w={w * 0.6} tone={accent ? PAINT.accent : PAINT.ink} />
    <SkeletonBar x={x + 6} y={y + h * 0.4 + 21} w={w * 0.45} />
  </g>
);

export const Row = ({ x, y, w, accent = false }) => (
  <g>
    {accent && <Rect x={x} y={y} w={w} h={14} fill={PAINT.accentTint} corner="xs" />}
    <Rule x1={x} x2={x + w} y1={y + 14} y2={y + 14} />
    <Rect x={x + 4} y={y + 4} w={6} h={6} fill={accent ? PAINT.accent : PAINT.neutral} corner="sm" />
    <SkeletonBar x={x + 16} y={y + 5} w={w * 0.3} accent={accent} />
    <SkeletonBar x={x + w * 0.5} y={y + 5} w={w * 0.2} />
    <SkeletonBar x={x + w * 0.8} y={y + 5} w={w * 0.12} />
  </g>
);

export const Field = ({ x, y, w, accent = false }) => (
  <g>
    <SkeletonBar x={x} y={y} w={w * 0.3} h={3} tone={PAINT.ink} />
    <Rect x={x} y={y + 7} w={w} h={12} fill={PAINT.surface} stroke={accent ? PAINT.accent : PAINT.ink} corner="sm" />
    <SkeletonBar x={x + 5} y={y + 11} w={w * 0.4} />
  </g>
);

/**
 * A Button, drawn only in appearances PLUS ships. `primary` is the brand fill,
 * so it is the drawing's accent: draw it only on the subject. Every other
 * button is `default` (neutral fill). The label is a thin bar in the real
 * Button's text token, so it reads as a word rather than a block.
 */
export const ButtonShape = ({ x, y, w, appearance = 'default' }) => {
  const primary = appearance === 'primary';
  return (
    <g>
      <Rect x={x} y={y} w={w} h={12} fill={primary ? PAINT.accent : PAINT.neutral} corner="sm" />
      <SkeletonBar x={x + w * 0.3} y={y + 5} w={w * 0.4} h={2} tone={primary ? PAINT.onAccent : PAINT.label} />
    </g>
  );
};

export const Popup = ({ x, y, w, h, accent = false }) => (
  <g>
    <Lift x={x} y={y} w={w} h={h} corner="sm" accent={accent} />
    {[0, 1, 2, 3].map((i) => (
      <SkeletonBar key={i} x={x + 8} y={y + 8 + i * 10} w={w * (0.7 - i * 0.1)} />
    ))}
  </g>
);

export const Panel = ({ x, y, w, h, accent = false }) => (
  <g>
    <Lift x={x} y={y} w={w} h={h} corner="none" accent={accent} />
    <SkeletonBar x={x + 8} y={y + 8} w={w * 0.5} h={5} tone={accent ? PAINT.accent : PAINT.ink} />
    {[0, 1, 2].map((i) => (
      <SkeletonBar key={i} x={x + 8} y={y + 24 + i * 10} w={w * 0.75} />
    ))}
  </g>
);

export const Backdrop = ({ x, y, w, h }) => <Rect x={x} y={y} w={w} h={h} fill={PAINT.blanket} corner="none" />;

export const Modal = ({ x, y, w, h, accent = false }) => {
  // Footer buttons shrink with a narrow modal so they stay inside it.
  const bw = Math.min(28, (w - 24) / 2);
  return (
  <g>
    <Lift x={x} y={y} w={w} h={h} corner="md" accent={accent} />
    <SkeletonBar x={x + 10} y={y + 10} w={w * 0.45} h={5} tone={accent ? PAINT.accent : PAINT.ink} />
    <SkeletonBar x={x + 10} y={y + 24} w={w * 0.75} />
    <SkeletonBar x={x + 10} y={y + 33} w={w * 0.6} />
    <Rule x1={x} x2={x + w} y1={y + h - 22} y2={y + h - 22} />
    <ButtonShape x={x + w - 14 - 2 * bw} y={y + h - 16} w={bw} />
    <ButtonShape x={x + w - 10 - bw} y={y + h - 16} w={bw} appearance={accent ? 'primary' : 'default'} />
  </g>
  );
};

/**
 * A numbered-part marker for the gutter of an anatomy drawing: a disc with no
 * digit (the number sits in the caption's list), joined to its part by a leader.
 */
export const AnatomyMarker = ({ x, y, tx, ty, accent = false }) => (
  <g>
    <Rule x1={x} y1={y} x2={tx} y2={ty} stroke={accent ? PAINT.accent : PAINT.ink} />
    <circle cx={x} cy={y} r={4} fill={accent ? PAINT.accent : PAINT.ink} />
    <circle cx={tx} cy={ty} r={1.5} fill={accent ? PAINT.accent : PAINT.ink} />
  </g>
);

export { Rect, Rule };
