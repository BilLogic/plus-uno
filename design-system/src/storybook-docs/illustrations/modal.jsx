import React from 'react';
import { PAINT } from './paint.js';
import { Illustration } from './Illustration.jsx';
import { Backdrop, ButtonShape, Modal, ProgressTracker, Rect, Rule, SkeletonBar, Tabs } from './primitives.jsx';

/**
 * The Modal template's do and don't drawings. Each lesson is about the Modal's
 * size, stacking, footer or sequence, so every drawing is blocked out: no
 * words, buttons as flat strips, one accent on the subject. Every pair shares
 * one canvas, so a do and its don't compare at one scale.
 */

const W = 168;
const H = 104;

const Canvas = ({ title, children }) => (
  <Illustration width={W} height={H} title={title}>
    <Rect x={0} y={0} w={W} h={H} fill={PAINT.pageSurface} />
    <Backdrop x={0} y={0} w={W} h={H} />
    {children}
  </Illustration>
);

/** Do: a confirm at the narrow step, sized to its one line. */
export const ConfirmNarrow = ({ title = 'A confirm in a narrow Modal, sized to its title, one line and two buttons' }) => (
  <Canvas title={title}>
    <Modal x={52} y={26} w={64} h={52} accent />
  </Canvas>
);

/** Don't: the same confirm in a wide Modal, empty width around one line. */
export const ConfirmWide = ({ title = 'The same confirm in a wide Modal, with empty width around one line' }) => (
  <Canvas title={title}>
    <Modal x={20} y={26} w={128} h={52} accent />
  </Canvas>
);

/** Do: one Modal that confirms inside itself, a message row above its two buttons. */
export const ConfirmsInside = ({ title = 'One Modal that confirms inside itself: a message row in its body and its own two buttons' }) => (
  <Canvas title={title}>
    <Modal x={36} y={14} w={96} h={76} accent />
    <Rect x={46} y={52} w={76} h={14} fill={PAINT.fieldSurface} stroke={PAINT.fieldBorder} corner="field" />
    <SkeletonBar x={52} y={57} w={50} />
  </Canvas>
);

/** Don't: a Modal opened on another Modal, a second Backdrop over the first. */
export const ModalOnModal = ({ title = 'A Modal opened on another Modal, a second Backdrop dimming the first' }) => (
  <Canvas title={title}>
    <Modal x={22} y={10} w={104} h={72} />
    <Backdrop x={0} y={0} w={W} h={H} />
    <Modal x={52} y={30} w={96} h={66} accent />
  </Canvas>
);

/** Do: the body scrolls past the cap and the footer stays pinned with its buttons. */
export const FooterPinned = ({ title = 'A tall Modal whose body runs past the cap while its footer stays pinned at the bottom with its buttons' }) => (
  <Canvas title={title}>
    <Modal x={34} y={4} w={100} h={96} />
    {[0, 1, 2, 3, 4].map((i) => <SkeletonBar key={i} x={44} y={38 + i * 9} w={70 - (i % 2) * 14} />)}
    <Rect x={34} y={78} w={100} h={22} fill="none" stroke={PAINT.accent} corner="modal" />
  </Canvas>
);

/** Don't: the button inside the scrolling body, so it scrolls out of reach. */
export const ButtonInBody = ({ title = 'A tall Modal with its button inside the scrolling body and no pinned footer' }) => (
  <Canvas title={title}>
    <Rect x={34} y={4} w={100} h={96} fill={PAINT.modalSurface} corner="modal" />
    <SkeletonBar x={44} y={14} w={40} h={5} heading />
    {[0, 1, 2, 3, 4, 5].map((i) => <SkeletonBar key={i} x={44} y={30 + i * 9} w={70 - (i % 2) * 14} />)}
    <ButtonShape x={44} y={86} w={30} appearance="primary" />
    <Rect x={42} y={84} w={34} h={12} fill="none" stroke={PAINT.accent} corner="button" />
  </Canvas>
);

/** Do: steps in order, Cancel at the start and Back and Next on the right half. */
export const StepsForSequence = ({ title = 'A wide Modal with a step tracker and a footer: Cancel at the start, Back and Next on the right half' }) => (
  <Canvas title={title}>
    <Rect x={20} y={14} w={128} h={76} fill={PAINT.modalSurface} corner="modal" />
    <ProgressTracker x={30} y={24} w={108} count={3} current={1} accent />
    <SkeletonBar x={30} y={50} w={80} />
    <SkeletonBar x={30} y={59} w={60} />
    <Rule x1={20} x2={148} y1={76} y2={76} stroke={PAINT.modalDivider} />
    <ButtonShape x={20} y={82} w={64} />
    <ButtonShape x={84} y={82} w={32} />
    <ButtonShape x={116} y={82} w={32} appearance="primary" />
  </Canvas>
);

/** Don't: numbered tabs standing in for steps, with one Save and nothing to go back to. */
export const TabsForSteps = ({ title = 'A wide Modal whose steps are numbered tabs with a single Save button' }) => (
  <Canvas title={title}>
    <Rect x={20} y={14} w={128} h={76} fill={PAINT.modalSurface} corner="modal" />
    <Tabs x={30} y={24} w={108} count={3} selected={1} accent />
    <SkeletonBar x={30} y={50} w={80} />
    <SkeletonBar x={30} y={59} w={60} />
    <Rule x1={20} x2={148} y1={76} y2={76} stroke={PAINT.modalDivider} />
    <ButtonShape x={84} y={82} w={64} appearance="primary" />
  </Canvas>
);
