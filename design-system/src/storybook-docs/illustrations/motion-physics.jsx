import React, { useId } from 'react';
import { C, RefTable } from '@/storybook-docs/foundation-blocks.jsx';
import { SPRINGS } from '@/tokens/ladder/springs.generated.js';
import { PAINT } from './paint.js';
import {
  Backdrop, ButtonShape, CardBox, Flag, Frame, Modal, PageHeader, Panel, Popup, Rect, Row, Rule, Section, SkeletonBar,
} from './primitives.jsx';
import { ChartAxis, ChartCurve, Pointer } from './primitives-motion.jsx';
import { BEAT, LOOP_PERIOD, measure, pair, projectedRest, ratioOf, resisted, springFor, springWithRatio, stepOf } from './motion.jsx';

/**
 * The Physics page's figures (Foundations/Motion/Physics). Each is a principle,
 * so it animates blocked-out kit shapes with no words; the app examples keep
 * the moving element as the one accented subject in a blocked-out screen.
 * Every scene lands at `landing`; the stories assert it.
 */

const VIEW = '0 0 160 100';

/** A group scaled about a point. */
const Scaled = ({ cx, cy, s, children }) => (
  <g transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>{children}</g>
);
const Moved = ({ x = 0, y = 0, opacity = 1, children }) => (
  <g transform={`translate(${x} ${y})`} opacity={opacity}>
    {children}
  </g>
);

/** Shows only what lies inside a rectangle: a layer entering from an edge, or opening from a corner. */
const Clip = ({ x, y, w, h, children }) => {
  const id = useId().replace(/:/g, '');
  return (
    <>
      <clipPath id={id}>
        <rect x={x} y={y} width={Math.max(0, w)} height={Math.max(0, h)} />
      </clipPath>
      <g clipPath={`url(#${id})`}>{children}</g>
    </>
  );
};

/** The blocked-out screen most app examples sit in: a frame, a header and rows. */
const Screen = ({ rows = 3, header = true }) => (
  <>
    <Frame x={8} y={6} w={144} h={88} />
    {header && <PageHeader x={16} y={24} w={128} />}
    {/* Never more rows than fit above the Frame's bottom edge. */}
    {Array.from({ length: Math.min(rows, Math.floor((94 - 44) / 14)) }, (_, i) => (
      <Row key={i} x={16} y={44 + i * 14} w={128} />
    ))}
  </>
);
// The PageHeader's button, where a press opens a layer.
const HEADER_BUTTON = [129, 29];
const FRAME_RIGHT = 152;

// ---------- Families ----------

const spatialShape = {
  id: 'spatial-shape',
  title: 'Spatial, as a shape',
  caption: 'Where it is and how big: the shape travels, then grows, on springs that settle.',
  viewBox: VIEW,
  initial: { x: 0, s: 1 },
  landing: { x: 96, s: 1.8 },
  arrows: [[[32, 50], [128, 50]]],
  draw: ({ x, s }) => (
    <>
      <Rule x1={24} x2={136} y1={50} y2={50} />
      <Scaled cx={32 + x} cy={50} s={s}>
        <Rect x={24 + x} y={42} w={16} h={16} fill={PAINT.accent} corner="shape" />
      </Scaled>
    </>
  ),
  play: async (ctx) => {
    await ctx.spring('x', 96, 'spatial.default');
    await ctx.hold(1);
    await ctx.spring('s', 1.8, 'spatial.default');
  },
};

/** A Popup opening from its trigger's corner: the clip grows from top right. */
const popupOpening = ({ id, title, caption, token }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: { p: 0 },
  landing: { p: 1 },
  arrows: [[[140, 36], [72, 82]]],
  draw: ({ p }) => (
    <>
      <Screen rows={3} header={false} />
      <ButtonShape x={112} y={22} w={28} />
      {/* The reveal reaches one unit past the Popup's top and right, so its ring is never sliced. */}
      <Clip x={140 - 74 * p} y={33} w={74 * p + 1} h={52 * p + 1}>
        <Popup x={68} y={34} w={72} h={48} accent />
      </Clip>
    </>
  ),
  play: async (ctx) => {
    await ctx.tap(126, 26);
    await ctx.spring('p', 1, token);
  },
});

const spatialApp = popupOpening({
  id: 'spatial-app',
  title: 'Spatial, in the app',
  caption: 'A Popup grows out of its trigger: position and size, on a spring.',
  token: 'spatial.fast',
});

const appearanceShape = {
  id: 'appearance-shape',
  title: 'Appearance, as a shape',
  caption: 'How it looks: the shape fades in, then changes color. It never moves or changes size.',
  viewBox: VIEW,
  initial: { o: 0.6, c: 0 },
  landing: { o: 1, c: 1 },
  draw: ({ o, c }) => (
    <g opacity={o}>
      <Rect x={68} y={38} w={24} h={24} fill={PAINT.shape} corner="shape" />
      <Rect x={68} y={38} w={24} h={24} fill={PAINT.accent} corner="shape" opacity={c} />
    </g>
  ),
  play: async (ctx) => {
    await ctx.spring('o', 1, 'appearance.default');
    await ctx.hold(1);
    await ctx.spring('c', 1, 'appearance.default');
  },
};

const appearanceApp = {
  id: 'appearance-app',
  title: 'Appearance, in the app',
  caption: 'A pressed row takes the selected color. Color only, on a spring with no bounce.',
  viewBox: VIEW,
  initial: { c: 0 },
  landing: { c: 1 },
  draw: ({ c }) => (
    <>
      <Screen />
      <g opacity={c}>
        <Row x={16} y={58} w={128} accent />
      </g>
      <Pointer x={104} y={63} />
    </>
  ),
  play: async (ctx) => {
    await ctx.tap(104, 63);
    await ctx.spring('c', 1, 'appearance.default');
  },
};

const linearShape = {
  id: 'linear-shape',
  title: 'Linear, as a shape',
  caption: 'Follows time one to one: one speed from start to end, then it stops dead, like a clock hand.',
  viewBox: VIEW,
  initial: { p: 0 },
  landing: { p: 1 },
  arrows: [[[32, 40], [128, 40]]],
  draw: ({ p }) => (
    <>
      <Rule x1={24} x2={136} y1={40} y2={40} />
      <Rect x={24 + 96 * p} y={32} w={16} h={16} fill={PAINT.accent} corner="shape" />
      <SkeletonBar x={24} y={66} w={112} tone={PAINT.shape} />
      <SkeletonBar x={24} y={66} w={112 * p} accent />
    </>
  ),
  play: (ctx) => ctx.linear('p', 1, 3),
};

const linearApp = {
  id: 'linear-app',
  title: 'Linear, in the app',
  caption: 'A progress bar fills with the work. No spring: it reports, it doesn’t settle.',
  viewBox: VIEW,
  initial: { p: 0 },
  landing: { p: 1 },
  draw: ({ p }) => (
    <>
      <Frame x={8} y={6} w={144} h={88} />
      <Section x={16} y={24} w={128} h={44} rows={1} />
      <SkeletonBar x={24} y={52} w={112} tone={PAINT.shape} />
      <SkeletonBar x={24} y={52} w={112 * p} accent />
      <Row x={16} y={74} w={128} />
    </>
  ),
  play: (ctx) => ctx.linear('p', 1, 4),
};

// ---------- Modes ----------

const sampleStep = (config, seconds, n = 48) => {
  const y = stepOf(config);
  return Array.from({ length: n + 1 }, (_, i) => y((seconds * i) / n));
};

/** A shape travels while its position over time is plotted under it, against the dashed target. */
const plotted = ({ id, title, caption, config, seconds }) => {
  const values = sampleStep(config, seconds);
  return {
    id,
    title,
    caption,
    viewBox: VIEW,
    initial: { x: 0, t: 0 },
    landing: { x: 1, t: 1 },
    arrows: [[[30, 18], [124, 18]]],
    draw: ({ x, t }) => (
      <>
        <Rule x1={24} x2={136} y1={18} y2={18} />
        <Rule x1={130} x2={130} y1={4} y2={32} stroke={PAINT.target} dash="3 3" />
        <Rect x={24 + 100 * x} y={12} w={12} h={12} fill={PAINT.accent} corner="shape" />
        <ChartAxis x={24} y={36} w={112} h={54} />
        <ChartCurve x={24} y={36} w={112} h={54} values={values} upTo={Math.max(0.02, t)} accent />
      </>
    ),
    play: (ctx) => Promise.all([ctx.spring('x', 1, config), ctx.linear('t', 1, seconds / BEAT)]),
  };
};

const FAST_P = springFor('spatial.fast', 'productive');
const FAST_X = springFor('spatial.fast', 'expressive');
const PLOT_SECONDS = Math.max(measure(FAST_P).settle, measure(FAST_X).settle) * 1.5;

const plotProductive = plotted({
  id: 'plot-productive',
  title: 'Productive',
  caption: 'No overshoot: the curve meets the dashed line and stays under it.',
  config: FAST_P,
  seconds: PLOT_SECONDS,
});
const plotExpressive = plotted({
  id: 'plot-expressive',
  title: 'Expressive',
  caption: 'The curve crosses the dashed line once, then settles: the one bounce.',
  config: FAST_X,
  seconds: PLOT_SECONDS,
});

/** A Flag-sized floating layer at the top right of a blocked-out screen. */
const FLAG = { x: 88, y: 22, w: 56, h: 48 };
const FlagLayer = ({ x = 0, opacity = 1 }) => (
  <Clip x={8} y={6} w={FRAME_RIGHT - 8 - 1} h={88}>
    <Moved x={x} opacity={opacity}>
      <Flag {...FLAG} accent />
    </Moved>
  </Clip>
);
const FLAG_IN = [[140, 40], [116, 40]];
const arrive = (ctx, token, mode) =>
  Promise.all([ctx.spring('x', 0, token, { mode }), ctx.spring('o', 1, 'appearance.default')]);

const flagMode = ({ id, title, caption, token, mode }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: { x: 24, o: 0 },
  landing: { x: 0, o: 1 },
  arrows: [FLAG_IN],
  draw: ({ x, o }) => (
    <>
      <Screen rows={3} />
      <FlagLayer x={x} opacity={o} />
    </>
  ),
  play: (ctx) => arrive(ctx, token, mode),
});

const flagProductive = flagMode({
  id: 'flag-productive',
  title: 'Productive, on a Flag',
  caption: 'A saved change: the Flag arrives from the right and stops.',
  token: 'spatial.default',
  mode: 'productive',
});
const flagExpressive = flagMode({
  id: 'flag-expressive',
  title: 'Expressive, on a Flag',
  caption: 'A finished reflection: the same Flag lands with one overshoot.',
  token: 'spatial.fast',
  mode: 'expressive',
});

// ---------- Speed follows size and distance ----------

const sizeFast = popupOpening({
  id: 'size-fast',
  title: 'spatial.fast: a Popup',
  caption: 'A small layer, a short distance.',
  token: 'spatial.fast',
});

const MODAL = { x: 34, y: 32, w: 92, h: 52 };
const sizeDefault = {
  id: 'size-default',
  title: 'spatial.default: a Modal',
  caption: 'A mid-size layer, growing from 96% where it stands.',
  viewBox: VIEW,
  initial: { s: 0.96, o: 0, b: 0 },
  landing: { s: 1, o: 1, b: 1 },
  draw: ({ s, o, b }) => (
    <>
      <Screen rows={3} />
      <g opacity={b}>
        <Backdrop x={8} y={18} w={144} h={76} />
      </g>
      <g opacity={o}>
        <Scaled cx={MODAL.x + MODAL.w / 2} cy={MODAL.y + MODAL.h / 2} s={s}>
          <Modal {...MODAL} accent />
        </Scaled>
      </g>
    </>
  ),
  play: async (ctx) => {
    await ctx.tap(...HEADER_BUTTON);
    await Promise.all([
      ctx.spring('s', 1, 'spatial.default'),
      ctx.spring('o', 1, 'appearance.default'),
      ctx.spring('b', 1, 'appearance.default'),
    ]);
  },
};

const PANEL = { x: 98, y: 18, w: 54, h: 76 };
const DockedPanel = ({ x }) => (
  <Clip x={8} y={18} w={FRAME_RIGHT - 8 - 1} h={76}>
    <Moved x={x}>
      <Panel {...PANEL} accent />
    </Moved>
  </Clip>
);
const sizeSlow = {
  id: 'size-slow',
  title: 'spatial.slow: a Panel',
  caption: 'A large layer crossing a third of the screen.',
  viewBox: VIEW,
  initial: { x: PANEL.w },
  landing: { x: 0 },
  arrows: [[[150, 40], [100, 40]]],
  draw: ({ x }) => (
    <>
      <Screen rows={3} />
      <DockedPanel x={x} />
    </>
  ),
  play: async (ctx) => {
    await ctx.tap(...HEADER_BUTTON);
    await ctx.spring('x', 0, 'spatial.slow');
  },
};

// ---------- Exits ----------

const exitReverse = {
  id: 'exit-reverse',
  title: 'It can come back: reverse, one speed faster',
  caption: 'The Panel opens on spatial.default and closes on spatial.fast, held at its edge.',
  viewBox: VIEW,
  // Only the exit is drawn and played: the Panel starts open.
  initial: { x: 0 },
  landing: { x: PANEL.w },
  arrows: [[[100, 56], [150, 56]]],
  draw: ({ x }) => (
    <>
      <Screen rows={3} />
      <DockedPanel x={x} />
    </>
  ),
  play: async (ctx) => {
    await ctx.hold(1);
    await ctx.tap(104, 24);
    await ctx.spring('x', PANEL.w, 'spatial.fast');
  },
};

// Past this offset the whole Flag has crossed the frame's right edge.
const FLAG_GONE = FRAME_RIGHT - FLAG.x;
const FLAG_OUT = [[116, 56], [154, 56]];

const flagExit = ({ id, title, caption, arrows, landing, leave }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  // Only the exit is drawn and played: the Flag starts in place.
  initial: { x: 0, o: 1, ptr: 0 },
  landing,
  arrows,
  draw: ({ x, o, ptr }) => (
    <>
      <Screen rows={3} />
      <FlagLayer x={x} opacity={o} />
      {ptr > 0 && (
        <g opacity={ptr}>
          <Pointer x={116 + x} y={46} />
        </g>
      )}
    </>
  ),
  play: async (ctx) => {
    await ctx.hold(1);
    await leave(ctx);
  },
});

const exitSystem = flagExit({
  id: 'exit-system',
  title: 'Gone, the system decided: spatial.exit',
  caption: 'A Flag timing out is aimed 3.8× past the edge, so it is still speeding up as it leaves.',
  arrows: [FLAG_OUT],
  landing: { x: FLAG_GONE },
  leave: (ctx) => ctx.exit('x', FLAG_GONE),
});

const exitClick = flagExit({
  id: 'exit-click',
  title: 'Gone, the person clicked: a fade',
  caption: 'Closing by hand is a quick appearance.fast fade, with no travel.',
  arrows: [],
  landing: { x: 0, o: 0 },
  leave: async (ctx) => {
    await ctx.tap(132, 30);
    await ctx.spring('o', 0, 'appearance.fast');
  },
});

// The hand's drag before release: a short pull, at one speed.
const PULL = 8;
const PULL_BEATS = 0.5;
const exitFlick = flagExit({
  id: 'exit-flick',
  title: 'Gone, the person flicked: the hand’s speed',
  caption: 'spatial.exit starts from the release velocity instead of from rest.',
  arrows: [FLAG_OUT],
  landing: { x: FLAG_GONE, ptr: 0 },
  leave: async (ctx) => {
    await ctx.spring('ptr', 1, 'appearance.fast');
    await ctx.linear('x', PULL, PULL_BEATS);
    await Promise.all([
      ctx.exit('x', FLAG_GONE, { velocity: PULL / (PULL_BEATS * BEAT) }),
      ctx.spring('ptr', 0, 'appearance.fast'),
    ]);
  },
});

// ---------- Loops ----------

const DOTS = [0, 1, 2];
// Three dots, each an eighth of a cycle behind the one before.
const DOT_LAG = 1 / 8;
const loopScene = ({ id, title, caption, still }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: { d0: 0, d1: 0, d2: 0, dots: 1, a: 0 },
  landing: { d0: 0, d1: 0, d2: 0, dots: 0, a: 1 },
  draw: (s) => (
    <>
      <Frame x={8} y={6} w={144} h={88} />
      {[0, 1, 2, 3].map((i) => (
        <Row key={i} x={16} y={24 + i * 14} w={74} />
      ))}
      <Rect x={98} y={18} w={54} h={76} fill={PAINT.panelSurface} corner="none" />
      <Rule x1={98} x2={98} y1={18} y2={94} />
      <SkeletonBar x={106} y={26} w={26} h={5} tone={PAINT.placeholderHeading} />
      <g opacity={s.dots}>
        {DOTS.map((i) => (
          <circle key={i} cx={110 + i * 8} cy={46 - s[`d${i}`]} r={2} fill={PAINT.accent} />
        ))}
      </g>
      <g opacity={s.a}>
        <SkeletonBar x={106} y={42} w={38} />
        <SkeletonBar x={106} y={51} w={30} />
        <SkeletonBar x={106} y={60} w={34} />
      </g>
    </>
  ),
  play: async (ctx) => {
    const loops = still ? [] : DOTS.map((i) => ctx.loop(`d${i}`, 3, { phase: -i * DOT_LAG }));
    await ctx.hold(4);
    await Promise.all([
      ...loops.map((l) => l.stop()),
      ctx.spring('a', 1, 'appearance.fast'),
      ctx.spring('dots', 0, 'appearance.fast'),
    ]);
  },
});

const loopThinking = loopScene({
  id: 'loop',
  title: 'Thinking, then done',
  caption: 'Three dots on one undamped spring. When the answer is ready the damping returns and the loop settles.',
});
const loopReduced = loopScene({
  id: 'loop-reduced',
  title: 'Reduced: still, then the answer',
  caption: 'The dots hold still; the answer fades in as they fade out. Nothing loops.',
  still: true,
});

// ---------- Damping ratio ----------

const RATIOS = [
  [1, 'Ratio 1: arrives, never passes', 'Every Productive token. It reads as precise: the card stops on the line.'],
  [0.8, 'Ratio 0.8: passes by about 1.5%', 'Expressive default. A whisper of overshoot you feel more than see.'],
  [0.6, 'Ratio 0.6: passes by about 9.5%', 'Expressive fast, for small things thrown with energy. Visible, still one swing.'],
  [0.4, 'Ratio 0.4: rings', 'Passes by about 25% and swings back and forth. Too loose for any interface motion; no token goes this low.'],
];
const DAMP_SECONDS = measure(springWithRatio('spatial.default', 0.4)).settle * 1.2;

const dampScenes = RATIOS.map(([ratio, title, caption]) => {
  const config = springWithRatio('spatial.default', ratio);
  return plotted({ id: `damping-${String(ratio).replace('.', '')}`, title, caption, config, seconds: DAMP_SECONDS });
});

// ---------- Velocity ----------

const round2 = (v) => Math.round(v * 100) / 100;
const HAND = [[110, 56], [150, 56]];

/** The Panel docked at the right, with the hand's pointer on its left edge while it holds it. */
const PanelAndHand = ({ x, hand, dim = 1 }) => (
  <>
    <Screen rows={3} />
    <g opacity={dim}>
      <DockedPanel x={x} />
    </g>
    {hand > 0 && (
      <g opacity={hand}>
        <Pointer x={PANEL.x + x + 6} y={56} />
      </g>
    )}
  </>
);

// A short, fast pull. The hand's speed is that distance over that time.
const THROW_PULL = 16;
const THROW_BEATS = 0.25;
const speedOf = (pull, beats) => pull / (beats * BEAT);
const THROW_V = Math.round(speedOf(THROW_PULL, THROW_BEATS));

/** The same throw twice: only whether the spring is handed the hand's speed changes. */
const throwScene = ({ id, title, caption, keeps }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: { x: 0, hand: 0, vel: 0 },
  landing: { x: PANEL.w, vel: keeps ? THROW_V : 0 },
  arrows: [HAND],
  draw: ({ x, hand }) => <PanelAndHand x={x} hand={hand} />,
  play: async (ctx) => {
    await ctx.spring('hand', 1, 'appearance.fast');
    await ctx.linear('x', THROW_PULL, THROW_BEATS);
    if (keeps) {
      ctx.set({ vel: THROW_V });
      await Promise.all([ctx.exit('x', PANEL.w, { velocity: speedOf(THROW_PULL, THROW_BEATS) }), ctx.spring('hand', 0, 'appearance.fast')]);
    } else {
      // The hand lets go and the speed is lost: it waits, then leaves from rest.
      await ctx.spring('hand', 0, 'appearance.fast');
      await ctx.hold(1);
      await ctx.exit('x', PANEL.w);
    }
  },
});

const throwKeeps = throwScene({
  id: 'throw-keeps',
  title: 'It leaves at the speed it was thrown',
  caption: 'On release the spring starts from the hand’s velocity, so nothing jumps.',
  keeps: true,
});
const throwDrops = throwScene({
  id: 'throw-drops',
  title: 'It stops, then leaves from rest',
  caption: 'The hand’s speed is dropped: the Panel pauses and starts again from nothing.',
  keeps: false,
});

/** A throw is decided by where it would land: a short fast flick leaves, a long slow drag returns. */
const decisionScene = ({ id, title, caption, pull, beats, gone }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: { x: 0, hand: 0, armed: 0, pull: 0, gone: 0 },
  landing: { x: gone ? PANEL.w : 0, armed: 0, pull, gone: gone ? 1 : 0 },
  arrows: [HAND],
  draw: ({ x, hand, armed }) => <PanelAndHand x={x} hand={hand} dim={1 - armed * 0.35} />,
  play: async (ctx) => {
    const velocity = speedOf(pull, beats);
    const leaves = projectedRest(pull, velocity) > PANEL.w / 2;
    await ctx.spring('hand', 1, 'appearance.fast');
    await ctx.linear('x', pull, beats);
    ctx.set({ pull });
    if (leaves) {
      // The decision shows before release, as an armed state, so it can still be taken back.
      await ctx.spring('armed', 1, 'appearance.fast');
      await ctx.hold(1);
    }
    ctx.set({ armed: 0, gone: leaves ? 1 : 0 });
    await Promise.all([
      leaves ? ctx.exit('x', PANEL.w, { velocity }) : ctx.spring('x', 0, 'spatial.fast', { velocity }),
      ctx.spring('hand', 0, 'appearance.fast'),
    ]);
  },
});

const decideFlick = decisionScene({
  id: 'decide-flick',
  title: 'A short, fast flick leaves',
  caption: 'Where it would land is past halfway, so it dims as armed, and leaves when let go.',
  pull: 16,
  beats: 0.25,
  gone: true,
});
const decideDrag = decisionScene({
  id: 'decide-drag',
  title: 'A long, slow drag returns',
  caption: 'Let go farther along, but it would land short of halfway, so it springs back.',
  pull: 18,
  beats: 3,
  gone: false,
});

/** Closing mid-open: the second press wins at once. Both end closed; one turned back in flight. */
const interruptScene = ({ id, title, caption, turns }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: { x: PANEL.w, turned: 0 },
  landing: { x: PANEL.w, turned: turns ? 1 : 0 },
  arrows: [[[150, 36], [100, 36]], [[100, 76], [150, 76]]],
  draw: ({ x }) => (
    <>
      <Screen rows={3} />
      <DockedPanel x={x} />
    </>
  ),
  play: async (ctx) => {
    await ctx.tap(...HEADER_BUTTON);
    const opening = ctx.begin('x', 0, 'spatial.slow');
    await ctx.hold(0.5);
    await ctx.tap(104, 24);
    if (turns) {
      const { velocity } = opening.halt();
      ctx.set({ turned: 1 });
      await ctx.spring('x', PANEL.w, 'spatial.fast', { velocity });
    } else {
      await opening.done;
      await ctx.hold(1);
      await ctx.spring('x', PANEL.w, 'spatial.fast');
    }
  },
});

const interruptTurns = interruptScene({
  id: 'interrupt-turns',
  title: 'Closed mid-open: it turns back from where it is',
  caption: 'A spring can be reversed at any moment; the second press wins at once.',
  turns: true,
});
const interruptWaits = interruptScene({
  id: 'interrupt-waits',
  title: 'Closed mid-open: it finishes opening first',
  caption: 'The person waits for an animation to end before anything answers.',
  turns: false,
});

// ---------- Weight ----------

const CARRY = { from: [40, 65], to: [118, 54] };
const carryScene = ({ id, title, caption, token, card }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: { px: CARRY.from[0], py: CARRY.from[1], ix: CARRY.from[0], iy: CARRY.from[1], po: 0, lag: 0 },
  landing: { px: CARRY.to[0], py: CARRY.to[1], ix: CARRY.to[0], iy: CARRY.to[1], po: 0 },
  arrows: [[CARRY.from, [80, 40], CARRY.to]],
  draw: ({ px, py, ix, iy, po }) => (
    <>
      <Frame x={8} y={6} w={144} h={88} />
      {[0, 1, 2, 3].map((i) => (
        <Row key={i} x={16} y={44 + i * 14 - 14} w={72} />
      ))}
      <Section x={96} y={20} w={48} h={68} subtle rows={0} />
      {card ? (
        <CardBox x={ix - 20} y={iy - 10} w={40} h={20} accent />
      ) : (
        <Rect x={ix - 10} y={iy - 4} w={20} h={8} fill={PAINT.accent} corner="shape" />
      )}
      {po > 0 && (
        <g opacity={po}>
          <Pointer x={px} y={py} />
        </g>
      )}
    </>
  ),
  play: async (ctx) => {
    const [ex, ey] = CARRY.to;
    const [sx, sy] = CARRY.from;
    await ctx.spring('po', 1, 'appearance.fast');
    await ctx.tap(sx, sy);
    // The hand's own path is a sweep: linear in time along a gentle arc.
    const arc = (px) => ({ py: sy + ((ey - sy) * (px - sx)) / (ex - sx) - Math.sin((Math.PI * (px - sx)) / (ex - sx)) * 14 });
    await Promise.all([
      ctx.linear('px', ex, 2, { derive: arc }),
      ctx.chase(['ix', 'iy'], ['px', 'py'], token, 3),
    ]);
    await ctx.spring('po', 0, 'appearance.fast');
  },
});

const carryChip = carryScene({
  id: 'carry-chip',
  title: 'A chip keeps close on fast',
  caption: 'A tag or a name is light: it stays right under the pointer on spatial.fast.',
  token: 'spatial.fast',
});
const carryCard = carryScene({
  id: 'carry-card',
  title: 'A whole card trails on default',
  caption: 'A card carries a record, so it lags the pointer a touch on spatial.default. It still never bounces.',
  token: 'spatial.default',
  card: true,
});

// ---------- Damping at a limit ----------

// The Panel's resting width, the distance past it that is allowed, and how far the hand pulls.
const BASE_W = PANEL.w;
const EXTRA = 25;
const LIMIT = BASE_W + EXTRA;
const REACH = 40;
const widthAt = (d, stretch) => BASE_W + Math.min(d, EXTRA) + (stretch ? resisted(d - EXTRA) : 0);
const PEAK = round2(widthAt(REACH, true));
const PULL_RATE = REACH / (2 * BEAT);
// How fast the panel is still widening at release, from the pull's own speed through the resistance.
const STRETCH_V = ((widthAt(REACH, true) - widthAt(REACH - 0.5, true)) / 0.5) * PULL_RATE;

const limitScene = ({ id, title, caption, stretch }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: { d: 0, w: BASE_W, hand: 0, peak: BASE_W, limit: LIMIT },
  landing: { d: REACH, w: LIMIT, peak: stretch ? PEAK : LIMIT, limit: LIMIT },
  arrows: [[[FRAME_RIGHT - BASE_W - 2, 56], [FRAME_RIGHT - BASE_W - REACH, 56]]],
  draw: ({ d, w, hand }) => (
    <>
      <Screen rows={3} />
      <Clip x={8} y={18} w={FRAME_RIGHT - 8 - 1} h={76}>
        <Panel x={FRAME_RIGHT - w} y={PANEL.y} w={w} h={PANEL.h} accent />
      </Clip>
      <Rule x1={FRAME_RIGHT - LIMIT} x2={FRAME_RIGHT - LIMIT} y1={18} y2={94} stroke={PAINT.target} dash="3 3" />
      {hand > 0 && (
        <g opacity={hand}>
          <Pointer x={FRAME_RIGHT - BASE_W - d} y={56} />
        </g>
      )}
    </>
  ),
  play: async (ctx) => {
    await ctx.spring('hand', 1, 'appearance.fast');
    await ctx.linear('d', REACH, 2, { derive: (d) => ({ w: widthAt(d, stretch) }) });
    ctx.set({ peak: stretch ? PEAK : LIMIT });
    await ctx.hold(1);
    await Promise.all([
      stretch ? ctx.spring('w', LIMIT, 'spatial.fast', { velocity: STRETCH_V }) : Promise.resolve(),
      ctx.spring('hand', 0, 'appearance.fast'),
    ]);
  },
});

const limitResists = limitScene({
  id: 'limit-resists',
  title: 'Past its limit, it resists and returns',
  caption: 'Past the dashed line the Panel follows less and less; on release it springs back with the hand’s speed.',
  stretch: true,
});
const limitWall = limitScene({
  id: 'limit-wall',
  title: 'Past its limit, it hits a wall',
  caption: 'A hard stop drops the hand’s speed and hides where the limit is.',
  stretch: false,
});

// ---------- Reduced motion ----------

const LIST_ROW = { x: 16, y: 44, w: 128, h: 14 };
const RECORD = { x: 16, y: 26, w: 128, h: 62 };
const lerp = (a, b, t) => a + (b - a) * t;

const drillScene = ({ id, title, caption, reduced }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: { g: reduced ? 1 : 0, list: 1, rec: 0 },
  landing: { g: 1, list: 0, rec: 1 },
  arrows: reduced ? [] : [[[100, 51], [100, 70]]],
  draw: ({ g, list, rec }) => (
    <>
      <Frame x={8} y={6} w={144} h={88} />
      <g opacity={list}>
        <PageHeader x={16} y={24} w={128} />
        {[0, 1, 2].map((i) => (
          <Row key={i} x={16} y={44 + i * 14} w={128} />
        ))}
      </g>
      {g > 0 && (
        <g opacity={reduced ? rec : 1}>
          <CardBox
            x={lerp(LIST_ROW.x, RECORD.x, g)}
            y={lerp(LIST_ROW.y, RECORD.y, g)}
            w={lerp(LIST_ROW.w, RECORD.w, g)}
            h={lerp(LIST_ROW.h, RECORD.h, g)}
            accent
          />
        </g>
      )}
      <g opacity={rec}>
        <Section x={26} y={36} w={108} h={46} rows={3} />
      </g>
    </>
  ),
  play: async (ctx) => {
    await ctx.tap(100, 51);
    if (reduced) {
      // One short fade in the final place and size. Never a cut.
      await Promise.all([ctx.spring('list', 0, 'appearance.fast'), ctx.spring('rec', 1, 'appearance.fast')]);
    } else {
      await Promise.all([
        ctx.spring('g', 1, 'spatial.default'),
        ctx.spring('list', 0, 'appearance.fast'),
        ctx.spring('rec', 1, 'appearance.default'),
      ]);
    }
  },
});

const drillProductive = drillScene({
  id: 'reduced-productive',
  title: 'Productive',
  caption: 'The row grows into the record on spatial.default.',
});
const drillReduced = drillScene({
  id: 'reduced-reduced',
  title: 'Reduced',
  caption: 'The same change as one appearance.fast fade in the final place. Never a cut.',
  reduced: true,
});

// ---------- The demos, in page order ----------

export const PHYSICS_DEMOS = {
  spatial: { title: 'spatial', scenes: [spatialShape, spatialApp] },
  appearance: { title: 'appearance', scenes: [appearanceShape, appearanceApp] },
  linear: { title: 'linear', scenes: [linearShape, linearApp] },
  modes: { title: 'Productive and Expressive', scenes: [plotProductive, plotExpressive, flagProductive, flagExpressive] },
  size: { title: 'Speed follows size', scenes: [sizeFast, sizeDefault, sizeSlow] },
  exits: { title: 'Four ways to leave', scenes: [exitReverse, exitSystem, exitClick, exitFlick] },
  loops: { title: 'A loop and its reduced fallback', scenes: [loopThinking, loopReduced] },
  damping: { title: 'One stiffness, four ratios', scenes: dampScenes },
  throw: { title: 'A throw keeps the hand’s speed', scenes: pair(throwKeeps, throwDrops) },
  decision: { title: 'Where it would land decides', scenes: [decideFlick, decideDrag] },
  interruption: { title: 'Interrupted mid-motion', scenes: pair(interruptTurns, interruptWaits) },
  carry: { title: 'What you carry', scenes: [carryChip, carryCard] },
  limit: { title: 'Dragged past a limit', scenes: pair(limitResists, limitWall) },
  reducedMotion: { title: 'Reduced motion is a fade, never a cut', scenes: [drillProductive, drillReduced] },
};

// ---------- The token table ----------

const ms = (seconds) => `${Math.round(seconds * 1000)} ms`;
const pct = (fraction) => (fraction < 0.0005 ? 'none' : `${(fraction * 100).toFixed(1)}%`);

/** One row per token and mode, every number read from the generated spring config. */
const tokenRows = () => {
  const rows = [];
  const springRow = (token, mode, label, modeLabel) => {
    const config = springFor(token, mode);
    const m = measure(config);
    rows.push([
      label ? <C>{`motion.${token}`}</C> : '',
      modeLabel,
      config.stiffness,
      ratioOf(config).toFixed(1),
      ms(m.t90),
      ms(m.settle),
      pct(m.overshoot),
    ]);
  };
  for (const speed of ['fast', 'default', 'slow']) {
    springRow(`spatial.${speed}`, 'productive', true, 'Productive');
    springRow(`spatial.${speed}`, 'expressive', false, 'Expressive');
  }
  for (const speed of ['fast', 'default', 'slow']) springRow(`appearance.${speed}`, 'productive', true, 'both');

  const exit = springFor('spatial.exit');
  const { aim } = SPRINGS['spatial.exit'];
  const step = stepOf(exit);
  let edge = 0;
  while (step(edge) < 1 / aim) edge += 0.0005;
  rows.push([<C>motion.spatial.exit</C>, 'both', exit.stiffness, ratioOf(exit).toFixed(1), `aimed ${aim}× past the edge; reaches it in ${ms(edge)}`, '', 'none']);

  const loop = springFor('loop');
  rows.push([<C>motion.loop</C>, 'both', loop.stiffness, ratioOf(loop), `one cycle every ${(LOOP_PERIOD).toFixed(1)} s; never settles`, '', '—']);
  rows.push([<C>linear</C>, 'both', '—', '—', 'one to one with time or the pointer', '', 'none']);
  return rows;
};

export const SpringTokenTable = () => (
  <RefTable head={['Token', 'Mode', 'Stiffness', 'Ratio', '90%', 'Settled', 'Overshoot']} rows={tokenRows()} />
);

// ---------- One spring, five ways ----------

const FIGMA_TOKENS = ['spatial.fast', 'spatial.default', 'spatial.slow', 'appearance.fast', 'appearance.default', 'appearance.slow'];
const trim = (n) => +n.toFixed(2);

/** `motion.spatial.default` in every target, and every token's Figma proxy, read from the generated config. */
export const OneSpringFiveWays = () => {
  const c = springFor('spatial.default');
  const mass = c.mass ?? 1;
  const response = (2 * Math.PI) / Math.sqrt(c.stiffness / mass);
  return (
    <>
      <RefTable
        head={['Target', <C>motion.spatial.default</C>]}
        rows={[
          ['CSS', <><C>--ds-motion-spatial-default</C>: a generated <C>linear()</C> easing over its settle time</>],
          ['Motion (React)', <><C>{`{ type: 'spring', stiffness: ${c.stiffness}, damping: ${trim(c.damping)}, mass: ${mass} }`}</C>, for drag and interruption</>],
          ['Figma', 'Nearest spring, prototype proxy only. Figma holds no motion tokens'],
          ['SwiftUI', <C>{`.spring(response: ${response.toFixed(2)}, dampingFraction: ${ratioOf(c).toFixed(1)})`}</C>],
          ['Native web animation', <>The same generated <C>linear()</C></>],
        ]}
      />
      <RefTable
        head={['Token', 'Figma spring (stiffness / damping, mass 1)']}
        rows={FIGMA_TOKENS.map((t) => {
          const f = springFor(t);
          return [<C>{`motion.${t}`}</C>, `${f.stiffness} / ${trim(f.damping)}`];
        })}
      />
    </>
  );
};

// ---------- Numbers in prose ----------

/**
 * A spring's time in prose, read from the same generated config the token table
 * reads, so a sentence cannot drift from the table. `of` is `t90` (the table's
 * 90% column) or `settle`; `mode` is `productive` or `expressive`.
 */
export const springMs = (token, of = 't90', mode = 'productive') => ms(measure(springFor(token, mode))[of]);
export const SpringMs = ({ token, of = 't90', mode = 'productive' }) => <>{springMs(token, of, mode)}</>;
