import React from 'react';
import { PAINT } from './paint.js';
import { Illustration } from './Illustration.jsx';
import { ButtonShape, Field, Rect, Row, Rule, SkeletonBar } from './primitives.jsx';

/**
 * The Section template's do and don't drawings. Each lesson is about where a
 * part sits, so every drawing is blocked out: no words, buttons as flat strips,
 * one accent on the subject. Every pair shares one canvas, so a do and its
 * don't compare at one scale.
 */

const W = 168;
const H = 104;
const X = 8;
const INNER = W - 2 * X;

const Canvas = ({ title, children }) => (
  <Illustration width={W} height={H} title={title}>
    {children}
  </Illustration>
);

/** A title row: the title bar and a one-line description under it. */
const TitleRow = ({ y, accent = false, w = 48 }) => (
  <g>
    <SkeletonBar x={X} y={y} w={w} h={6} tone={accent ? PAINT.accent : PAINT.ink} />
    <SkeletonBar x={X} y={y + 10} w={w * 1.5} />
  </g>
);

/** Pill views: hugging pills at the start of the bar, the first selected. */
const Pills = ({ x = X, y, count = 2 }) => (
  <g>
    {Array.from({ length: count }, (_, i) => (
      <Rect key={i} x={x + i * 26} y={y} w={22} h={8} fill={i === 0 ? PAINT.neutral : PAINT.sunken} corner="full" />
    ))}
  </g>
);

/** An icon button in a bar: a square strip. */
const IconStrip = ({ x, y }) => <Rect x={x} y={y} w={8} h={8} fill={PAINT.neutral} corner="xs" />;

/** Table rows under the bar. */
const Rows = ({ y, count = 3 }) => (
  <g>
    {Array.from({ length: count }, (_, i) => <Row key={i} x={X} y={y + i * 15} w={INNER} />)}
  </g>
);

/** Title row first, the view bar under it, one left edge. */
export const TitleRowAboveViewBar = ({ title = 'A Section with its title row on top and the view bar under it, both starting at one left edge' }) => (
  <Canvas title={title}>
    <TitleRow y={8} accent />
    <Pills y={30} />
    <ButtonShape x={W - X - 28} y={30} w={28} />
    <Rows y={46} />
  </Canvas>
);

/** The title pushed into the view bar, fighting the pills for the start. */
export const TitleInViewBar = ({ title = 'A Section whose title sits inside the view bar, crowding the pills, with no room for a description' }) => (
  <Canvas title={title}>
    <SkeletonBar x={X} y={10} w={36} h={6} tone={PAINT.accent} />
    <Pills x={X + 42} y={9} />
    <ButtonShape x={W - X - 28} y={9} w={28} />
    <Rows y={26} count={4} />
  </Canvas>
);

/** The right side in order, the Primary last: five controls at most. */
export const RightSideInOrder = ({ title = 'A view bar whose right side runs format switch, three icon buttons, then the primary button last' }) => (
  <Canvas title={title}>
    <TitleRow y={8} />
    <Pills y={30} />
    <Rect x={70} y={30} w={20} h={8} fill={PAINT.neutral} corner="xs" />
    <Rule x1={80} x2={80} y1={30} y2={38} stroke={PAINT.surface} />
    {[0, 1, 2].map((i) => <IconStrip key={i} x={94 + i * 11} y={30} />)}
    <ButtonShape x={W - X - 26} y={30} w={26} appearance="primary" />
    <Rows y={46} />
  </Canvas>
);

/** Six controls in no order, the Primary first and a second labeled button. */
export const RightSideCrowded = ({ title = 'A view bar with six controls in no order: the primary button first, then a second wide button and scattered icons' }) => (
  <Canvas title={title}>
    <TitleRow y={8} />
    <Pills y={30} count={1} />
    <ButtonShape x={36} y={30} w={24} appearance="primary" />
    <IconStrip x={64} y={30} />
    <ButtonShape x={76} y={30} w={24} />
    <IconStrip x={104} y={30} />
    <Rect x={116} y={30} w={20} h={8} fill={PAINT.neutral} corner="xs" />
    <IconStrip x={140} y={30} />
    <Rows y={46} />
  </Canvas>
);

/** A form card holds its own Save; the Section footer leads to more. */
export const CardOwnsSave = ({ title = 'A form card with its own buttons at its bottom, and the Section footer holding only a link to more' }) => (
  <Canvas title={title}>
    <TitleRow y={8} />
    <Rect x={X} y={28} w={INNER} h={56} fill={PAINT.raised} stroke={PAINT.line} corner="sm" />
    <Field x={X + 8} y={34} w={INNER / 2 - 12} />
    <Field x={X + INNER / 2 + 4} y={34} w={INNER / 2 - 12} />
    <ButtonShape x={X + 8} y={68} w={24} appearance="primary" />
    <ButtonShape x={X + 36} y={68} w={24} />
    <SkeletonBar x={W - X - 24} y={92} w={24} tone={PAINT.neutral} />
  </Canvas>
);

/** Cancel and Save in the Section footer, away from the fields they commit. */
export const FooterCommits = ({ title = 'A form card with no buttons, its Cancel and Save down in the Section footer, away from the fields' }) => (
  <Canvas title={title}>
    <TitleRow y={8} />
    <Rect x={X} y={28} w={INNER} h={44} fill={PAINT.raised} stroke={PAINT.line} corner="sm" />
    <Field x={X + 8} y={34} w={INNER / 2 - 12} />
    <Field x={X + INNER / 2 + 4} y={34} w={INNER / 2 - 12} />
    <ButtonShape x={W - X - 52} y={88} w={24} />
    <ButtonShape x={W - X - 24} y={88} w={24} appearance="primary" />
  </Canvas>
);

/** A card with its own title stands on its own in the page. */
export const CardStandsAlone = ({ title = 'One card with its own title, standing on its own with no Section heading above it' }) => (
  <Canvas title={title}>
    <Rect x={X} y={16} w={INNER} h={72} fill={PAINT.raised} stroke={PAINT.line} corner="sm" />
    <SkeletonBar x={X + 8} y={24} w={48} h={6} tone={PAINT.accent} />
    <SkeletonBar x={X + 8} y={36} w={INNER * 0.6} />
    <SkeletonBar x={X + 8} y={46} w={INNER * 0.5} />
    <SkeletonBar x={X + 8} y={56} w={INNER * 0.55} />
  </Canvas>
);

/** A Section whose heading repeats its only card's title: two headings for one thing. */
export const SectionRepeatsCard = ({ title = 'A Section heading above one card that repeats the same title, so one thing has two headings' }) => (
  <Canvas title={title}>
    <SkeletonBar x={X} y={8} w={48} h={6} tone={PAINT.accent} />
    <Rect x={X} y={22} w={INNER} h={72} fill={PAINT.raised} stroke={PAINT.line} corner="sm" />
    <SkeletonBar x={X + 8} y={30} w={48} h={6} tone={PAINT.accent} />
    <SkeletonBar x={X + 8} y={42} w={INNER * 0.6} />
    <SkeletonBar x={X + 8} y={52} w={INNER * 0.5} />
    <SkeletonBar x={X + 8} y={62} w={INNER * 0.55} />
  </Canvas>
);

/** No view bar, so the actions sit at the end of the title row. */
export const ActionsInTitleRow = ({ title = 'A Section with no view bar, its actions at the end of the title row above the rows' }) => (
  <Canvas title={title}>
    <TitleRow y={8} />
    <ButtonShape x={W - X - 54} y={8} w={24} />
    <ButtonShape x={W - X - 26} y={8} w={26} appearance="primary" />
    <Rows y={30} count={4} />
  </Canvas>
);

/** Actions in the title row and a view bar with its own: one action, two homes. */
export const ActionsInTwoHomes = ({ title = 'A Section with the primary action in its title row and again at the end of its view bar' }) => (
  <Canvas title={title}>
    <TitleRow y={8} />
    <ButtonShape x={W - X - 26} y={8} w={26} appearance="primary" />
    <Pills y={30} />
    <ButtonShape x={W - X - 26} y={30} w={26} appearance="primary" />
    <Rows y={46} />
  </Canvas>
);
