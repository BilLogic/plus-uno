import React from 'react';
import { expect, waitFor } from 'storybook/test';

import { MotionDemo } from './motion.jsx';

/**
 * The play tests every motion page's stories share: wait for a demo's first
 * pass to settle and check each tile landed where its scene says, then render
 * the same demo under reduced motion and check it reaches the same landing as
 * a still frame. Intermediate frames are never asserted.
 */

const PAINTED = ['fill', 'stroke'];
const TOKEN_OR_NONE = /^(?:var\(--ds-[\w-]+\)|none)$/;
const everyPaintIsAToken = (root) =>
  [...root.querySelectorAll('svg *')].every((el) =>
    PAINTED.every((attr) => !el.hasAttribute(attr) || TOKEN_OR_NONE.test(el.getAttribute(attr))),
  );

// A first pass is a hold, the arrows and the motion; at ¼× it is four times
// that. One pass at 1× stays well inside this.
export const PASS = { timeout: 15000, interval: 50 };

export const landed = (demo, canvasElement) => {
  for (const scene of demo.scenes) {
    const tile = canvasElement.querySelector(`[data-tile="${scene.id}"]`);
    expect(JSON.parse(tile.dataset.state)).toMatchObject(scene.landing);
  }
};

/** Plays one pass, checks the arrows came first, then checks every landing. */
export const playsToItsLanding = (demo) => async ({ canvasElement }) => {
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
export const stillAtItsLanding = (demo) => async ({ canvasElement }) => {
  const root = canvasElement.querySelector('[data-motion-demo]');
  await waitFor(() => expect(root.dataset.phase).toBe('still'), PASS);
  landed(demo, canvasElement);
  await expect(everyPaintIsAToken(root)).toBe(true);
};

// A test does not need to watch a pass in real time: it plays at 8×, so a slow
// CI browser still settles well inside the test timeout. The landing is the same.
const TEST_SPEED = 8;

export const story = (demo) => ({ render: () => <MotionDemo {...demo} fastForward={TEST_SPEED} />, play: playsToItsLanding(demo) });
export const reducedStory = (demo) => ({ render: () => <MotionDemo {...demo} reduced />, play: stillAtItsLanding(demo) });
