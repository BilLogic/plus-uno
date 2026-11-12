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
import { PHYSICS_DEMOS, SpringTokenTable } from '@/storybook-docs/illustrations/motion-physics.jsx';

export default {
  // A test harness and the page's figures: `!dev` keeps it out of the sidebar.
  // The page itself is Foundations/Motion/Physics (MotionPhysics.mdx).
  title: 'Foundations/Motion/Physics',
  tags: ['!dev', '!autodocs'],
  parameters: { layout: 'padded' },
};

const PAINTED = ['fill', 'stroke'];
const TOKEN_OR_NONE = /^(?:var\(--ds-[\w-]+\)|none)$/;
const everyPaintIsAToken = (root) =>
  [...root.querySelectorAll('svg *')].every((el) =>
    PAINTED.every((attr) => !el.hasAttribute(attr) || TOKEN_OR_NONE.test(el.getAttribute(attr))),
  );

// A first pass is a hold, the arrows and the motion; at ¼× it is four times
// that. One pass at 1× stays well inside this.
const PASS = { timeout: 15000, interval: 50 };

const landed = (demo, canvasElement) => {
  for (const scene of demo.scenes) {
    const tile = canvasElement.querySelector(`[data-tile="${scene.id}"]`);
    expect(JSON.parse(tile.dataset.state)).toMatchObject(scene.landing);
  }
};

/** Plays one pass, checks the arrows came first, then checks every landing. */
const playsToItsLanding = (demo) => async ({ canvasElement }) => {
  const root = canvasElement.querySelector('[data-motion-demo]');
  await expect(everyPaintIsAToken(root)).toBe(true);
  // Words appear only on a real-fidelity subject; the captions sit outside the drawings.
  await expect(root.querySelectorAll('svg text:not([data-fidelity="real"] text)').length).toBe(0);
  if (demo.scenes.some((s) => s.arrows?.length)) {
    await waitFor(() => expect(root.dataset.phase).toBe('arrows'), PASS);
    for (const scene of demo.scenes) {
      const tile = canvasElement.querySelector(`[data-tile="${scene.id}"]`);
      await expect(tile.querySelectorAll('[data-trail]').length).toBe(scene.arrows?.length ?? 0);
    }
  }
  await waitFor(() => expect(root.dataset.phase).toBe('settled'), PASS);
  landed(demo, canvasElement);
};

/** Under reduced motion nothing plays: the demo shows its landing, still. */
const stillAtItsLanding = (demo) => async ({ canvasElement }) => {
  const root = canvasElement.querySelector('[data-motion-demo]');
  await waitFor(() => expect(root.dataset.phase).toBe('still'), PASS);
  landed(demo, canvasElement);
  await expect(everyPaintIsAToken(root)).toBe(true);
};

const story = (demo) => ({
  render: () => <MotionDemo {...demo} />,
  play: playsToItsLanding(demo),
});
const reducedStory = (demo) => ({
  render: () => <MotionDemo {...demo} reduced />,
  play: stillAtItsLanding(demo),
});

export const Families = story(PHYSICS_DEMOS.families);
export const FamiliesReduced = reducedStory(PHYSICS_DEMOS.families);
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

/** The speed control steps 1×, ½×, ¼× and back, for the whole demo at once. */
export const SpeedControl = {
  render: () => <MotionDemo {...PHYSICS_DEMOS.damping} />,
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
