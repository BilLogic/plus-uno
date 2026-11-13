import React from 'react';
import { PAINT } from './paint.js';
import { Illustration } from './Illustration.jsx';
import { Field, Popup, Rect, Sidebar, SkeletonBar } from './primitives.jsx';

/**
 * The Disabled pattern's do and don't drawings, and the locked Toolkit. Each
 * lesson is about where a reason goes, or what is shown at all, so every
 * drawing is blocked out: no words. The one accent is a ring around the
 * subject, the reason or the thing wrongly shown. Every pair shares one
 * canvas, so a do and its don't compare at one scale. A disabled part is drawn
 * faded, the way the real components fade it.
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

/** A disabled field: the whole field faded, label included. */
const FadedField = () => (
  <g opacity={FADED}>
    <Field x={FIELD_X} y={FIELD_Y} w={FIELD_W} />
  </g>
);

/** Do: the reason is the caption under the field, at full contrast. */
export const ReasonInCaption = ({ title = 'A faded field with its reason as a caption under it, at full contrast' }) => (
  <Canvas title={title}>
    <FadedField />
    <SkeletonBar x={FIELD_X} y={FIELD_Y + 34} w={72} />
    <Rect x={FIELD_X - RING} y={FIELD_Y + 31} w={76} h={10} fill="none" stroke={PAINT.accent} corner="button" />
  </Canvas>
);

/** Don't: the reason in a tooltip over a faded field, a layer that never opens on touch. */
export const ReasonInTooltip = ({ title = 'A faded field with no caption and a tooltip layer floating over it' }) => (
  <Canvas title={title}>
    <FadedField />
    <Popup x={FIELD_X + 70} y={FIELD_Y + 32} w={56} h={34} accent />
  </Canvas>
);

const MENU = { x: 52, y: 12, w: 64, h: 52 };

/** Do: a menu for a role holds only what that role can use. */
export const LeftOutOfMenu = ({ title = 'A menu holding only the actions this role can take' }) => (
  <Canvas title={title}>
    <Popup x={MENU.x} y={MENU.y} w={MENU.w} h={MENU.h - 10} accent />
  </Canvas>
);

/** Don't: an action the role can never take, dimmed in the menu. */
export const DimmedInMenu = ({ title = 'A menu whose last action is faded, one this role can never take' }) => (
  <Canvas title={title}>
    <Popup x={MENU.x} y={MENU.y} w={MENU.w} h={MENU.h} />
    <Rect x={MENU.x + 4} y={MENU.y + 34} w={MENU.w - 8} h={10} fill={PAINT.popupSurface} opacity={1 - FADED} />
    <Rect x={MENU.x + 4} y={MENU.y + 32} w={MENU.w - 8} h={14} fill="none" stroke={PAINT.accent} corner="button" />
  </Canvas>
);

const BAR = { x: 24, y: 8, w: 60, h: H - 16 };

/** The Toolkit during onboarding: its rows faded and visible, the one line that says what unlocks it under them. */
export const LockedToolkit = ({ title = 'A Sidebar whose Toolkit rows are faded but shown, with one line under them that says what unlocks them' }) => (
  <Canvas title={title}>
    <Sidebar x={BAR.x} y={BAR.y} w={BAR.w} h={BAR.h} />
    <Rect x={BAR.x + 4} y={BAR.y + 42} w={BAR.w - 8} h={26} fill={PAINT.frameSunken} opacity={1 - FADED} />
    <SkeletonBar x={BAR.x + 8} y={BAR.y + 72} w={BAR.w - 22} />
    <Rect x={BAR.x + 4} y={BAR.y + 68} w={BAR.w - 10} h={12} fill="none" stroke={PAINT.accent} corner="button" />
  </Canvas>
);
