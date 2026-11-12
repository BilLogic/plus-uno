import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { animate } from 'motion';
import { useReducedMotion } from 'motion/react';

import { Button, IconButton } from '@/components';

import { SPRINGS } from '@/tokens/ladder/springs.generated.js';
import { measureSpring, springStep } from '../../../../scripts/lib/tokens/spring.mjs';
import { Illustration } from './Illustration.jsx';
import { Trail, TapRing } from './primitives-motion.jsx';

/**
 * The illustration kit's motion layer. A demo animates kit primitives on the
 * generated springs (`springs.generated.js`, ADR-041) through the `motion`
 * package, so a drawing moves exactly as the product does. Every demo:
 * - draws each subject's path, start to landing, before the motion plays;
 * - has a 1×, ½× and ¼× speed control that slows every spring and pause alike;
 * - under reduced motion, shows its landing as a still frame with the paths
 *   drawn, and plays one pass only when the reader asks.
 *
 * A demo is a list of scenes. A scene is `{ id, title, caption, viewBox,
 * initial, landing, arrows, draw, play }`: `draw(state)` returns the SVG for a
 * state, `play(ctx)` moves the state from `initial` to `landing` with the
 * `ctx` calls below, and `arrows` lists the paths (point lists, in viewBox
 * units) the subjects travel. There are no timings here: every move reads a
 * spring token, and every pause is counted in beats.
 */

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

const round = (v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v);
const roundState = (state) => Object.fromEntries(Object.entries(state).map(([k, v]) => [k, round(v)]));

/**
 * The calls a scene's `play` makes. In `instant` mode (reduced motion's still
 * frame) every move lands at once and every pause is skipped.
 */
function createContext({ scene, getState, setState, track, instant, isLive }) {
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

  return {
    get state() {
      return getState();
    },
    set,
    /** Move one state key to a value on a spring token (or a config). */
    spring: (key, to, token, { mode, velocity } = {}) =>
      springTo(key, to, typeof token === 'string' ? springFor(token, mode) : token, velocity ? { velocity } : {}),
    /**
     * Follow time one to one: `linear`, over a number of beats. `derive(value)`
     * returns more state that follows the same value, such as a panel under a hand.
     */
    linear: (key, to, beats, { derive } = {}) =>
      run(getState()[key], to, {
        duration: beats * BEAT,
        ease: 'linear',
        onUpdate: (v) => set({ [key]: v, ...derive?.(v) }),
      }),
    /**
     * Start a spring that something can interrupt. `halt()` stops it where it is
     * and returns that value and the speed it had, to hand to the next spring.
     */
    begin: (key, to, token, { mode, velocity } = {}) => {
      if (instant) {
        set({ [key]: to });
        return { done: Promise.resolve(), halt: () => ({ value: to, velocity: 0 }) };
      }
      const config = typeof token === 'string' ? springFor(token, mode) : token;
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
    exit: (key, edge, { velocity = 0 } = {}) => {
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
    },
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
  return (
    <figure
      data-tile={scene.id}
      data-state={JSON.stringify(roundState(state))}
      // Title, drawing and caption share rows across tiles, so drawings line up
      // when a title wraps.
      style={{ margin: 0, display: 'grid', gridTemplateRows: 'subgrid', gridRow: 'span 3', gap: 'var(--stack-sm)', minInlineSize: 0 }}
    >
      <div style={{ font: 'var(--heading-xxsmall)', color: 'var(--ds-text)' }}>{scene.title}</div>
      <div style={{ padding: 'var(--card-pad-compact)', borderRadius: 'var(--radius-lg)', background: 'var(--ds-surface)' }}>
        <Illustration viewBox={scene.viewBox} title={scene.label ?? `${scene.title}. ${scene.caption}`}>
          <g opacity={round(1 - dim * 0.7)}>
            <g opacity={round(state.fade ?? 1)}>{scene.draw(state)}</g>
          </g>
          {state.tapOpacity > 0 && (
            <TapRing x={state.tapX} y={state.tapY} r={3 + state.tap * 7} opacity={round(state.tapOpacity)} accent />
          )}
          {(showArrows || arrows > 0) && (
            <g opacity={round(arrows)}>
              {(scene.arrows ?? []).map((points, i) => (
                <Trail key={i} points={points} accent />
              ))}
            </g>
          )}
        </Illustration>
      </div>
      <figcaption style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)', marginBlockEnd: 'var(--stack-md)' }}>
        {scene.caption}
      </figcaption>
    </figure>
  );
};

const NO_CHROME = { arrows: 0, dim: 0 };
/** Every scene at its start, with the layer's own keys at rest. */
const startStates = (scenes, extra) =>
  Object.fromEntries(scenes.map((s) => [s.id, { fade: 1, tap: 0, tapOpacity: 0, tapX: 0, tapY: 0, ...s.initial, ...extra }]));

/**
 * A group of scenes that play together and share one speed control. Phases,
 * on `data-phase`: `arrows` (paths drawn over the dimmed start), `playing`,
 * `settled` (holding at the landing), and `still` under reduced motion.
 * `fastForward` starts every animation at that multiple of 1×, so a test
 * waits for a pass in a fraction of the time; the control still reads 1×.
 */
export const MotionDemo = ({ title, scenes, reduced: forcedReduced, fastForward = 1 }) => {
  const prefersReduced = useReducedMotion();
  const reduced = forcedReduced ?? Boolean(prefersReduced);
  const [states, setStates] = useState(() => startStates(scenes));
  const [chrome, setChrome] = useState(NO_CHROME);
  const [phase, setPhase] = useState(reduced ? 'still' : 'idle');
  const [speedIndex, setSpeedIndex] = useState(0);
  const [paused, setPausedState] = useState(false);
  const [replay, setReplay] = useState(0);
  const statesRef = useRef(states);
  const { track, setSpeed, setPaused, stopAll } = useTracker(fastForward);
  const titleId = useId();

  useEffect(() => {
    let live = true;
    const isLive = () => live;
    const chromeRef = { current: NO_CHROME };
    const putStates = (next) => {
      statesRef.current = next;
      if (live) setStates(next);
    };
    const putChrome = (next) => {
      chromeRef.current = next;
      if (live) setChrome(next);
    };
    const contexts = (instant) =>
      scenes.map((scene) =>
        createContext({
          scene,
          instant,
          isLive,
          track,
          getState: () => statesRef.current[scene.id],
          setState: (patch) =>
            putStates({ ...statesRef.current, [scene.id]: { ...statesRef.current[scene.id], ...patch } }),
        }),
      );
    const chromeCtx = createContext({
      scene: null,
      instant: false,
      isLive,
      track,
      getState: () => chromeRef.current,
      setState: (patch) => putChrome({ ...chromeRef.current, ...patch }),
    });
    const playAll = (instant) => Promise.all(contexts(instant).map((ctx) => ctx.scene.play(ctx)));

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
      if (live) setPhase('settled');
    };

    putStates(startStates(scenes));
    putChrome(NO_CHROME);
    if (reduced && !replay) {
      // The landing, still, with its paths drawn: what changed, without the motion.
      playAll(true).then(() => {
        if (!live) return;
        putChrome({ arrows: 1, dim: 0 });
        setPhase('still');
      });
    } else if (reduced) {
      // The reader asked: one pass, then it holds.
      pass();
    } else {
      (async () => {
        await chromeCtx.hold(1);
        while (live) {
          await pass();
          if (!live) return;
          await chromeCtx.hold(4);
          if (!live) return;
          // Fade out, put every scene back at its start, fade in: a loop never jumps.
          await Promise.all(contexts(false).map((ctx) => ctx.spring('fade', 0, 'appearance.default')));
          if (!live) return;
          putStates(startStates(scenes, { fade: 0 }));
          await Promise.all(contexts(false).map((ctx) => ctx.spring('fade', 1, 'appearance.default')));
        }
      })();
    }
    return () => {
      live = false;
      stopAll();
    };
    // `scenes` is a module constant per demo; `replay` restarts a reduced pass.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, replay]);

  const cycleSpeed = () => {
    const next = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(next);
    setSpeed(SPEEDS[next]);
  };
  const togglePause = () => {
    setPaused(!paused);
    setPausedState(!paused);
  };

  return (
    <section
      data-motion-demo
      data-phase={phase}
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-100)' }}>
        {title && (
          <span id={titleId} style={{ flex: 1, font: 'var(--heading-xsmall)', color: 'var(--ds-text)' }}>
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, var(--card-min-width-sm)), 1fr))`,
          columnGap: 'var(--grid-gutter)',
          rowGap: 'var(--stack-sm)',
          alignItems: 'start',
        }}
      >
        {scenes.map((scene) => (
          <Tile
            key={scene.id}
            scene={scene}
            state={states[scene.id]}
            arrows={chrome.arrows}
            dim={chrome.dim}
            showArrows={phase === 'arrows'}
          />
        ))}
      </div>
    </section>
  );
};
