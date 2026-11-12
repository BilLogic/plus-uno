import React from 'react';
import { PAINT } from './paint.js';
import { Illustration } from './Illustration.jsx';
import { Field, Rect, Section, SkeletonBar } from './primitives.jsx';

/**
 * The Read-only pattern's do and don't drawings. Each lesson is about how a
 * value someone cannot change is shown, so every drawing is blocked out: no
 * words. The one accent is a ring around the subject, the reason or the part
 * that is wrongly drawn. Every pair shares one canvas, so a do and its don't
 * compare at one scale.
 */

const W = 168;
const H = 104;
const FIELD_X = 20;
const FIELD_W = W - 2 * FIELD_X;
const FIELD_Y = 16;
/** The ring's inset from what it wraps. */
const RING = 2;
/** How far a disabled part fades: the kit's one fade, for a part that cannot be used. */
const FADED = 0.4; // docs-literal

const Canvas = ({ title, children }) => (
  <Illustration width={W} height={H} title={title}>
    <Rect x={0} y={0} w={W} h={H} fill={PAINT.pageSurface} />
    {children}
  </Illustration>
);

/** Do: the value at full contrast with its reason in the caption. */
export const ReadableWithReason = ({ title = 'A field at full contrast with its reason as a caption under it' }) => (
  <Canvas title={title}>
    <Field x={FIELD_X} y={FIELD_Y} w={FIELD_W} />
    <SkeletonBar x={FIELD_X} y={FIELD_Y + 34} w={72} />
    <Rect x={FIELD_X - RING} y={FIELD_Y + 31} w={76} h={10} fill="none" stroke={PAINT.accent} corner="button" />
  </Canvas>
);

/** Don't: the value faded, with no reason, as a disabled field is. */
export const FadedNoReason = ({ title = 'A faded field with no caption: hard to read and no reason given' }) => (
  <Canvas title={title}>
    <g opacity={FADED}>
      <Field x={FIELD_X} y={FIELD_Y} w={FIELD_W} />
    </g>
    <Rect x={FIELD_X - RING} y={FIELD_Y + 5} w={FIELD_W + 2 * RING} h={24} fill="none" stroke={PAINT.accent} corner="field" />
  </Canvas>
);

const SECTION = { x: 20, y: 14, w: W - 40 };

/** Do: a value nobody changes here is a label and a value, plain. */
export const PlainValue = ({ title = 'A details Section with two label and value pairs, no field' }) => (
  <Canvas title={title}>
    <Section x={SECTION.x} y={SECTION.y} w={SECTION.w} h={60} rows={0} />
    <SkeletonBar x={SECTION.x} y={SECTION.y + 20} w={24} />
    <SkeletonBar x={SECTION.x + 40} y={SECTION.y + 20} w={56} />
    <SkeletonBar x={SECTION.x} y={SECTION.y + 32} w={24} />
    <SkeletonBar x={SECTION.x + 40} y={SECTION.y + 32} w={44} />
    <Rect x={SECTION.x - RING} y={SECTION.y + 16} w={104} h={24} fill="none" stroke={PAINT.accent} corner="button" />
  </Canvas>
);

/** Don't: a field for a value that was never editable, promising an input. */
export const FieldForFixedValue = ({ title = 'A details Section whose never-editable value sits in a field' }) => (
  <Canvas title={title}>
    <Section x={SECTION.x} y={SECTION.y} w={SECTION.w} h={60} rows={0} />
    <Field x={SECTION.x} y={SECTION.y + 16} w={SECTION.w * 0.8} accent />
  </Canvas>
);
