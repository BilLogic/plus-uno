import React, { useEffect, useId, useRef, useState } from 'react';
import { animate } from 'motion';
import { useReducedMotion } from 'motion/react';

import { Button, Range, RadioGroup } from '@/components';
import { Illustration } from './Illustration.jsx';
import { HERO_HAIRLINE, PAINT } from './paint.js';
import { Backdrop, Frame, Modal, PageHeader, Panel, Popup, Rect, Row, Rule } from './primitives.jsx';
import { ChartAxis, ChartCurve, Pointer } from './primitives-motion.jsx';
import { SPEEDS, SPEED_LABELS, measure, ratioOf, resisted, springFor, stepOf, unresisted } from './motion.jsx';
import { PHYSICS_DEMOS } from './motion-physics.jsx';

/**
 * The Playground page's figures (Foundations/Expression/Motion/Playground): a spring you
 * can tune by hand, and the feel checks. Everything here is for feel only; the
 * numbers in Physics are the only source of a token.
 */

const VIEW_W = 160;
const VIEW = `0 0 ${VIEW_W} 100`;
const lerp = (a, b, t) => a + (b - a) * t;
const round2 = (n) => Math.round(n * 100) / 100;

// ---------- The spring the controls describe ----------

/**
 * The config the playground plays. With the controls untouched it is exactly
 * the generated config for the token and mode; a moved stiffness or ratio
 * rebuilds it the way the generator does: damping = 2 × ratio × √(stiffness × mass).
 */
export const playgroundConfig = ({ token = 'spatial.default', mode = 'productive', stiffness, ratio } = {}) => {
  const base = springFor(token, mode);
  const mass = base.mass ?? 1;
  const k = stiffness ?? base.stiffness;
  const r = ratio ?? ratioOf(base);
  if (k === base.stiffness && r === ratioOf(base)) return base;
  return { type: 'spring', stiffness: k, damping: round2(2 * r * Math.sqrt(k * mass)), mass };
};

const TOKENS = [
  { value: 'spatial.fast', label: 'spatial.fast' },
  { value: 'spatial.default', label: 'spatial.default' },
  { value: 'spatial.slow', label: 'spatial.slow' },
];
const MODES = [
  { value: 'productive', label: 'Productive' },
  { value: 'expressive', label: 'Expressive' },
];
const SPEED_OPTIONS = SPEEDS.map((s, i) => ({ value: String(s), label: SPEED_LABELS[i] }));

const TRIGGER = { x: 130, y: 26, w: 8, h: 8 };
const POPUP = { x: 92, y: 36, w: 48, h: 36 };
const SAMPLES = 48;

/** A menu opening on a spring you set: the controls, the move, and the curve it follows. */
export const SpringPlayground = ({ reduced: forcedReduced }) => {
  const deviceReduced = useReducedMotion();
  const prefersReduced = forcedReduced ?? deviceReduced;
  const [token, setToken] = useState('spatial.default');
  const [mode, setMode] = useState('productive');
  const [stiffness, setStiffness] = useState(null);
  const [ratio, setRatio] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [p, setP] = useState(0);
  const [phase, setPhase] = useState('idle');
  const [played, setPlayed] = useState(null);
  const controlsRef = useRef(null);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const config = playgroundConfig({ token, mode, stiffness, ratio });
  const base = springFor(token, mode);
  const m = measure(config);

  useEffect(() => () => controlsRef.current?.stop(), []);
  useEffect(() => {
    if (controlsRef.current) controlsRef.current.speed = speed;
  }, [speed]);

  const reset = (patch) => {
    setStiffness(null);
    setRatio(null);
    patch();
  };

  const play = () => {
    controlsRef.current?.stop();
    setPlayed(config);
    setP(0);
    if (prefersReduced) {
      setP(1);
      setPhase('settled');
      return;
    }
    setPhase('playing');
    const controls = animate(0, 1, { ...config, onUpdate: setP });
    controls.speed = speedRef.current;
    controlsRef.current = controls;
    controls.then(
      () => setPhase('settled'),
      () => {},
    );
  };

  const step = stepOf(config);
  const span = Math.max(0.2, m.settle * 1.15);
  const values = Array.from({ length: SAMPLES + 1 }, (_, i) => Math.min(1.25, step((i / SAMPLES) * span)));
  const ms = (s) => `${Math.round(s * 1000)} ms`;

  return (
    <section
      data-playground
      data-docs-stage
      data-config={JSON.stringify(config)}
      data-played={played ? JSON.stringify(played) : ''}
      data-phase={phase}
      data-speed={String(speed)}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, var(--card-min-width-sm)), 1fr))',
        gap: 'var(--grid-gutter)',
        padding: 'var(--card-pad-default)',
        borderRadius: 'var(--card-radius)',
        background: 'var(--ds-surface-sunken)',
        alignItems: 'start',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
        <RadioGroup
          legend="Start from"
          orientation="inline"
          options={TOKENS}
          value={token}
          onChange={(v) => reset(() => setToken(v))}
        />
        <RadioGroup
          legend="Mode"
          orientation="inline"
          options={MODES}
          value={mode}
          onChange={(v) => reset(() => setMode(v))}
        />
        <Range
          label="Stiffness"
          min={40}
          max={3000}
          step={10}
          value={stiffness ?? base.stiffness}
          onChange={(v) => setStiffness(v)}
        />
        <Range
          label="Damping ratio"
          min={0.2}
          max={1.2}
          step={0.05}
          value={ratio ?? ratioOf(base)}
          onChange={(v) => setRatio(round2(v))}
        />
        <RadioGroup
          legend="Playback speed"
          orientation="inline"
          options={SPEED_OPTIONS}
          value={String(speed)}
          onChange={(v) => setSpeed(Number(v))}
        />
        <div style={{ display: 'flex', gap: 'var(--space-100)', alignItems: 'center' }}>
          <Button appearance="primary" onClick={play}>
            Play
          </Button>
          <Button appearance="subtle" onClick={() => reset(() => {})}>
            Reset
          </Button>
        </div>
        <code style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>
          {`{ stiffness: ${config.stiffness}, damping: ${config.damping}, mass: ${config.mass ?? 1} }`}
        </code>
        <span style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>
          {`90% at ${ms(m.t90)} · settled at ${ms(m.settle)} · overshoot ${(m.overshoot * 100).toFixed(1)}%`}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
        <Illustration viewBox={VIEW} title="A menu opening from its button on the spring in the controls">
          <Frame x={8} y={6} w={144} h={88} />
          <PageHeader x={16} y={24} w={128} />
          {[0, 1, 2].map((i) => (
            <Row key={i} x={16} y={44 + i * 14} w={128} />
          ))}
          {p > 0.02 && (
            <Popup
              x={lerp(TRIGGER.x, POPUP.x, p)}
              y={lerp(TRIGGER.y, POPUP.y, p)}
              w={Math.max(1, lerp(TRIGGER.w, POPUP.w, p))}
              h={Math.max(1, lerp(TRIGGER.h, POPUP.h, p))}
              accent
            />
          )}
        </Illustration>
        <Illustration viewBox={VIEW} title="Position over time on the spring in the controls, against the dashed target">
          <ChartAxis x={12} y={10} w={136} h={80} />
          <ChartCurve x={12} y={10} w={136} h={80} values={values} accent />
        </Illustration>
      </div>
    </section>
  );
};

// ---------- The two ends of the dial ----------

const openingScene = ({ id, title, caption, stiffness }) => {
  const config = { type: 'spring', stiffness, mass: 1, damping: round2(2 * Math.sqrt(stiffness)) };
  return {
    id,
    title,
    caption,
    viewBox: VIEW,
    initial: { g: 0 },
    landing: { g: 1 },
    arrows: [[[134, 30], [116, 54]]],
    draw: ({ g }) => (
      <>
        <Frame x={8} y={6} w={144} h={88} />
        <PageHeader x={16} y={24} w={128} />
        {[0, 1, 2].map((i) => (
          <Row key={i} x={16} y={44 + i * 14} w={128} />
        ))}
        {g > 0.02 && (
          <Popup
            x={lerp(TRIGGER.x, POPUP.x, g)}
            y={lerp(TRIGGER.y, POPUP.y, g)}
            w={Math.max(1, lerp(TRIGGER.w, POPUP.w, g))}
            h={Math.max(1, lerp(TRIGGER.h, POPUP.h, g))}
            accent
          />
        )}
      </>
    ),
    play: async (ctx) => {
      await ctx.tap(134, 30);
      await ctx.spring('g', 1, config);
    },
  };
};
const stiff = openingScene({ id: 'extreme-stiff', title: 'Very stiff', caption: 'Stiffness 3000: the menu snaps open.', stiffness: 3000 });
const soft = openingScene({ id: 'extreme-soft', title: 'Very soft', caption: 'Stiffness 60: the menu drifts open and you wait for it.', stiffness: 60 });

// ---------- The shake ----------

/** A blocked Save: one kick at 420 px/s (210 kit units) into a stiff, lightly damped spring. */
const SHAKE_SPRING = { type: 'spring', stiffness: 1187.5, damping: 15, mass: 1 };
const SHAKE_KICK = 210;
const shake = {
  id: 'shake',
  title: 'A blocked Save shakes once',
  caption: 'A kick into a stiff spring: it peaks at about 9 px after 40 ms and settles within a quarter of a second.',
  viewBox: VIEW,
  initial: { x: 0, shook: 0 },
  landing: { x: 0, shook: 1 },
  arrows: [],
  draw: ({ x }) => (
    <>
      <Frame x={8} y={6} w={144} h={88} />
      <PageHeader x={16} y={24} w={128} />
      <Backdrop x={8} y={20} w={144} h={74} />
      <g transform={`translate(${x} 0)`}>
        <Modal x={34} y={32} w={92} h={52} accent />
      </g>
    </>
  ),
  play: async (ctx) => {
    await ctx.tap(112, 78);
    ctx.set({ shook: 1, x: 0.001 });
    await ctx.spring('x', 0, SHAKE_SPRING, { velocity: SHAKE_KICK });
  },
};

// ---------- Damping at a limit, by hand ----------

// A docked Panel on the right of the Frame: its resting width, how far it may
// widen, and the Frame's right edge, in kit units (1 unit = 2 px).
const LIMIT_FRAME_RIGHT = 152;
const LIMIT_PANEL = { y: 18, h: 76, rest: 40, extra: 25 };
const LIMIT_W = LIMIT_PANEL.rest + LIMIT_PANEL.extra;
/** The Panel's width for a pull of `d` units: one to one up to the limit, then `resisted()`. */
export const limitWidth = (d) => LIMIT_PANEL.rest + Math.min(Math.max(0, d), LIMIT_PANEL.extra) + resisted(d - LIMIT_PANEL.extra);
/** Where a let-go Panel comes to rest: where it was, held to the limit. */
export const limitRest = (w) => Math.min(Math.max(w, LIMIT_PANEL.rest), LIMIT_W);
// One key press pulls the edge 6 units (12 px): far enough to feel the resistance within a few presses.
const KEY_STEP = 6;

/**
 * Drag a docked Panel's edge to the left, past the dashed limit: up to it the
 * Panel follows the hand one to one, past it less and less, and let go it
 * springs back to the limit on `motion.spatial.fast` with the speed it had.
 * ArrowLeft and ArrowRight pull while held; letting go of the key lets go.
 */
export const DragPastLimit = ({ reduced: forcedReduced }) => {
  const deviceReduced = useReducedMotion();
  const reduced = forcedReduced ?? deviceReduced;
  const [w, setW] = useState(LIMIT_PANEL.rest);
  const [phase, setPhase] = useState('rest');
  const [hand, setHand] = useState(null);
  const svgRef = useRef(null);
  const drag = useRef(null);
  const controls = useRef(null);
  useEffect(() => () => controls.current?.stop(), []);

  // Measured on the drawing itself, so a pixel of pointer travel is converted at the drawing's own scale.
  const drawing = () => svgRef.current.querySelector('svg');
  const unitsPerPx = () => VIEW_W / drawing().getBoundingClientRect().width;
  const grab = (startW) => {
    controls.current?.stop();
    // The pull that gives the current width, so a second grab picks up where the Panel is.
    const d = startW > LIMIT_W ? LIMIT_PANEL.extra + unresisted(startW - LIMIT_W) : startW - LIMIT_PANEL.rest;
    drag.current = { d, last: { w: startW, t: performance.now() }, v: 0 };
    setPhase('dragging');
  };
  const pull = (d) => {
    const g = drag.current;
    const next = limitWidth(d);
    const now = performance.now();
    if (now > g.last.t) g.v = ((next - g.last.w) / (now - g.last.t)) * 1000;
    g.last = { w: next, t: now };
    g.d = d;
    setW(next);
  };
  const letGo = () => {
    const g = drag.current;
    if (!g) return;
    drag.current = null;
    setHand(null);
    const from = g.last.w;
    const to = limitRest(from);
    if (from === to) return setPhase('rest');
    // Under reduced motion the hand still drives the drag (it is the person's own motion, resistance
    // included), but the return is not played: the Panel is simply at the limit.
    if (reduced) {
      setW(to);
      return setPhase('rest');
    }
    setPhase('returning');
    controls.current = animate(from, to, { ...springFor('spatial.fast'), velocity: g.v, onUpdate: setW });
    controls.current.then(() => setPhase('rest'));
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    grab(w);
    drag.current.x0 = e.clientX;
    drag.current.d0 = drag.current.d;
  };
  const onPointerMove = (e) => {
    const g = drag.current;
    if (!g || g.x0 === undefined) return;
    const d = g.d0 + (g.x0 - e.clientX) * unitsPerPx();
    const rect = drawing().getBoundingClientRect();
    setHand({ x: (e.clientX - rect.left) * unitsPerPx(), y: (e.clientY - rect.top) * unitsPerPx() });
    pull(d);
  };
  // ArrowLeft and ArrowUp pull the edge out (wider), ArrowRight and ArrowDown push it back.
  const WIDER = { ArrowLeft: 1, ArrowUp: 1, ArrowRight: -1, ArrowDown: -1 };
  const onKeyDown = (e) => {
    if (!(e.key in WIDER)) return;
    e.preventDefault();
    if (!drag.current) grab(w);
    pull(drag.current.d + WIDER[e.key] * KEY_STEP);
  };
  const onKeyUp = (e) => {
    if (e.key in WIDER) letGo();
  };
  const describedBy = `${useId()}-how`;

  const edge = LIMIT_FRAME_RIGHT - w;
  return (
    <section
      data-drag-limit
      data-docs-stage
      data-phase={phase}
      data-width={String(Math.round(w * 100) / 100)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--stack-md)',
        padding: 'var(--card-pad-default)',
        borderRadius: 'var(--card-radius)',
        background: 'var(--ds-surface-sunken)',
      }}
    >
      <div
        style={{
          borderRadius: 'var(--radius-lg)',
          background: 'var(--ds-surface)',
          paddingBlock: 'var(--card-pad-default)',
          '--stroke-hairline': HERO_HAIRLINE,
          touchAction: 'none',
        }}
      >
        {/* The whole drawing is the handle: grab anywhere and pull left. */}
        <div
          ref={svgRef}
          role="slider"
          tabIndex={0}
          aria-label="Panel width"
          aria-describedby={describedBy}
          aria-orientation="horizontal"
          aria-valuemin={LIMIT_PANEL.rest}
          aria-valuemax={LIMIT_W}
          aria-valuenow={Math.round(Math.min(w, LIMIT_W))}
          aria-valuetext={w > LIMIT_W + 0.5 ? 'Pulled past the limit' : w >= LIMIT_W - 0.5 ? 'At the limit' : 'Below the limit'}
          data-grab
          style={{ cursor: 'ew-resize', borderRadius: 'var(--radius-lg)' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={letGo}
          onPointerCancel={letGo}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onBlur={letGo}
        >
          <Illustration viewBox={VIEW} title="A docked Panel whose edge you drag left, past a dashed limit">
            <Frame x={8} y={6} w={144} h={88} />
            <PageHeader x={16} y={24} w={Math.max(20, edge - 24)} />
            {[0, 1, 2].map((i) => (
              <Row key={i} x={16} y={44 + i * 14} w={Math.max(20, edge - 24)} />
            ))}
            <Panel x={edge} y={LIMIT_PANEL.y} w={w} h={LIMIT_PANEL.h} accent />
            <Rule x1={LIMIT_FRAME_RIGHT - LIMIT_W} x2={LIMIT_FRAME_RIGHT - LIMIT_W} y1={18} y2={94} stroke={PAINT.target} dash="3 3" />
            <Rect x={edge - 1} y={50} w={2} h={12} fill={PAINT.accent} corner="shape" />
            {hand && <Pointer x={hand.x} y={hand.y} />}
          </Illustration>
        </div>
      </div>
      <p id={describedBy} style={{ margin: 0, font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>
        Drag the edge left, or focus it and hold ArrowLeft; let go to release.
      </p>
    </section>
  );
};

export const PLAYGROUND_DEMOS = {
  extremes: { title: 'Stiff and soft', scenes: [stiff, soft] },
  shake: { title: 'The shake', scenes: [shake] },
  speeds: PHYSICS_DEMOS.size,
};
