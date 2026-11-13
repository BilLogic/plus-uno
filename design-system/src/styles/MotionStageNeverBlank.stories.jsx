/**
 * A motion tile never paints nothing. Every registry of demos plays at 8× for
 * several loops; each frame, every tile's drawing (its trails and tap ring
 * aside) must keep painted content at an effective opacity of at least 0.5.
 * The loop reset crossfades and the arrows phase only veils, so no tile blanks
 * or washes out.
 *
 * Run: npx vitest run --project=storybook design-system/src/styles/MotionStageNeverBlank.stories.jsx
 */
import React from 'react';
import { expect } from 'storybook/test';

import { MotionDemo } from '@/storybook-docs/illustrations/motion.jsx';
import { CHOREOGRAPHY_DEMOS } from '@/storybook-docs/illustrations/motion-choreography.jsx';
import { PHYSICS_DEMOS } from '@/storybook-docs/illustrations/motion-physics.jsx';
import { PLAYGROUND_DEMOS } from '@/storybook-docs/illustrations/motion-playground.jsx';
import { PRINCIPLE_DEMOS } from '@/storybook-docs/illustrations/motion-principles.jsx';
import { TRANSITION_DEMOS } from '@/storybook-docs/illustrations/motion-transitions.jsx';
import { ABOVE_DEMOS, FEEDBACK_DEMOS, WITHIN_DEMOS } from '@/storybook-docs/illustrations/motion-transitions-place.jsx';

export default {
  title: 'Foundations/Expression/Motion/Stage never blank',
  tags: ['!dev', '!autodocs', 'manifest'],
  parameters: { layout: 'padded' },
};

const SAMPLE_MS = 9000;
const MIN_OPACITY = 0.5;

const effectiveOpacity = (el, svg) => {
  let o = 1;
  for (let n = el; n && n !== svg; n = n.parentElement) {
    const v = n.getAttribute('opacity') ?? n.style.opacity;
    if (v !== null && v !== '') o *= Number(v);
  }
  return o;
};

/** How many painted shapes of a tile's drawing read at MIN_OPACITY or more right now. */
const visibleContent = (tile) => {
  const svg = tile.querySelector('svg');
  return [...svg.querySelectorAll('rect, path, circle, ellipse, line, polygon, polyline')].filter((el) => {
    if (el.closest('[data-trail]')) return false;
    const fill = el.getAttribute('fill');
    const stroke = el.getAttribute('stroke');
    if ((!fill || fill === 'none') && (!stroke || stroke === 'none')) return false;
    const box = el.getBBox();
    if (!box.width && !box.height) return false;
    return effectiveOpacity(el, svg) >= MIN_OPACITY;
  }).length;
};

const neverBlankStory = (demos) => ({
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Object.entries(demos).map(([key, demo]) => (
        <div key={key} data-demo-key={key}>
          <MotionDemo {...demo} reduced={false} fastForward={8} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const tiles = [...canvasElement.querySelectorAll('[data-tile]')];
    await expect(tiles.length).toBeGreaterThan(0);
    const blank = new Map();
    const start = performance.now();
    await new Promise((resolve) => {
      const tick = () => {
        for (const tile of tiles) {
          if (!visibleContent(tile)) blank.set(`${tile.closest('[data-demo-key]').dataset.demoKey}/${tile.dataset.tile}`, tile.dataset.state);
        }
        if (performance.now() - start < SAMPLE_MS) requestAnimationFrame(tick);
        else resolve();
      };
      tick();
    });
    await expect([...blank.keys()]).toEqual([]);
  },
});

export const PrinciplesNeverBlank = neverBlankStory(PRINCIPLE_DEMOS);
export const PhysicsNeverBlank = neverBlankStory(PHYSICS_DEMOS);
export const ChoreographyNeverBlank = neverBlankStory(CHOREOGRAPHY_DEMOS);
export const PlaygroundNeverBlank = neverBlankStory(PLAYGROUND_DEMOS);
export const TransitionsNeverBlank = neverBlankStory(TRANSITION_DEMOS);
export const TransitionsWithinNeverBlank = neverBlankStory(WITHIN_DEMOS);
export const TransitionsAboveNeverBlank = neverBlankStory(ABOVE_DEMOS);
export const TransitionsFeedbackNeverBlank = neverBlankStory(FEEDBACK_DEMOS);
