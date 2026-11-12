import React, { useEffect, useRef, useState } from 'react';
import { animate } from 'motion';
import { useReducedMotion } from 'motion/react';

import { Button, Range, RadioGroup } from '@/components';
import { Illustration } from './Illustration.jsx';
import { Backdrop, Frame, Modal, PageHeader, Popup, Row } from './primitives.jsx';
import { ChartAxis, ChartCurve } from './primitives-motion.jsx';
import { SPEEDS, SPEED_LABELS, measure, ratioOf, springFor, stepOf } from './motion.jsx';
import { PHYSICS_DEMOS } from './motion-physics.jsx';

/**
 * The Playground page's figures (Foundations/Motion/Playground): a spring you
 * can tune by hand, and the feel checks. Everything here is for feel only; the
 * numbers in Physics are the only source of a token.
 */

const VIEW = '0 0 160 100';
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

export const PLAYGROUND_DEMOS = {
  extremes: { title: 'Stiff and soft', scenes: [stiff, soft] },
  shake: { title: 'The shake', scenes: [shake] },
  speeds: PHYSICS_DEMOS.size,
};
