import React from 'react';
import { HAIRLINE, PAINT } from './paint.js';
import {
  Backdrop, ButtonShape, CardBox, Field, Flag, Modal, Panel, PageHeader, Rect, Rule, Row, Screen, SkeletonBar,
} from './primitives.jsx';
import { BEAT } from './motion.jsx';
import { Clip, Moved, VIEW, mix } from './motion-parts.jsx';

/**
 * The Transitions page's figures for Within a place, Above a place and Feedback
 * (Foundations/Motion/Transitions). Blocked out in kit shapes with no words;
 * every scene lands at `landing`, which the stories assert. A Don't is the same
 * scene with one rule broken, listed second in its demo.
 */

// The screen every scene sits in: Frame (8,6,144,88), a docked Sidebar and its Page.
const PAGE = { x: 52, y: 18, w: 99, h: 75 };
const BODY = { x: 60, y: 48, w: 83, h: 44 };
const FRAME = { x: 8, y: 6, w: 144, h: 88 };
const HEADER_BUTTON = [128, 34];

/** Milliseconds as beats, for the few pauses the rules count in time. */
const ms = (n) => n / 1000 / BEAT;
/** The stagger between items: 20 ms apart, or 500 ms divided by the items if that is shorter. */
const stagger = (items) => ms(Math.min(20, 500 / items));

const Base = ({ children, header = true }) => (
  <Screen {...FRAME} header={false}>
    {header && <PageHeader x={60} y={26} w={83} />}
    {children}
  </Screen>
);

const scene = (s) => ({ viewBox: VIEW, arrows: [], ...s });

// ---------- Scroll to a spot on the page ----------

const SCROLL = 44;
const scrollTo = scene({
  id: 'scroll-spot',
  title: 'The page scrolls to the spot, then marks it',
  caption: 'The body travels on spatial.slow while the header stays put. On arrival the heading takes one highlight, in and out.',
  initial: { s: 0, h: 0, seen: 0 },
  landing: { s: 1, h: 0, seen: 1 },
  arrows: [[[110, 86], [110, 50]]],
  draw: ({ s, h }) => (
    <>
      <Base />
      <Clip x={60} y={46} w={72} h={46}>
        <Moved y={-s * SCROLL}>
          <Row x={60} y={48} w={72} />
          <Row x={60} y={62} w={72} />
          <Row x={60} y={76} w={72} />
          <SkeletonBar x={60} y={94} w={30} h={5} heading />
          <CardBox x={60} y={104} w={72} h={26} />
        </Moved>
      </Clip>
      <Rect x={58} y={48} w={74} h={9} stroke={PAINT.accent} corner="shape" opacity={h} />
      {[48, 56, 64].map((y, i) => (
        <SkeletonBar key={y} x={137} y={y} w={9} accent={i === 2} />
      ))}
    </>
  ),
  play: async (ctx) => {
    await ctx.hold(1);
    await ctx.tap(141, 66);
    await ctx.spring('s', 1, 'spatial.slow');
    await ctx.spring('h', 1, 'appearance.fast');
    await ctx.hold(ms(500));
    await ctx.spring('h', 0, 'appearance.slow');
    ctx.set({ seen: 1 });
  },
});

// ---------- Swap content in place ----------

const PILLS = [60, 88, 116];
const swap = ({ id, title, caption, crossfade }) =>
  scene({
    id,
    title,
    caption,
    initial: { f: 0, o: 1, n: 0 },
    landing: { f: 1, o: 0, n: 1 },
    arrows: [[[72, 56], [100, 56]]],
    draw: ({ f, o, n }) => (
      <>
        <Base />
        {PILLS.map((x) => (
          <Rect key={x} x={x} y={44} w={24} h={12} fill={PAINT.shape} corner="tab" />
        ))}
        <Rect x={mix(PILLS[0], PILLS[1], f)} y={44} w={24} h={12} fill={PAINT.accent} corner="tab" />
        <g opacity={o}>
          <Row x={60} y={62} w={83} />
          <Row x={60} y={76} w={83} />
        </g>
        <g opacity={n}>
          <CardBox x={60} y={62} w={38} h={28} />
          <CardBox x={104} y={62} w={39} h={28} />
        </g>
      </>
    ),
    play: async (ctx) => {
      await ctx.hold(1);
      await ctx.tap(PILLS[1] + 12, 50);
      const content = crossfade
        ? Promise.all([ctx.spring('o', 0, 'appearance.slow'), ctx.spring('n', 1, 'appearance.slow')])
        : (async () => {
            await ctx.spring('o', 0, 'appearance.fast');
            await ctx.spring('n', 1, 'appearance.fast');
          })();
      await Promise.all([ctx.spring('f', 1, 'spatial.fast'), content]);
    },
  });

// ---------- Add or remove an item ----------

const ROW_H = 14;
const addRemove = ({ id, title, caption, removing }) =>
  scene({
    id,
    title,
    caption,
    initial: removing ? { h: 1, c: 1 } : { h: 0, c: 0 },
    landing: removing ? { h: 0, c: 0 } : { h: 1, c: 1 },
    arrows: [removing ? [[148, 80], [148, 66]] : [[148, 66], [148, 80]]],
    draw: ({ h, c }) => (
      <>
        <Base />
        <Clip {...BODY}>
          <Row x={60} y={48} w={83} />
          <Clip x={60} y={62} w={83} h={ROW_H * h}>
            <g opacity={c}>
              <Row x={60} y={62} w={83} accent />
            </g>
          </Clip>
          <Row x={60} y={62 + ROW_H * h} w={83} />
          <Row x={60} y={76 + ROW_H * h} w={83} />
        </Clip>
      </>
    ),
    play: async (ctx) => {
      await ctx.hold(1);
      if (removing) {
        await ctx.tap(138, 69);
        // The row fades as the gap closes.
        await Promise.all([ctx.spring('c', 0, 'appearance.fast'), ctx.spring('h', 0, 'spatial.fast')]);
        return;
      }
      await ctx.tap(130, 34);
      // The rows below make room as the new row opens; its content waits for the room.
      await ctx.spring('h', 1, 'spatial.fast');
      await ctx.spring('c', 1, 'appearance.fast');
    },
  });

// ---------- Reorder items ----------

const WIDTHS = [30, 18, 24];
const PERM = [1, 2, 0];
const SortRow = ({ x, y, w, i }) => (
  <g>
    <Rule x1={x} x2={x + w} y1={y + 14} y2={y + 14} stroke={PAINT.rowDivider} />
    <Rect x={x + 4} y={y + 4} w={6} h={6} fill={PAINT.placeholderText} corner="tab" />
    <SkeletonBar x={x + 16} y={y + 5} w={WIDTHS[i] * 1.6} heading={i === 0} />
    <SkeletonBar x={x + w * 0.8} y={y + 5} w={w * 0.12} />
  </g>
);
const reorder = scene({
  id: 'reorder-sort',
  title: 'The same rows, a new order',
  caption: 'Each row moves straight to its new place on spatial.default, 20 ms apart. In a grid it moves x then y.',
  initial: { r0: 0, r1: 0, r2: 0 },
  landing: { r0: 1, r1: 1, r2: 1 },
  arrows: [[[100, 55], [100, 69]], [[146, 83], [146, 55]]],
  draw: ({ r0, r1, r2 }) => (
    <>
      <Base />
      <Clip {...BODY}>
        {[r0, r1, r2].map((r, i) => (
          <Moved key={i} y={(PERM[i] - i) * ROW_H * r}>
            <SortRow x={60} y={48 + i * ROW_H} w={83} i={i} />
          </Moved>
        ))}
      </Clip>
    </>
  ),
  play: async (ctx) => {
    await ctx.hold(1);
    await ctx.tap(130, 34);
    await Promise.all(
      [0, 1, 2].map(async (i) => {
        await ctx.hold(i * stagger(3));
        await ctx.spring(`r${i}`, 1, 'spatial.default');
      }),
    );
  },
});

// ---------- Expand and collapse ----------

const DETAIL = 30;
const Chevron = ({ x, y, open }) => (
  <path
    d={`M${x - 3} ${y - 1.5} L${x} ${y + 1.5} L${x + 3} ${y - 1.5}`}
    fill="none"
    stroke={PAINT.placeholderText}
    style={HAIRLINE}
    transform={`rotate(${-90 * (1 - open)} ${x} ${y})`}
  />
);
const expand = ({ id, title, caption, closing }) =>
  scene({
    id,
    title,
    caption,
    initial: closing ? { h: 1, c: 1 } : { h: 0, c: 0 },
    landing: closing ? { h: 0, c: 0 } : { h: 1, c: 1 },
    arrows: [closing ? [[100, 90], [100, 66]] : [[100, 66], [100, 90]]],
    draw: ({ h, c }) => (
      <>
        <Base />
        <Clip {...BODY}>
          <Row x={60} y={48} w={83} />
          <Chevron x={136} y={55} open={h} />
          <Clip x={60} y={62} w={83} h={DETAIL * h}>
            <g opacity={c}>
              <CardBox x={60} y={62} w={83} h={DETAIL - 2} />
              <SkeletonBar x={68} y={70} w={40} />
              <SkeletonBar x={68} y={78} w={56} />
            </g>
          </Clip>
          <Row x={60} y={62 + DETAIL * h} w={83} />
          <Row x={60} y={76 + DETAIL * h} w={83} />
        </Clip>
      </>
    ),
    play: async (ctx) => {
      await ctx.hold(1);
      await ctx.tap(100, 55);
      if (closing) {
        await ctx.spring('c', 0, 'appearance.fast');
        await ctx.spring('h', 0, 'spatial.fast');
        return;
      }
      // Height, the rows below and the chevron move together; the detail waits for room.
      await ctx.spring('h', 1, 'spatial.fast');
      await ctx.spring('c', 1, 'appearance.fast');
    },
  });

// ---------- Load content ----------

const LOAD_ROWS = [38, 52, 66];
const LOAD_KEYS = ['r1', 'r2', 'r3'];
const load = ({ id, title, caption, skeleton }) =>
  scene({
    id,
    title,
    caption,
    initial: { sk: skeleton ? 1 : 0, sh: 0, hd: 0, r1: 0, r2: 0, r3: 0, pri: 0, ch: 0 },
    landing: { sk: 0, hd: 1, r1: 1, r2: 1, r3: 1, pri: 1, ch: 1 },
    draw: ({ sk, sh, hd, r1, r2, r3, pri, ch }) => {
      // With no Skeleton to hold the room, the rows sit high until the header arrives and push them down.
      const rise = skeleton ? 0 : 12 * (1 - hd);
      return (
        <>
          <Base header={false} />
          <g opacity={hd}>
            <SkeletonBar x={60} y={26} w={30} h={6} heading />
          </g>
          {[r1, r2, r3].map((o, i) => (
            <g key={i} opacity={o}>
              <Row x={60} y={LOAD_ROWS[i] - rise} w={83} />
            </g>
          ))}
          <g opacity={pri}>
            <ButtonShape x={120} y={24} w={23} appearance="primary" />
          </g>
          <g opacity={ch}>
            {[10, 18, 14, 22].map((bh, i) => (
              <Rect key={i} x={62 + i * 12} y={90 - bh} w={8} h={bh} fill={PAINT.shape} corner="shape" />
            ))}
          </g>
          {skeleton && (
            <g opacity={sk}>
              <SkeletonBar x={60} y={26} w={30} h={6} heading />
              {LOAD_ROWS.map((y) => (
                <SkeletonBar key={y} x={60} y={y + 2} w={83} h={10} />
              ))}
              <SkeletonBar x={120} y={24} w={23} h={8} />
              <SkeletonBar x={62} y={70} w={44} h={20} />
              <Clip {...BODY}>
                <Rect x={mix(40, 150, sh)} y={20} w={14} h={74} fill={PAINT.pageSurface} opacity={0.5} />
              </Clip>
            </g>
          )}
        </>
      );
    },
    play: async (ctx) => {
      await ctx.hold(1);
      if (skeleton) {
        // The shimmer follows time one to one while the person waits.
        await ctx.linear('sh', 1, 2);
        await Promise.all([
          ctx.spring('hd', 1, 'appearance.default'),
          ctx.spring('sk', 0, 'appearance.fast'),
        ]);
        await Promise.all(
          LOAD_KEYS.map(async (key, i) => {
            await ctx.hold(i * stagger(3));
            await ctx.spring(key, 1, 'appearance.default');
          }),
        );
        await ctx.spring('pri', 1, 'appearance.default');
        await ctx.spring('ch', 1, 'appearance.default');
        return;
      }
      // The same order with nothing holding the room: each part pops in and the rest jumps.
      ctx.set({ r1: 1, r2: 1, r3: 1 });
      await ctx.hold(1);
      ctx.set({ hd: 1 });
      await ctx.hold(1);
      ctx.set({ pri: 1, ch: 1 });
    },
  });

// ---------- Overlays ----------

/** The page every overlay opens over. */
const UnderPage = () => (
  <>
    <Base />
    <Row x={60} y={48} w={83} />
    <Row x={60} y={62} w={83} />
    <Row x={60} y={76} w={83} />
  </>
);

const MODAL = { x: 66, y: 22, w: 76, h: 62 };
const CENTER = [MODAL.x + MODAL.w / 2, MODAL.y + MODAL.h / 2];
const Scaled = ({ s, opacity, children }) => (
  <g opacity={opacity} transform={`translate(${CENTER[0]} ${CENTER[1]}) scale(${s}) translate(${-CENTER[0]} ${-CENTER[1]})`}>
    {children}
  </g>
);

const modalScene = ({ id, title, caption, closing }) =>
  scene({
    id,
    title,
    caption,
    initial: closing ? { m: 1, s: 1, d: 1 } : { m: 0, s: 0.96, d: 0 },
    landing: closing ? { m: 0, s: 0.98, d: 0 } : { m: 1, s: 1, d: 1 },
    arrows: [],
    draw: ({ m, s, d }) => (
      <>
        <UnderPage />
        <g opacity={d}>
          <Backdrop {...FRAME} />
        </g>
        <Scaled s={s} opacity={m}>
          <Modal {...MODAL} accent />
        </Scaled>
      </>
    ),
    play: async (ctx) => {
      await ctx.hold(1);
      if (closing) {
        await ctx.tap(116, 76);
        await Promise.all([
          ctx.spring('s', 0.98, 'spatial.fast'),
          ctx.spring('m', 0, 'appearance.fast'),
          ctx.spring('d', 0, 'appearance.fast'),
        ]);
        return;
      }
      await ctx.tap(...HEADER_BUTTON);
      await Promise.all([
        ctx.spring('s', 1, 'spatial.default'),
        ctx.spring('m', 1, 'appearance.default'),
        ctx.spring('d', 1, 'appearance.default'),
      ]);
    },
  });

const DRAWER = { x: 100, y: 6, w: 52, h: 88 };
const drawerScene = ({ id, title, caption, closing }) =>
  scene({
    id,
    title,
    caption,
    initial: closing ? { x: 0, d: 1 } : { x: 1, d: 0 },
    landing: closing ? { x: 1, d: 0 } : { x: 0, d: 1 },
    arrows: [closing ? [[110, 50], [148, 50]] : [[148, 50], [110, 50]]],
    draw: ({ x, d }) => (
      <>
        <UnderPage />
        <g opacity={d}>
          <Backdrop {...FRAME} />
        </g>
        <Clip {...FRAME}>
          <Moved x={x * (DRAWER.w + 6)}>
            <Panel {...DRAWER} floating accent />
          </Moved>
        </Clip>
      </>
    ),
    play: async (ctx) => {
      await ctx.hold(1);
      if (closing) {
        await ctx.tap(60, 70);
        // The Drawer goes back to the same edge and never fades; only the Blanket does.
        await Promise.all([ctx.spring('x', 1, 'spatial.default'), ctx.spring('d', 0, 'appearance.fast')]);
        return;
      }
      await ctx.tap(...HEADER_BUTTON);
      await Promise.all([ctx.spring('x', 0, 'spatial.slow'), ctx.spring('d', 1, 'appearance.default')]);
    },
  });

const FLAG = { x: 94, y: 10, w: 54, h: 26 };
const FLAG_EDGE = 60;
const flagScene = ({ id, title, caption, closing }) =>
  scene({
    id,
    title,
    caption,
    initial: closing ? { x: 0, f: 1 } : { x: FLAG_EDGE, f: 0 },
    landing: closing ? { x: FLAG_EDGE, f: 0 } : { x: 0, f: 1 },
    arrows: [closing ? [[100, 23], [148, 23]] : [[148, 23], [100, 23]]],
    draw: ({ x, f }) => (
      <>
        <UnderPage />
        <Clip {...FRAME}>
          <Moved x={x} opacity={f}>
            <Flag {...FLAG} tone="success" accent />
          </Moved>
        </Clip>
      </>
    ),
    play: async (ctx) => {
      await ctx.hold(1);
      if (closing) {
        // A timeout leaves the way it came, on the exit spring, still speeding up at the edge.
        await ctx.exit('x', FLAG_EDGE);
        ctx.set({ f: 0 });
        return;
      }
      await ctx.tap(...HEADER_BUTTON);
      await Promise.all([ctx.spring('x', 0, 'spatial.default'), ctx.spring('f', 1, 'appearance.default')]);
    },
  });

/** Confirm carries on; Cancel reverses the entrance. The row's status is the third row's pill. */
const confirmScene = ({ id, title, caption, confirm }) =>
  scene({
    id,
    title,
    caption,
    initial: { m: 1, s: 1, d: 1, c: 0, fx: FLAG_EDGE, fo: 0 },
    landing: confirm ? { m: 0, d: 0, c: 1, fx: 0, fo: 1 } : { m: 0, s: 0.96, d: 0, c: 0, fo: 0 },
    arrows: [],
    draw: ({ m, s, d, c, fx, fo }) => (
      <>
        <Base />
        <Row x={60} y={48} w={83} />
        <Row x={60} y={62} w={83} />
        <Row x={60} y={76} w={83} />
        <Rect x={124} y={80} w={14} h={6} fill={PAINT.countSurface} corner="count" />
        <Rect x={124} y={80} w={14} h={6} fill={PAINT.accent} corner="count" opacity={c} />
        <g opacity={d}>
          <Backdrop {...FRAME} />
        </g>
        <Scaled s={s} opacity={m}>
          <Modal {...MODAL} accent />
        </Scaled>
        <Clip {...FRAME}>
          <Moved x={fx} opacity={fo}>
            <Flag {...FLAG} tone="success" />
          </Moved>
        </Clip>
      </>
    ),
    play: async (ctx) => {
      await ctx.hold(1);
      if (!confirm) {
        await ctx.tap(94, 76);
        // Cancel shrinks the Modal back the way it came, and nothing else changes.
        await Promise.all([
          ctx.spring('s', 0.96, 'spatial.fast'),
          ctx.spring('m', 0, 'appearance.fast'),
          ctx.spring('d', 0, 'appearance.fast'),
        ]);
        return;
      }
      await ctx.tap(124, 76);
      await Promise.all([
        ctx.spring('s', 0.98, 'spatial.fast'),
        ctx.spring('m', 0, 'appearance.fast'),
        ctx.spring('d', 0, 'appearance.fast'),
      ]);
      await ctx.spring('c', 1, 'appearance.default');
      await Promise.all([ctx.spring('fx', 0, 'spatial.default'), ctx.spring('fo', 1, 'appearance.default')]);
    },
  });

// ---------- Dock and undock ----------

const SIDE = 34;
const DOCK_PANEL = { x: PAGE.x + PAGE.w - SIDE, y: PAGE.y, w: SIDE, h: PAGE.h };
const dockScene = ({ id, title, caption, closing }) =>
  scene({
    id,
    title,
    caption,
    initial: closing ? { p: 1, c: 1 } : { p: 0, c: 0 },
    landing: closing ? { p: 0, c: 0 } : { p: 1, c: 1 },
    arrows: [closing ? [[130, 55], [152, 55]] : [[152, 55], [130, 55]]],
    draw: ({ p, c }) => (
      <>
        <Base header={false} />
        <PageHeader x={60} y={26} w={83 - SIDE * p} />
        {[48, 62, 76].map((y) => (
          <Row key={y} x={60} y={y} w={83 - SIDE * p} />
        ))}
        <Clip x={DOCK_PANEL.x} y={DOCK_PANEL.y} w={SIDE + 1} h={DOCK_PANEL.h}>
          <Moved x={(1 - p) * SIDE}>
            <Panel {...DOCK_PANEL} accent />
            {/* The content fades in after the Panel arrives: a cover in the panel's own surface leaves it. */}
            <Rect x={DOCK_PANEL.x + 2} y={DOCK_PANEL.y + 4} w={SIDE - 3} h={DOCK_PANEL.h - 8} fill={PAINT.panelSurface} opacity={1 - c} />
          </Moved>
        </Clip>
      </>
    ),
    play: async (ctx) => {
      await ctx.hold(1);
      if (closing) {
        await ctx.tap(138, 30);
        await ctx.spring('c', 0, 'appearance.fast');
        await ctx.spring('p', 0, 'spatial.default');
        return;
      }
      await ctx.tap(...HEADER_BUTTON);
      // The page makes room on the Panel's own clock; the content follows once the page is about 90% there.
      await Promise.all([
        ctx.spring('p', 1, 'spatial.slow'),
        (async () => {
          await ctx.hold(ms(250));
          await ctx.spring('c', 1, 'appearance.fast');
        })(),
      ]);
    },
  });

const floatScene = scene({
  id: 'dock-floating',
  title: 'A floating Panel slides over and the page stays',
  caption: 'Opens on spatial.default over the page, which does not move. No Blanket at desktop width.',
  initial: { x: 1 },
  landing: { x: 0 },
  arrows: [[[152, 55], [110, 55]]],
  draw: ({ x }) => (
    <>
      <UnderPage />
      <Clip {...FRAME}>
        <Moved x={x * (DRAWER.w + 6)}>
          <Panel x={104} y={14} w={44} h={74} floating accent />
        </Moved>
      </Clip>
    </>
  ),
  play: async (ctx) => {
    await ctx.hold(1);
    await ctx.tap(...HEADER_BUTTON);
    await ctx.spring('x', 0, 'spatial.default');
  },
});

// ---------- Update a value or state ----------

const update = scene({
  id: 'update-value',
  title: 'A status recolors; a number rolls once, then fades',
  caption: 'Color on appearance.default. The count rolls on spatial.fast the first time only; later updates fade to the new value.',
  initial: { c: 0, k: 0, f: 0 },
  landing: { c: 1, k: 1, f: 1 },
  arrows: [[[76, 60], [76, 72]]],
  draw: ({ c, k, f }) => (
    <>
      <Base />
      <Row x={60} y={48} w={83} />
      <Rect x={124} y={52} w={14} h={6} fill={PAINT.countSurface} corner="count" />
      <Rect x={124} y={52} w={14} h={6} fill={PAINT.accent} corner="count" opacity={c} />
      <CardBox x={60} y={66} w={83} h={24} />
      <Clip x={66} y={68} w={28} h={20}>
        <Moved y={14 * k} opacity={1 - k}>
          <SkeletonBar x={70} y={74} w={16} h={7} heading />
        </Moved>
        <Moved y={-14 * (1 - k)} opacity={k}>
          <g opacity={1 - f}>
            <SkeletonBar x={70} y={74} w={20} h={7} heading />
          </g>
          <g opacity={f}>
            <SkeletonBar x={70} y={74} w={16} h={7} heading />
          </g>
        </Moved>
      </Clip>
      <SkeletonBar x={100} y={76} w={30} />
    </>
  ),
  play: async (ctx) => {
    await ctx.hold(1);
    await ctx.spring('c', 1, 'appearance.default');
    await ctx.hold(1);
    await ctx.spring('k', 1, 'spatial.fast');
    await ctx.hold(1);
    await ctx.spring('f', 1, 'appearance.fast');
  },
});

// ---------- Call attention ----------

const attention = scene({
  id: 'attention-once',
  title: 'Look here, once',
  caption: 'A highlight in on appearance.fast, a short hold, out on appearance.slow. It never repeats.',
  initial: { h: 0, seen: 0 },
  landing: { h: 0, seen: 1 },
  draw: ({ h }) => (
    <>
      <Base />
      <Row x={60} y={48} w={83} />
      <Row x={60} y={62} w={83} />
      <Row x={60} y={76} w={83} />
      <Rect x={60} y={62} w={83} h={14} stroke={PAINT.accent} opacity={h} />
    </>
  ),
  play: async (ctx) => {
    await ctx.hold(1);
    await ctx.spring('h', 1, 'appearance.fast');
    await ctx.hold(ms(500));
    await ctx.spring('h', 0, 'appearance.slow');
    ctx.set({ seen: 1 });
  },
});

// ---------- Errors ----------

/**
 * The shake: a loose spring (stiffness 1187.5, damping 15, mass 1) kicked sideways,
 * one pattern and not a token (Physics). The kick is 420 px/s in drawing units.
 */
const SHAKE = { type: 'spring', stiffness: 1187.5, damping: 15, mass: 1 };
const KICK = 140;
const shake = async (ctx) => {
  // A spring started exactly at rest has nothing to release; start a hair off it.
  ctx.set({ sx: 0.001 });
  await ctx.spring('sx', 0, SHAKE, { velocity: KICK });
  ctx.set({ shook: 1 });
};

const Message = ({ x, y, w, opacity }) => (
  <g opacity={opacity}>
    <SkeletonBar x={x} y={y} w={w} h={3} tone={PAINT.fieldMessageDanger} />
  </g>
);

const FIELD_W = 83;
const errField = ({ id, title, caption, early }) =>
  scene({
    id,
    title,
    caption,
    initial: { f1: 0, f2: 0, b: 0, h: 0, m: 0 },
    landing: { f1: 0, f2: 1, b: 1, h: 1, m: 1 },
    draw: ({ f1, f2, b, h, m }) => (
      <>
        <Base header={false} />
        <Field x={60} y={24} w={FIELD_W} invalid={b > 0.5} />
        <Rect x={60} y={31} w={FIELD_W} h={20} stroke={PAINT.accent} corner="field" opacity={f1} />
        <Message x={60} y={54} w={46} opacity={m} />
        <Field x={60} y={56 + 8 * h} w={FIELD_W} />
        <Rect x={60} y={63 + 8 * h} w={FIELD_W} h={20} stroke={PAINT.accent} corner="field" opacity={f2} />
      </>
    ),
    play: async (ctx) => {
      const raise = async () => {
        await ctx.spring('b', 1, 'appearance.fast');
        await ctx.spring('h', 1, 'spatial.fast');
        await ctx.spring('m', 1, 'appearance.fast');
      };
      await ctx.hold(1);
      await ctx.tap(100, 41);
      await ctx.spring('f1', 1, 'appearance.fast');
      if (early) {
        // The Don't: red while the person is still typing.
        await ctx.hold(0.5);
        await raise();
      }
      await ctx.hold(1);
      await ctx.tap(100, 73);
      await Promise.all([ctx.spring('f1', 0, 'appearance.fast'), ctx.spring('f2', 1, 'appearance.fast')]);
      // The Do: the field is checked once focus leaves it.
      if (!early) await raise();
    },
  });

const MODAL_BASE = { x: 66, y: 18, w: 76, h: 60 };
const errModal = ({ id, title, caption, shakes }) =>
  scene({
    id,
    title,
    caption,
    initial: shakes ? { sx: 0, shook: 0 } : { h: 0, m: 0 },
    landing: shakes ? { sx: 0, shook: 1 } : { h: 1, m: 1 },
    draw: ({ sx = 0, h = 0, m = 0 }) => (
      <>
        <UnderPage />
        <Backdrop {...FRAME} />
        <Moved x={sx}>
          <Modal {...MODAL_BASE} h={MODAL_BASE.h + 12 * h} />
          <Message x={MODAL_BASE.x + 10} y={MODAL_BASE.y + 41} w={46} opacity={m} />
        </Moved>
      </>
    ),
    play: async (ctx) => {
      await ctx.hold(1);
      await ctx.tap(119, 68);
      await ctx.hold(0.5);
      if (shakes) {
        await shake(ctx);
        return;
      }
      // The system failed, not the person: the Modal stays still and a message makes room.
      await ctx.spring('h', 1, 'spatial.fast');
      await ctx.spring('m', 1, 'appearance.fast');
    },
  });

const errPage = ({ id, title, caption, shakes }) =>
  scene({
    id,
    title,
    caption,
    initial: shakes ? { b: 0, sx: 0, shook: 0 } : { b: 0, h: 0, m: 0, f1: 0 },
    landing: shakes ? { b: 1, sx: 0, shook: 1 } : { b: 1, h: 1, m: 1, f1: 1 },
    draw: ({ b, sx = 0, h = 0, m = 0, f1 = 0 }) => (
      <Moved x={sx}>
        <Base header={false} />
        <Message x={60} y={25} w={60} opacity={m} />
        <Field x={60} y={24 + 9 * h} w={58} invalid={b > 0.5} />
        <Rect x={60} y={31 + 9 * h} w={58} h={20} stroke={PAINT.accent} corner="field" opacity={f1} />
        <Field x={60} y={55 + 9 * h} w={58} invalid={b > 0.5} />
        <ButtonShape x={124} y={72} w={19} appearance="primary" />
      </Moved>
    ),
    play: async (ctx) => {
      await ctx.hold(1);
      await ctx.tap(133, 76);
      await ctx.spring('b', 1, 'appearance.fast');
      if (shakes) {
        await shake(ctx);
        return;
      }
      // A one-line summary makes room at the top and focus goes to the first error.
      await ctx.spring('h', 1, 'spatial.fast');
      await Promise.all([ctx.spring('m', 1, 'appearance.fast'), ctx.spring('f1', 1, 'appearance.fast')]);
    },
  });

// ---------- The demos, in page order ----------

export const WITHIN_DEMOS = {
  scroll: { title: 'Scroll to a spot on the page', scenes: [scrollTo] },
  swap: {
    title: 'Swap content in place',
    scenes: [
      swap({ id: 'swap-do', title: 'The old content is gone before the new arrives', caption: 'The pill fill glides; the rows fade out, then the cards fade in. One clean frame between.' }),
      swap({ id: 'swap-dont', title: 'Old and new cross-fade on top of each other', crossfade: true, caption: 'Half-transparent rows and cards overlap for a muddy moment, and the eye cannot read either.' }),
    ],
  },
  add: { title: 'Add an item', scenes: [addRemove({ id: 'add-row', title: 'A row joins from its seam', caption: 'The rows below make room on spatial.fast as the new row opens; its content fades in once there is room.' })] },
  remove: { title: 'Remove an item', scenes: [addRemove({ id: 'remove-row', title: 'A row fades, then the gap closes', removing: true, caption: 'The removed row fades on appearance.fast as the rows below close the gap.' })] },
  reorder: { title: 'Reorder items', scenes: [reorder] },
  expand: { title: 'Expand a row', scenes: [expand({ id: 'expand-row', title: 'A row opens down from its seam', caption: 'Height, the rows below and the chevron move together; the detail fades in once there is room.' })] },
  collapse: { title: 'Collapse a row', scenes: [expand({ id: 'collapse-row', title: 'A row closes back to its seam', closing: true, caption: 'The detail fades first, then the height closes on the same token it opened on.' })] },
  load: {
    title: 'Load content',
    scenes: [
      load({ id: 'load-do', title: 'A Skeleton holds the layout; content fades in, in order', skeleton: true, caption: 'The shimmer runs while waiting. Rows arrive 20 ms apart, then the primary action, then the chart. Nothing jumps.' }),
      load({ id: 'load-dont', title: 'No Skeleton: content pops in and pushes the layout', caption: 'The same order with nothing holding the room: each part pops in, and the rows jump when the header arrives.' }),
    ],
  },
};

export const ABOVE_DEMOS = {
  modalOpen: { title: 'Modal opens', scenes: [modalScene({ id: 'modal-open', title: 'Scales up from 96% and fades in', caption: 'The Blanket dims on the same clock. Scale is for floating layers only.' })] },
  modalClose: { title: 'Modal closes', scenes: [modalScene({ id: 'modal-close', title: 'Scales to 98% and fades', closing: true, caption: 'Leaves one speed faster than it arrived, on spatial.fast.' })] },
  drawerOpen: { title: 'Drawer opens', scenes: [drawerScene({ id: 'drawer-open', title: 'Slides in from its edge', caption: 'On spatial.slow; only the Blanket dims. The Drawer itself never fades.' })] },
  drawerClose: { title: 'Drawer closes', scenes: [drawerScene({ id: 'drawer-close', title: 'Slides back to the same edge', closing: true, caption: 'On spatial.default, and the Drawer stays at its edge.' })] },
  flagOpen: { title: 'Flag appears', scenes: [flagScene({ id: 'flag-open', title: 'Slides in from the top right', caption: 'On spatial.default with an appearance.default fade.' })] },
  flagClose: { title: 'Flag leaves', scenes: [flagScene({ id: 'flag-close', title: 'Leaves the way it came', closing: true, caption: 'A timeout leaves on spatial.exit; it is still speeding up as it crosses the edge.' })] },
  confirm: {
    title: 'Confirm carries on, Cancel reverses',
    scenes: [
      confirmScene({ id: 'confirm-cancel', title: 'Cancel reverses the entrance', caption: 'The Modal shrinks and fades back the way it came, one speed faster. Nothing else changes.' }),
      confirmScene({ id: 'confirm-go', title: 'Confirm carries on', confirm: true, caption: 'The Modal fades; the row\'s status recolors and a Flag confirms from the top right.' }),
    ],
  },
  dock: {
    title: 'Dock and undock a panel',
    scenes: [
      dockScene({ id: 'dock-docked', title: 'Docked: the page makes room', caption: 'The Panel slides in on spatial.slow while the page narrows on the same clock; its content fades in once the page is about 90% there.' }),
      dockScene({ id: 'dock-undock', title: 'Undocked: the content fades, then the Panel leaves', closing: true, caption: 'Closes one speed faster, and the page widens as the Panel goes.' }),
      floatScene,
    ],
  },
};

export const FEEDBACK_DEMOS = {
  update: { title: 'Update a value or state', scenes: [update] },
  attention: { title: 'Call attention', scenes: [attention] },
  errField: {
    title: 'An error in a field',
    scenes: [
      errField({ id: 'err-field-do', title: 'Checked when the field is left', caption: 'On blur the field turns red and its message makes room on spatial.fast, then fades in. No shake.' }),
      errField({ id: 'err-field-dont', title: 'Checked while typing', early: true, caption: 'An error before the person has finished is an interruption, not help.' }),
    ],
  },
  errModal: {
    title: 'Sending from a Modal failed',
    scenes: [
      errModal({ id: 'err-modal-do', title: 'A message makes room', caption: 'The failure is the system\'s, so the Modal stays still: a message opens at its top on spatial.fast and fades in.' }),
      errModal({ id: 'err-modal-dont', title: 'The Modal shakes', shakes: true, caption: 'The person did nothing wrong, yet the Modal shakes as if they had. A shake is only for a blocked submit.' }),
    ],
  },
  errPage: {
    title: 'Submitting a page',
    scenes: [
      errPage({ id: 'err-page-do', title: 'A summary makes room at the top', caption: 'The fields are marked, a one-line summary opens above the form, and focus goes to the first error. No shake.' }),
      errPage({ id: 'err-page-dont', title: 'The page shakes', shakes: true, caption: 'The whole page shakes and nothing says what to fix. A page gets a summary, never a shake.' }),
    ],
  },
};
