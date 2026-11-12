import React from 'react';
import { Illustration } from './Illustration.jsx';
import { PAINT } from './paint.js';
import { ButtonShape, CountTag, Rect, Row, SkeletonBar, Tabs } from './primitives.jsx';

/**
 * The Filtering pattern's do and don't drawings. Each lesson is about where
 * the filters sit in a Section's view bar and how many systems the bar runs,
 * so every drawing is blocked out: no words, buttons as flat strips. The one
 * accent is a ring around the subject, the filters; buttons keep their shipped
 * appearances. Every pair shares one canvas, so a do and its don't compare at
 * one scale.
 */

const W = 168;
const H = 104;
const X = 8;
const INNER = W - 2 * X;
/** The view bar's top edge, under the title row. */
const BAR = 30;
/** A blocked-out button strip's height: the button's 16, at the kit's strip scale. */
const STRIP = 8;
/** The ring's inset from what it wraps. */
const RING = 2;

const Canvas = ({ title, children }) => (
  <Illustration width={W} height={H} title={title}>
    {children}
  </Illustration>
);

/** The title row: the title bar and a one-line description under it. */
const TitleRow = () => (
  <g>
    <SkeletonBar x={X} y={8} w={48} h={6} heading />
    <SkeletonBar x={X} y={18} w={72} />
  </g>
);

/** Pill views at the bar's start, the first selected. */
const Views = ({ x = X, count = 2 }) => <Tabs x={x} y={BAR - 4} w={count * 24} count={count} />;

/** The labeled Primary, last at the bar's end. */
const Primary = () => <ButtonShape x={W - X - 26} y={BAR} w={26} appearance="primary" />;

/** An icon button in the bar: a square strip. */
const IconStrip = ({ x, w = STRIP }) => <ButtonShape x={x} y={BAR} w={w} />;

/** The accent: a ring around the subject, from `x` to `x + w` along the bar. */
const Subject = ({ x, y = BAR, w, h = STRIP }) => (
  <Rect x={x - RING} y={y - RING} w={w + 2 * RING} h={h + 2 * RING} stroke={PAINT.accent} corner="button" />
);

/** Table rows under the bar. */
const Rows = ({ y = 46, count = 3 }) => (
  <g>
    {Array.from({ length: count }, (_, i) => <Row key={i} x={X} y={y + i * 15} w={INNER} />)}
  </g>
);

/** Three quick filters, all in the bar: one tier. */
export const OneTier = ({ title = 'A view bar with three quick filter buttons together at its end, before the primary button' }) => (
  <Canvas title={title}>
    <TitleRow />
    <Views />
    {[0, 1, 2].map((i) => <ButtonShape key={i} x={70 + i * 22} y={BAR} w={18} />)}
    <Subject x={70} w={62} />
    <Primary />
    <Rows />
  </Canvas>
);

/** Two quick filters plus a Filter icon: two systems in one bar. */
export const TwoTiers = ({ title = 'A view bar with two quick filter buttons and a separate filter icon button beside them: two systems in one bar' }) => (
  <Canvas title={title}>
    <TitleRow />
    <Views />
    {[0, 1].map((i) => <ButtonShape key={i} x={80 + i * 22} y={BAR} w={18} />)}
    <IconStrip x={124} />
    <Subject x={80} w={52} />
    <Primary />
    <Rows />
  </Canvas>
);

/** The count on the Filter icon: the button widens to hold it. */
export const CountOnIcon = ({ title = 'A view bar whose filter icon button is wider, holding its own count of the filters that are on' }) => (
  <Canvas title={title}>
    <TitleRow />
    <Views />
    <IconStrip x={100} />
    <IconStrip x={112} w={16} />
    <Subject x={112} w={16} />
    <Primary />
    <Rows />
  </Canvas>
);

/** A row of tags under the bar, repeating what is on. */
export const TagRow = ({ title = 'A view bar with a plain filter icon button and a row of tags under the bar repeating each filter that is on' }) => (
  <Canvas title={title}>
    <TitleRow />
    <Views />
    <IconStrip x={108} />
    <IconStrip x={120} />
    <Primary />
    {[0, 1, 2].map((i) => <CountTag key={i} x={X + i * 28} y={44} w={24} />)}
    <Subject x={X} y={44} w={80} h={10} />
    <Rows y={60} count={2} />
  </Canvas>
);

/** Filters at the bar's end, after Search; the start stays for views. */
export const FiltersAtEnd = ({ title = 'A view bar with the views at its start and the filters at its end, just before the primary button' }) => (
  <Canvas title={title}>
    <TitleRow />
    <Views />
    <IconStrip x={88} />
    {[0, 1].map((i) => <ButtonShape key={i} x={100 + i * 16} y={BAR} w={13} />)}
    <Subject x={100} w={29} />
    <Primary />
    <Rows />
  </Canvas>
);

/** Filters squeezed in beside the views, at the bar's start. */
export const FiltersAmongViews = ({ title = 'A view bar with the filters squeezed in right after the views at its start, far from the other controls' }) => (
  <Canvas title={title}>
    <TitleRow />
    <Views />
    {[0, 1].map((i) => <ButtonShape key={i} x={60 + i * 16} y={BAR} w={13} />)}
    <Subject x={60} w={29} />
    <IconStrip x={120} />
    <Primary />
    <Rows />
  </Canvas>
);
