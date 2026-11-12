import React from 'react';
import { PAINT } from './paint.js';
import { Illustration } from './Illustration.jsx';
import { ButtonShape, Popup, Rect, Row, SkeletonBar } from './primitives.jsx';

/**
 * The Overflow pattern's do and don't drawings. The lessons are about what
 * happens to text that is longer than its room, so every drawing is blocked
 * out: no words, text as bars, one accent on the subject. Each pair shares one
 * canvas, so a do and its don't compare at one scale.
 */

const W = 168;
const H = 104;
const X = 14;

const Canvas = ({ title, children }) => (
  <Illustration width={W} height={H} title={title}>
    <Rect x={0} y={0} w={W} h={H} fill={PAINT.frameSunken} />
    <Rect x={8} y={8} w={W - 16} h={H - 16} fill={PAINT.pageSurface} corner="section" />
    {children}
  </Illustration>
);

/** The three dots of an ellipsis, ending a bar that is clipped. */
const Ellipsis = ({ x, y, tone = PAINT.placeholderText }) => (
  <g>
    {[0, 4, 8].map((dx) => <Rect key={dx} x={x + dx} y={y} w={2} h={2} fill={tone} corner="count" />)}
  </g>
);

/** Do: a clipped cell ends in an ellipsis and its full text opens beside it. */
export const ClippedCellOpensText = ({ title = 'A table row whose clipped cell ends in an ellipsis, with its full text open in a small layer below it' }) => (
  <Canvas title={title}>
    <SkeletonBar x={X} y={16} w={36} h={5} heading />
    <Row x={X} y={30} w={W - 2 * X} />
    <SkeletonBar x={X + 16} y={52} w={44} accent />
    <Ellipsis x={X + 62} y={53} tone={PAINT.accent} />
    <Popup x={X + 10} y={58} w={72} h={26} accent />
  </Canvas>
);

/** Don't: the one line that names the content is the one that is cut. */
export const ClippedSectionTitle = ({ title = 'A Section whose title is cut to a short bar and an ellipsis while its rows run on' }) => (
  <Canvas title={title}>
    <SkeletonBar x={X} y={16} w={32} h={5} accent heading />
    <Ellipsis x={X + 36} y={17.5} tone={PAINT.accent} />
    <Row x={X} y={30} w={W - 2 * X} />
    <Row x={X} y={46} w={W - 2 * X} />
    <Row x={X} y={62} w={W - 2 * X} />
  </Canvas>
);

/** Do: a folded list names how many more it holds, and grows in place. */
export const ShowMoreWithCount = ({ title = 'A list of three rows with a button strip under it that folds the rest' }) => (
  <Canvas title={title}>
    <SkeletonBar x={X} y={16} w={36} h={5} heading />
    <Row x={X} y={30} w={W - 2 * X} />
    <Row x={X} y={46} w={W - 2 * X} />
    <Row x={X} y={62} w={W - 2 * X} />
    <ButtonShape x={X} y={82} w={34} appearance="default" />
    <Rect x={X - 2} y={80} w={38} h={12} fill="none" stroke={PAINT.accent} corner="button" />
  </Canvas>
);

/** Don't: a fade over the list hides how much is there. */
export const FadedList = ({ title = 'A list whose last rows fade out into the page, with nothing to say how many more there are' }) => (
  <Canvas title={title}>
    <SkeletonBar x={X} y={16} w={36} h={5} heading />
    <Row x={X} y={30} w={W - 2 * X} />
    <g opacity={0.6}><Row x={X} y={46} w={W - 2 * X} /></g>
    <g opacity={0.3}><Row x={X} y={62} w={W - 2 * X} /></g>
    <g opacity={0.1}><Row x={X} y={78} w={W - 2 * X} /></g>
    <Rect x={X - 2} y={44} w={W - 2 * X + 4} h={48} fill="none" stroke={PAINT.accent} corner="button" />
  </Canvas>
);
