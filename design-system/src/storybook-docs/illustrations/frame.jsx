import React from 'react';
import { PAINT } from './paint.js';
import { Illustration } from './Illustration.jsx';
import { ButtonShape, Field, Panel, Rect, Row, Rule, Sidebar, SkeletonBar } from './primitives.jsx';

/**
 * The Frame template's do and don't drawings. Each lesson is about which
 * regions a Frame has and where they sit, so every drawing is blocked out: no
 * words, buttons as flat strips, one accent on the subject. Every pair shares
 * one canvas, so a do and its don't compare at one scale.
 */

const W = 168;
const H = 104;
const SIDE = 34;
const BAR_H = 12;

const Canvas = ({ title, children }) => (
  <Illustration width={W} height={H} title={title}>
    <Rect x={0} y={0} w={W} h={H} fill={PAINT.frameSunken} />
    {children}
  </Illustration>
);

/** The Page: a surface that runs to the window's edges. */
const PageBox = ({ x, w, h = H }) => <Rect x={x} y={0} w={w} h={h} fill={PAINT.pageSurface} />;

/** A few placeholder rows in the Page. */
const Body = ({ x, y = 28, w }) => (
  <g>
    {[0, 1, 2].map((i) => <Row key={i} x={x} y={y + i * 15} w={w} />)}
  </g>
);

/** The task's footer: Save and exit at the start, Back and Next at the end, on one line. */
const Bar = () => (
  <g>
    <Rect x={0} y={H - BAR_H} w={W} h={BAR_H} fill={PAINT.pageSurface} />
    <Rule x1={0} x2={W} y1={H - BAR_H} y2={H - BAR_H} />
    <ButtonShape x={SIDE + 6} y={H - BAR_H + 2} w={30} />
    <ButtonShape x={W - 66} y={H - BAR_H + 2} w={28} />
    <ButtonShape x={W - 34} y={H - BAR_H + 2} w={28} appearance="primary" />
  </g>
);

/** A multi-step task: the steps are the Sidebar's inner rows, so the Page holds only the task. */
export const MultiStepInnerSidebar = ({ title = 'A multi-step task with its steps as rows in the Sidebar and only the task in the Page' }) => (
  <Canvas title={title}>
    <Sidebar x={0} y={0} w={SIDE} h={H} accent />
    {[0, 1, 2, 3].map((i) => <SkeletonBar key={i} x={6} y={30 + i * 11} w={SIDE - 12} heading={i === 1} />)}
    <PageBox x={SIDE} w={W - SIDE} h={H - BAR_H} />
    <SkeletonBar x={SIDE + 8} y={8} w={40} h={6} heading />
    <Body x={SIDE + 8} w={W - SIDE - 16} />
    <Bar />
  </Canvas>
);

/** A second step list in the Page, beside the Sidebar's own rows: two lists for one task. */
export const MultiStepStepsInPage = ({ title = 'A multi-step task with the steps drawn again inside the Page, beside the Sidebar that still lists the main areas' }) => (
  <Canvas title={title}>
    <Sidebar x={0} y={0} w={SIDE} h={H} />
    <PageBox x={SIDE} w={W - SIDE} h={H - BAR_H} />
    <SkeletonBar x={SIDE + 8} y={8} w={40} h={6} heading />
    {[0, 1, 2, 3].map((i) => <SkeletonBar key={i} x={SIDE + 8} y={28 + i * 11} w={28} heading={i === 1} accent={i === 1} />)}
    <Body x={SIDE + 44} w={W - SIDE - 52} />
    <Bar />
  </Canvas>
);

/** The AI panel docked on the right as its own region, the Page beside it. */
export const AiPanelDocked = ({ title = 'The AI panel docked at the right edge as its own region, the Page shrinking beside it' }) => (
  <Canvas title={title}>
    <Sidebar x={0} y={0} w={SIDE} h={H} />
    <PageBox x={SIDE} w={W - SIDE - 52} />
    <Body x={SIDE + 8} y={14} w={W - SIDE - 52 - 16} />
    <Panel x={W - 52} y={0} w={52} h={H} accent />
  </Canvas>
);

/** The AI panel floating over the Page, covering what it sits on. */
export const AiPanelFloating = ({ title = 'The AI panel floating over the Page and covering part of its rows' }) => (
  <Canvas title={title}>
    <Sidebar x={0} y={0} w={SIDE} h={H} />
    <PageBox x={SIDE} w={W - SIDE} />
    <Body x={SIDE + 8} y={14} w={W - SIDE - 16} />
    <Panel x={W - 64} y={8} w={56} h={H - 16} accent floating />
  </Canvas>
);

/** A bare sign-in: one centered column, nothing else. */
export const BareColumn = ({ title = 'A bare Frame with one centered column of fields and a button, and no Sidebar' }) => (
  <Canvas title={title}>
    <PageBox x={0} w={W} />
    <g transform={`translate(${(W - 64) / 2} 0)`}>
      <Rect x={0} y={6} w={14} h={14} fill={PAINT.accent} corner="shape" />
      <Field x={0} y={26} w={64} accent />
      <Field x={0} y={58} w={64} />
      <ButtonShape x={0} y={92} w={64} appearance="primary" />
    </g>
  </Canvas>
);

/** A sign-in with the Sidebar beside it: navigation for a person who has no account yet. */
export const BareWithSidebar = ({ title = 'A sign-in form with the full Sidebar docked beside it, offering navigation to a person who has not signed in' }) => (
  <Canvas title={title}>
    <Sidebar x={0} y={0} w={SIDE} h={H} accent />
    <PageBox x={SIDE} w={W - SIDE} />
    <g transform={`translate(${SIDE + (W - SIDE - 64) / 2} 0)`}>
      <Field x={0} y={26} w={64} />
      <Field x={0} y={58} w={64} />
      <ButtonShape x={0} y={92} w={64} appearance="primary" />
    </g>
  </Canvas>
);
