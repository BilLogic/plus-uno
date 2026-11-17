import React from 'react';
import { PAINT } from './paint.js';
import { Illustration } from './Illustration.jsx';
import { Blanket, Modal, Rect, SkeletonBar } from './primitives.jsx';

/**
 * The Modal template's do and don't drawings. Each lesson is about the Modal's
 * size or stacking, so every drawing is blocked out: no words, buttons as flat
 * strips, one accent on the subject. Every pair shares one canvas, so a do and
 * its don't compare at one scale.
 */

const W = 168;
const H = 104;

const Canvas = ({ title, children }) => (
  <Illustration width={W} height={H} title={title}>
    <Rect x={0} y={0} w={W} h={H} fill={PAINT.pageSurface} />
    <Blanket x={0} y={0} w={W} h={H} />
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

/** Don't: a Modal opened on another Modal, a second Blanket over the first. */
export const ModalOnModal = ({ title = 'A Modal opened on another Modal, a second Blanket dimming the first' }) => (
  <Canvas title={title}>
    <Modal x={22} y={10} w={104} h={72} />
    <Blanket x={0} y={0} w={W} h={H} />
    <Modal x={52} y={30} w={96} h={66} accent />
  </Canvas>
);
