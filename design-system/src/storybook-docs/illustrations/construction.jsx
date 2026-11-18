import React from 'react';
import { Illustration } from './Illustration.jsx';
import { HAIRLINE, MONO_LABEL_FONT, PAINT, scaledCorner } from './paint.js';

/**
 * Construction-kit parts and layout figures built on top of the illustration
 * kit. All paints read from `PAINT` in `paint.js` and all typography reads from
 * `MONO_LABEL_FONT` / design-system tokens so drawings follow light, dark and
 * increased-contrast modes automatically.
 */

export const MAX_LABELED_ZONES = 3;

const CORE_OUTLINE = { strokeWidth: 'var(--stroke-2)' };
const cornerStyle = (value) => ({ rx: value, ry: value });
const RADIUS_CONTROL_SM_2X = cornerStyle(scaledCorner('window', 2));
const RADIUS_CONTROL_MD_2X = cornerStyle(scaledCorner('tab', 2));
const RADIUS_CONTROL_LG_2X = cornerStyle(scaledCorner('field', 2));
const RADIUS_CONTROL_MD_4X = cornerStyle(scaledCorner('tab', 4));
const RADIUS_4 = cornerStyle('var(--radius-md)');
const RADIUS_CARD = cornerStyle('var(--card-radius)');
const RADIUS_6 = cornerStyle('var(--radius-control-sm)');
const RADIUS_ICON_2X = cornerStyle(scaledCorner('icon', 2));

const PAD_OPACITY = 0.68;
const COLUMNS_OPACITY = 0.45;
const PRIMARY_BAR_OPACITY = 0.42;

/**
 * A dimension bracket for a box's own height (`axis="vertical"`) or width
 * (`axis="horizontal"`), labeled with its primitive name (`size-200`,
 * `space-100`) in `--ds-text-accent-magenta` mono 11 and drawn with
 * `--ds-border-accent-magenta`.
 */
export const Measure = ({ x = 0, y = 0, w, h, axis, side, label, tick = 4 }) => {
  const horizontal = axis === 'horizontal' || (axis !== 'vertical' && w !== undefined && h === undefined);
  if (horizontal) {
    const span = Math.max(0, w ?? 0);
    const top = side === 'top';
    const ly = top ? y - tick * 2 : y + tick * 2;
    return (
      <g data-part="measure" data-axis="horizontal">
        <line x1={x} y1={y} x2={x + span} y2={y} stroke={PAINT.measureLine} style={HAIRLINE} />
        <line x1={x} y1={y - tick} x2={x} y2={y + tick} stroke={PAINT.measureLine} style={HAIRLINE} />
        <line x1={x + span} y1={y - tick} x2={x + span} y2={y + tick} stroke={PAINT.measureLine} style={HAIRLINE} />
        {label && (
          <text
            x={x + span / 2}
            y={ly}
            textAnchor="middle"
            dominantBaseline={top ? 'auto' : 'hanging'}
            fill={PAINT.measureText}
            style={MONO_LABEL_FONT}
          >
            {label}
          </text>
        )}
      </g>
    );
  }

  const span = Math.max(0, h ?? 0);
  const right = side === 'right';
  const lx = right ? x + tick * 2 : x - tick * 2;
  return (
    <g data-part="measure" data-axis="vertical">
      <line x1={x} y1={y} x2={x} y2={y + span} stroke={PAINT.measureLine} style={HAIRLINE} />
      <line x1={x - tick} y1={y} x2={x + tick} y2={y} stroke={PAINT.measureLine} style={HAIRLINE} />
      <line x1={x - tick} y1={y + span} x2={x + tick} y2={y + span} stroke={PAINT.measureLine} style={HAIRLINE} />
      {label && (
        <text
          x={lx}
          y={y + span / 2}
          textAnchor={right ? 'start' : 'end'}
          dominantBaseline="central"
          fill={PAINT.measureText}
          style={MONO_LABEL_FONT}
        >
          {label}
        </text>
      )}
    </g>
  );
};

const padPath = ({ x, y, w, h, r, inner }) => {
  const cr = Math.max(0, Math.min(r, w / 2, h / 2));
  const outer = cr > 0
    ? `M${x + cr},${y}H${x + w - cr}A${cr},${cr} 0 0 1 ${x + w},${y + cr}V${y + h - cr}A${cr},${cr} 0 0 1 ${x + w - cr},${y + h}H${x + cr}A${cr},${cr} 0 0 1 ${x},${y + h - cr}V${y + cr}A${cr},${cr} 0 0 1 ${x + cr},${y}Z`
    : `M${x},${y}H${x + w}V${y + h}H${x}Z`;
  const hole = `M${inner.x},${inner.y}h${Math.max(0, inner.w)}v${Math.max(0, inner.h)}h${-Math.max(0, inner.w)}Z`;
  return `${outer}${hole}`;
};

const resolveInner = (x, y, w, h, inner, inset) => {
  if (inner) return inner;
  const top = typeof inset === 'number' ? inset : (inset?.top ?? inset?.y ?? Math.round(h * 0.2));
  const bottom = typeof inset === 'number' ? inset : (inset?.bottom ?? inset?.y ?? Math.round(h * 0.2));
  const left = typeof inset === 'number' ? inset : (inset?.left ?? inset?.x ?? Math.round(w * 0.2));
  const right = typeof inset === 'number' ? inset : (inset?.right ?? inset?.x ?? Math.round(w * 0.2));
  return {
    x: x + left,
    y: y + top,
    w: Math.max(0, w - left - right),
    h: Math.max(0, h - top - bottom),
  };
};

/**
 * A tinted gap or pad zone (`--ds-background-accent-magenta-subtler`).
 * A `pad` zone is translucent and overlays the box as outline minus content
 * area (`fillRule="evenodd"`). Keep to at most 3 labeled zones per figure;
 * labels sit outside the object, joined by a dashed leader where needed.
 */
export const Zone = ({
  x = 0,
  y = 0,
  w = 0,
  h = 0,
  kind,
  inner,
  inset,
  radius = 0,
  translucent = false,
  opacity,
  label,
  labelPos,
  leader,
  labels,
}) => {
  const isPad = kind === 'pad' || Boolean(inner) || inset !== undefined;
  const resolvedInner = isPad ? resolveInner(x, y, w, h, inner, inset) : null;
  const fillOpacity = opacity ?? (isPad || translucent ? PAD_OPACITY : 1);
  const callouts = (
    labels ?? (label ? [{ text: label, x: labelPos?.x ?? x + w + 8, y: labelPos?.y ?? y + h / 2, anchor: labelPos?.anchor ?? 'start', leader }] : [])
  ).slice(0, MAX_LABELED_ZONES);

  return (
    <g data-part="zone" data-zone-kind={isPad ? 'pad' : 'gap'}>
      {isPad ? (
        <path
          d={padPath({ x, y, w: Math.max(0, w), h: Math.max(0, h), r: radius, inner: resolvedInner })}
          fill={PAINT.zone}
          fillRule="evenodd"
          opacity={fillOpacity}
        />
      ) : (
        <rect
          x={x}
          y={y}
          width={Math.max(0, w)}
          height={Math.max(0, h)}
          fill={PAINT.zone}
          opacity={fillOpacity}
        />
      )}
      {callouts.map((c, i) => (
        <React.Fragment key={`${c.text}-${i}`}>
          {c.leader && (
            <line
              x1={c.leader.x1}
              y1={c.leader.y1}
              x2={c.leader.x2}
              y2={c.leader.y2}
              stroke={PAINT.measureLine}
              strokeDasharray="3 3"
              style={HAIRLINE}
            />
          )}
          <text
            x={c.x}
            y={c.y}
            textAnchor={c.anchor ?? 'start'}
            dominantBaseline="central"
            fill={PAINT.measureText}
            style={MONO_LABEL_FONT}
            data-zone-label=""
          >
            {c.text}
          </text>
        </React.Fragment>
      ))}
    </g>
  );
};

/**
 * A 4-unit grid of horizontal hairlines behind a figure (`step = 4` by default,
 * or `step = 8` for a 2x drawing).
 */
export const Baseline = ({ x = 0, y = 0, w = 100, h = 60, step = 4 }) => {
  const pitch = Math.max(1, step);
  const ys = [];
  for (let ly = y; ly <= y + h + 0.001; ly += pitch) ys.push(ly);
  return (
    <g data-part="baseline" aria-hidden="true">
      {ys.map((ly) => (
        <line key={ly} x1={x} y1={ly} x2={x + w} y2={ly} stroke={PAINT.baseline} style={HAIRLINE} />
      ))}
    </g>
  );
};

/**
 * Grid columns only, painted in `--ds-background-accent-blue-subtler` at
 * translucent opacity so underlying surfaces show through.
 */
export const Columns = ({ x = 0, y = 0, w = 100, h = 60, columns = 12, gutter = 16, opacity = COLUMNS_OPACITY }) => {
  const count = Math.max(1, columns);
  const safeGutter = count > 1 ? Math.min(gutter, w / (count * 2)) : 0;
  const colW = Math.max(0, (w - (count - 1) * safeGutter) / count);
  return (
    <g data-part="columns" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <rect
          key={i}
          x={x + i * (colW + safeGutter)}
          y={y}
          width={colW}
          height={Math.max(0, h)}
          fill={PAINT.columns}
          opacity={opacity}
        />
      ))}
    </g>
  );
};

const LADDER_STEPS = [
  [4, '025', false],
  [8, '050', false],
  [12, '075', false],
  [16, '100', true],
  [20, '125', false],
  [24, '150', true],
  [32, '200', true],
  [40, '250', true],
  [48, '300', true],
  [64, '400', false],
  [80, '500', false],
];

/**
 * The scale strip: the quarter-rem space ladder drawn as bars as wide as their
 * value (`4` through `80`), with the five core sizes (`16, 24, 32, 40, 48`)
 * outlined.
 */
export const ScaleStrip = () => {
  const barScale = 1.9;
  const barGap = 10;
  const barY = 28;
  const barH = 96;
  let cursor = 96;
  const bars = LADDER_STEPS.map(([px, token, core]) => {
    const bw = px * barScale;
    const bx = cursor;
    cursor += bw + barGap;
    return { px, token, core, bx, bw };
  });

  return (
    <Illustration
      viewBox="0 0 864 152"
      scale={1}
      title="The quarter-rem primitives drawn as bars as wide as their value; the five core sizes outlined"
    >
      <g data-figure="scale-strip">
        <text x={0} y={18} fill={PAINT.measureText} style={MONO_LABEL_FONT}>px</text>
        <text x={0} y={70} fill={PAINT.measureSubtleText} style={MONO_LABEL_FONT}>rem =</text>
        <text x={0} y={86} fill={PAINT.measureSubtleText} style={MONO_LABEL_FONT}>token ÷ 100</text>
        <text x={0} y={142} fill={PAINT.measureSubtleText} style={MONO_LABEL_FONT}>--space-*</text>
        {bars.map(({ px, token, core, bx, bw }) => (
          <g key={token} data-scale-step={token}>
            <Zone x={bx} y={barY} w={bw} h={barH} />
            {core && (
              <rect
                x={bx + 1}
                y={barY + 1}
                width={bw - 2}
                height={barH - 2}
                fill="none"
                stroke={PAINT.measureLine}
                style={CORE_OUTLINE}
                data-core-size={px}
              />
            )}
            <text x={bx + bw / 2} y={18} textAnchor="middle" fill={PAINT.measureText} style={MONO_LABEL_FONT}>
              {px}
            </text>
            <text x={bx + bw / 2} y={142} textAnchor="middle" fill={PAINT.measureSubtleText} style={MONO_LABEL_FONT}>
              {token}
            </text>
          </g>
        ))}
      </g>
    </Illustration>
  );
};

const MATRIX_COLS = [
  { px: 16, token: '100' },
  { px: 24, token: '150' },
  { px: 32, token: '200' },
  { px: 40, token: '250' },
  { px: 48, token: '300' },
];

const MATRIX_GRID_STYLE = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.35fr) repeat(5, minmax(0, 1fr))',
  alignItems: 'center',
  gap: 'var(--inline-md)',
};

const MATRIX_ROW_STYLE = {
  ...MATRIX_GRID_STYLE,
  borderTop: 'var(--border-width-default) solid var(--ds-border)',
  paddingBlock: 'var(--stack-md)',
};

const MATRIX_CELL_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minBlockSize: 'calc(var(--control-xl) * 2)',
};

const MATRIX_LABEL_STYLE = {
  font: 'var(--body-default)',
  fontWeight: 'var(--type-weight-medium)',
  color: 'var(--ds-text)',
};

const MATRIX_SUB_STYLE = {
  font: 'var(--body-sm)',
  color: 'var(--ds-text-subtle)',
};

const MatrixCellSvg = ({ width, height, label, children }) => (
  <svg
    width={width}
    height={height}
    viewBox={`0 0 ${width} ${height}`}
    role="img"
    aria-label={label}
    style={{ display: 'block', overflow: 'visible', maxInlineSize: '100%', blockSize: 'auto' }}
  >
    {children}
  </svg>
);

const BUTTON_SPEC = {
  24: { w: 86, h: 48, radius: RADIUS_CONTROL_SM_2X, primary: false, barW: 44 },
  32: { w: 116, h: 64, radius: RADIUS_CONTROL_MD_2X, primary: true, barW: 58 },
  48: { w: 136, h: 96, radius: RADIUS_CONTROL_LG_2X, primary: false, barW: 68 },
};

const FIELD_SPEC = {
  32: { w: 116, h: 64, radius: RADIUS_CONTROL_MD_2X, barW: 52 },
  40: { w: 136, h: 80, radius: RADIUS_CONTROL_LG_2X, barW: 62 },
};

const ICON_INNER = { 16: 24, 24: 32, 32: 32, 40: 48, 48: 48 };

/**
 * The core-size matrix: the five core steps (`16, 24, 32, 40, 48`) across
 * Step, Button, Field, Row (with dashed lines above and below each row), Media,
 * and Icon in the box.
 */
export const CoreSizeMatrix = () => (
  <div data-figure="core-size-matrix" style={{ display: 'flex', flexDirection: 'column' }}>
    <div style={{ ...MATRIX_GRID_STYLE, paddingBlockEnd: 'var(--stack-md)' }}>
      <div />
      {MATRIX_COLS.map(({ px, token }) => (
        <div
          key={px}
          data-matrix-col={px}
          style={{
            textAlign: 'center',
            fontFamily: 'var(--type-family-code)',
            fontSize: 'var(--type-size-0875)',
            fontWeight: 'var(--type-weight-medium)',
          }}
        >
          <span style={{ color: 'var(--ds-text-accent-magenta)' }}>{px}</span>
          <span style={{ color: 'var(--ds-text-subtle)' }}>{` · ${token}`}</span>
        </div>
      ))}
    </div>

    <div data-matrix-row="step" style={MATRIX_ROW_STYLE}>
      <div style={MATRIX_LABEL_STYLE}>Step</div>
      {MATRIX_COLS.map(({ px }) => {
        const s = px * 2;
        return (
          <div key={px} style={MATRIX_CELL_STYLE}>
            <MatrixCellSvg width={s} height={s} label={`${px} square`}>
              <Zone x={0} y={0} w={s} h={s} />
              <rect x={1} y={1} width={s - 2} height={s - 2} fill="none" stroke={PAINT.measureLine} style={CORE_OUTLINE} />
            </MatrixCellSvg>
          </div>
        );
      })}
    </div>

    <div data-matrix-row="button" style={MATRIX_ROW_STYLE}>
      <div>
        <div style={MATRIX_LABEL_STYLE}>Control · Button</div>
        <div style={MATRIX_SUB_STYLE}>compact 24 · default 32 · spacious 48</div>
      </div>
      {MATRIX_COLS.map(({ px }) => {
        const spec = BUTTON_SPEC[px];
        if (!spec) return <div key={px} />;
        return (
          <div key={px} style={MATRIX_CELL_STYLE}>
            <MatrixCellSvg width={spec.w} height={spec.h} label={`${px} Button`}>
              <rect
                x={0}
                y={0}
                width={spec.w}
                height={spec.h}
                fill={spec.primary ? PAINT.buttonPrimary : PAINT.buttonDefault}
                style={spec.radius}
              />
              <rect
                x={(spec.w - spec.barW) / 2}
                y={(spec.h - 32) / 2}
                width={spec.barW}
                height={32}
                fill={spec.primary ? PAINT.buttonPrimaryText : PAINT.placeholderText}
                opacity={spec.primary ? PRIMARY_BAR_OPACITY : 1}
                style={RADIUS_CARD}
              />
            </MatrixCellSvg>
          </div>
        );
      })}
    </div>

    <div data-matrix-row="field" style={MATRIX_ROW_STYLE}>
      <div>
        <div style={MATRIX_LABEL_STYLE}>Control · Field</div>
        <div style={MATRIX_SUB_STYLE}>compact 32 · default 40</div>
      </div>
      {MATRIX_COLS.map(({ px }) => {
        const spec = FIELD_SPEC[px];
        if (!spec) return <div key={px} />;
        return (
          <div key={px} style={MATRIX_CELL_STYLE}>
            <MatrixCellSvg width={spec.w} height={spec.h} label={`${px} Field`}>
              <rect
                x={0.5}
                y={0.5}
                width={spec.w - 1}
                height={spec.h - 1}
                fill={PAINT.fieldSurface}
                stroke={PAINT.fieldBorder}
                style={{ ...HAIRLINE, ...spec.radius }}
              />
              <rect
                x={20}
                y={(spec.h - 32) / 2}
                width={spec.barW}
                height={32}
                fill={PAINT.placeholderText}
                style={RADIUS_4}
              />
            </MatrixCellSvg>
          </div>
        );
      })}
    </div>

    <div data-matrix-row="row" style={MATRIX_ROW_STYLE}>
      <div>
        <div style={MATRIX_LABEL_STYLE}>Row</div>
        <div style={MATRIX_SUB_STYLE}>compact · default · spacious</div>
      </div>
      {MATRIX_COLS.map(({ px }) => {
        if (px < 32) return <div key={px} />;
        const h = px * 2;
        return (
          <div key={px} style={MATRIX_CELL_STYLE}>
            <MatrixCellSvg width={136} height={h} label={`${px} row: dashed edges mark its height`}>
              <line
                x1={0}
                y1={1}
                x2={136}
                y2={1}
                stroke={PAINT.measureLine}
                strokeDasharray="4 3"
                style={HAIRLINE}
                data-row-edge="top"
              />
              <line
                x1={0}
                y1={h - 1}
                x2={136}
                y2={h - 1}
                stroke={PAINT.measureLine}
                strokeDasharray="4 3"
                style={HAIRLINE}
                data-row-edge="bottom"
              />
              <rect x={6} y={(h - 32) / 2} width={60} height={32} fill={PAINT.placeholderText} style={RADIUS_4} />
              <rect x={76} y={(h - 32) / 2} width={50} height={32} fill={PAINT.placeholderText} style={RADIUS_4} />
            </MatrixCellSvg>
          </div>
        );
      })}
    </div>

    <div data-matrix-row="media" style={MATRIX_ROW_STYLE}>
      <div>
        <div style={MATRIX_LABEL_STYLE}>Media · Avatar, Tile</div>
        <div style={MATRIX_SUB_STYLE}>16 inline … 48 largest</div>
      </div>
      {MATRIX_COLS.map(({ px }) => {
        const s = px * 2;
        return (
          <div key={px} style={MATRIX_CELL_STYLE}>
            <MatrixCellSvg width={s} height={s} label={`${px} circle`}>
              <circle cx={px} cy={px} r={px} fill={PAINT.placeholderText} />
            </MatrixCellSvg>
          </div>
        );
      })}
    </div>

    <div data-matrix-row="icon" style={MATRIX_ROW_STYLE}>
      <div>
        <div style={MATRIX_LABEL_STYLE}>Icon in the box</div>
        <div style={MATRIX_SUB_STYLE}>12 · 16 · 16 · 24 · 24, as Tile and Avatar ship</div>
      </div>
      {MATRIX_COLS.map(({ px }) => {
        const s = px * 2;
        const inner = ICON_INNER[px];
        const pad = (s - inner) / 2;
        return (
          <div key={px} style={MATRIX_CELL_STYLE}>
            <MatrixCellSvg width={s} height={s} label={`${inner / 2} icon inside ${px} box`}>
              <rect
                x={0.5}
                y={0.5}
                width={s - 1}
                height={s - 1}
                fill="none"
                stroke={PAINT.fieldBorder}
                strokeDasharray="3 3"
                style={{ ...HAIRLINE, ...(px <= 24 ? RADIUS_6 : RADIUS_CARD) }}
              />
              <rect x={pad} y={pad} width={inner} height={inner} fill={PAINT.iconGlyph} style={RADIUS_ICON_2X} />
            </MatrixCellSvg>
          </div>
        );
      })}
    </div>
  </div>
);

/**
 * The control-construction figure: a 32 Button at 4x scale built from
 * 6 + 20 + 6 with 12 pad-x, showing `size-200`, `size-125`, `space-0375`
 * (pad-y) and `space-075` (pad-x).
 */
export const ControlConstruction = () => (
  <Illustration
    viewBox="0 0 424 200"
    scale={1}
    title="A 32 Button built from 6 + 20 + 6 with 12 pad-x around its 20 label line"
  >
    <g data-figure="control-construction">
      <rect x={80} y={26} width={232} height={128} fill={PAINT.buttonDefault} style={RADIUS_CONTROL_MD_4X} />
      <rect x={128} y={58} width={136} height={64} fill={PAINT.placeholderText} style={RADIUS_4} />
      <Zone
        kind="pad"
        x={80}
        y={26}
        w={232}
        h={128}
        radius={32}
        inner={{ x: 128, y: 50, w: 136, h: 80 }}
        labels={[
          { text: 'space-0375', x: 336, y: 38, anchor: 'start', leader: { x1: 288, y1: 38, x2: 330, y2: 38 } },
          { text: 'space-075', x: 104, y: 184, anchor: 'middle', leader: { x1: 104, y1: 154, x2: 104, y2: 172 } },
        ]}
      />
      <Measure x={64} y={26} h={128} label="size-200" side="left" />
      <Measure x={328} y={50} h={80} label="size-125" side="right" />
    </g>
  </Illustration>
);
