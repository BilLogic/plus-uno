import React from 'react';
import { PAINT } from './paint.js';
import { CardBox, Flag, Frame, PageHeader, Popup, ProgressTracker, Rect, Row, Section } from './primitives.jsx';
import { Pointer, SequenceStrip } from './primitives-motion.jsx';
import { ReflowScreen } from './compositions.jsx';
import { measure, springFor } from './motion.jsx';

/**
 * The Choreography page's figures (Foundations/Motion/Choreography). Each is a
 * principle, so it animates blocked-out kit shapes with no words. Every pair is
 * the same scene with one rule broken, so the difference is the lesson, and
 * every scene lands at `landing`; the stories assert it.
 */

const VIEW = '0 0 160 100';
const lerp = (a, b, t) => a + (b - a) * t;

const Moved = ({ x = 0, y = 0, opacity = 1, children }) => (
  <g transform={`translate(${x} ${y})`} opacity={opacity}>
    {children}
  </g>
);

// ---------- The timing rules ----------

/** Stagger: 20 ms apart, or 500 ms ÷ items if that is shorter, so a whole set is in within half a second. */
export const STAGGER = { gap: 20, cap: 500 };
/** The gap between rows for a list of `n` items. */
export const ruleGap = (n) => Math.min(STAGGER.gap, STAGGER.cap / n);
/** Each item's start, in ms after the first. */
export const staggerDelays = (n, gap = ruleGap(n)) => Array.from({ length: n }, (_, i) => i * gap);

/** Clean fades: the new content starts when the old is about 90% out, read from `appearance.fast`. */
const FADE = measure(springFor('appearance.fast'));
export const CLEAN_FADE_GAP_MS = Math.round(FADE.t90 * 1000);
const FADE_MS = Math.round(FADE.settle * 1000);

// ---------- Direction: unify, and step indicators stay put ----------

const CARD_BASE = [16, 62, 108];
const unifyScene = ({ id, title, caption, scatter }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: { p: 0, step: 0 },
  landing: { p: 1, step: 1 },
  arrows: CARD_BASE.map((x, i) => (scatter && i === 1 ? [[x + 20, 73], [x + 20, 43]] : [[x + 60, 43], [x + 20, 43]])),
  draw: ({ p, step }) => (
    <>
      <Frame x={8} y={6} w={144} h={88} />
      {CARD_BASE.map((x, i) => {
        const fromBelow = scatter && i === 1;
        return (
          <Moved key={i} x={fromBelow ? 0 : (1 - p) * 40} y={fromBelow ? (1 - p) * 30 : 0} opacity={p}>
            <CardBox x={x} y={26} w={36} h={34} accent={i === 1} />
          </Moved>
        );
      })}
      <ProgressTracker x={16} y={74} w={128} count={4} current={step >= 1 ? 2 : 1} />
    </>
  ),
  play: async (ctx) => {
    await ctx.spring('p', 1, 'spatial.default');
    await ctx.hold(1);
    // A step indicator changes state where it is: it never travels.
    ctx.set({ step: 1 });
  },
});
const unify = unifyScene({
  id: 'direction-unify',
  title: 'Every part moves along one axis',
  caption: 'Three cards arrive along x. The step indicator changes state in place: it does not travel.',
});
const scatter = unifyScene({
  id: 'direction-scatter',
  title: 'One part comes from another axis',
  caption: 'The middle card rises from below while its neighbors slide across: three motions, no shared direction.',
  scatter: true,
});

// ---------- Move along the grid ----------

const gridScene = ({ id, title, caption, diagonal }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: { x: 0, y: 0 },
  landing: { x: 96, y: 40 },
  arrows: [diagonal ? [[28, 32], [124, 72]] : [[28, 32], [124, 32], [124, 72]]],
  draw: ({ x, y }) => (
    <>
      <Frame x={8} y={6} w={144} h={88} />
      {[0, 1, 2].map((i) => (
        <Row key={i} x={16} y={44 + i * 14} w={128} />
      ))}
      <CardBox x={16 + x} y={24 + y} w={24} h={16} accent />
    </>
  ),
  play: async (ctx) => {
    if (diagonal) {
      await Promise.all([ctx.spring('x', 96, 'spatial.default'), ctx.spring('y', 40, 'spatial.default')]);
    } else {
      await ctx.spring('x', 96, 'spatial.default');
      await ctx.spring('y', 40, 'spatial.default');
    }
  },
});
const gridDo = gridScene({
  id: 'grid-along',
  title: 'Across, then down',
  caption: 'Along the grid and round the corner. A size change is the same: width, then height.',
});
const gridDont = gridScene({
  id: 'grid-diagonal',
  title: 'Straight across the corner',
  caption: 'The same start and landing, on a diagonal the grid never draws.',
  diagonal: true,
});

// ---------- Back the way it came ----------

const TRIGGER = { x: 130, y: 26, w: 8, h: 8 };
const POPUP = { x: 92, y: 36, w: 48, h: 36 };
const retraceScene = ({ id, title, caption, away }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: { g: 0, out: 0 },
  landing: away ? { g: 1, out: 1 } : { g: 0, out: 0 },
  arrows: away ? [[[134, 30], [116, 54]], [[116, 54], [66, 84]]] : [[[134, 30], [116, 54]]],
  draw: ({ g, out }) => (
    <>
      <Frame x={8} y={6} w={144} h={88} />
      <PageHeader x={16} y={24} w={128} />
      {[0, 1, 2].map((i) => (
        <Row key={i} x={16} y={44 + i * 14} w={128} />
      ))}
      {g > 0.02 && (
        <Moved x={-out * 50} y={out * 30} opacity={1 - out}>
          <Popup
            x={lerp(TRIGGER.x, POPUP.x, g)}
            y={lerp(TRIGGER.y, POPUP.y, g)}
            w={lerp(TRIGGER.w, POPUP.w, g)}
            h={lerp(TRIGGER.h, POPUP.h, g)}
            accent
          />
        </Moved>
      )}
    </>
  ),
  play: async (ctx) => {
    await ctx.tap(134, 30);
    await ctx.spring('g', 1, 'spatial.default');
    await ctx.hold(2);
    if (away) {
      await ctx.spring('out', 1, 'spatial.fast');
    } else {
      // Closing retraces the opening in reverse, one speed faster.
      await ctx.spring('g', 0, 'spatial.fast');
    }
  },
});
const retraceDo = retraceScene({
  id: 'retrace-back',
  title: 'Closes back into its trigger',
  caption: 'One line, there and back: the Popup shrinks into the button it grew from, one speed faster.',
});
const retraceDont = retraceScene({
  id: 'retrace-away',
  title: 'Leaves by another route',
  caption: 'It grew from the button and slides off elsewhere: two lines, and no sign of where it went.',
  away: true,
});

// ---------- Keep space ----------

const spaceScene = ({ id, title, caption, collide }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: { f: 1, m: 0, clash: 0 },
  landing: { f: 0, m: 1, clash: collide ? 1 : 0 },
  arrows: [[[80, 65], [80, 51]], [[80, 79], [80, 65]]],
  draw: ({ f, m }) => (
    <>
      <Frame x={8} y={6} w={144} h={88} />
      <Row x={16} y={30} w={128} />
      <g opacity={f}>
        <Row x={16} y={44} w={128} accent />
      </g>
      <Moved y={-14 * m}>
        <Row x={16} y={58} w={128} />
        <Row x={16} y={72} w={128} />
      </Moved>
    </>
  ),
  play: async (ctx) => {
    if (collide) {
      ctx.set({ clash: ctx.state.f > 0.05 ? 1 : 0 });
      await Promise.all([ctx.spring('f', 0, 'appearance.fast'), ctx.spring('m', 1, 'spatial.default')]);
    } else {
      // What leaves fades out first; only then does anything move into its place.
      await ctx.spring('f', 0, 'appearance.fast');
      ctx.set({ clash: ctx.state.f > 0.05 ? 1 : 0 });
      await ctx.spring('m', 1, 'spatial.default');
    }
  },
});
const spaceClear = spaceScene({
  id: 'space-clear',
  title: 'Gone first, then the rows close up',
  caption: 'The row fades out; only when it has gone do the rows below move into its place.',
});
const spaceCollide = spaceScene({
  id: 'space-collide',
  title: 'Rows move while it is still there',
  caption: 'The rows below start moving as the row fades, so for a moment two share one place.',
  collide: true,
});

// ---------- Clean fades ----------

const fadeScene = ({ id, title, caption, cross }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: { a: 1, b: 0, gap: 0 },
  landing: { a: 0, b: 1, gap: cross ? 0 : CLEAN_FADE_GAP_MS },
  arrows: [],
  draw: ({ a, b }) => (
    <>
      <Frame x={8} y={6} w={144} h={88} />
      <PageHeader x={16} y={24} w={128} />
      <g opacity={a}>
        <Section x={16} y={44} w={128} h={42} rows={2} />
      </g>
      <g opacity={b}>
        {[0, 1, 2].map((i) => (
          <Row key={i} x={16} y={44 + i * 14} w={128} />
        ))}
      </g>
    </>
  ),
  play: async (ctx) => {
    const fadeOut = ctx.spring('a', 0, 'appearance.fast');
    if (cross) {
      await Promise.all([fadeOut, ctx.spring('b', 1, 'appearance.fast')]);
    } else {
      // The new content begins when the old is about 90% out.
      await ctx.after(CLEAN_FADE_GAP_MS);
      ctx.set({ gap: CLEAN_FADE_GAP_MS });
      await Promise.all([fadeOut, ctx.spring('b', 1, 'appearance.fast')]);
    }
  },
});
const fadeClean = fadeScene({
  id: 'fade-clean',
  title: 'The old is out before the new starts',
  caption: 'The new content begins when the old is about 90% out, so the two never overprint.',
});
const fadeCross = fadeScene({
  id: 'fade-cross',
  title: 'Old and new at once',
  caption: 'A crossfade of text-like content: for a moment both are half there, one over the other.',
  cross: true,
});

// ---------- Stagger ----------

const STRIP = { x: 16, y: 66, w: 128, h: 22 };
const staggerScene = ({ id, title, caption, gap }) => {
  const n = 5;
  const delays = staggerDelays(n, gap);
  const total = Math.max(STAGGER.cap, Math.ceil((delays[n - 1] + FADE_MS) / 100) * 100);
  const lanes = delays.map((d) => ({ start: d / total, end: (d + FADE_MS) / total }));
  const rows = Array.from({ length: n }, (_, i) => `r${i}`);
  return {
    id,
    title,
    caption,
    viewBox: VIEW,
    initial: { ...Object.fromEntries(rows.map((k) => [k, 0])), t: 0, lag: 0 },
    landing: { ...Object.fromEntries(rows.map((k) => [k, 1])), lag: delays[n - 1] - delays[0] },
    arrows: [],
    draw: (state) => (
      <>
        {rows.map((k, i) => (
          <g key={k} opacity={state[k]}>
            <Rect x={16} y={8 + i * 11} w={128} h={8} fill={PAINT.shape} corner="shape" />
          </g>
        ))}
        <SequenceStrip x={STRIP.x} y={STRIP.y} w={STRIP.w} h={STRIP.h} lanes={lanes} now={state.t / total} accent />
      </>
    ),
    play: async (ctx) => {
      ctx.set({ lag: delays[n - 1] - delays[0] });
      await Promise.all([
        ctx.clock('t', total),
        ...rows.map(async (k, i) => {
          await ctx.after(delays[i]);
          await ctx.spring(k, 1, 'appearance.fast');
        }),
      ]);
    },
  };
};
const staggerTight = staggerScene({
  id: 'stagger-tight',
  title: 'Five rows, 20 ms apart',
  caption: 'Each row starts a little after the one above. The fifth lands 80 ms after the first, so the set reads as one arrival.',
});
const staggerFlat = staggerScene({
  id: 'stagger-flat',
  title: 'All at once',
  caption: 'Everything lands in the same frame: nothing leads the eye through the list.',
  gap: 0,
});
const staggerLoose = staggerScene({
  id: 'stagger-loose',
  title: '150 ms apart',
  caption: 'Each row is its own event and the set takes most of a second: a stagger is a texture, not a sequence.',
  gap: 150,
});

// ---------- Who started it ----------

const causeScene = ({ id, title, caption, pushes }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: { sel: 0, flag: 0, shift: 0 },
  landing: { sel: 1, flag: pushes ? 0 : 1, shift: pushes ? 1 : 0 },
  arrows: pushes ? [[[84, 44], [84, 58]]] : [[[150, 20], [128, 20]]],
  draw: ({ sel, flag, shift }) => (
    <>
      <Frame x={8} y={6} w={144} h={88} />
      <Moved y={14 * shift}>
        {[0, 1, 2].map((i) => (
          <Row key={i} x={16} y={30 + i * 14} w={128} accent={i === 1 && sel > 0.5} />
        ))}
      </Moved>
      {pushes && (
        <g opacity={shift}>
          <Row x={16} y={30} w={128} />
        </g>
      )}
      {!pushes && flag > 0.02 && (
        <Moved x={(1 - flag) * 24} opacity={flag}>
          <Flag x={92} y={10} w={56} h={20} />
        </Moved>
      )}
      <Pointer x={60} y={52} />
    </>
  ),
  play: async (ctx) => {
    // Input is answered at once.
    await ctx.tap(60, 52);
    await ctx.spring('sel', 1, 'appearance.fast');
    await ctx.hold(1);
    // A system change arrives where the system speaks, and never moves what a person is touching.
    if (pushes) await ctx.spring('shift', 1, 'spatial.default');
    else await ctx.spring('flag', 1, 'spatial.default');
  },
});
const causeQuiet = causeScene({
  id: 'cause-quiet',
  title: 'A system change, away from the hand',
  caption: 'The tap is answered at once. The system’s own change arrives in the corner and the row stays where it is.',
});
const causePushes = causeScene({
  id: 'cause-pushes',
  title: 'A system change, under the hand',
  caption: 'A row arrives at the top and shoves the rows down, so the one being touched is no longer there.',
  pushes: true,
});

// ---------- Breakpoints ----------

export const BREAKPOINTS = [1280, 960, 768];
/** The kit's state for a width: the nearest breakpoint at or below it, never in between. */
export const snapWidth = (w) => (w >= 1120 ? 1280 : w >= 864 ? 960 : 768);

const bpScene = ({ id, title, caption, lags }) => ({
  id,
  title,
  caption,
  viewBox: '0 0 176 112',
  initial: { w: 1280, shown: 1280, blend: 1, stepsSeen: [1280], waited: 0 },
  landing: { w: 768, shown: 768, blend: 1 },
  arrows: [[[168, 56], [104, 56]]],
  draw: ({ w, shown, blend }) => (
    <>
      <g opacity={blend}>
        <ReflowScreen width={shown} neutral />
      </g>
      <Pointer x={8 + w / 8} y={52} />
    </>
  ),
  play: async (ctx) => {
    let seen = [1280];
    await ctx.linear('w', 768, 2, {
      derive: lags
        ? undefined
        : (w) => {
            const shown = snapWidth(w);
            if (seen[seen.length - 1] !== shown) seen = [...seen, shown];
            return { shown, stepsSeen: seen };
          },
    });
    if (lags) {
      // The hand has stopped, and only now does the layout follow, fading to its new state.
      ctx.set({ waited: 1 });
      await ctx.spring('blend', 0, 'appearance.fast');
      ctx.set({ shown: 768 });
      await ctx.spring('blend', 1, 'appearance.fast');
    }
  },
});
const bpFollows = bpScene({
  id: 'bp-follows',
  title: 'The layout follows the hand',
  caption: 'Each breakpoint is a one-jump change, the instant the edge crosses it: the hand is the only clock.',
});
const bpLags = bpScene({
  id: 'bp-lags',
  title: 'The layout plays on its own',
  caption: 'The edge stops, then the layout fades to its new state: the person waits on motion they did not ask for.',
  lags: true,
});

// ---------- The demos, in page order ----------

export const CHOREOGRAPHY_DEMOS = {
  direction: { title: 'Unify direction', scenes: [unify, scatter] },
  grid: { title: 'Move along the grid', scenes: [gridDo, gridDont] },
  retrace: { title: 'Back the way it came', scenes: [retraceDo, retraceDont] },
  space: { title: 'Keep space', scenes: [spaceClear, spaceCollide] },
  fades: { title: 'Clean fades', scenes: [fadeClean, fadeCross] },
  stagger: { title: 'Sequence and stagger', scenes: [staggerTight, staggerFlat, staggerLoose] },
  cause: { title: 'Who started it', scenes: [causeQuiet, causePushes] },
  breakpoints: { title: 'Breakpoints', scenes: [bpFollows, bpLags] },
};
