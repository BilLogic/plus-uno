import React from 'react';
import { PAINT } from './paint.js';
import { Frame, Panel, Rect, Row, Screen } from './primitives.jsx';
import { Pointer } from './primitives-motion.jsx';
import { pair } from './motion.jsx';
import { Clip, VIEW, mix } from './motion-parts.jsx';
import { drillScene } from './motion-transitions.jsx';

/**
 * The Principles page's Do/Don't pairs (Foundations/Motion/Principles). Each pair
 * is one scene with one rule broken, so the difference is the lesson, and the
 * arrows before the move are the same in both tiles. Blocked out in kit shapes,
 * no words.
 */

// ---------- Show what changed: a row grows into its record, or the record just replaces the list ----------

const showWhatChanged = {
  title: 'Show what changed',
  scenes: pair(
    drillScene({ id: 'show-do', title: 'The row grows into the record', caption: 'You can point to where the record came from, and back.' }),
    drillScene({ id: 'show-dont', title: 'The record replaces the list', mode: 'cut', caption: 'A cut: nothing says where the record came from.' }),
  ),
};

// ---------- Always responsive: a Toggle ----------

const TRACK = { x: 64, y: 44, w: 32, h: 16 };
const THUMB_TRAVEL = 16;

const toggle = ({ id, title, caption, waits }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: { c: 0, t: 0 },
  landing: { c: 1, t: 1 },
  arrows: [[[TRACK.x + 8, 52], [TRACK.x + 8 + THUMB_TRAVEL, 52]]],
  draw: ({ c, t }) => (
    <>
      <Frame x={8} y={6} w={144} h={88} />
      <Rect {...TRACK} fill={PAINT.shape} corner="full" />
      <Rect {...TRACK} fill={PAINT.accent} corner="full" opacity={c} />
      <circle cx={TRACK.x + 8 + t * THUMB_TRAVEL} cy={TRACK.y + 8} r={6} fill={PAINT.pageSurface} />
    </>
  ),
  play: async (ctx) => {
    await ctx.hold(1);
    await ctx.tap(TRACK.x + 16, TRACK.y + 8);
    // The Don't leaves the person waiting for the thumb before anything answers.
    if (waits) await ctx.hold(1);
    // The fill answers in the same frame on appearance.fast; the thumb follows on spatial.fast.
    await Promise.all([ctx.spring('c', 1, 'appearance.fast'), ctx.spring('t', 1, 'spatial.fast')]);
  },
});

const alwaysResponsive = {
  title: 'Always responsive',
  scenes: pair(
    toggle({ id: 'responsive-do', title: 'Color answers in the same frame', caption: 'The fill changes at once; the thumb follows.' }),
    toggle({ id: 'responsive-dont', title: 'Nothing answers until the thumb arrives', waits: true, caption: 'The person pressed and nothing changed for a moment.' }),
  ),
};

// ---------- Move like real things: a floating Panel thrown closed ----------

const EDGE = 70;
const thrown = ({ id, title, caption, keepsSpeed }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: { x: 0, h: 0 },
  landing: { x: EDGE, h: 0 },
  arrows: [[[110, 50], [150, 50]]],
  draw: ({ x, h }) => (
    <>
      <Screen x={8} y={6} w={144} h={88} sidebar="none" header={false}>
        {[0, 1, 2].map((i) => (
          <Row key={i} x={16} y={30 + i * 14} w={128} />
        ))}
      </Screen>
      <Clip x={8} y={18} w={144} h={75}>
        <g transform={`translate(${x} 0)`}>
          <Panel x={96} y={24} w={52} h={64} floating accent />
        </g>
      </Clip>
      {h > 0 && <Pointer x={mix(104, 124, x / 20)} y={50} />}
    </>
  ),
  play: async (ctx) => {
    await ctx.hold(1);
    ctx.set({ h: 1 });
    await ctx.linear('x', 20, 0.3);
    ctx.set({ h: 0 });
    if (keepsSpeed) {
      // The spring starts from the hand's speed, so nothing jumps.
      await ctx.exit('x', EDGE, { velocity: 110 });
    } else {
      // The hand's speed is dropped: it stops, then plays a canned slide from rest.
      await ctx.hold(1);
      await ctx.spring('x', EDGE, 'spatial.default');
    }
  },
});

const moveLikeRealThings = {
  title: 'Move like real things',
  scenes: pair(
    thrown({ id: 'real-do', title: 'It leaves at the speed it was thrown', keepsSpeed: true, caption: 'On release the exit spring starts from the hand\'s speed, so nothing jumps.' }),
    thrown({ id: 'real-dont', title: 'It stops, then plays a canned slide', caption: 'The hand\'s speed is dropped; the Panel pauses and restarts from rest.' }),
  ),
};

// ---------- Quiet by default: a view pill used dozens of times a day ----------

const PILLS = [60, 90, 120];
const pill = ({ id, title, caption, expressive }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: { x: 0 },
  landing: { x: 1 },
  arrows: [[[PILLS[0] + 12, 50], [PILLS[1] + 12, 50]]],
  draw: ({ x }) => (
    <>
      <Frame x={8} y={6} w={144} h={88} />
      {PILLS.map((px) => (
        <Rect key={px} x={px} y={42} w={26} h={16} fill={PAINT.shape} corner="tab" />
      ))}
      <Rect x={mix(PILLS[0], PILLS[1], x)} y={42} w={26} h={16} fill={PAINT.accent} corner="tab" />
    </>
  ),
  play: async (ctx) => {
    await ctx.hold(1);
    await ctx.tap(PILLS[1] + 13, 50);
    // Expressive is for the end of something worth finishing, never a control used all day.
    await ctx.spring('x', 1, 'spatial.fast', expressive ? { mode: 'expressive' } : undefined);
  },
});

const quietByDefault = {
  title: 'Quiet by default',
  scenes: pair(
    pill({ id: 'quiet-do', title: 'Dozens a day: the fill glides', caption: 'A view pill moves on Productive spatial.fast. Nobody notices it twice.' }),
    pill({ id: 'quiet-dont', title: 'Dozens a day: the fill bounces', expressive: true, caption: 'The same pill on Expressive overshoots every time. A control used all day stays Productive.' }),
  ),
};

export const PRINCIPLE_DEMOS = { showWhatChanged, alwaysResponsive, moveLikeRealThings, quietByDefault };
