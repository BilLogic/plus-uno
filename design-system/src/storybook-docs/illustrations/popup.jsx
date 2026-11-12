import React from 'react';
import { PAINT } from './paint.js';
import { Illustration } from './Illustration.jsx';
import { Backdrop, ButtonShape, Field, Modal, Popup, Rect, SkeletonBar } from './primitives.jsx';

/**
 * The Popup template's do and don't drawings. Each lesson is about where a
 * Popup sits or how wide it is, so every drawing is blocked out: no words,
 * buttons as flat strips, one accent on the subject. A Popup draws on the
 * overlay pair with no Backdrop. Every pair shares one canvas, so a do and its
 * don't compare at one scale.
 */

const W = 168;
const H = 104;
const X = 12;

/** A trigger's top edge, and the 4 gap under it (2 units) that every Popup hangs at. */
const BAR_Y = 12;
const BUTTON_H = 8;
const POPUP_Y = BAR_Y + BUTTON_H + 2;

const Canvas = ({ title, children }) => (
  <Illustration width={W} height={H} title={title}>
    <Rect x={0} y={0} w={W} h={H} fill={PAINT.pageSurface} />
    {children}
  </Illustration>
);

/** The page behind a layer, blocked out so the layer is what reads. */
const Behind = () => (
  <g>
    {[0, 1, 2].map((i) => <SkeletonBar key={i} x={X} y={64 + i * 10} w={W - 2 * X - i * 24} />)}
  </g>
);

/** Do: fields the person must finish go in a Modal, over its Backdrop. */
export const FieldsInModal = ({ title = 'A Modal over its Backdrop holding two fields and a Primary button' }) => (
  <Illustration width={W} height={H} title={title}>
    <Rect x={0} y={0} w={W} h={H} fill={PAINT.pageSurface} />
    <Backdrop x={0} y={0} w={W} h={H} />
    <Modal x={36} y={10} w={96} h={84} accent />
    <Field x={46} y={28} w={76} />
    <Field x={46} y={50} w={76} />
    <ButtonShape x={46} y={78} w={76} appearance="primary" />
  </Illustration>
);

/** Don't: a form in a Popup, which an outside click closes and loses. */
export const FormInPopup = ({ title = 'A Popup under a trigger holding a field and a Primary button' }) => (
  <Canvas title={title}>
    <ButtonShape x={X} y={BAR_Y} w={40} />
    <Popup x={X} y={POPUP_Y} w={84} h={68} accent />
    <Field x={X + 8} y={POPUP_Y + 6} w={68} />
    <ButtonShape x={X + 8} y={POPUP_Y + 50} w={68} appearance="primary" />
  </Canvas>
);

/** Do: a trigger at the end of the bar gets a layer aligned to its end edge, growing into the page. */
export const EndAligned = ({ title = 'A trigger at the end of the bar with its Popup aligned to the trigger’s end edge, inside the page' }) => (
  <Canvas title={title}>
    <ButtonShape x={W - X - 24} y={BAR_Y} w={24} />
    <Popup x={W - X - 64} y={POPUP_Y} w={64} h={44} accent />
    <Behind />
  </Canvas>
);

/** Don't: the same trigger with a start-aligned layer, which runs off the edge of the page. */
export const StartAlignedAtEnd = ({ title = 'A trigger at the end of the bar with its Popup aligned to the start edge, running past the page’s edge' }) => (
  <Canvas title={title}>
    <ButtonShape x={W - X - 24} y={BAR_Y} w={24} />
    <Popup x={W - X - 24} y={POPUP_Y} w={64} h={44} accent />
    <Behind />
  </Canvas>
);

/** Do: content at the 4-col cap. */
export const AtCap = ({ title = 'A content Popup at the 4-column cap under its trigger' }) => (
  <Canvas title={title}>
    <ButtonShape x={X} y={BAR_Y} w={32} />
    <Popup x={X} y={POPUP_Y} w={72} h={44} accent />
    <Behind />
  </Canvas>
);

/** Don't: a Popup wider than 4-col; anything this wide is a Panel or a Modal. */
export const WiderThanCap = ({ title = 'A Popup wider than the 4-column cap, spanning most of the page' }) => (
  <Canvas title={title}>
    <ButtonShape x={X} y={BAR_Y} w={32} />
    <Popup x={X} y={POPUP_Y} w={W - 2 * X} h={44} accent />
    <Behind />
  </Canvas>
);

/** Do: the menu is at least as wide as its trigger, so the edges line up. */
export const AsWideAsTrigger = ({ title = 'A wide trigger with a Popup at least as wide, their edges lined up' }) => (
  <Canvas title={title}>
    <ButtonShape x={X} y={BAR_Y} w={64} />
    <Popup x={X} y={POPUP_Y} w={64} h={44} accent />
    <Behind />
  </Canvas>
);

/** Don't: a menu narrower than the trigger it hangs off. */
export const NarrowerThanTrigger = ({ title = 'A wide trigger with a Popup narrower than it, their edges no longer lined up' }) => (
  <Canvas title={title}>
    <ButtonShape x={X} y={BAR_Y} w={64} />
    <Popup x={X} y={POPUP_Y} w={40} h={44} accent />
    <Behind />
  </Canvas>
);

/** Do: one flat menu. */
export const OneFlatMenu = ({ title = 'One flat Popup under its trigger' }) => (
  <Canvas title={title}>
    <ButtonShape x={X} y={BAR_Y} w={40} />
    <Popup x={X} y={POPUP_Y} w={56} h={44} accent />
    <Behind />
  </Canvas>
);

/** Don't: a menu that opens a second Popup beside it, two layers off one trigger. */
export const PopupBesidePopup = ({ title = 'A Popup that opens a second Popup beside it, two layers off one trigger' }) => (
  <Canvas title={title}>
    <ButtonShape x={X} y={BAR_Y} w={40} />
    <Popup x={X} y={POPUP_Y} w={56} h={44} />
    <Popup x={X + 52} y={POPUP_Y + 8} w={56} h={44} accent />
    <Behind />
  </Canvas>
);
