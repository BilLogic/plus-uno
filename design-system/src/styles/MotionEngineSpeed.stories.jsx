/**
 * A motion page plays at the product's speed. The docs page renders the very
 * story the play tests run, so this renders it the way the page does and times
 * one move: the row growing into its record on `motion.spatial.default` must
 * take about that spring's settle time, not a fraction of it.
 *
 * Run: npx vitest run --project=storybook design-system/src/styles/MotionEngineSpeed.stories.jsx
 */
import { expect } from 'storybook/test';

import { measure, springFor } from '@/storybook-docs/illustrations/motion.jsx';
import { story } from '@/storybook-docs/illustrations/motion-story-helpers.jsx';
import { TRANSITION_DEMOS } from '@/storybook-docs/illustrations/motion-transitions.jsx';

export default {
  title: 'Foundations/Expression/Motion/Engine speed',
  tags: ['!dev', '!autodocs', 'manifest'],
  parameters: { layout: 'padded' },
};

const SETTLE_MS = measure(springFor('spatial.default')).settle * 1000;

/** Samples a tile's state each frame until `key` has gone from 0 to 1; returns the move's length in ms. */
const timeMove = (tile, key, timeout = 20000) =>
  new Promise((resolve, reject) => {
    const t0 = performance.now();
    let start = null;
    const tick = () => {
      const now = performance.now();
      const v = JSON.parse(tile.dataset.state)[key];
      if (start === null && v > 0 && v < 1) start = now;
      if (start !== null && v >= 0.99) return resolve(now - start);
      if (now - t0 > timeout) return reject(new Error(`${key} never moved`));
      requestAnimationFrame(tick);
    };
    tick();
  });

export const PlaysAtProductSpeedOnADocsPage = {
  render: (args) => story(TRANSITION_DEMOS.drill).render(args, { viewMode: 'docs' }),
  play: async ({ canvasElement }) => {
    const ms = await timeMove(canvasElement.querySelector('[data-tile="drill-grow"]'), 'g');
    // A frame or two of slack each way; an 8× fast-forward lands near SETTLE_MS / 8.
    await expect(ms).toBeGreaterThan(SETTLE_MS * 0.6);
    await expect(ms).toBeLessThan(SETTLE_MS * 2);
  },
};
