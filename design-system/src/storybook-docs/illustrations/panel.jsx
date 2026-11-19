import React from 'react';
import { PAINT } from './paint.js';
import { Illustration } from './Illustration.jsx';
import { Panel, Rect, Row, Section } from './primitives.jsx';

/**
 * The Panel template's do and don't drawings. Each lesson is about how a Panel
 * sits against the page, so every drawing is blocked out: no words, buttons as
 * flat strips, one accent on the subject. Every pair shares one canvas, so a do
 * and its don't compare at one scale.
 */

const W = 168;
const H = 104;
const X = 8;

const Canvas = ({ title, children }) => (
  <Illustration width={W} height={H} title={title}>
    <Rect x={0} y={0} w={W} h={H} fill={PAINT.pageSurface} />
    {children}
  </Illustration>
);

/** The page under a Panel: a Section with rows. */
const PageBehind = ({ w = W - 2 * X }) => (
  <g>
    <Section x={X} y={10} w={w} h={60} rows={3} />
    <Row x={X} y={74} w={w} />
    <Row x={X} y={88} w={w} />
  </g>
);

/** Do: the floating Panel sits beside the docked AI panel, which stays uncovered. */
export const BesideAiPanel = ({ title = 'A floating Panel left of a docked AI panel, which stays fully visible' }) => (
  <Canvas title={title}>
    <PageBehind w={80} />
    <Panel x={56} y={0} w={56} h={H} floating accent />
    <Panel x={112} y={0} w={56} h={H} />
  </Canvas>
);

/** Don't: the floating Panel covering the docked AI panel. */
export const CoversAiPanel = ({ title = 'A floating Panel drawn over the docked AI panel, hiding part of it' }) => (
  <Canvas title={title}>
    <PageBehind w={80} />
    <Panel x={112} y={0} w={56} h={H} />
    <Panel x={80} y={0} w={72} h={H} floating accent />
  </Canvas>
);
