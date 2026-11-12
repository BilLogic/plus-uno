import React from 'react';
import { PAINT } from './paint.js';
import { Illustration } from './Illustration.jsx';
import { ButtonShape, Rect, Row, SkeletonBar, Tabs } from './primitives.jsx';

/**
 * The Empty pattern's do and don't drawings. Each lesson is about how an empty
 * view is laid out, so every drawing is blocked out: no words, buttons as flat
 * strips. The one accent is a ring around the subject, the empty block or the
 * table it replaced. Every pair shares one canvas, so a do and its don't
 * compare at one scale.
 */

const W = 168;
const H = 104;
const X = 8;
const INNER = W - 2 * X;
/** The ring's inset from what it wraps. */
const RING = 2;
/** A picture's placeholder: the empty state's icon at the kit's scale. */
const PICTURE = 12;

const Canvas = ({ title, children }) => (
  <Illustration width={W} height={H} title={title}>
    {children}
  </Illustration>
);

const TitleRow = () => <SkeletonBar x={X} y={8} w={48} h={6} heading />;

const Subject = ({ x, y, w, h }) => <Rect x={x - RING} y={y - RING} w={w + 2 * RING} h={h + 2 * RING} stroke={PAINT.accent} corner="card" />;

/** Do: a picture, a heading, one line and the one action, all on one left edge. */
export const WhatBelongsHere = ({ title = 'An empty view with a picture, a heading, one line and one action on one left edge' }) => (
  <Canvas title={title}>
    <TitleRow />
    <Rect x={X + 12} y={34} w={PICTURE} h={PICTURE} fill={PAINT.placeholderText} corner="button" />
    <SkeletonBar x={X + 12} y={52} w={64} h={5} heading />
    <SkeletonBar x={X + 12} y={62} w={92} />
    <ButtonShape x={X + 12} y={74} w={26} appearance="primary" />
    <Subject x={X + 8} y={30} w={108} h={56} />
  </Canvas>
);

/** Don't: a bare string in an empty box; broken, loading or empty, nobody can tell. */
export const BareString = ({ title = 'An empty view holding one short line in a wide empty box' }) => (
  <Canvas title={title}>
    <TitleRow />
    <SkeletonBar x={W / 2 - 14} y={56} w={28} />
    <Subject x={X} y={22} w={INNER} h={74} />
  </Canvas>
);

/** Do: the empty state replaces the whole table; the view bar stays. */
export const ReplacedTable = ({ title = 'A section whose empty state replaced the whole table, with its view bar still above' }) => (
  <Canvas title={title}>
    <TitleRow />
    <Tabs x={X} y={22} w={48} count={2} />
    <ButtonShape x={W - X - 26} y={26} w={26} appearance="primary" />
    <Rect x={X + 36} y={50} w={PICTURE} h={PICTURE} fill={PAINT.placeholderText} corner="button" />
    <SkeletonBar x={X + 36} y={68} w={56} h={5} heading />
    <SkeletonBar x={X + 36} y={78} w={76} />
    <Subject x={X} y={44} w={INNER} h={52} />
  </Canvas>
);

/** Don't: column headers and a footer over nothing, with a centered paragraph. */
export const HeaderOverNothing = ({ title = 'A table with its column headers and footer over a short centered line' }) => (
  <Canvas title={title}>
    <TitleRow />
    <Tabs x={X} y={22} w={48} count={2} />
    <ButtonShape x={W - X - 26} y={26} w={26} appearance="primary" />
    <Row x={X} y={44} w={INNER} />
    <SkeletonBar x={W / 2 - 22} y={68} w={44} />
    <Row x={X} y={82} w={INNER} />
    <Subject x={X} y={44} w={INNER} h={52} />
  </Canvas>
);
