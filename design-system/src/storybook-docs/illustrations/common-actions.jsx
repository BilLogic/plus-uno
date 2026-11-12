import React from 'react';
import { PAINT } from './paint.js';
import { Illustration } from './Illustration.jsx';
import { ButtonShape, Field, Rect, SkeletonBar } from './primitives.jsx';

/**
 * The Common actions pattern's do and don't drawings. The lesson is how many
 * Primary buttons an area holds, so the drawing is blocked out: no words,
 * buttons as flat strips, one accent on the subject, the button row. The pair
 * shares one canvas, so a do and its don't compare at one scale.
 */

const W = 168;
const H = 104;
const X = 14;
const ROW = 70;

const Canvas = ({ title, children }) => (
  <Illustration width={W} height={H} title={title}>
    <Rect x={0} y={0} w={W} h={H} fill={PAINT.frameSunken} />
    <Rect x={8} y={8} w={W - 16} h={H - 16} fill={PAINT.pageSurface} corner="section" />
    <SkeletonBar x={X} y={16} w={36} h={5} heading />
    <Field x={X} y={30} w={W - 2 * X} />
    {children}
  </Illustration>
);

/** The ring around a button row: the accent on the subject. */
const Subject = ({ w }) => <Rect x={X - 2} y={ROW - 2} w={w + 4} h={12} fill="none" stroke={PAINT.accent} corner="button" />;

/** Do: one Primary, another action Default beside it. */
export const OnePrimary = ({ title = 'An area with one primary button and a default button beside it' }) => (
  <Canvas title={title}>
    <ButtonShape x={X} y={ROW} w={26} appearance="primary" />
    <ButtonShape x={X + 30} y={ROW} w={26} />
    <Subject w={56} />
  </Canvas>
);

/** Don't: two Primary buttons in one row; neither reads as the next step. */
export const TwoPrimaries = ({ title = 'An area with two primary buttons side by side' }) => (
  <Canvas title={title}>
    <ButtonShape x={X} y={ROW} w={26} appearance="primary" />
    <ButtonShape x={X + 30} y={ROW} w={26} appearance="primary" />
    <Subject w={56} />
  </Canvas>
);
