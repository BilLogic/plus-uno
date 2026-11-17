/**
 * The Physics page's demos, run in the Storybook tests. Each play test waits
 * for a demo's first pass to settle and checks that every tile landed where its
 * scene says, then renders the same demo under reduced motion and checks that it
 * reaches the same landing as a still frame. Intermediate frames are never
 * asserted.
 *
 * Run: npx vitest run --project=storybook design-system/src/styles/MotionPhysics.stories.jsx
 */
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { MotionDemo, SPEED_LABELS } from '@/storybook-docs/illustrations/motion.jsx';
import { PASS, reducedStory, story } from '@/storybook-docs/illustrations/motion-story-helpers.jsx';
import { ghostOf, pointsOf } from '@/storybook-docs/illustrations/trails.js';
import { TapRing } from '@/storybook-docs/illustrations/primitives-motion.jsx';
import { PAINT } from '@/storybook-docs/illustrations/paint.js';
import { PHYSICS_DEMOS, SpringTokenTable, OneSpringFiveWays } from '@/storybook-docs/illustrations/motion-physics.jsx';

export default {
  // A test harness and the page's figures: `!dev` keeps it out of the sidebar.
  // The page itself is Foundations/Expression/Motion/Physics (MotionPhysics.mdx).
  title: 'Foundations/Expression/Motion/Physics',
  tags: ['!dev', '!autodocs', 'manifest'],
  parameters: { layout: 'padded' },
};

export const FamilySpatial = story(PHYSICS_DEMOS.spatial);
export const FamilySpatialReduced = reducedStory(PHYSICS_DEMOS.spatial);
export const FamilyAppearance = story(PHYSICS_DEMOS.appearance);
export const FamilyAppearanceReduced = reducedStory(PHYSICS_DEMOS.appearance);
export const FamilyLinear = story(PHYSICS_DEMOS.linear);
export const FamilyLinearReduced = reducedStory(PHYSICS_DEMOS.linear);
export const Modes = story(PHYSICS_DEMOS.modes);
export const ModesReduced = reducedStory(PHYSICS_DEMOS.modes);
export const Size = story(PHYSICS_DEMOS.size);
export const SizeReduced = reducedStory(PHYSICS_DEMOS.size);
export const Exits = story(PHYSICS_DEMOS.exits);
export const ExitsReduced = reducedStory(PHYSICS_DEMOS.exits);
export const Loops = story(PHYSICS_DEMOS.loops);
export const LoopsReduced = reducedStory(PHYSICS_DEMOS.loops);
export const Damping = story(PHYSICS_DEMOS.damping);
export const DampingReduced = reducedStory(PHYSICS_DEMOS.damping);

export const Throw = story(PHYSICS_DEMOS.throw);
export const ThrowReduced = reducedStory(PHYSICS_DEMOS.throw);
export const ThrowDecision = story(PHYSICS_DEMOS.decision);
export const ThrowDecisionReduced = reducedStory(PHYSICS_DEMOS.decision);
export const Interruption = story(PHYSICS_DEMOS.interruption);
export const InterruptionReduced = reducedStory(PHYSICS_DEMOS.interruption);
export const Carry = story(PHYSICS_DEMOS.carry);
export const CarryReduced = reducedStory(PHYSICS_DEMOS.carry);
export const Limit = story(PHYSICS_DEMOS.limit);
export const LimitReduced = reducedStory(PHYSICS_DEMOS.limit);
export const ReducedMotion = story(PHYSICS_DEMOS.reducedMotion);
export const ReducedMotionReduced = reducedStory(PHYSICS_DEMOS.reducedMotion);

const stateOf = (canvasElement, id) => JSON.parse(canvasElement.querySelector(`[data-tile="${id}"]`).dataset.state);
const settled = async (canvasElement) => {
  const root = canvasElement.querySelector('[data-motion-demo]');
  await waitFor(() => expect(root.dataset.phase).toBe('settled'), PASS);
};

/** A throw keeps the hand's speed; the same throw with the speed dropped starts from rest. */
export const ThrowKeepsTheHandsSpeed = {
  render: () => <MotionDemo {...PHYSICS_DEMOS.throw} reduced={false} />,
  play: async ({ canvasElement }) => {
    await settled(canvasElement);
    const keeps = stateOf(canvasElement, 'throw-keeps');
    const drops = stateOf(canvasElement, 'throw-drops');
    // Both leave; only one was handed the release velocity.
    await expect(keeps.x).toBe(drops.x);
    await expect(keeps.vel).toBeGreaterThan(50);
    await expect(drops.vel).toBe(0);
  },
};

/** Where it would land decides a throw: a short fast flick leaves, a long slow drag returns. */
export const ThrowIsDecidedByProjectedRest = {
  render: () => <MotionDemo {...PHYSICS_DEMOS.decision} reduced={false} />,
  play: async ({ canvasElement }) => {
    await settled(canvasElement);
    const flick = stateOf(canvasElement, 'decide-flick');
    const drag = stateOf(canvasElement, 'decide-drag');
    await expect(flick.gone).toBe(1);
    await expect(drag.gone).toBe(0);
    // The slow drag let go farther along than the flick did, and still came back; its trail points left to rest.
    await expect(drag.pull).toBeGreaterThan(flick.pull);
    await expect(drag.x).toBe(0);
    const dragArrow = PHYSICS_DEMOS.decision.scenes.find((s) => s.id === 'decide-drag').arrows[0];
    const [dragStart, dragEnd] = pointsOf(dragArrow);
    await expect(dragEnd[0]).toBeLessThan(dragStart[0]);
    await expect(ghostOf(dragArrow)).toMatchObject({ x: 98, w: 54 });
  },
};

/** A second press turns it back from where it is; the other waits, then closes. Both rest closed. */
export const InterruptionRestsClosed = {
  render: () => <MotionDemo {...PHYSICS_DEMOS.interruption} reduced={false} />,
  play: async ({ canvasElement }) => {
    await settled(canvasElement);
    const turns = stateOf(canvasElement, 'interrupt-turns');
    const waits = stateOf(canvasElement, 'interrupt-waits');
    await expect(turns.x).toBe(waits.x);
    await expect(turns.turned).toBe(1);
    await expect(waits.turned).toBe(0);
  },
};

/** What is carried lags by how much it holds: a tag stays closer than a card, and neither strays far. */
export const CarryLagsByWeight = {
  render: () => <MotionDemo {...PHYSICS_DEMOS.carry} reduced={false} />,
  play: async ({ canvasElement }) => {
    await settled(canvasElement);
    const tag = stateOf(canvasElement, 'carry-tag');
    const card = stateOf(canvasElement, 'carry-card');
    await expect(tag.lag).toBeLessThan(card.lag);
    await expect(card.lag).toBeLessThan(12);
    // Both land in the slot, with the pointer's own spot.
    await expect([tag.ix, tag.iy]).toEqual([tag.px, tag.py]);
    await expect([card.ix, card.iy]).toEqual([card.px, card.py]);
  },
};

/** Past its limit it stretches by √extra × 4 px, then springs back to the limit; a wall never stretches. */
export const LimitStretchesAndReturns = {
  render: () => <MotionDemo {...PHYSICS_DEMOS.limit} reduced={false} />,
  play: async ({ canvasElement }) => {
    await settled(canvasElement);
    const resists = stateOf(canvasElement, 'limit-resists');
    const wall = stateOf(canvasElement, 'limit-wall');
    await expect(resists.w).toBe(resists.limit);
    await expect(wall.w).toBe(wall.limit);
    await expect(resists.peak).toBeGreaterThan(resists.limit);
    await expect(wall.peak).toBe(wall.limit);
    for (const s of PHYSICS_DEMOS.limit.scenes) {
      const arrow = s.arrows[0];
      const [start, end] = pointsOf(arrow);
      await expect(end[0]).toBe(152 - resists.limit);
      await expect(end[0]).toBeLessThan(start[0]);
      await expect(ghostOf(arrow)).toMatchObject({ x: 152 - resists.limit, w: resists.limit });
    }
  },
};

/** The tap ring draws in the brand family: the same lagoon hue as the accent in light mode. */
export const TapRingIsBrand = {
  render: () => (
    <svg viewBox="0 0 40 20" width="160" data-testid="ring">
      <rect x="2" y="2" width="8" height="8" fill={PAINT.accent} data-accent />
      <TapRing x="25" y="10" r="6" />
    </svg>
  ),
  play: async ({ canvasElement }) => {
    const accent = getComputedStyle(canvasElement.querySelector('[data-accent]')).fill;
    const ring = getComputedStyle(canvasElement.querySelector('circle[r="6"]')).stroke;
    await expect(ring).toBe(accent);
  },
};

/** One spring, five ways reads its numbers from the generated config. */
export const OneSpringTable = {
  render: () => <OneSpringFiveWays />,
  play: async ({ canvasElement }) => {
    const text = canvasElement.textContent;
    await expect(text).toContain('stiffness: 440, damping: 41.95, mass: 1');
    await expect(text).toContain('.spring(response: 0.30, dampingFraction: 1.0)');
    await expect(text).toContain('880 / 59.33');
    await expect(text).toContain('3800 / 123.29');
  },
};

/** The speed control steps 1×, ½×, ¼× and back, for the whole demo at once. */
export const SpeedControl = {
  render: () => <MotionDemo {...PHYSICS_DEMOS.damping} reduced={false} />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-motion-demo]');
    const button = within(root).getByRole('button', { name: /playback speed/i });
    await expect(button).toHaveTextContent(SPEED_LABELS[0]);
    for (const label of [...SPEED_LABELS.slice(1), SPEED_LABELS[0]]) {
      await userEvent.click(button);
      await expect(button).toHaveTextContent(label);
    }
    await userEvent.click(button);
    await expect(root.dataset.speed).toBe('0.5');
  },
};

/** The token table reads the generated spring config: one row per token and mode. */
export const TokenTable = {
  render: () => <SpringTokenTable />,
  play: async ({ canvasElement }) => {
    const rows = canvasElement.querySelectorAll('tbody tr');
    // spatial ×3 in two modes, appearance ×3, exit, loop, linear.
    await expect(rows.length).toBe(12);
    const text = canvasElement.textContent;
    for (const token of ['spatial.fast', 'appearance.slow', 'spatial.exit', 'loop']) {
      await expect(text).toContain(`motion.${token}`);
    }
    // Settle times come from the generated config, so Productive spatial.default reads 317 ms.
    await expect(text).toContain('317 ms');
  },
};

/** Audit T6 + T7 checks: exits keep a ghost, Modal size has arrows+ghost, Modes Flag has a dimmed start ghost, and appearance uses appearance.fast with no hard-coded Pointer. */
export const NoEmptyTilesAndAppearanceFast = {
  render: () => null,
  play: async () => {
    const find = (demo, id) => demo.scenes.find((s) => s.id === id);
    const exitClick = find(PHYSICS_DEMOS.exits, 'exit-click');
    await expect(exitClick.arrows?.length).toBe(1);
    await expect(ghostOf(exitClick.arrows[0])).toMatchObject({ x: 88, y: 22, w: 56, h: 48 });

    const sizeModal = find(PHYSICS_DEMOS.size, 'size-default');
    await expect(sizeModal.arrows?.length).toBeGreaterThan(0);
    for (const arrow of sizeModal.arrows) {
      await expect(ghostOf(arrow)).toMatchObject({ x: 34, y: 32, w: 92, h: 52 });
    }

    for (const id of ['flag-productive', 'flag-expressive']) {
      const flag = find(PHYSICS_DEMOS.modes, id);
      const wrap = document.createElement('div');
      const { createRoot } = await import('react-dom/client');
      const root = createRoot(wrap);
      root.render(<svg>{flag.draw(flag.initial)}</svg>);
      await waitFor(() => expect(wrap.querySelectorAll('[opacity="0.35"]').length).toBeGreaterThan(0));
      root.unmount();
    }

    const app = find(PHYSICS_DEMOS.appearance, 'appearance-app');
    const tokens = [];
    await app.play({
      tap: async () => {},
      spring: async (_k, _to, token) => { tokens.push(token); },
      hold: async () => {},
    });
    await expect(tokens).toEqual(['appearance.fast']);
    const wrap = document.createElement('div');
    const { createRoot } = await import('react-dom/client');
    const root = createRoot(wrap);
    root.render(<svg>{app.draw(app.landing)}</svg>);
    await waitFor(() => expect(wrap.querySelectorAll('rect').length).toBeGreaterThan(0));
    await expect(wrap.querySelector(`path[fill="${PAINT.pointer}"]`)).toBeNull();
    root.unmount();
  },
};
