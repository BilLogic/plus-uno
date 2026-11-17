import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { animate } from 'motion';
import { useReducedMotion } from 'motion/react';

import { Button, IconButton } from '@/components';
import { DoDontCaption } from '@/storybook-docs/ds-docs-layout.jsx';

import { SPRINGS } from '@/tokens/ladder/springs.generated.js';
import { measureSpring, springStep } from '@/tokens/spring.js';
import { Illustration } from './Illustration.jsx';
import { HERO_HAIRLINE } from './paint.js';
import { Trail, TapRing } from './primitives-motion.jsx';
import { crossings, ghostless, ghostOf, pointsOf } from './trails.js';

/**
 * The illustration kit's motion layer. A demo animates kit primitives on the
 * generated springs (`springs.generated.js`, ADR-041) through the `motion`
 * package, so a drawing moves exactly as the product does. Every demo:
 * - draws each subject's path, start to landing, before the motion plays, with
 *   a dashed outline where it lands;
 * - keeps the paths of things that move together heading one way: none cross,
 *   unless the scene is the broken version and says `crossing: true` (dev builds
 *   warn about the rest);
 * - has a 1×, ½× and ¼× speed control that slows every spring and pause alike;
 * - under reduced motion, shows its landing as a still frame with the paths
 *   drawn, and plays one pass only when the reader asks.
 *
 * A demo is a list of scenes. A scene is `{ id, title, caption, viewBox,
 * initial, landing, arrows, draw, play }`: `draw(state)` returns the SVG for a
 * state, `play(ctx)` moves the state from `initial` to `landing` with the
 * `ctx` calls below, and `arrows` lists the paths (point lists, in viewBox
 * units) the subjects travel, each a point list or `{ points, ghost }` (see
 * `trails.js`). There are no timings here: every move reads a
 * spring token, and every pause is counted in beats.
 */

/**
 * A right way and its wrong ways, side by side: the first scene is the Do, every
 * other one a Don't, and each tile carries the tag the docs' Do/Don't pairs use.
 */
export const pair = (doScene, ...donts) => [
  { ...doScene, verdict: 'do' },
  ...donts.map((scene) => ({ ...scene, verdict: 'dont' })),
];

/** The speed control's steps, and how each reads. */
export const SPEEDS = [1, 0.5, 0.25];
export const SPEED_LABELS = ['1×', '½×', '¼×'];

/** A spring token's config for the `motion` package, in a mode. */
export const springFor = (token, mode = 'productive') => {
  const entry = SPRINGS[token];
  if (!entry) throw new Error(`No spring token named ${token}`);
  return entry[mode] ?? entry.productive;
};

/** A config's damping ratio: damping over 2 √(stiffness × mass). */
export const ratioOf = ({ stiffness, damping, mass = 1 }) =>
  Math.round((damping / (2 * Math.sqrt(stiffness * mass))) * 100) / 100;

/** A spring at a token's stiffness with a chosen ratio, for comparing ratios. */
export const springWithRatio = (token, ratio) => {
  const { stiffness, mass = 1 } = springFor(token);
  return { type: 'spring', stiffness, mass, damping: 2 * ratio * Math.sqrt(stiffness * mass) };
};

/**
 * Time to 90% and to settled (seconds) and the overshoot (a fraction), from the
 * same maths the token generator samples, so a table matches the CSS.
 */
export const measure = (config) =>
  measureSpring({ stiffness: config.stiffness, ratio: ratioOf(config), mass: config.mass ?? 1 });

/** Position over time of a spring released from 0 toward 1. */
export const stepOf = (config) =>
  springStep({ stiffness: config.stiffness, ratio: ratioOf(config), mass: config.mass ?? 1 });

/**
 * One beat: half a cycle of `motion.loop`, the slowest steady rhythm in the
 * system. Demos count their pauses in beats so no pause is a hand-picked time.
 */
const LOOP = springFor('loop');
export const LOOP_PERIOD = (2 * Math.PI) / Math.sqrt(LOOP.stiffness / (LOOP.mass ?? 1));
export const BEAT = LOOP_PERIOD / 2;

/**
 * Where a release would come to rest: the hand's speed carries it a further
 * velocity ÷ 1000 × 0.998 ÷ 0.002 px. Positions and velocities here are in the
 * kit's units (1 unit = 2 px).
 */
export const projectedRest = (position, velocity) => position + (((velocity * 2) / 1000) * 0.998) / 0.002 / 2;

/** Resistance past a limit: the square root of the extra distance, × 4 px, in kit units. */
export const resisted = (extra) => (Math.sqrt(Math.max(0, extra) * 2) * 4) / 2;
/** The extra distance past a limit that `resisted()` turns into `travel`: its inverse. */
export const unresisted = (travel) => (Math.max(0, travel) ** 2) / 8;

const round = (v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v);
const roundState = (state) => Object.fromEntries(Object.entries(state).map(([k, v]) => [k, round(v)]));

/**
 * The calls a scene's `play` makes. In `instant` mode (reduced motion's still
 * frame) every move lands at once and every pause is skipped.
 */
function createContext({ scene, getState, setState, track, instant, isLive, mode: defaultMode = 'productive' }) {
  const set = (patch) => setState(patch);
  const run = (from, to, options) => {
    if (instant) {
      options.onUpdate?.(to);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const controls = track(animate(from, to, { ...options }));
      controls.then(resolve, resolve);
      controls.__resolve = resolve;
    });
  };
  const springTo = (key, to, config, extra = {}) =>
    run(getState()[key], to, { ...config, ...extra, onUpdate: (v) => set({ [key]: v }) });
  const linearTo = (key, to, beats = 1, { derive } = {}) =>
    run(getState()[key], to, {
      duration: beats * BEAT,
      ease: 'linear',
      onUpdate: (v) => set({ [key]: v, ...derive?.(v) }),
    });
  const exitTo = (key, edge, { velocity = 0 } = {}) => {
    const config = springFor('spatial.exit');
    const from = getState()[key];
    if (instant) {
      set({ [key]: edge });
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      let controls;
      const toward = Math.sign(edge - from) || 1;
      controls = track(
        animate(from, from + (edge - from) * SPRINGS['spatial.exit'].aim, {
          ...config,
          velocity,
          onUpdate: (v) => {
            if ((v - edge) * toward >= 0) {
              set({ [key]: edge });
              controls?.stop();
              resolve();
              return;
            }
            set({ [key]: v });
          },
        }),
      );
      controls.then(resolve, resolve);
    });
  };

  return {
    get state() {
      return getState();
    },
    set,
    /** Move one state key to a value on a spring token (or a config). */
    spring: (key, to, token, { mode = defaultMode, velocity } = {}) => {
      if (token === 'linear') return linearTo(key, to, 1);
      if (token === 'spatial.exit') return exitTo(key, to, { velocity });
      const resolved = token === 'loop' ? 'appearance.default' : token;
      return springTo(key, to, typeof resolved === 'string' ? springFor(resolved, mode) : resolved, velocity ? { velocity } : {});
    },
    /**
     * Follow time one to one: `linear`, over a number of beats. `derive(value)`
     * returns more state that follows the same value, such as a panel under a hand.
     */
    linear: linearTo,
    /**
     * Start a spring that something can interrupt. `halt()` stops it where it is
     * and returns that value and the speed it had, to hand to the next spring.
     */
    begin: (key, to, token, { mode = defaultMode, velocity } = {}) => {
      if (instant) {
        set({ [key]: to });
        return { done: Promise.resolve(), halt: () => ({ value: to, velocity: 0 }) };
      }
      if (token === 'linear') {
        const done = linearTo(key, to, 1);
        return { done, halt: () => ({ value: getState()[key], velocity: 0 }) };
      }
      const resolved = token === 'loop' ? 'appearance.default' : token;
      const config = typeof resolved === 'string' ? springFor(resolved, mode) : resolved;
      let last = { v: getState()[key], t: 0 };
      let speed = 0;
      let controls;
      const done = new Promise((resolve) => {
        controls = track(
          animate(getState()[key], to, {
            ...config,
            ...(velocity ? { velocity } : {}),
            onUpdate: (v) => {
              const t = controls?.time ?? 0;
              if (t > last.t) speed = (v - last.v) / (t - last.t);
              last = { v, t };
              set({ [key]: v });
            },
          }),
        );
        controls.then(resolve, resolve);
        controls.__resolve = resolve;
      });
      return {
        done,
        halt: () => {
          controls.stop();
          controls.__resolve();
          return { value: last.v, velocity: speed };
        },
      };
    },
    /**
     * Something carried: `keys` (x, y) chase the target keys on a spring token
     * for a number of beats, the way a dragged thing follows the pointer. The
     * farthest it falls behind is kept in `lag`, then it lands on the target.
     */
    chase: ([kx, ky], [tx, ty], token, beats, lag = 'lag') => {
      const snap = () => set({ [kx]: getState()[tx], [ky]: getState()[ty] });
      if (instant) {
        snap();
        return Promise.resolve();
      }
      const { stiffness, damping, mass = 1 } = springFor(token);
      const v = { x: 0, y: 0 };
      let prev = 0;
      let peak = 0;
      return run(0, 1, {
        duration: beats * BEAT,
        ease: 'linear',
        onUpdate: (p) => {
          const dt = (p - prev) * beats * BEAT;
          prev = p;
          const s = getState();
          const pos = { x: s[kx], y: s[ky] };
          const goal = { x: s[tx], y: s[ty] };
          const n = 8;
          const h = dt / n;
          for (let i = 0; i < n; i++) {
            for (const a of ['x', 'y']) {
              v[a] += ((-stiffness * (pos[a] - goal[a]) - damping * v[a]) / mass) * h;
              pos[a] += v[a] * h;
            }
          }
          peak = Math.max(peak, Math.hypot(pos.x - goal.x, pos.y - goal.y));
          set({ [kx]: pos.x, [ky]: pos.y, [lag]: peak });
        },
      }).then(snap);
    },
    /** Wait a number of milliseconds, for rules stated in milliseconds (a stagger, a gap between fades). */
    after: (ms) => (instant || ms <= 0 ? Promise.resolve() : run(0, 1, { duration: ms / 1000, ease: 'linear' })),
    /** A clock: `key` counts up to `ms` over `ms` milliseconds, for a sequence strip's playhead. */
    clock: (key, ms) =>
      run(getState()[key], ms, { duration: ms / 1000, ease: 'linear', onUpdate: (v) => set({ [key]: v }) }),
    /** Wait a number of beats. */
    hold: (beats) => (instant ? Promise.resolve() : run(0, 1, { duration: beats * BEAT, ease: 'linear' })),
    /**
     * Leave for good on `motion.spatial.exit`: aimed `aim` times past the edge,
     * so it is still speeding up when it crosses. Resolves at the edge.
     */
    exit: exitTo,
    /**
     * Swing `key` on `motion.loop`, an undamped spring: a sine wave, one cycle
     * per loop period, starting `phase` cycles in. Returns `stop()`, which turns
     * the damping back on (ratio 1) and settles at rest from where it is.
     */
    loop: (key, amplitude, { phase = 0 } = {}) => {
      const w = (2 * Math.PI) / LOOP_PERIOD;
      let cycles = 0;
      if (instant) return { stop: () => Promise.resolve() };
      const controls = track(
        animate(0, 1, {
          duration: LOOP_PERIOD,
          ease: 'linear',
          repeat: Infinity,
          onUpdate: (p) => {
            cycles = p;
            set({ [key]: amplitude * Math.sin(2 * Math.PI * (p + phase)) });
          },
        }),
      );
      return {
        stop: () => {
          controls.stop();
          const angle = 2 * Math.PI * (cycles + phase);
          const velocity = amplitude * w * Math.cos(angle);
          return springTo(key, 0, { ...LOOP, damping: 2 * Math.sqrt(LOOP.stiffness * (LOOP.mass ?? 1)) }, { velocity });
        },
      };
    },
    /** A press at a point: the tap ring opens and fades on appearance springs. */
    tap: async (x, y) => {
      if (instant || !isLive()) return;
      set({ tapX: x, tapY: y, tap: 0, tapOpacity: 1 });
      await Promise.all([
        springTo('tap', 1, springFor('spatial.fast')),
        springTo('tapOpacity', 0, springFor('appearance.default')),
      ]);
    },
    scene,
  };
}

/** Pause or play every running animation of a demo, and keep new ones at its speed. */
function useTracker(initialSpeed = 1) {
  const ref = useRef({ speed: initialSpeed, paused: false, controls: new Set() });
  const track = useCallback((controls) => {
    const g = ref.current;
    controls.speed = g.speed;
    if (g.paused) controls.pause();
    g.controls.add(controls);
    controls.then(
      () => g.controls.delete(controls),
      () => g.controls.delete(controls),
    );
    return controls;
  }, []);
  const setSpeed = useCallback((speed) => {
    ref.current.speed = speed;
    ref.current.controls.forEach((c) => {
      c.speed = speed;
    });
  }, []);
  const setPaused = useCallback((paused) => {
    ref.current.paused = paused;
    ref.current.controls.forEach((c) => (paused ? c.pause() : c.play()));
  }, []);
  const stopAll = useCallback(() => {
    ref.current.controls.forEach((c) => {
      c.stop();
      c.__resolve?.();
    });
    ref.current.controls.clear();
  }, []);
  return { track, setSpeed, setPaused, stopAll };
}


/** One tile: a scene's drawing, its arrows layer, the tap ring and its caption. */
const Tile = ({ scene, state, arrows, dim, showArrows }) => {
  // While a loop resets, the finished drawing fades out over the start state:
  // a crossfade, so the tile never paints nothing.
  const resetting = (state.fade ?? 1) < 1;
  return (
    <figure
      data-tile={scene.id}
      data-scene={scene.id}
      data-state={JSON.stringify(roundState(state))}
      // Title, drawing and caption share rows across tiles, so drawings line up
      // when a title wraps.
      style={{ margin: 0, display: 'grid', gridTemplateRows: 'subgrid', gridRow: 'span 3', gap: 'var(--stack-sm)', minInlineSize: 0 }}
    >
      {scene.title ? <div style={{ font: 'var(--heading-xxs)', color: 'var(--ds-text)' }}>{scene.title}</div> : <div />}
      <div
        style={{
          borderRadius: 'var(--radius-lg)',
          background: 'var(--ds-surface)',
          overflow: 'hidden',
          // Vertical room around the drawing: a frame never sits against the tile edge.
          paddingBlock: 'var(--card-pad-default)',
          // One viewBox unit is 2px, so every kit outline here is half a stroke: 1px, as in the heroes.
          '--stroke-hairline': HERO_HAIRLINE,
        }}
      >
        <Illustration viewBox={scene.viewBox} title={scene.label ?? (`${scene.title ?? ''}. ${scene.caption ?? ''}`.trim() || scene.id)}>
          <g opacity={round(1 - dim * VEIL)}>
            {resetting && (
              <g opacity={state.crossfade ? round(1 - (state.fade ?? 1)) : undefined}>
                {scene.draw(startStates([scene])[scene.id])}
              </g>
            )}
            <g opacity={round(state.fade ?? 1)}>{scene.draw(state)}</g>
          </g>
          {state.tapOpacity > 0 && (
            <TapRing x={state.tapX} y={state.tapY} r={3 + state.tap * 7} opacity={round(state.tapOpacity)} accent />
          )}
          {(showArrows || arrows > 0) && (
            <g opacity={round(arrows)}>
              {(scene.arrows ?? []).map((arrow, i) => (
                <Trail key={i} points={pointsOf(arrow)} ghost={ghostOf(arrow)} accent />
              ))}
            </g>
          )}
        </Illustration>
      </div>
      {scene.verdict ? (
        <DoDontCaption
          tone={scene.verdict}
          style={{ marginBlockStart: 'var(--stack-lg)', marginBlockEnd: 'var(--stack-md)' }}
        >
          {scene.caption}
        </DoDontCaption>
      ) : scene.caption ? (
        <figcaption
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 'var(--stack-sm)',
            font: 'var(--body-sm)',
            color: 'var(--ds-text-subtle)',
            marginBlockEnd: 'var(--stack-md)',
          }}
        >
          <span>{scene.caption}</span>
        </figcaption>
      ) : (
        <div />
      )}
    </figure>
  );
};

const NO_CHROME = { arrows: 0, dim: 0 };
const REDUCED_CHROME = { arrows: 1, dim: 0 };
/** How far the arrows phase veils the drawing: light, so the window stays readable under the paths. */
const VEIL = 0.15;
/** Every scene at its start, with the layer's own keys at rest. */
const startStates = (scenes, extra) =>
  Object.fromEntries(scenes.map((s) => [s.id, { fade: 1, tap: 0, tapOpacity: 0, tapX: 0, tapY: 0, ...s.initial, ...extra }]));
/** Every scene at its declared landing, so reduced stills never flash their start frame on mount. */
const landingStates = (scenes, extra) =>
  Object.fromEntries(scenes.map((s) => [s.id, { fade: 1, tap: 0, tapOpacity: 0, tapX: 0, tapY: 0, ...s.initial, ...s.landing, ...extra }]));

/**
 * A group of scenes that play together and share one speed control. Phases,
 * on `data-phase`: `arrows` (paths drawn over the dimmed start), `playing`,
 * `settled` (holding at the landing), and `still` under reduced motion.
 * `fastForward` starts every animation at that multiple of 1×, so a test
 * waits for a pass in a fraction of the time; the control still reads 1×.
 */
export const MotionDemo = ({
  title,
  scenes,
  reduced: forcedReduced,
  fastForward = 1,
  loop = true,
  playOnInView = false,
  mode = 'productive',
  replayKey = 0,
  controls = true,
}) => {
  const prefersReduced = useReducedMotion();
  const reduced = forcedReduced ?? Boolean(prefersReduced);
  const [states, setStates] = useState(() => (reduced ? landingStates(scenes) : startStates(scenes)));
  const [chrome, setChrome] = useState(() => (reduced ? REDUCED_CHROME : NO_CHROME));
  const [phase, setPhase] = useState('idle');
  const [passes, setPasses] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [paused, setPausedState] = useState(false);
  const [replay, setReplay] = useState(0);
  const [inView, setInView] = useState(!playOnInView || typeof IntersectionObserver === 'undefined');
  const sectionRef = useRef(null);
  const statesRef = useRef(states);
  const { track, setSpeed, setPaused, stopAll } = useTracker(fastForward);
  const titleId = useId();

  useEffect(() => {
    if (!playOnInView || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const el = sectionRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [playOnInView]);

  // Dev only: paths that move together must not cross unless the scene is the broken version,
  // and every trail must carry a dashed landing ghost.
  useEffect(() => {
    if (!import.meta.env?.DEV) return;
    for (const s of scenes) {
      if (!s.crossing && crossings(s.arrows).length) {
        console.warn(`Motion scene "${s.id}": trails cross. Unify their direction, or set crossing: true.`);
      }
      if (ghostless(s.arrows).length) {
        console.warn(`Motion scene "${s.id}": every trail must carry a dashed landing ghost.`);
      }
    }
  }, [scenes]);

  useEffect(() => {
    let live = true;
    const isLive = () => live;
    const chromeRef = { current: reduced ? REDUCED_CHROME : NO_CHROME };
    const putStates = (next) => {
      statesRef.current = next;
      if (live) setStates(next);
    };
    const putChrome = (next) => {
      chromeRef.current = next;
      if (live) setChrome(next);
    };
    const contexts = (instant, storeRef = statesRef, write = putStates) =>
      scenes.map((scene) =>
        createContext({
          scene,
          instant,
          isLive,
          track,
          mode,
          getState: () => storeRef.current[scene.id],
          setState: (patch) =>
            write({ ...storeRef.current, [scene.id]: { ...storeRef.current[scene.id], ...patch } }),
        }),
      );
    const chromeCtx = createContext({
      scene: null,
      instant: false,
      isLive,
      track,
      mode,
      getState: () => chromeRef.current,
      setState: (patch) => putChrome({ ...chromeRef.current, ...patch }),
    });
    const playAll = (instant) => Promise.all(contexts(instant).map((ctx) => ctx.scene.play(ctx)));
    const resolveLandingStates = async (extra) => {
      const scratch = { current: startStates(scenes) };
      await Promise.all(
        contexts(true, scratch, (next) => {
          scratch.current = next;
        }).map((ctx) => ctx.scene.play(ctx)),
      );
      if (!extra) return scratch.current;
      return Object.fromEntries(Object.entries(scratch.current).map(([id, st]) => [id, { ...st, ...extra }]));
    };

    const pass = async () => {
      if (scenes.some((s) => s.arrows?.length)) {
        setPhase('arrows');
        await Promise.all([chromeCtx.spring('arrows', 1, 'appearance.default'), chromeCtx.spring('dim', 1, 'appearance.default')]);
        await chromeCtx.hold(2);
        if (!live) return;
        await Promise.all([chromeCtx.spring('arrows', 0, 'appearance.fast'), chromeCtx.spring('dim', 0, 'appearance.fast')]);
      }
      if (!live) return;
      setPhase('playing');
      await playAll(false);
      if (live) {
        setPasses((n) => n + 1);
        setPhase('settled');
      }
    };

    const reducedPass = async () => {
      const finished = await resolveLandingStates();
      const landed = Object.fromEntries(Object.entries(finished).map(([id, st]) => [id, { ...st, fade: 0, crossfade: 1 }]));
      if (!live) return;
      putStates(landed);
      putChrome({ arrows: 1, dim: 1 });
      if (scenes.some((s) => s.arrows?.length)) {
        setPhase('arrows');
        await chromeCtx.hold(0.5);
        if (!live) return;
      }
      setPhase('playing');
      await Promise.all([
        ...contexts(false).map((ctx) => ctx.spring('fade', 1, 'appearance.fast')),
        chromeCtx.spring('dim', 0, 'appearance.fast'),
      ]);
      if (live) {
        putStates(finished);
        setPasses((n) => n + 1);
        setPhase('still');
      }
    };

    const totalReplays = replay + replayKey;
    if (reduced && !totalReplays) {
      // The landing, still, with its paths drawn: what changed, without the motion.
      putStates(landingStates(scenes));
      putChrome(REDUCED_CHROME);
      resolveLandingStates().then((landed) => {
        if (!live) return;
        putStates(landed);
        putChrome(REDUCED_CHROME);
        setPhase('still');
      });
    } else if (reduced) {
      // The reader asked: fade in place from start to landing on appearance.fast, never a cut or travel.
      setPhase('idle');
      reducedPass();
    } else {
      putStates(startStates(scenes));
      putChrome(NO_CHROME);
      if (!inView && !totalReplays) {
        setPhase('idle');
      } else if (!loop) {
        setPhase('idle');
        (async () => {
          await chromeCtx.hold(1);
          if (!live) return;
          await pass();
        })();
      } else {
        setPhase('idle');
        (async () => {
          await chromeCtx.hold(1);
          while (live) {
            await pass();
            if (!live) return;
            await chromeCtx.hold(4);
            if (!live) return;
            // Crossfade the landing out over the start state, then put every scene
            // back at its start: a loop never jumps and a tile never goes empty.
            await Promise.all(contexts(false).map((ctx) => ctx.spring('fade', 0, 'appearance.default')));
            if (!live) return;
            putStates(startStates(scenes));
          }
        })();
      }
    }
    return () => {
      live = false;
      stopAll();
    };
    // `scenes` is a module constant per demo (or memoized per card event); `replay`/`replayKey` restarts a pass.
  }, [reduced, replay, replayKey, inView, loop, mode, scenes, stopAll, track]);

  const cycleSpeed = () => {
    const next = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(next);
    // The control scales the demo's own rate: ½× of a fast-forwarded test is still half of it.
    setSpeed(SPEEDS[next] * fastForward);
  };
  const togglePause = () => {
    setPaused(!paused);
    setPausedState(!paused);
  };

  const landingMap = Object.fromEntries(scenes.map((s) => [s.id, s.landing]));

  return (
    <section
      ref={sectionRef}
      data-motion-demo
      data-docs-stage
      data-phase={phase}
      data-passes={String(passes)}
      data-reduced={String(reduced)}
      data-mode={mode}
      data-landing={JSON.stringify(landingMap)}
      data-speed={String(SPEEDS[speedIndex])}
      aria-labelledby={title ? titleId : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--stack-md)',
        padding: 'var(--card-pad-default)',
        borderRadius: 'var(--card-radius)',
        background: 'var(--ds-surface-sunken)',
      }}
    >
      {controls && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-100)' }}>
          {title && (
            <span id={titleId} style={{ flex: 1, font: 'var(--heading-xs)', color: 'var(--ds-text)' }}>
              {title}
            </span>
          )}
          <Button appearance="subtle" spacing="compact" onClick={cycleSpeed} aria-label={`Playback speed: ${SPEED_LABELS[speedIndex]}`}>
            {SPEED_LABELS[speedIndex]}
          </Button>
          {reduced ? (
            <IconButton appearance="subtle" spacing="compact" icon="play" label="Play this demo once" onClick={() => setReplay((n) => n + 1)} />
          ) : (
            <IconButton
              appearance="subtle"
              spacing="compact"
              icon={paused ? 'play' : 'pause'}
              label={paused ? 'Play this demo' : 'Pause this demo'}
              onClick={togglePause}
            />
          )}
        </div>
      )}
      <div
        style={{
          display: 'grid',
          // Two tiles a row at most: a drawing keeps its natural size (two px a unit) instead of
          // shrinking to a fractional scale that blurs its hairlines.
          gridTemplateColumns: `repeat(auto-fit, minmax(max(min(100%, var(--card-min-width-sm)), calc((100% - var(--grid-gutter)) / 2)), 1fr))`,
          columnGap: 'var(--grid-gutter)',
          rowGap: 'var(--stack-sm)',
          alignItems: 'start',
        }}
      >
        {scenes.map((scene) => (
          <Tile
            key={scene.id}
            scene={scene}
            state={states[scene.id] ?? startStates([scene])[scene.id]}
            arrows={chrome.arrows}
            dim={chrome.dim}
            showArrows={phase === 'arrows'}
          />
        ))}
      </div>
    </section>
  );
};
