import React from 'react';
import { PAINT } from './paint.js';
import { Illustration } from './Illustration.jsx';
import { Backdrop, ButtonShape, Panel, Rect, Row, Rule, Section } from './primitives.jsx';

/**
 * The Panel template's do and don't drawings. Each lesson is about how a Panel
 * sits against the page, so every drawing is blocked out: no words, buttons as
 * flat strips, one accent on the subject. Every pair shares one canvas, so a do
 * and its don't compare at one scale.
 */

const W = 168;
const H = 104;
const X = 8;

const Canvas = ({ title, children }) => (
  <Illustration width={W} height={H} title={title}>
    <Rect x={0} y={0} w={W} h={H} fill={PAINT.pageSurface} />
    {children}
  </Illustration>
);

/** The page under a Panel: a Section with rows. */
const PageBehind = ({ w = W - 2 * X }) => (
  <g>
    <Section x={X} y={10} w={w} h={60} rows={3} />
    <Row x={X} y={74} w={w} />
    <Row x={X} y={88} w={w} />
  </g>
);

/** Do: a Panel floats over the page on the overlay fill and shadow, and the page is still there. */
export const FloatsNoBackdrop = ({ title = 'A Panel floating over the right of the page on a shadow, the page beside it undimmed' }) => (
  <Canvas title={title}>
    <PageBehind />
    <Panel x={96} y={0} w={72} h={H} accent floating />
  </Canvas>
);

/** Don't: the same Panel with a Backdrop dimming the page. */
export const PanelOnBackdrop = ({ title = 'The same Panel with a Backdrop dimming the whole page behind it' }) => (
  <Canvas title={title}>
    <PageBehind />
    <Backdrop x={0} y={0} w={W} h={H} />
    <Panel x={96} y={0} w={72} h={H} accent floating />
  </Canvas>
);

/** Do: one floating Panel, another record swaps its content. */
export const OneFloatingPanel = ({ title = 'One floating Panel over the page' }) => (
  <Canvas title={title}>
    <PageBehind />
    <Panel x={96} y={0} w={72} h={H} accent floating />
  </Canvas>
);

/** Don't: two floating Panels stacked, the second covering the first. */
export const TwoFloatingPanels = ({ title = 'Two floating Panels open at once, the second covering part of the first' }) => (
  <Canvas title={title}>
    <PageBehind />
    <Panel x={70} y={0} w={72} h={H} floating />
    <Panel x={96} y={0} w={72} h={H} accent floating />
  </Canvas>
);

/** Do: a Panel read in place has no footer. */
export const ReadingNoFooter = ({ title = 'A Panel that is only read, header and body with no footer' }) => (
  <Canvas title={title}>
    <PageBehind />
    <Panel x={96} y={0} w={72} h={H} floating accent />
  </Canvas>
);

/** Don't: a footer on a Panel that is only read. */
export const ReadingWithFooter = ({ title = 'A Panel that is only read, with a footer of buttons it has no use for' }) => (
  <Canvas title={title}>
    <PageBehind />
    <Panel x={96} y={0} w={72} h={H} floating />
    <Rule x1={96} x2={168} y1={H - 22} y2={H - 22} stroke={PAINT.modalDivider} />
    <ButtonShape x={96} y={H - 16} w={36} />
    <ButtonShape x={132} y={H - 16} w={36} appearance="primary" />
    <Rect x={96} y={H - 22} w={72} h={22} fill="none" stroke={PAINT.accent} />
  </Canvas>
);

/** Do: the floating Panel sits beside the docked AI panel, which stays uncovered. */
export const BesideAiPanel = ({ title = 'A floating Panel left of a docked AI panel, which stays fully visible' }) => (
  <Canvas title={title}>
    <PageBehind w={80} />
    <Panel x={56} y={0} w={56} h={H} floating accent />
    <Panel x={112} y={0} w={56} h={H} />
  </Canvas>
);

/** Don't: the floating Panel covering the docked AI panel. */
export const CoversAiPanel = ({ title = 'A floating Panel drawn over the docked AI panel, hiding part of it' }) => (
  <Canvas title={title}>
    <PageBehind w={80} />
    <Panel x={112} y={0} w={56} h={H} />
    <Panel x={80} y={0} w={72} h={H} floating accent />
  </Canvas>
);
