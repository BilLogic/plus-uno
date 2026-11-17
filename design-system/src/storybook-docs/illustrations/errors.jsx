import React from 'react';
import { PAINT } from './paint.js';
import { Illustration } from './Illustration.jsx';
import { Blanket, ButtonShape, Modal, Rect, Section, SkeletonBar } from './primitives.jsx';

/**
 * The Errors pattern's abstract page-vs-modal diagram.
 */

const W = 168;
const H = 104;

const Canvas = ({ title, children }) => (
  <Illustration width={W} height={H} title={title}>
    <Rect x={0} y={0} w={W} h={H} fill={PAINT.pageSurface} />
    {children}
  </Illustration>
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
    <Blanket x={0} y={0} w={W} h={H} />
    <Modal x={44} y={26} w={80} h={52} accent />
  </Canvas>
);
