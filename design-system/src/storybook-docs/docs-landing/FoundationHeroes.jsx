import React from "react";
import {
  PAINT,
  CORNER,
  HAIRLINE,
  TAB_UNDERLINE,
} from "../illustrations/paint.js";
import {
  CardBox,
  Modal,
  Popup,
  Rect,
  Rule,
  SkeletonBar,
} from "../illustrations/primitives.jsx";
import { IsoStack, LogoConstruction } from "../illustrations/shapes.jsx";
import { usePageContrast } from "../lib/use-page-contrast.js";
import { HeroDrawing, HeroPane } from "./HeroDrawing.jsx";

/**
 * The Foundations heroes: each foundation as one object, cropped to what
 * matters, drawn from the illustration kit and painted by its roles. Text is
 * soft skeleton bars; the one accent (brand bold) sits on the subject. Real
 * glyphs appear only in the Typography specimen. Coordinates are kit units
 * (1 = 2px) from the stage's corner; a drawing bleeds past the stage where the
 * picture is a crop. Color has its own file (`ColorHero.jsx`); Motion and
 * Sound are drawn by their own tickets.
 */

/** The mouse pointer: the kit's pointer roles. */
export const Pointer = ({ x, y }) => (
  <path
    transform={`translate(${x} ${y}) scale(1.5)`}
    d="M0 0 l0 12 l3 -3 l2.5 5.5 l2 -1 l-2.5 -5.5 l4.5 0 z"
    fill={PAINT.pointer}
    stroke={PAINT.pointerEdge}
  />
);

/** A rounded outline in the selected-border weight: an edge that is the subject. */
const BoldEdge = ({ x, y, w, h, fill, corner = "card" }) => {
  const radius = `min(${CORNER[corner]}, ${Math.min(w, h) / 2}px)`;
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      fill={fill ?? "none"}
      stroke={PAINT.accent}
      style={{ ...TAB_UNDERLINE, rx: radius, ry: radius }}
    />
  );
};

export const OverviewHero = () => (
  <HeroDrawing>
    <IsoStack x={0} y={-4} w={300} h={180} accent layers={4} />
  </HeroDrawing>
);

export const AccessibilityHero = () => (
  <HeroDrawing>
    <rect
      x={45}
      y={35}
      width={210}
      height={90}
      fill="none"
      stroke={PAINT.axis}
      strokeDasharray="3 3"
      style={{ ...HAIRLINE, rx: CORNER.card, ry: CORNER.card }}
    />
    <Rect
      x={70}
      y={54}
      w={160}
      h={52}
      fill={PAINT.cardSurface}
      stroke={PAINT.fieldBorder}
      corner="full"
    />
    <BoldEdge x={66} y={50} w={168} h={60} corner="full" />
    <SkeletonBar x={110} y={78} w={80} h={5} />
    <Pointer x={206} y={88} />
  </HeroDrawing>
);

export const BorderHero = () => (
  <HeroDrawing>
    <Rect
      x={-140}
      y={15}
      w={310}
      h={100}
      fill={PAINT.cardSurface}
      stroke={PAINT.fieldBorder}
      corner="card"
    />
    <SkeletonBar x={-80} y={35} w={120} h={5} heading />
    <BoldEdge x={-140} y={55} w={380} h={100} fill={PAINT.cardSurface} />
    <SkeletonBar x={-80} y={80} w={150} h={5} heading />
    <SkeletonBar x={-80} y={95} w={110} h={4} />
  </HeroDrawing>
);

const Layers = () => (
  <>
    <Rect
      x={25}
      y={85}
      w={250}
      h={75}
      fill={PAINT.pageSurface}
      stroke={PAINT.illustrationEdge}
      corner="section"
    />
    <CardBox x={50} y={55} w={200} h={65} />
    <Popup x={75} y={25} w={150} h={55} />
    <Modal x={100} y={-2} w={100} h={45} accent divider={false} closeButton />
  </>
);

export const ElevationHero = () => {
  const contrast = usePageContrast();
  return (
    <>
      {["light", "dark"].map((mode) => (
        <HeroPane key={mode} mode={mode} contrast={contrast}>
          <HeroDrawing>
            <Layers />
          </HeroDrawing>
        </HeroPane>
      ))}
    </>
  );
};

/** Twelve columns, a gutter of 8 units, a 440-unit run: the frame's own grid. */
const GRID = { x: -70, w: 440, cols: 12, gutter: 8 };
const colW = (GRID.w - GRID.gutter * (GRID.cols - 1)) / GRID.cols;
const span = (col, n) => ({
  x: GRID.x + col * (colW + GRID.gutter),
  w: colW * n + GRID.gutter * (n - 1),
});

export const GridHero = () => (
  <HeroDrawing>
    {Array.from({ length: GRID.cols }, (_, c) => (
      <Rect
        key={c}
        x={GRID.x + c * (colW + GRID.gutter)}
        y={-20}
        w={colW}
        h={200}
        fill={PAINT.accent}
        opacity={0.08}
      />
    ))}
    {[
      [0, 8, 10, 60],
      [0, 3, 82, 70],
      [3, 6, 82, 70],
      [9, 3, 82, 70],
    ].map(([c, n, y, h]) => {
      const { x, w } = span(c, n);
      return <CardBox key={`${c}-${y}`} x={x} y={y} w={w} h={h} />;
    })}
    <Rect
      x={span(8, 4).x}
      y={10}
      w={span(8, 4).w}
      h={60}
      fill={PAINT.accent}
      corner="card"
    />
  </HeroDrawing>
);

/**
 * Ten stroke glyphs on a 24 grid, each a different object, so the set reads as
 * one family: the same stroke, the same corners, the same live area.
 */
const GLYPHS = {
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10H21M8 3v4M16 3v4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
  bell: <path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5L21 21" />
    </>
  ),
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l3 3 5-6" />
    </>
  ),
  star: <path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4 6.5 20.3l1-6.2L3 9.7l6.2-.9z" />,
  folder: <path d="M3 6h7l2 2h9v11H3z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  book: <path d="M4 4h7a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-7a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h7z" />,
};

/** The set, five across and two down; the bell is the subject. */
const ICON_SET = ["calendar", "user", "bell", "search", "chat", "check", "star", "folder", "clock", "book"];

export const IconographyHero = () => {
  const cell = 48;
  const gap = 10;
  const x0 = (300 - (5 * cell + 4 * gap)) / 2;
  const y0 = (160 - (2 * cell + gap)) / 2;
  return (
    <HeroDrawing>
      {ICON_SET.map((name, i) => {
        const x = x0 + (i % 5) * (cell + gap);
        const y = y0 + Math.floor(i / 5) * (cell + gap);
        const subject = name === "bell";
        return (
          <g key={name}>
            <CardBox x={x} y={y} w={cell} h={cell} accent={subject} />
            {/* The bell's 24 keyline: the live area the glyph is drawn in. */}
            {subject && (
              <rect x={x + 12} y={y + 12} width={24} height={24} fill="none" stroke={PAINT.annotation} strokeDasharray="1.5 1.5" style={HAIRLINE} />
            )}
            <g
              transform={`translate(${x + 12} ${y + 12})`}
              fill="none"
              stroke={subject ? PAINT.accent : PAINT.iconGlyph}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {GLYPHS[name]}
            </g>
          </g>
        );
      })}
    </HeroDrawing>
  );
};

export const IllustrationsHero = () => (
  <HeroDrawing>
    <g transform="rotate(-8 120 80)">
      <CardBox x={15} y={15} w={210} h={130} />
    </g>
    <g transform="rotate(-3 150 80)">
      <CardBox x={45} y={15} w={210} h={130} />
    </g>
    <g transform="rotate(3 175 82)">
      <Rect
        x={70}
        y={17}
        w={210}
        h={130}
        fill={PAINT.frameSunken}
        stroke={PAINT.illustrationEdge}
        corner="card"
      />
      <CardBox x={130} y={47} w={90} h={70} accent />
      <SkeletonBar x={140} y={59} w={50} h={5} heading />
      <SkeletonBar x={140} y={71} w={60} h={4} />
    </g>
  </HeroDrawing>
);

export const LogosHero = () => (
  <HeroDrawing>
    <LogoConstruction x={75} y={5} size={150} accent mark />
  </HeroDrawing>
);

export const RadiusHero = () => (
  <HeroDrawing>
    <rect
      x={50}
      y={25}
      width={450}
      height={300}
      rx={80}
      ry={80}
      fill={PAINT.cardSurface}
      stroke={PAINT.illustrationEdge}
      style={HAIRLINE}
    />
    <circle
      cx={130}
      cy={105}
      r={80}
      fill="none"
      stroke={PAINT.axis}
      strokeDasharray="2 3"
      style={HAIRLINE}
    />
    <line
      x1={130}
      y1={105}
      x2={73.4}
      y2={48.4}
      stroke={PAINT.annotation}
      style={HAIRLINE}
    />
    <path
      d="M50 105 A80 80 0 0 1 130 25"
      fill="none"
      stroke={PAINT.accent}
      strokeLinecap="round"
      style={TAB_UNDERLINE}
    />
    <circle cx={130} cy={105} r={2.5} fill={PAINT.annotation} />
  </HeroDrawing>
);

/** The spacing scale, in kit units: each step a square its own size. */
const STEPS = [4, 8, 12, 16, 24, 32, 48, 64, 96, 128];

export const SpacingHero = () => {
  let x = -40;
  const base = 130;
  return (
    <HeroDrawing>
      {STEPS.map((s) => {
        const size = s * 0.7;
        const at = x;
        x += size + 10;
        return s === 16 ? (
          <Rect
            key={s}
            x={at}
            y={base - size}
            w={size}
            h={size}
            fill={PAINT.accent}
            corner="icon"
          />
        ) : (
          <Rect
            key={s}
            x={at}
            y={base - size}
            w={size}
            h={size}
            fill={PAINT.accent}
            opacity={0.18}
            corner="icon"
          />
        );
      })}
      <Rule
        x1={-50}
        x2={320}
        y1={base + 0.5}
        y2={base + 0.5}
        stroke={PAINT.fieldBorder}
      />
    </HeroDrawing>
  );
};

const CHIP_ROWS = [
  { y: 10, x: -120, ws: [90, 70, 110, 80, 100] },
  { y: 58, x: -100, ws: [75, 115, 85, 95, 70] },
  { y: 106, x: -80, ws: [105, 80, 70, 110, 90] },
];

export const TokensHero = () => (
  <HeroDrawing>
    {CHIP_ROWS.map((row, r) => {
      let x = row.x;
      return row.ws.map((w, k) => {
        const at = x;
        x += w + 10;
        const subject = r === 1 && k === 2;
        return (
          <g key={`${r}-${k}`}>
            {subject ? (
              <BoldEdge
                x={at}
                y={row.y}
                w={w}
                h={32}
                fill={PAINT.cardSurface}
                corner="full"
              />
            ) : (
              <Rect
                x={at}
                y={row.y}
                w={w}
                h={32}
                fill={PAINT.cardSurface}
                stroke={PAINT.illustrationEdge}
                corner="full"
              />
            )}
            <circle
              cx={at + 16}
              cy={row.y + 16}
              r={9}
              fill={subject ? PAINT.accent : PAINT.placeholderText}
            />
            <SkeletonBar x={at + 31} y={row.y + 14} w={w - 45} h={4} />
          </g>
        );
      });
    })}
  </HeroDrawing>
);

/** Noto's cap height and x-height as a share of the em: the guides are measured from the glyphs. */
const CAP = 0.714;
const X_HEIGHT = 0.536;
const SIZE = 130;
const BASELINE = 130;

const Specimen = ({ x, family, weight }) => (
  <text
    x={x}
    y={BASELINE}
    textAnchor="middle"
    aria-hidden="true"
    fill={PAINT.glyph}
    style={{
      fontFamily: family,
      fontWeight: weight,
      fontSize: SIZE,
      letterSpacing: "-0.02em",
    }}
  >
    Aa
  </text>
);

export const TypographyHero = () => (
  <HeroDrawing>
    <Rule
      x1={-100}
      x2={400}
      y1={BASELINE - SIZE * CAP}
      y2={BASELINE - SIZE * CAP}
      stroke={PAINT.axis}
      dash="2 3"
    />
    <Rule
      x1={-100}
      x2={400}
      y1={BASELINE - SIZE * X_HEIGHT}
      y2={BASELINE - SIZE * X_HEIGHT}
      stroke={PAINT.axis}
      dash="2 3"
    />
    <Rule
      x1={150}
      x2={150}
      y1={15}
      y2={BASELINE + 20}
      stroke={PAINT.frameDivider}
    />
    <Specimen
      x={35}
      family="var(--type-family-heading-serif)"
      weight="var(--type-weight-medium)"
    />
    <Specimen
      x={265}
      family="var(--type-family-body)"
      weight="var(--type-weight-regular)"
    />
    <line
      x1={-100}
      x2={400}
      y1={BASELINE}
      y2={BASELINE}
      stroke={PAINT.accent}
      style={TAB_UNDERLINE}
    />
  </HeroDrawing>
);
