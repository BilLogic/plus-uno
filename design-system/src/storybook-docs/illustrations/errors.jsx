import React from 'react';
import { PAINT } from './paint.js';
import { Illustration } from './Illustration.jsx';
import { Backdrop, ButtonShape, Field, Modal, Popup, Rect, Section, SkeletonBar } from './primitives.jsx';

/**
 * The Errors pattern's do and don't drawings. Each lesson is about where a
 * message goes, so every drawing is blocked out: no words, buttons as flat
 * strips. The one accent is a ring around the subject, the message or the
 * block that holds it. Every pair shares one canvas, so a do and its don't
 * compare at one scale.
 */

const W = 168;
const H = 104;
const FIELD_X = 20;
const FIELD_W = W - 2 * FIELD_X;
const FIELD_Y = 16;
/** The ring's inset from what it wraps. */
const RING = 2;

const Canvas = ({ title, children }) => (
  <Illustration width={W} height={H} title={title}>
    <Rect x={0} y={0} w={W} h={H} fill={PAINT.pageSurface} />
    {children}
  </Illustration>
);

/** Do: the message sits right under the invalid field, in words. */
export const MessageOnField = ({ title = 'An invalid field with its message right under it' }) => (
  <Canvas title={title}>
    <Field x={FIELD_X} y={FIELD_Y} w={FIELD_W} invalid />
    <SkeletonBar x={FIELD_X} y={FIELD_Y + 34} w={72} tone={PAINT.fieldMessageDanger} />
    <Rect x={FIELD_X - RING} y={FIELD_Y + 31} w={76} h={10} fill="none" stroke={PAINT.accent} corner="button" />
  </Canvas>
);

/** Don't: a red border alone, its words in a tooltip layer. */
export const BorderAndTooltip = ({ title = 'An invalid field with no message of its own and a tooltip layer floating beside it' }) => (
  <Canvas title={title}>
    <Field x={FIELD_X} y={FIELD_Y} w={FIELD_W} invalid />
    <Popup x={FIELD_X + 70} y={FIELD_Y + 32} w={56} h={34} accent />
  </Canvas>
);

const SECTION = { x: 12, y: 10, w: W - 24, h: H - 20 };

/** The page behind a failure: a Section with its title and rows. */
const PageBehind = () => <Section x={SECTION.x} y={SECTION.y} w={SECTION.w} h={SECTION.h} rows={0} />;

/** Do: a load failure takes the Section's empty-state slot; the rest of the page works. */
export const FailureInSlot = ({ title = 'A Section whose body shows its error and one action in place, with the rest of the page in view' }) => (
  <Canvas title={title}>
    <PageBehind />
    <SkeletonBar x={SECTION.x + 40} y={SECTION.y + 30} w={64} heading />
    <SkeletonBar x={SECTION.x + 40} y={SECTION.y + 42} w={88} />
    <ButtonShape x={SECTION.x + 40} y={SECTION.y + 54} w={40} />
    <Rect x={SECTION.x + 34} y={SECTION.y + 24} w={100} h={48} fill="none" stroke={PAINT.accent} corner="card" />
  </Canvas>
);

/** Don't: a load failure reported in a Modal over the whole page. */
export const FailureInModal = ({ title = 'A Section with an empty body while a Modal opens over the whole page to report the failure' }) => (
  <Canvas title={title}>
    <PageBehind />
    <Backdrop x={0} y={0} w={W} h={H} />
    <Modal x={44} y={26} w={80} h={52} accent />
  </Canvas>
);
