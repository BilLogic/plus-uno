import React from 'react';
import { PAINT } from './paint.js';
import { Illustration } from './Illustration.jsx';
import { Popup, Rect, Row, SkeletonBar } from './primitives.jsx';

/**
 * The Loading pattern's do and don't drawings. Each lesson is about what fills
 * the space while a view waits, so every drawing is blocked out: no words. A
 * spinner is a ring of the skeleton's own tone; the one accent is a ring
 * around the subject. Every pair shares one canvas, so a do and its don't
 * compare at one scale.
 */

const W = 168;
const H = 104;
const X = 8;
const INNER = W - 2 * X;
const RING = 2;
/** The wait ring's size at the kit's scale. */
const SPIN = 8;

const Canvas = ({ title, children }) => (
  <Illustration width={W} height={H} title={title}>
    {children}
  </Illustration>
);

const Subject = ({ x, y, w, h, corner = 'card' }) => <Rect x={x - RING} y={y - RING} w={w + 2 * RING} h={h + 2 * RING} stroke={PAINT.accent} corner={corner} />;

/** The wait ring: a circle stroked in the skeleton's tone. */
const Spinner = ({ x, y }) => <Rect x={x} y={y} w={SPIN} h={SPIN} stroke={PAINT.placeholderText} corner="full" />;

/** One skeleton row in a table's own shape: three text bars on the row's columns. */
const SkeletonRow = ({ y }) => (
  <g>
    <SkeletonBar x={X + 4} y={y} w={INNER * 0.34} />
    <SkeletonBar x={X + INNER * 0.5} y={y} w={INNER * 0.18} />
    <SkeletonBar x={X + INNER * 0.78} y={y} w={INNER * 0.14} />
  </g>
);

/** Do: a skeleton in the table's own shape, text bars throughout. */
export const SkeletonInShape = ({ title = 'A table drawn as text bars in its own columns' }) => (
  <Canvas title={title}>
    <SkeletonBar x={X} y={8} w={48} h={6} heading />
    {[0, 1, 2, 3].map((i) => <SkeletonRow key={i} y={34 + i * 14} />)}
    <Subject x={X} y={28} w={INNER} h={62} />
  </Canvas>
);

/** Don't: one spinner in a blank area; the layout jumps when the rows arrive. */
export const SpinnerInBlank = ({ title = 'A blank area with one spinner in the middle' }) => (
  <Canvas title={title}>
    <SkeletonBar x={X} y={8} w={48} h={6} heading />
    <Spinner x={W / 2 - SPIN / 2} y={56} />
    <Subject x={X} y={28} w={INNER} h={62} />
  </Canvas>
);

/** Do: a menu that waits shows one loading row. */
export const MenuOneRow = ({ title = 'A menu holding one row with a spinner beside a text bar' }) => (
  <Canvas title={title}>
    <Row x={X} y={12} w={INNER} />
    <Popup x={X + 16} y={32} w={96} h={24} />
    <Spinner x={X + 24} y={40} />
    <SkeletonBar x={X + 38} y={42} w={48} />
    <Subject x={X + 16} y={32} w={96} h={24} corner="popup" />
  </Canvas>
);

/** Don't: a menu full of skeleton rows, promising items it may not have. */
export const MenuSkeletonRows = ({ title = 'A menu holding three skeleton rows' }) => (
  <Canvas title={title}>
    <Row x={X} y={12} w={INNER} />
    <Popup x={X + 16} y={32} w={96} h={56} />
    {[0, 1, 2].map((i) => <SkeletonBar key={i} x={X + 24} y={42 + i * 14} w={72 - i * 12} />)}
    <Subject x={X + 16} y={32} w={96} h={56} corner="popup" />
  </Canvas>
);
