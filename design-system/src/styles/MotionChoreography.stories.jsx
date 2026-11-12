/**
 * The Choreography page's demos, run in the Storybook tests. Each play test
 * waits for a demo's first pass to settle and checks that every tile landed
 * where its scene says (and that the paths were drawn first), then renders the
 * same demo under reduced motion and checks it shows the same landing, still.
 * Intermediate frames are never asserted.
 *
 * Run: npx vitest run --project=storybook design-system/src/styles/MotionChoreography.stories.jsx
 */
import React from 'react';
import { expect, waitFor } from 'storybook/test';

import { MotionDemo } from '@/storybook-docs/illustrations/motion.jsx';
import {
  CHOREOGRAPHY_DEMOS,
  CLEAN_FADE_GAP_MS,
  STAGGER,
  staggerDelays,
} from '@/storybook-docs/illustrations/motion-choreography.jsx';

export default {
  // A test harness and the page's figures: `!dev` keeps it out of the sidebar.
  // The page itself is Foundations/Motion/Choreography (MotionChoreography.mdx).
  title: 'Foundations/Motion/Choreography',
  tags: ['!dev', '!autodocs', 'manifest'],
  parameters: { layout: 'padded' },
};

const PAINTED = ['fill', 'stroke'];
const TOKEN_OR_NONE = /^(?:var\(--ds-[\w-]+\)|none)$/;
const everyPaintIsAToken = (root) =>
  [...root.querySelectorAll('svg *')].every((el) =>
    PAINTED.every((attr) => !el.hasAttribute(attr) || TOKEN_OR_NONE.test(el.getAttribute(attr))),
  );
const PASS = { timeout: 15000, interval: 50 };
const stateOf = (canvasElement, id) => JSON.parse(canvasElement.querySelector(`[data-tile="${id}"]`).dataset.state);
const settled = async (canvasElement) => {
  const root = canvasElement.querySelector('[data-motion-demo]');
  await waitFor(() => expect(root.dataset.phase).toBe('settled'), PASS);
};

const landed = (demo, canvasElement) => {
  for (const scene of demo.scenes) expect(stateOf(canvasElement, scene.id)).toMatchObject(scene.landing);
};

const playsToItsLanding = (demo) => async ({ canvasElement }) => {
  const root = canvasElement.querySelector('[data-motion-demo]');
  await expect(everyPaintIsAToken(root)).toBe(true);
  // Choreography lessons are principles: blocked out, no words.
  await expect(root.querySelectorAll('svg text').length).toBe(0);
  // A part that fades in place travels nowhere, so a demo of only those has no paths to draw first.
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

const stillAtItsLanding = (demo) => async ({ canvasElement }) => {
  const root = canvasElement.querySelector('[data-motion-demo]');
  await waitFor(() => expect(root.dataset.phase).toBe('still'), PASS);
  landed(demo, canvasElement);
  await expect(everyPaintIsAToken(root)).toBe(true);
};

const story = (demo) => ({ render: () => <MotionDemo {...demo} reduced={false} />, play: playsToItsLanding(demo) });
const reducedStory = (demo) => ({ render: () => <MotionDemo {...demo} reduced />, play: stillAtItsLanding(demo) });

export const Direction = story(CHOREOGRAPHY_DEMOS.direction);
export const DirectionReduced = reducedStory(CHOREOGRAPHY_DEMOS.direction);
export const Grid = story(CHOREOGRAPHY_DEMOS.grid);
export const GridReduced = reducedStory(CHOREOGRAPHY_DEMOS.grid);
export const Retrace = story(CHOREOGRAPHY_DEMOS.retrace);
export const RetraceReduced = reducedStory(CHOREOGRAPHY_DEMOS.retrace);
export const KeepSpace = story(CHOREOGRAPHY_DEMOS.space);
export const KeepSpaceReduced = reducedStory(CHOREOGRAPHY_DEMOS.space);
export const CleanFades = story(CHOREOGRAPHY_DEMOS.fades);
export const CleanFadesReduced = reducedStory(CHOREOGRAPHY_DEMOS.fades);
export const Stagger = story(CHOREOGRAPHY_DEMOS.stagger);
export const StaggerReduced = reducedStory(CHOREOGRAPHY_DEMOS.stagger);
export const WhoStartedIt = story(CHOREOGRAPHY_DEMOS.cause);
export const WhoStartedItReduced = reducedStory(CHOREOGRAPHY_DEMOS.cause);
export const Breakpoints = story(CHOREOGRAPHY_DEMOS.breakpoints);
export const BreakpointsReduced = reducedStory(CHOREOGRAPHY_DEMOS.breakpoints);

/** Stagger: 20 ms apart, or 500 ms ÷ items when that is shorter. The fifth row lands 80 ms after the first. */
export const StaggerIsComputedFromTheRule = {
  render: () => <div />,
  play: async () => {
    await expect(STAGGER).toMatchObject({ gap: 20, cap: 500 });
    const five = staggerDelays(5);
    await expect(five[4] - five[0]).toBe(80);
    // A long list is squeezed so the whole set is in within the cap.
    const forty = staggerDelays(40);
    await expect(Math.max(...forty)).toBeLessThanOrEqual(STAGGER.cap);
    await expect(forty[39]).toBeGreaterThan(forty[1]);
    await expect(staggerDelays(5, 0)).toEqual([0, 0, 0, 0, 0]);
  },
};

/** The stagger demo: a 20 ms gap, none, and 150 ms, each with its strip; the strip's bars follow the delays. */
export const StaggerStripsMatchTheDelays = {
  render: () => <MotionDemo {...CHOREOGRAPHY_DEMOS.stagger} reduced={false} />,
  play: async ({ canvasElement }) => {
    await settled(canvasElement);
    const tight = stateOf(canvasElement, 'stagger-tight');
    const flat = stateOf(canvasElement, 'stagger-flat');
    const loose = stateOf(canvasElement, 'stagger-loose');
    await expect(tight.lag).toBe(80);
    await expect(flat.lag).toBe(0);
    await expect(loose.lag).toBe(600);
    const strips = canvasElement.querySelectorAll('[data-tile="stagger-tight"] [data-sequence-strip] rect');
    await expect(strips.length).toBe(5);
  },
};

/** Clean fades: the new content starts when the old is about 90% out, read from the appearance.fast spring. */
export const CleanFadeGapIsTheNinetyPercentTime = {
  render: () => <MotionDemo {...CHOREOGRAPHY_DEMOS.fades} reduced={false} />,
  play: async ({ canvasElement }) => {
    await expect(CLEAN_FADE_GAP_MS).toBeGreaterThan(40);
    await expect(CLEAN_FADE_GAP_MS).toBeLessThan(120);
    await settled(canvasElement);
    await expect(stateOf(canvasElement, 'fade-clean').gap).toBe(CLEAN_FADE_GAP_MS);
    await expect(stateOf(canvasElement, 'fade-cross').gap).toBe(0);
  },
};

/** Keep space: nothing moves into a place until what was there has gone. */
export const NothingMovesIntoAnOccupiedPlace = {
  render: () => <MotionDemo {...CHOREOGRAPHY_DEMOS.space} reduced={false} />,
  play: async ({ canvasElement }) => {
    await settled(canvasElement);
    await expect(stateOf(canvasElement, 'space-clear').clash).toBe(0);
    await expect(stateOf(canvasElement, 'space-collide').clash).toBe(1);
  },
};

/** Breakpoints: the layout steps through the kit's three states as the hand crosses each one. */
export const BreakpointsFollowTheHand = {
  render: () => <MotionDemo {...CHOREOGRAPHY_DEMOS.breakpoints} reduced={false} />,
  play: async ({ canvasElement }) => {
    await settled(canvasElement);
    const follows = stateOf(canvasElement, 'bp-follows');
    const lags = stateOf(canvasElement, 'bp-lags');
    await expect(follows.shown).toBe(768);
    await expect(lags.shown).toBe(768);
    // The right way never shows a width the hand has not reached.
    await expect(follows.stepsSeen).toEqual([1280, 960, 768]);
    await expect(lags.waited).toBe(1);
  },
};
