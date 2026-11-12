import React from 'react';
import { PAINT } from './paint.js';
import {
  Breadcrumb, ButtonShape, Card, CardBox, Field, Frame, PageHeader, ProgressTracker, Rect, Row, Rule, Screen,
  Section, SkeletonBar, Tabs,
} from './primitives.jsx';
import { TreeEdge, TreeNode } from './primitives-motion.jsx';
import { Clip, Moved, VIEW, mix } from './motion-parts.jsx';
import { ABOVE_DEMOS, FEEDBACK_DEMOS, WITHIN_DEMOS } from './motion-transitions-place.jsx';

/**
 * The Transitions page's figures (Foundations/Motion/Transitions), Between places.
 * Each transition is structure across screens, so it is blocked out in kit shapes
 * with no words; Step draws the kit's ProgressTracker. Every scene lands at
 * `landing`; the stories assert it. A Don't is the same scene with one rule broken.
 */

// The screen every scene sits in: Frame (8,6,144,88), a docked Sidebar and its Page.
const PAGE = { x: 52, y: 18, w: 99, h: 75 };
const BODY = { x: 60, y: 48, w: 83, h: 42 };
const ROW = { x: 60, y: 62, w: 83, h: 14 };
// The Page's button, where a press opens a focused task.
const HEADER_BUTTON = [128, 34];

// ---------- Drill into and climb back out ----------

/** The list a record is opened from: a header (or a Breadcrumb) and three rows. The middle row is what gets pressed, so it stays neutral. */
const ListLayer = ({ crumbs }) => (
  <>
    {crumbs ? (
      <>
        <Breadcrumb x={60} y={24} w={60} count={crumbs} />
        <SkeletonBar x={60} y={36} w={30} h={6} heading />
      </>
    ) : (
      <PageHeader x={60} y={26} w={83} />
    )}
    <Row x={BODY.x} y={BODY.y} w={BODY.w} />
    <Row x={ROW.x} y={ROW.y} w={ROW.w} />
    <Row x={BODY.x} y={76} w={BODY.w} />
  </>
);

/** The record: its Breadcrumb one level longer, a heading and two cards. */
const RecordLayer = ({ crumbs }) => (
  <>
    <Breadcrumb x={60} y={24} w={70} count={crumbs} accent />
    <SkeletonBar x={60} y={36} w={34} h={6} heading />
    <CardBox x={60} y={48} w={38} h={36} />
    <CardBox x={104} y={48} w={39} h={36} />
  </>
);

/**
 * A row growing into its record. `g` is the container (position, size and
 * corner together), `l` the list, `c` the record's content. `cut` replaces the
 * grow with a jump; `slide` brings the record in from the right edge instead.
 */
const drill = ({ id, title, caption, crumbs = 0, mode = 'grow' }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: mode === 'slide' ? { x: 1, l: 1, c: 1 } : { g: 0, l: 1, c: 0 },
  landing: mode === 'slide' ? { x: 0, l: 1, c: 1 } : { g: 1, l: 0, c: 1 },
  arrows: mode === 'slide' ? [[[148, 56], [101, 56]]] : [[[101, 69], [101, 52]]],
  draw: ({ g = 0, l, c, x = 0 }) => (
    <>
      <Screen x={8} y={6} w={144} h={88} header={false}>
        <g opacity={l}>
          <ListLayer crumbs={crumbs} />
        </g>
        {mode !== 'slide' && g > 0 && (
          <>
            <Rect
              x={mix(ROW.x, PAGE.x, g)}
              y={mix(ROW.y, PAGE.y, g)}
              w={mix(ROW.w, PAGE.w, g)}
              h={mix(ROW.h, PAGE.h, g)}
              fill={PAGE_FILL}
              stroke={PAGE_EDGE}
              corner={g > 0.5 ? undefined : 'shape'}
            />
            <g opacity={c}>
              <RecordLayer crumbs={crumbs + 2} />
            </g>
          </>
        )}
        {mode === 'slide' && (
          <Clip {...PAGE}>
            <Moved x={x * PAGE.w}>
              <Rect {...PAGE} fill={PAGE_FILL} stroke={PAGE_EDGE} />
              <RecordLayer crumbs={crumbs + 2} />
            </Moved>
          </Clip>
        )}
      </Screen>
    </>
  ),
  play: async (ctx) => {
    await ctx.hold(1);
    await ctx.tap(101, 69);
    if (mode === 'slide') {
      await ctx.spring('x', 0, 'spatial.default');
      return;
    }
    if (mode === 'cut') {
      ctx.set({ g: 1, l: 0, c: 1 });
      return;
    }
    // The grow, the list fading out in place, and the record's content once the container is well on its way.
    await Promise.all([
      ctx.spring('g', 1, 'spatial.default'),
      (async () => {
        await ctx.spring('l', 0, 'appearance.fast');
        await ctx.spring('c', 1, 'appearance.default');
      })(),
    ]);
  },
});
const PAGE_FILL = PAINT.pageSurface;
const PAGE_EDGE = PAINT.pageEdge;

export const drillScene = drill;

/** Back one level shrinks the page into its row; back two fades, because the row is not on screen. */
const climbOne = {
  id: 'climb-one',
  title: 'Back one level: the page shrinks into its row',
  caption: 'The Breadcrumb or browser back reverses the grow one speed faster. The row is on screen, so it is where the page lands.',
  viewBox: VIEW,
  initial: { g: 1, l: 0, c: 1 },
  landing: { g: 0, l: 1, c: 0 },
  arrows: [[[101, 52], [101, 69]]],
  draw: ({ g, l, c }) => drill({ id: 'x', crumbs: 1 }).draw({ g, l, c }),
  play: async (ctx) => {
    await ctx.hold(1);
    await ctx.tap(74, 26);
    await Promise.all([
      ctx.spring('c', 0, 'appearance.fast'),
      ctx.spring('g', 0, 'spatial.fast'),
      ctx.spring('l', 1, 'appearance.fast'),
    ]);
  },
};

const climbTwo = {
  id: 'climb-two',
  title: 'Back two levels: a fade',
  caption: 'Past a level that is no longer on screen there is no row to shrink into: the page fades out and the destination fades in, in place, with the Breadcrumb already shorter.',
  viewBox: VIEW,
  initial: { f: 1, n: 0 },
  landing: { f: 0, n: 1 },
  arrows: [],
  draw: ({ f, n }) => (
    <Screen x={8} y={6} w={144} h={88} header={false}>
      <g opacity={n}>
        <ListLayer crumbs={0} />
      </g>
      <g opacity={f}>
        <Rect {...PAGE} fill={PAGE_FILL} stroke={PAGE_EDGE} />
        <RecordLayer crumbs={3} />
      </g>
    </Screen>
  ),
  play: async (ctx) => {
    await ctx.hold(1);
    await ctx.tap(66, 26);
    await ctx.spring('f', 0, 'appearance.fast');
    await ctx.spring('n', 1, 'appearance.default');
  },
};

// ---------- Focused task ----------

/** The task that takes the whole window: a header with its close, the step list, the form and the bottom bar. */
const TaskLayer = () => (
  <>
    <Frame x={8} y={6} w={144} h={88} />
    <Rect x={16} y={22} w={6} h={6} fill={PAINT.placeholderText} corner="tab" />
    <SkeletonBar x={28} y={23} w={40} h={5} heading />
    {[0, 1, 2, 3, 4].map((i) => (
      <SkeletonBar key={i} x={16} y={40 + i * 9} w={30} heading={i === 1} />
    ))}
    <Field x={64} y={36} w={80} />
    <Field x={64} y={58} w={80} />
    <Rule x1={9} x2={151} y1={80} y2={80} stroke={PAINT.frameDivider} />
    <ButtonShape x={16} y={82} w={28} />
    <ButtonShape x={92} y={82} w={24} />
    <ButtonShape x={120} y={82} w={28} appearance="primary" />
  </>
);

const focused = ({ id, title, caption, slide }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: slide ? { fr: 1, x: 1 } : { fr: 1, f: 0 },
  landing: slide ? { fr: 0, x: 0 } : { fr: 0, f: 1 },
  arrows: [slide ? [[148, 50], [80, 50]] : [[128, 34], [80, 50]]],
  draw: ({ fr, f = 0, x = 0 }) => (
    <>
      <g opacity={fr}>
        <Screen x={8} y={6} w={144} h={88} header={false}>
          <PageHeader x={60} y={26} w={83} />
          <Row x={BODY.x} y={BODY.y} w={BODY.w} />
          <Row x={BODY.x} y={ROW.y} w={BODY.w} />
        </Screen>
      </g>
      {slide ? (
        <Clip x={8} y={6} w={144} h={88}>
          <Moved x={x * 144}>
            <TaskLayer />
          </Moved>
        </Clip>
      ) : (
        <g opacity={f}>
          <TaskLayer />
        </g>
      )}
    </>
  ),
  play: async (ctx) => {
    await ctx.hold(1);
    await ctx.tap(...HEADER_BUTTON);
    if (slide) {
      await Promise.all([ctx.spring('fr', 0, 'appearance.fast'), ctx.spring('x', 0, 'spatial.default')]);
      return;
    }
    await ctx.spring('fr', 0, 'appearance.fast');
    await ctx.spring('f', 1, 'appearance.default');
  },
});

// ---------- Go to another area ----------

const SIDEBAR_ROWS = [42, 59];

const goTo = ({ id, title, caption, slide }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: slide ? { hl: 0, p: 0 } : { hl: 0, o: 1, n: 0 },
  landing: slide ? { hl: 1, p: 1 } : { hl: 1, o: 0, n: 1 },
  arrows: [[[30, 67], [30, 50]]],
  draw: ({ hl, o = 1, n = 0, p = 0 }) => (
    <>
      <Screen x={8} y={6} w={144} h={88} header={false} />
      <Rect x={12} y={mix(SIDEBAR_ROWS[1], SIDEBAR_ROWS[0], hl)} w={36} h={16} stroke={PAINT.accent} corner="sidebarRow" />
      <Clip {...PAGE}>
        <Moved x={-p * PAGE.w} opacity={slide ? 1 : o}>
          <ListLayer crumbs={0} />
        </Moved>
        <Moved x={(1 - p) * PAGE.w} opacity={slide ? 1 : n}>
          <Section x={60} y={26} w={83} h={60} rows={3} />
        </Moved>
      </Clip>
    </>
  ),
  play: async (ctx) => {
    await ctx.hold(1);
    await ctx.tap(30, 67);
    if (slide) {
      await Promise.all([ctx.spring('hl', 1, 'spatial.fast'), ctx.spring('p', 1, 'spatial.slow')]);
      return;
    }
    // The highlight moves while the old page fades out; the new page waits out the clean-fade gap.
    await Promise.all([
      ctx.spring('hl', 1, 'spatial.fast'),
      (async () => {
        await ctx.spring('o', 0, 'appearance.fast');
        await ctx.spring('n', 1, 'appearance.default');
      })(),
    ]);
  },
});

// ---------- Switch views ----------

const TAB_W = 83 / 3;
const switchViews = ({ id, title, caption, fade }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial: fade ? { i: 0, p: 0, o: 0 } : { i: 0, p: 0 },
  landing: fade ? { i: 1, p: 1, o: 1 } : { i: 1, p: 1 },
  arrows: [[[130, 66], [78, 66]]],
  draw: ({ i, p, o = 0 }) => (
    <>
      <Screen x={8} y={6} w={144} h={88} header={false}>
        <SkeletonBar x={60} y={24} w={30} h={6} heading />
        <Tabs x={60} y={32} w={83} count={3} selected={-1} />
      </Screen>
      <Rule x1={60 + i * TAB_W} x2={60 + (i + 1) * TAB_W} y1={48} y2={48} stroke={PAINT.accent} thick />
      <Clip x={60} y={52} w={83} h={40}>
        <Moved x={-p * 95} opacity={fade ? 1 - o : 1}>
          <Row x={60} y={54} w={83} />
          <Row x={60} y={68} w={83} />
          <Row x={60} y={82} w={83} />
        </Moved>
        <Moved x={(1 - p) * 95} opacity={fade ? o : 1}>
          <CardBox x={60} y={54} w={38} h={34} />
          <CardBox x={104} y={54} w={39} h={34} />
        </Moved>
      </Clip>
    </>
  ),
  play: async (ctx) => {
    await ctx.hold(1);
    await ctx.tap(60 + TAB_W * 1.5, 40);
    await Promise.all([
      ctx.spring('i', 1, 'spatial.fast'),
      ctx.spring('p', 1, 'spatial.slow'),
      ...(fade ? [ctx.spring('o', 1, 'appearance.default')] : []),
    ]);
  },
});

// ---------- Step ----------

/** The steps down a side: visited, current and unvisited, drawn from the tracker's own roles. */
const SideSteps = ({ x, y, current }) => (
  <>
    {[0, 1, 2, 3].map((i) => {
      const cy = y + i * 14 + 6;
      return (
        <React.Fragment key={i}>
          {i === current && <Rect x={x} y={cy - 6} w={34} h={12} fill={PAINT.trackerCurrent} corner="tracker" />}
          {i < current ? (
            <path
              d={`M${x + 4.5} ${cy} L${x + 6.5} ${cy + 2} L${x + 10} ${cy - 2}`}
              fill="none"
              stroke={PAINT.trackerVisited}
              style={{ strokeWidth: 'var(--stroke-1)' }}
            />
          ) : (
            <circle
              cx={x + 7}
              cy={cy}
              r={2.5}
              fill="none"
              stroke={i === current ? PAINT.trackerCurrentRing : PAINT.trackerDot}
              style={{ strokeWidth: 'var(--stroke-1)' }}
            />
          )}
          <SkeletonBar x={x + 14} y={cy - 2} w={16} heading={i === current} />
        </React.Fragment>
      );
    })}
  </>
);

/** One step's body: a card and a few lines, drawn at (`x`, `y`) in a w × h box. */
const StepBody = ({ x, y, w, h }) => (
  <>
    <CardBox x={x} y={y} w={w} h={h} />
    <SkeletonBar x={x + 8} y={y + 8} w={w * 0.3} h={5} heading />
    <Field x={x + 8} y={y + 18} w={w - 16} />
  </>
);

const step = ({ id, title, caption, side, axis }) => {
  // Across the top the body is 128 × 36 under the tracker; down a side it is 80 wide beside the list.
  const box = side ? { x: 60, y: 22, w: 84, h: 52 } : { x: 16, y: 46, w: 128, h: 30 };
  const along = axis === 'x' ? box.w + 12 : box.h + 12;
  return {
    id,
    title,
    caption,
    viewBox: VIEW,
    initial: { cur: 0, p: 0 },
    landing: { cur: 1, p: 1 },
    arrows: [axis === 'x' ? [[box.x + box.w - 6, box.y + box.h / 2], [box.x + 8, box.y + box.h / 2]] : [[box.x + box.w / 2, box.y + box.h - 4], [box.x + box.w / 2, box.y + 6]]],
    draw: ({ cur, p }) => {
      const off = (t) => (axis === 'x' ? { x: t * along } : { y: t * along });
      return (
        <>
          <Frame x={8} y={6} w={144} h={88} />
          <SkeletonBar x={16} y={20} w={40} h={5} heading />
          {side ? (
            <>
              <g opacity={1 - cur}><SideSteps x={16} y={26} current={0} /></g>
              <g opacity={cur}><SideSteps x={16} y={26} current={1} /></g>
            </>
          ) : (
            <>
              <g opacity={1 - cur}><ProgressTracker x={16} y={28} w={128} count={4} current={0} /></g>
              <g opacity={cur}><ProgressTracker x={16} y={28} w={128} count={4} current={1} /></g>
            </>
          )}
          <Clip {...box}>
            <Moved {...off(-p)}>
              <StepBody {...box} />
            </Moved>
            <Moved {...off(1 - p)}>
              <StepBody {...box} />
            </Moved>
          </Clip>
          <Rule x1={9} x2={151} y1={82} y2={82} stroke={PAINT.frameDivider} />
          <ButtonShape x={16} y={84} w={24} />
          <ButtonShape x={122} y={84} w={24} appearance="primary" />
        </>
      );
    },
    play: async (ctx) => {
      await ctx.hold(1);
      await ctx.tap(134, 90);
      // Step states change in place at the moment the body starts; nothing travels along the tracker.
      await Promise.all([ctx.spring('cur', 1, 'appearance.fast'), ctx.spring('p', 1, 'spatial.default')]);
    },
  };
};

// ---------- Trees ----------

const N = { w: 16, h: 12 };
const at = (x, y) => ({ x: x - N.w / 2, y: y - N.h / 2 });
/** A node centered on (`cx`, `cy`). */
const Node = ({ cx, cy, ...props }) => <TreeNode {...at(cx, cy)} {...N} {...props} />;

const treeScene = ({ id, title, caption, initial, landing, draw, play }) => ({
  id,
  title,
  caption,
  viewBox: VIEW,
  initial,
  landing,
  arrows: [],
  draw,
  play,
});

const go = treeScene({
  id: 'tree-go',
  title: 'Go to another area',
  caption: 'Separate trees: one area lights, then another. No line joins them.',
  initial: { a: 1, b: 0 },
  landing: { a: 0, b: 1 },
  draw: ({ a, b }) => (
    <>
      {[[40, 20, 20, 62, 60, 62, a], [120, 20, 100, 62, 140, 62, b]].map(([rx, ry, lx, ly, mx, my, lit], i) => (
        <g key={i}>
          <TreeEdge x1={rx} y1={ry + 6} x2={lx} y2={ly - 6} />
          <TreeEdge x1={rx} y1={ry + 6} x2={mx} y2={my - 6} />
          <Node cx={rx} cy={ry} lit={lit} />
          <Node cx={lx} cy={ly} />
          <Node cx={mx} cy={my} />
        </g>
      ))}
    </>
  ),
  play: async (ctx) => {
    await ctx.hold(1);
    await ctx.spring('a', 0, 'appearance.fast');
    await ctx.spring('b', 1, 'appearance.default');
  },
});

const drillTree = treeScene({
  id: 'tree-drill',
  title: 'Drill into and climb back out',
  caption: 'The path lights one level down into the chosen record, then back up to its parent.',
  initial: { s: 1, r: 0, e: 0, seen: 0 },
  landing: { s: 1, r: 0, e: 0, seen: 1 },
  draw: ({ s, r, e }) => (
    <>
      <TreeEdge x1={80} y1={26} x2={40} y2={58} />
      <TreeEdge x1={80} y1={26} x2={80} y2={58} progress={e} accent />
      <TreeEdge x1={80} y1={26} x2={120} y2={58} />
      <Node cx={80} cy={20} lit={s} />
      <Node cx={40} cy={64} />
      <Node cx={80} cy={64} lit={r} />
      <Node cx={120} cy={64} />
    </>
  ),
  play: async (ctx) => {
    await ctx.hold(1);
    await ctx.spring('e', 1, 'spatial.default');
    ctx.set({ seen: 1 });
    await Promise.all([ctx.spring('r', 1, 'appearance.default'), ctx.spring('s', 0.35, 'appearance.default')]);
    await ctx.hold(1);
    await Promise.all([ctx.spring('r', 0, 'appearance.fast'), ctx.spring('e', 0, 'spatial.fast')]);
    await ctx.spring('s', 1, 'appearance.default');
  },
});

const switchTree = treeScene({
  id: 'tree-switch',
  title: 'Switch views',
  caption: 'The record stays; the light moves between its views, which hang from it as peers.',
  initial: { v1: 0, v2: 1, v3: 0 },
  landing: { v1: 0, v2: 0, v3: 1 },
  draw: ({ v1, v2, v3 }) => (
    <>
      {[40, 80, 120].map((x) => (
        <TreeEdge key={x} x1={80} y1={26} x2={x} y2={58} />
      ))}
      <Node cx={80} cy={20} lit={0.35} />
      <Node cx={40} cy={64} lit={v1} />
      <Node cx={80} cy={64} lit={v2} />
      <Node cx={120} cy={64} lit={v3} />
    </>
  ),
  play: async (ctx) => {
    await ctx.hold(1);
    await Promise.all([ctx.spring('v2', 0, 'appearance.fast'), ctx.spring('v3', 1, 'appearance.default')]);
  },
});

const stepTree = treeScene({
  id: 'tree-step',
  title: 'Step to the next or previous',
  caption: 'An ordered set is a chain: the light travels along the links, forward and back, and passed steps are marked done.',
  initial: { n1: 1, n2: 0, n3: 0, e1: 0, e2: 0, d1: 0, d2: 0 },
  landing: { n1: 0, n2: 1, n3: 0, e1: 1, e2: 0, d1: 1, d2: 0 },
  draw: ({ n1, n2, n3, e1, e2, d1, d2 }) => (
    <>
      <TreeEdge x1={32} y1={50} x2={72} y2={50} progress={e1} accent />
      <TreeEdge x1={88} y1={50} x2={128} y2={50} progress={e2} accent />
      <Node cx={24} cy={50} lit={n1} done={d1 > 0.5} />
      <Node cx={80} cy={50} lit={n2} done={d2 > 0.5} />
      <Node cx={136} cy={50} lit={n3} />
    </>
  ),
  play: async (ctx) => {
    await ctx.hold(1);
    await ctx.spring('e1', 1, 'spatial.default');
    ctx.set({ d1: 1 });
    await Promise.all([ctx.spring('n1', 0, 'appearance.fast'), ctx.spring('n2', 1, 'appearance.default')]);
    await ctx.hold(1);
    await ctx.spring('e2', 1, 'spatial.default');
    ctx.set({ d2: 1 });
    await Promise.all([ctx.spring('n2', 0, 'appearance.fast'), ctx.spring('n3', 1, 'appearance.default')]);
    await ctx.hold(1);
    // Back: the light returns along the link, and the step left behind is no longer done.
    await ctx.spring('e2', 0, 'spatial.fast');
    ctx.set({ d2: 0 });
    await Promise.all([ctx.spring('n3', 0, 'appearance.fast'), ctx.spring('n2', 1, 'appearance.default')]);
  },
});

export const TRANSITION_TREES = {
  go: { title: 'Go to another area', scenes: [go] },
  drill: { title: 'Drill into and climb back out', scenes: [drillTree] },
  switch: { title: 'Switch views', scenes: [switchTree] },
  step: { title: 'Step to the next or previous', scenes: [stepTree] },
};

// ---------- The demos, in page order ----------

export const TRANSITION_DEMOS = {
  go: {
    title: 'Go to another area',
    scenes: [
      goTo({ id: 'go-fade', title: 'A clean fade in place', caption: 'The Sidebar highlight moves; the old page fades out, then the new page fades in, in place. The Sidebar itself does not move.' }),
      goTo({ id: 'go-slide', title: 'The pages slide', slide: true, caption: 'A slide says the two areas sit side by side. They are unrelated, so nothing should slide.' }),
    ],
  },
  drill: {
    title: 'Depth 1: the row grows into the record',
    scenes: [
      drill({ id: 'drill-grow', title: 'The row grows into the record', caption: 'The container is the only mover. The list fades out in place with nothing dimmed, and the record\'s content fades in once the container is well on its way.' }),
    ],
  },
  deeper: {
    title: 'Deeper levels: the same rule',
    scenes: [
      drill({ id: 'deeper-grow', title: 'Depth 2: the row grows again', crumbs: 2, caption: 'Whatever was chosen becomes the page, at any depth, and the Breadcrumb arrives one level longer.' }),
      drill({ id: 'deeper-slide', title: 'Depth 2: a page slides in from the right', mode: 'slide', crumbs: 2, caption: 'Beside a docked Sidebar a sliding page reads as a drawer, not a deeper place.' }),
    ],
  },
  climb: { title: 'Climbing back out', scenes: [climbOne, climbTwo] },
  focused: {
    title: 'A focused task',
    scenes: [
      focused({ id: 'focused-fade', title: 'The frame fades, the task fades in', caption: 'The task changes the frame itself, so it is a clean fade in place: the page and Sidebar fade out, then the task fades in. Close reverses it.' }),
      focused({ id: 'focused-slide', title: 'The task slides in from the side', slide: true, caption: 'A slide says the task sits beside the page. It replaces the frame, so it fades.' }),
    ],
  },
  switch: {
    title: 'Switch views',
    scenes: [
      switchViews({ id: 'switch-slide', title: 'Both bodies slide together', caption: 'The views are peers in a row: the indicator moves on spatial.fast and both bodies slide as one flat sheet, no fade.' }),
      switchViews({ id: 'switch-fade', title: 'A fade on the slide', fade: true, caption: 'A fade on top of the slide reads as going deeper, and tabs are not deeper.' }),
    ],
  },
  step: {
    title: 'Step to the next or previous',
    scenes: [
      step({ id: 'step-across', title: 'Steps across the top: the body slides across', axis: 'x', caption: 'The row runs across, so the body moves across with it. Visited, current and unvisited change in place.' }),
      step({ id: 'step-across-wrong', title: 'Steps across the top: the body slides up', axis: 'y', caption: 'The row says across and the body says up: two axes for one move.' }),
      step({ id: 'step-down', title: 'Steps down a side: the body slides up', side: true, axis: 'y', caption: 'The list runs down, so Next brings the new step up from below and Back brings it down from above.' }),
      step({ id: 'step-down-wrong', title: 'Steps down a side: the body slides across', side: true, axis: 'x', caption: 'The list says down and the body says across: two axes for one move.' }),
    ],
  },
  ...WITHIN_DEMOS,
  ...ABOVE_DEMOS,
  ...FEEDBACK_DEMOS,
};
