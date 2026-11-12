import React from 'react';
import { LABEL_FONT, PAINT, CORNER, CORNER_TOKEN, HAIRLINE, TAB_UNDERLINE } from './paint.js';

/**
 * The illustration kit: plain components that return SVG fragments. Each takes
 * a position (`x`, `y`), a size (`w`, `h`) and `accent`, which paints the one
 * subject of a drawing in the brand color. One scale per set: 1 unit is 2px of
 * product UI. No primitive draws text; skeleton bars stand in for it. Every
 * part paints with the PAINT role of the token its real component uses.
 */

/**
 * A corner token, held to half the shape's shorter side. SVG draws a corner
 * larger than that as an ellipse, so the clamp keeps every rect a rounded
 * rectangle however small it is.
 */
const clampedCorner = (token, w, h) => (token ? `min(${token}, ${Math.min(w, h) / 2}px)` : undefined);

const Rect = ({ x, y, w, h, fill, stroke, corner, opacity }) => {
  const radius = clampedCorner(CORNER[corner], w, h);
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      fill={fill ?? 'none'}
      stroke={stroke}
      opacity={opacity}
      style={{ ...(stroke ? HAIRLINE : null), rx: radius, ry: radius }}
    />
  );
};

const Rule = ({ x1, y1, x2, y2, stroke = PAINT.frameDivider, dash, thick = false }) => (
  <line
    x1={x1}
    y1={y1}
    x2={x2}
    y2={y2}
    stroke={stroke}
    strokeDasharray={dash}
    style={thick ? TAB_UNDERLINE : HAIRLINE}
  />
);

/**
 * A line of placeholder text: a pill, so its corner is half its own height, in
 * the Skeleton component's own bar color. `heading` is a title line.
 */
export const SkeletonBar = ({ x, y, w, h = 4, accent = false, heading = false, tone }) => (
  <rect
    x={x}
    y={y}
    width={w}
    height={h}
    rx={h / 2}
    ry={h / 2}
    fill={tone ?? (accent ? PAINT.accent : heading ? PAINT.placeholderHeading : PAINT.placeholderText)}
  />
);

/**
 * A layer on its real elevation: a box carrying the component's own
 * `--ds-shadow-*` token and radius token. The box is laid out at twice the size
 * and scaled by half, so the shadow and corner are the real tokens at the kit's
 * scale (one unit is 2px) rather than twice too big. With no `shadow` it is a
 * plain fill.
 */
const Layer = ({ x, y, w, h, fill, shadow, corner }) => (
  <foreignObject x={x} y={y} width={w} height={h} style={{ overflow: 'visible' }}>
    <div
      xmlns="http://www.w3.org/1999/xhtml"
      style={{
        boxSizing: 'border-box',
        width: w * 2,
        height: h * 2,
        transform: 'scale(0.5)',
        transformOrigin: '0 0',
        background: fill,
        boxShadow: shadow,
        borderRadius: corner ? CORNER_TOKEN[corner] : undefined,
      }}
    />
  </foreignObject>
);

/** The accent marking a layer as the subject: a brand outline over its edge. */
const AccentRing = ({ x, y, w, h, corner }) => <Rect x={x} y={y} w={w} h={h} stroke={PAINT.accent} corner={corner} />;

export const Frame = ({ x, y, w, h, accent = false }) => (
  <g>
    <Rect x={x} y={y} w={w} h={h} fill={PAINT.frameSunken} stroke={accent ? PAINT.accent : PAINT.frameDivider} corner="window" />
    {[0, 1, 2].map((i) => (
      <circle key={i} cx={x + 8 + i * 7} cy={y + 6} r={2} fill={PAINT.windowDot} />
    ))}
    <SkeletonBar x={x + 34} y={y + 4} w={w * 0.35} />
    <Rule x1={x} x2={x + w} y1={y + 12} y2={y + 12} />
  </g>
);

const SIDEBAR_W = 44;
/** A Sidebar row: item-height-md (32) halved, 2 apart (frame-sidebar-row-gap) halved. */
const SIDEBAR_ROW_H = 16;
const SIDEBAR_ROW_PITCH = SIDEBAR_ROW_H + 1;

export const Sidebar = ({ x, y, w, h, accent = false, overlay = false }) => {
  const rowCount = Math.max(1, Math.min(5, Math.floor((h - 28) / SIDEBAR_ROW_PITCH)));
  return (
  <g>
    {overlay ? (
      <Layer x={x} y={y} w={w} h={h} fill={PAINT.sidebarOverlaySurface} shadow={PAINT.sidebarOverlayShadow} />
    ) : (
      <>
        <Rect x={x} y={y} w={w} h={h} fill={PAINT.frameSunken} />
        <Rule x1={x + w} x2={x + w} y1={y} y2={y + h} />
      </>
    )}
    <Rect x={x + 6} y={y + 4} w={12} h={12} fill={accent ? PAINT.accent : PAINT.sidebarIcon} corner="sidebarRow" />
    {Array.from({ length: rowCount }, (_, i) => {
      const ry = y + 24 + i * SIDEBAR_ROW_PITCH;
      const selected = i === (rowCount > 1 ? 1 : 0);
      return (
        <React.Fragment key={i}>
          {selected && (
            <Rect
              x={x + 4}
              y={ry}
              w={w - 8}
              h={SIDEBAR_ROW_H}
              fill={accent ? PAINT.accent : PAINT.sidebarSelected}
              corner="sidebarRow"
              opacity={accent ? 0.25 : 1}
            />
          )}
          <Rect x={x + 8} y={ry + 4} w={8} h={8} fill={PAINT.sidebarIcon} corner="tab" />
          <SkeletonBar x={x + 20} y={ry + SIDEBAR_ROW_H / 2 - 2} w={w - 32} />
        </React.Fragment>
      );
    })}
  </g>
  );
};

/**
 * The content area of a Frame: the page surface with its edge, an optional
 * header slot (`header`), and a body where Sections sit. Children draw in the
 * body; `pageBody` gives its rect.
 */
export const pageBody = ({ x, y, w, h, header }) => ({ x: x + 8, y: y + (header ? 30 : 8), w: w - 16, h: h - (header ? 38 : 16) });

export const Page = ({ x, y, w, h, accent = false, header = false, children }) => (
  <g>
    <Rect x={x} y={y} w={w} h={h} fill={PAINT.pageSurface} stroke={accent ? PAINT.accent : PAINT.pageEdge} />
    {header && (
      <>
        <SkeletonBar x={x + 8} y={y + 8} w={w * 0.3} h={6} heading />
        <SkeletonBar x={x + 8} y={y + 18} w={w * 0.5} />
      </>
    )}
    {children}
  </g>
);

/** Where a Screen puts its Page: beside a docked Sidebar, or full width. */
export const screenLayout = ({ x, y, w, h, sidebar = 'docked' }) => {
  const sw = sidebar === 'docked' ? SIDEBAR_W : 0;
  return { sidebarW: SIDEBAR_W, content: { x: x + sw, y: y + 12, w: w - sw - 1, h: h - 13 } };
};

/**
 * A whole screen: Frame, Sidebar and Page. `sidebar` is 'docked' (beside the
 * Page), 'overlay' (over a Backdrop, floating) or 'none'. Children draw on the
 * Page, under the Backdrop.
 */
export const Screen = ({ x, y, w, h, accent = false, accentSidebar = false, sidebar = 'docked', header = true, children }) => {
  const { sidebarW, content } = screenLayout({ x, y, w, h, sidebar });
  return (
    <g>
      <Frame x={x} y={y} w={w} h={h} />
      {sidebar === 'docked' && <Sidebar x={x} y={y + 12} w={sidebarW} h={h - 12} accent={accentSidebar} />}
      <Page {...content} header={header} accent={accent}>
        {children}
      </Page>
      {sidebar === 'overlay' && (
        <>
          <Backdrop x={x} y={y + 12} w={w} h={h - 12} />
          <Sidebar x={x} y={y + 12} w={sidebarW} h={h - 12} overlay accent={accentSidebar} />
        </>
      )}
    </g>
  );
};

export const PageHeader = ({ x, y, w, accent = false }) => (
  <g>
    <SkeletonBar x={x} y={y} w={w * 0.4} h={6} accent={accent} heading />
    <SkeletonBar x={x} y={y + 12} w={w * 0.6} />
    <ButtonShape x={x + w - 30} y={y} w={30} />
  </g>
);

/**
 * A Section. By default it has no fill, no pad and no box: the real
 * PatternSection draws only its parts, so the drawing is a heading and rows on
 * whatever surface it sits on. `subtle` is the one variant with a box
 * (the sunken surface, padded and rounded), for a section beside a list.
 */
export const Section = ({ x, y, w, h, accent = false, rows = 3, subtle = false }) => {
  const pad = subtle ? 8 : 0;
  return (
    <g data-part="section">
      {subtle && <Rect x={x} y={y} w={w} h={h} fill={PAINT.sectionSubtleSurface} corner="section" />}
      {subtle && accent && <AccentRing x={x} y={y} w={w} h={h} corner="section" />}
      <SkeletonBar x={x + pad} y={y + pad} w={w * 0.3} h={5} accent={accent} heading />
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonBar key={i} x={x + pad} y={y + pad + 14 + i * 9} w={Math.min(w * (0.8 - i * 0.15), w - 2 * pad)} />
      ))}
    </g>
  );
};

export const Card = ({ x, y, w, h, accent = false }) => (
  <g>
    <Layer x={x} y={y} w={w} h={h} fill={PAINT.cardSurface} shadow={PAINT.cardShadow} corner="card" />
    {accent && <AccentRing x={x} y={y} w={w} h={h} corner="card" />}
    <Rect x={x + 6} y={y + 6} w={w - 12} h={h * 0.4} fill={PAINT.placeholderText} corner="cardImage" />
    <SkeletonBar x={x + 6} y={y + h * 0.4 + 12} w={w * 0.6} accent={accent} heading />
    <SkeletonBar x={x + 6} y={y + h * 0.4 + 21} w={w * 0.45} />
  </g>
);

/** A bare Card box: the raised surface and its shadow, no contents. */
export const CardBox = ({ x, y, w, h, accent = false }) => (
  <g>
    <Layer x={x} y={y} w={w} h={h} fill={PAINT.cardSurface} shadow={PAINT.cardShadow} corner="card" />
    {accent && <AccentRing x={x} y={y} w={w} h={h} corner="card" />}
  </g>
);

export const Row = ({ x, y, w, accent = false }) => (
  <g>
    {accent && <Rect x={x} y={y} w={w} h={14} fill={PAINT.rowSelected} />}
    <Rule x1={x} x2={x + w} y1={y + 14} y2={y + 14} stroke={PAINT.rowDivider} />
    <Rect x={x + 4} y={y + 4} w={6} h={6} fill={accent ? PAINT.accent : PAINT.placeholderText} corner="tab" />
    <SkeletonBar x={x + 16} y={y + 5} w={w * 0.3} accent={accent} />
    <SkeletonBar x={x + w * 0.5} y={y + 5} w={w * 0.2} />
    <SkeletonBar x={x + w * 0.8} y={y + 5} w={w * 0.12} />
  </g>
);

/**
 * Overflow: a header row that stays put while rows scroll under it. It sits on
 * the page surface and takes the overflow shadow, the one level with no surface
 * of its own. Rows draw first so the header covers them.
 */
export const StickyHeader = ({ x, y, w, h = 64, accent = false }) => (
  <g>
    {Array.from({ length: Math.max(1, Math.floor((h - 10) / 15)) }, (_, i) => <Row key={i} x={x} y={y + 10 + i * 15} w={w} />)}
    <Layer x={x} y={y} w={w} h={16} fill={PAINT.pageSurface} shadow={PAINT.overflowShadow} />
    {accent && <AccentRing x={x} y={y} w={w} h={16} />}
    <SkeletonBar x={x + 16} y={y + 6} w={w * 0.2} heading />
    <SkeletonBar x={x + w * 0.5} y={y + 6} w={w * 0.14} heading />
  </g>
);

/** A single-line field: --height-250 (40) halved. */
const FIELD_H = 20;

export const Field = ({ x, y, w, accent = false, invalid = false }) => (
  <g>
    <SkeletonBar x={x} y={y} w={w * 0.3} h={3} heading />
    <Rect x={x} y={y + 7} w={w} h={FIELD_H} fill={PAINT.fieldSurface} stroke={invalid ? PAINT.fieldBorderInvalid : accent ? PAINT.accent : PAINT.fieldBorder} corner="field" />
    <SkeletonBar x={x + 6} y={y + 7 + FIELD_H / 2 - 2} w={w * 0.4} />
  </g>
);

/**
 * A Button in one of two fidelities, and only in appearances PLUS ships:
 * `primary` (brand fill, the drawing's accent, on the subject only) or
 * `default` (the real default: no fill, the input border).
 * - Blocked out (no `label`): a flat strip with no words, for drawings about
 *   where things sit (layout, placement, which surface opens, a sequence).
 * - Real (`label`): the real button with its word, for drawings about which
 *   element or what it says. Only the subject is drawn real; its context stays
 *   blocked out.
 */
export const ButtonShape = ({ x, y, w, appearance = 'default', label }) => {
  const primary = appearance === 'primary';
  const fill = primary ? PAINT.buttonPrimary : PAINT.buttonDefault;
  const stroke = primary ? undefined : PAINT.buttonDefaultBorder;
  if (!label) {
    return <Rect x={x} y={y} w={w} h={8} fill={fill} stroke={stroke} corner="button" />;
  }
  return (
    <g data-fidelity="real">
      <Rect x={x} y={y} w={w} h={16} fill={fill} stroke={stroke} corner="button" />
      <text
        x={x + w / 2}
        y={y + 8}
        textAnchor="middle"
        dominantBaseline="central"
        fill={primary ? PAINT.buttonPrimaryText : PAINT.buttonDefaultText}
        style={LABEL_FONT}
      >
        {label}
      </text>
    </g>
  );
};

export const Popup = ({ x, y, w, h, accent = false }) => (
  <g>
    <Layer x={x} y={y} w={w} h={h} fill={PAINT.popupSurface} shadow={PAINT.popupShadow} corner="popup" />
    {accent && <AccentRing x={x} y={y} w={w} h={h} corner="popup" />}
    {[0, 1, 2, 3].map((i) => (
      <SkeletonBar key={i} x={x + 8} y={y + 8 + i * 10} w={w * (0.7 - i * 0.1)} />
    ))}
  </g>
);

/** A Tooltip: a flat label, no shadow, offset 4 from its trigger. Its text is a bar in the inverse text color. */
export const Tooltip = ({ x, y, w, h = 16, accent = false }) => (
  <g>
    <Rect x={x} y={y} w={w} h={h} fill={PAINT.tooltipSurface} corner="tooltip" />
    {accent && <AccentRing x={x} y={y} w={w} h={h} corner="tooltip" />}
    <SkeletonBar x={x + 6} y={y + h / 2 - 1.5} w={w * 0.55} h={3} tone={PAINT.tooltipText} />
  </g>
);

export const Panel = ({ x, y, w, h, accent = false, floating = false }) => (
  <g>
    {floating ? (
      <Layer x={x} y={y} w={w} h={h} fill={PAINT.panelSurface} shadow={PAINT.panelFloatingShadow} />
    ) : (
      <>
        <Rect x={x} y={y} w={w} h={h} fill={PAINT.panelSurface} />
        <Rule x1={x} x2={x} y1={y} y2={y + h} stroke={PAINT.panelEdge} />
      </>
    )}
    {accent && <AccentRing x={x} y={y} w={w} h={h} />}
    <SkeletonBar x={x + 8} y={y + 8} w={w * 0.5} h={5} accent={accent} heading />
    {[0, 1, 2].map((i) => (
      <SkeletonBar key={i} x={x + 8} y={y + 24 + i * 10} w={w * 0.75} />
    ))}
  </g>
);

export const Backdrop = ({ x, y, w, h }) => <Rect x={x} y={y} w={w} h={h} fill={PAINT.backdrop} />;

export const Modal = ({ x, y, w, h, accent = false }) => {
  // Footer buttons shrink with a narrow modal so they stay inside it.
  const bw = Math.min(28, (w - 24) / 2);
  return (
    <g>
      <Layer x={x} y={y} w={w} h={h} fill={PAINT.modalSurface} shadow={PAINT.modalShadow} corner="modal" />
      {accent && <AccentRing x={x} y={y} w={w} h={h} corner="modal" />}
      <SkeletonBar x={x + 10} y={y + 10} w={w * 0.45} h={5} accent={accent} heading />
      <SkeletonBar x={x + 10} y={y + 24} w={w * 0.75} />
      <SkeletonBar x={x + 10} y={y + 33} w={w * 0.6} />
      <Rule x1={x} x2={x + w} y1={y + h - 22} y2={y + h - 22} stroke={PAINT.modalDivider} />
      <ButtonShape x={x + w - 14 - 2 * bw} y={y + h - 14} w={bw} />
      <ButtonShape x={x + w - 10 - bw} y={y + h - 14} w={bw} appearance={accent ? 'primary' : 'default'} />
    </g>
  );
};

/** A strip of `count` tabs. The selected one carries the underline: the accent when `accent`. */
export const Tabs = ({ x, y, w, h = 16, count = 3, selected = 0, accent = false }) => {
  const tw = Math.min(36, w / count);
  return (
    <g>
      <Rule x1={x} x2={x + w} y1={y + h} y2={y + h} stroke={PAINT.tabsDivider} />
      {Array.from({ length: count }, (_, i) => (
        <React.Fragment key={i}>
          <SkeletonBar x={x + i * tw + tw * 0.2} y={y + h / 2 - 2} w={tw * 0.6} heading={i === selected} />
          {i === selected && (
            <Rule
              x1={x + i * tw}
              x2={x + (i + 1) * tw}
              y1={y + h}
              y2={y + h}
              stroke={accent ? PAINT.accent : PAINT.tabSelected}
              thick
            />
          )}
        </React.Fragment>
      ))}
    </g>
  );
};

/** `count` crumbs joined by small separators; the last crumb is the accent. */
export const Breadcrumb = ({ x, y, w, h = 8, count = 3, accent = false }) => {
  const gap = 8;
  const cw = (w - (count - 1) * gap) / count;
  const cy = y + h / 2;
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const cx = x + i * (cw + gap);
        return (
          <React.Fragment key={i}>
            <SkeletonBar x={cx} y={cy - 2} w={cw} accent={accent && i === count - 1} />
            {i < count - 1 && (
              <path
                d={`M${cx + cw + 3} ${cy - 2} L${cx + cw + 5} ${cy} L${cx + cw + 3} ${cy + 2}`}
                fill="none"
                stroke={PAINT.breadcrumbSeparator}
                style={HAIRLINE}
              />
            )}
          </React.Fragment>
        );
      })}
    </g>
  );
};

/**
 * `count` steps: visited (a check), current (a ring on the selected pill) and
 * unvisited (an empty ring), joined by connectors. `accent` fills the current dot.
 */
export const ProgressTracker = ({ x, y, w, h = 16, count = 4, current = 1, accent = false }) => {
  const connector = 10;
  const iw = (w - (count - 1) * connector) / count;
  const cy = y + h / 2;
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const ix = x + i * (iw + connector);
        const mx = ix + 7;
        return (
          <React.Fragment key={i}>
            {i === current && <Rect x={ix} y={y} w={iw} h={h} fill={PAINT.trackerCurrent} corner="tracker" />}
            {i < current && (
              <path
                d={`M${mx - 2.5} ${cy} L${mx - 0.5} ${cy + 2} L${mx + 3} ${cy - 2}`}
                fill="none"
                stroke={PAINT.trackerVisited}
                style={HAIRLINE}
              />
            )}
            {i === current && (
              <circle
                cx={mx}
                cy={cy}
                r={2.5}
                fill={accent ? PAINT.trackerCurrentDot : 'none'}
                stroke={PAINT.trackerCurrentRing}
                style={HAIRLINE}
              />
            )}
            {i > current && <circle cx={mx} cy={cy} r={2.5} fill="none" stroke={PAINT.trackerDot} style={HAIRLINE} />}
            <SkeletonBar x={ix + 14} y={cy - 2} w={Math.max(iw - 20, 4)} heading={i === current} />
            {i < count - 1 && <Rule x1={ix + iw + 1} x2={ix + iw + connector - 1} y1={cy} y2={cy} stroke={PAINT.trackerConnector} />}
          </React.Fragment>
        );
      })}
    </g>
  );
};

const FLAG_ICON = {
  neutral: PAINT.flagIconNeutral,
  success: PAINT.flagIconSuccess,
  warning: PAINT.flagIconWarning,
  danger: PAINT.flagIconDanger,
  info: PAINT.flagIconInfo,
};

/** A floating notification card: the icon carries the `tone`, the lines stand in for its words. */
export const Flag = ({ x, y, w, h, tone = 'neutral', accent = false }) => (
  <g>
    <Layer x={x} y={y} w={w} h={h} fill={PAINT.flagSurface} shadow={PAINT.flagShadow} corner="flag" />
    {accent && <AccentRing x={x} y={y} w={w} h={h} corner="flag" />}
    <circle cx={x + 10} cy={y + 11} r={4} fill={FLAG_ICON[tone]} />
    <SkeletonBar x={x + 20} y={y + 8} w={w * 0.4} heading />
    <SkeletonBar x={x + 20} y={y + 17} w={w * 0.65} />
    {h > 34 && <SkeletonBar x={x + 20} y={y + 26} w={w * 0.5} />}
  </g>
);

/** A small count pill. The accent is an outline, since CountTag has no brand tone. */
export const CountTag = ({ x, y, w = 14, h = 10, accent = false }) => (
  <g>
    <Rect x={x} y={y} w={w} h={h} fill={PAINT.countSurface} corner="count" />
    <SkeletonBar x={x + w * 0.3} y={y + h / 2 - 1} w={w * 0.4} h={2} tone={PAINT.countText} />
    {accent && <AccentRing x={x - 1.5} y={y - 1.5} w={w + 3} h={h + 3} corner="count" />}
  </g>
);

/**
 * A numbered-part marker for the gutter of an anatomy drawing: a disc with no
 * digit (the number sits in the caption's list), joined to its part by a leader.
 */
export const AnatomyMarker = ({ x, y, tx, ty, accent = false }) => (
  <g>
    <Rule x1={x} y1={y} x2={tx} y2={ty} stroke={accent ? PAINT.accent : PAINT.annotation} />
    <circle cx={x} cy={y} r={4} fill={accent ? PAINT.accent : PAINT.annotation} />
    <circle cx={tx} cy={ty} r={1.5} fill={accent ? PAINT.accent : PAINT.annotation} />
  </g>
);

export { Rect, Rule };
