import React from 'react';
import { PAINT } from './paint.js';
import { Frame, Rect, SkeletonBar } from './primitives.jsx';
import { pair } from './motion.jsx';
import { VIEW } from './motion-parts.jsx';
import { drillScene } from './motion-transitions.jsx';

/**
 * The Principles page's Do/Don't pairs (Foundations/Expression/Motion/Principles), one per principle. Each pair
 * is one scene with one rule broken, so the difference is the lesson, and the
 * arrows before the move are the same in both tiles. Blocked out in kit shapes,
 * no words.
 */

// ---------- Build understanding: a row grows into its record, or the record just replaces the list ----------

const buildUnderstanding = {
  title: 'Build understanding',
  scenes: pair(
    drillScene({ id: 'understand-do', title: 'The row grows into the record', caption: 'You can point to where the record came from, and back.' }),
    drillScene({ id: 'understand-dont', title: 'The record replaces the list', mode: 'cut', caption: 'A cut: nothing says where the record came from.' }),
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
      <Frame x={8} y={6} w={144} h={88} chrome={false} />
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

// ---------- Lead with empathy: a failed save eases in, or shakes ----------

const MESSAGE = { x: 20, y: 60, w: 120, h: 26 };
const save = ({ id, title, caption, shakes }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: { o: 0, y: 1, x: 0 },
  landing: { o: 1, y: 0, x: 0 },
  arrows: [[[80, 50], [80, 58]]],
  draw: ({ o, y, x }) => (
    <>
      <Frame x={8} y={6} w={144} h={88} chrome={false} />
      <SkeletonBar x={16} y={14} w={80} h={5} heading />
      <SkeletonBar x={16} y={26} w={100} />
      <g opacity={o} transform={`translate(${x} ${y * 4})`}>
        <Rect {...MESSAGE} fill={PAINT.dangerSurface} corner="card" />
        <circle cx={MESSAGE.x + 12} cy={MESSAGE.y + 13} r={5} fill={PAINT.flagIconDanger} />
        <SkeletonBar x={MESSAGE.x + 24} y={MESSAGE.y + 11} w={60} />
      </g>
    </>
  ),
  play: async (ctx) => {
    await ctx.hold(1);
    if (shakes) {
      // The Don't treats a failed save like a blocked submit: it jolts a person already worried.
      await Promise.all([ctx.spring('o', 1, 'appearance.fast'), ctx.spring('y', 0, 'spatial.fast')]);
      for (const to of [5, -5, 3, 0]) await ctx.spring('x', to, 'spatial.fast');
      return;
    }
    await Promise.all([ctx.spring('o', 1, 'appearance.default'), ctx.spring('y', 0, 'spatial.default')]);
  },
});

const leadWithEmpathy = {
  title: 'Lead with empathy',
  scenes: pair(
    save({ id: 'empathy-do', title: 'A failed save eases in', caption: 'It fades in from just above its place and stays still until it is fixed.' }),
    save({ id: 'empathy-dont', title: 'A failed save shakes', shakes: true, caption: 'A shake belongs to a blocked submit, once. A save that failed is not a scolding.' }),
  ),
};

// ---------- Cut the noise: a filtered list arrives as one group, or every row scatters ----------

const ROWS = [0, 1, 2, 3];
const list = ({ id, title, caption, scatters }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: { g: 0 },
  landing: { g: 1 },
  arrows: [[[140, 30], [140, 40]]],
  draw: ({ g }) => (
    <>
      <Frame x={8} y={6} w={144} h={88} chrome={false} />
      {ROWS.map((r) => {
        const left = 1 - g;
        // One group moves together; the scatter sends each row its own way.
        const dx = scatters ? (r % 2 ? 1 : -1) * left * (24 + r * 6) : 0;
        const dy = scatters ? 0 : left * 8;
        return (
          <g key={r} opacity={g} transform={`translate(${dx} ${dy})`}>
            <SkeletonBar x={16} y={16 + r * 18} w={110 - r * 12} h={6} />
          </g>
        );
      })}
    </>
  ),
  play: async (ctx) => {
    await ctx.hold(1);
    await ctx.spring('g', 1, 'spatial.default');
  },
});

const cutTheNoise = {
  title: 'Cut the noise',
  scenes: pair(
    list({ id: 'noise-do', title: 'The new list arrives as one group', caption: 'Every row moves together, so there is one story to follow.' }),
    list({ id: 'noise-dont', title: 'Every row goes its own way', scatters: true, caption: 'Four rows, four paths: nothing says which one matters.' }),
  ),
};

export const PRINCIPLE_DEMOS = { alwaysResponsive, buildUnderstanding, leadWithEmpathy, cutTheNoise };
