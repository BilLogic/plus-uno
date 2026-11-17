import React from 'react';
import { PAINT } from './paint.js';
import { Illustration } from './Illustration.jsx';
import { Blanket, Field, Panel, Rect, Row } from './primitives.jsx';

/**
 * The Form template's do and don't drawings. Each lesson is about where the
 * form's pieces sit in a host, so every drawing is blocked out: no words,
 * buttons as flat strips, one accent on the subject. Every pair shares one
 * canvas, so a do and its don't compare at one scale.
 */

const W = 168;
const H = 104;

const Canvas = ({ title, children }) => (
  <Illustration width={W} height={H} title={title}>
    <Rect x={0} y={0} w={W} h={H} fill={PAINT.frameSunken} />
    {children}
  </Illustration>
);

/** Do: a short edit in a Panel, the page still in view beside it. */
export const EditInPanel = ({ title = 'A short edit in a Panel at the end, with the page and its rows still in view beside it' }) => (
  <Canvas title={title}>
    <Rect x={0} y={0} w={W - 64} h={H} fill={PAINT.pageSurface} />
    {[0, 1, 2, 3].map((i) => <Row key={i} x={10} y={14 + i * 18} w={W - 84} />)}
    <Panel x={W - 64} y={0} w={64} h={H} accent />
  </Canvas>
);

/** Don't: the same short edit in a Modal that covers the page. */
export const EditInModal = ({ title = 'A short edit in a Modal over a Blanket, with the page and its rows covered' }) => (
  <Canvas title={title}>
    <Rect x={0} y={0} w={W} h={H} fill={PAINT.pageSurface} />
    {[0, 1, 2, 3].map((i) => <Row key={i} x={10} y={14 + i * 18} w={W - 20} />)}
    <Blanket x={0} y={0} w={W} h={H} />
    <Rect x={44} y={14} w={80} h={76} fill={PAINT.modalSurface} stroke={PAINT.accent} corner="modal" />
    <Field x={52} y={24} w={64} />
    <Field x={52} y={52} w={64} />
  </Canvas>
);
