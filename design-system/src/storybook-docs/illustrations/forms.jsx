import React from 'react';
import { PAINT } from './paint.js';
import { Illustration } from './Illustration.jsx';
import { Backdrop, Field, Modal, Popup, Rect, SkeletonBar } from './primitives.jsx';

/**
 * The Forms pattern's do and don't drawings. Each lesson is about where a
 * message goes, so every drawing is blocked out: no words, buttons as flat
 * strips, one accent on the subject, the message. Every pair shares one
 * canvas, so a do and its don't compare at one scale.
 */

const W = 168;
const H = 104;
const MODAL = { x: 24, y: 10, w: 120, h: 84 };
const FIELD_X = MODAL.x + 10;
const FIELD_W = MODAL.w - 20;

const Canvas = ({ title, children }) => (
  <Illustration width={W} height={H} title={title}>
    <Rect x={0} y={0} w={W} h={H} fill={PAINT.pageSurface} />
    {children}
  </Illustration>
);

/** A Modal over its Backdrop with one field and its footer strip; the caller adds what the lesson is about. */
const FormModal = ({ invalid = false, children }) => (
  <g>
    <Backdrop x={0} y={0} w={W} h={H} />
    <Modal x={MODAL.x} y={MODAL.y} w={MODAL.w} h={MODAL.h} />
    <SkeletonBar x={FIELD_X} y={MODAL.y + 8} w={36} h={5} heading />
    <Field x={FIELD_X} y={MODAL.y + 22} w={FIELD_W} invalid={invalid} />
    {children}
  </g>
);

/** Do: the message sits on the field, in the same Modal. */
export const ErrorOnField = ({ title = 'A Modal whose invalid field carries its message right under it, in the same Modal' }) => (
  <Canvas title={title}>
    <FormModal invalid>
      <SkeletonBar x={FIELD_X} y={MODAL.y + 53} w={64} tone={PAINT.fieldBorderInvalid} />
      <Rect x={FIELD_X - 2} y={MODAL.y + 50} w={68} h={9} fill="none" stroke={PAINT.accent} corner="button" />
    </FormModal>
  </Canvas>
);

/** Don't: the message in a second dialog stacked on the first. */
export const ErrorInSecondDialog = ({ title = 'A Modal whose invalid field has no message of its own while a second small Modal opens over it' }) => (
  <Canvas title={title}>
    <FormModal invalid />
    <Backdrop x={0} y={0} w={W} h={H} />
    <Modal x={52} y={30} w={64} h={40} accent />
  </Canvas>
);

/** Do: help in a caption under the field, where it stays. */
export const HelpInCaption = ({ title = 'A field with its help in a caption under it, still there after typing' }) => (
  <Canvas title={title}>
    <FormModal>
      <SkeletonBar x={FIELD_X} y={MODAL.y + 53} w={72} />
      <Rect x={FIELD_X - 2} y={MODAL.y + 50} w={76} h={9} fill="none" stroke={PAINT.accent} corner="button" />
    </FormModal>
  </Canvas>
);

/** Don't: help only in a tooltip, a layer that is gone on touch and after typing. */
export const HelpInTooltip = ({ title = 'A field with no caption whose only help is a tooltip layer floating over it' }) => (
  <Canvas title={title}>
    <FormModal>
      <Popup x={FIELD_X + 36} y={MODAL.y + 40} w={52} h={24} accent />
    </FormModal>
  </Canvas>
);
