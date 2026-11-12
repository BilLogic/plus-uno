/**
 * The Playground page's demos, run in the Storybook tests: the spring
 * controls, which must drive the same spring config the token generator emits,
 * and the feel checks.
 *
 * Run: npx vitest run --project=storybook design-system/src/styles/MotionPlayground.stories.jsx
 */
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { MotionDemo, springFor } from '@/storybook-docs/illustrations/motion.jsx';
import { reducedStory } from '@/storybook-docs/illustrations/motion-story-helpers.jsx';
import { PLAYGROUND_DEMOS, SpringPlayground, playgroundConfig } from '@/storybook-docs/illustrations/motion-playground.jsx';

export default {
  // A test harness and the page's figures: `!dev` keeps it out of the sidebar.
  // The page itself is Foundations/Motion/Playground (MotionPlayground.mdx).
  title: 'Foundations/Motion/Playground',
  tags: ['!dev', '!autodocs'],
  parameters: { layout: 'padded' },
};

const PASS = { timeout: 15000, interval: 50 };
const configOf = (root) => JSON.parse(root.dataset.config);

/** Untouched controls give exactly the config the generator emits for the token and mode. */
export const ControlsStartAtTheGeneratorsConfig = {
  render: () => <SpringPlayground reduced={false} />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-playground]');
    await expect(configOf(root)).toEqual(springFor('spatial.default', 'productive'));
    await expect(playgroundConfig({ token: 'spatial.slow', mode: 'expressive' })).toEqual(springFor('spatial.slow', 'expressive'));
  },
};

/** Changing a control changes the spring config the demo reads on its next move. */
export const ChangingAControlChangesTheSpringTheDemoReads = {
  render: () => <SpringPlayground reduced={false} />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-playground]');
    const view = within(canvasElement);
    const before = configOf(root);

    const stiffness = view.getByRole('slider', { name: /stiffness/i });
    stiffness.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
    await waitFor(() => expect(configOf(root).stiffness).toBeGreaterThan(before.stiffness));

    await userEvent.click(view.getByRole('button', { name: /play/i }));
    // The move that plays is on the config now in the controls, not the token's.
    await waitFor(() => expect(JSON.parse(root.dataset.played)).toEqual(configOf(root)), PASS);
    await waitFor(() => expect(root.dataset.phase).toBe('settled'), PASS);
    await expect(JSON.parse(root.dataset.played).stiffness).not.toBe(before.stiffness);

    // The ratio moves the damping and leaves the stiffness alone.
    const mid = configOf(root);
    const ratio = view.getByRole('slider', { name: /ratio/i });
    ratio.focus();
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    await waitFor(() => expect(configOf(root).damping).toBeLessThan(mid.damping));
    await expect(configOf(root).stiffness).toBe(mid.stiffness);
  },
};

/** The mode switch loads that mode's generated spring into the controls. */
export const ModeLoadsTheModesSpring = {
  render: () => <SpringPlayground reduced={false} />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-playground]');
    const view = within(canvasElement);
    await userEvent.click(view.getByRole('radio', { name: /expressive/i }));
    await waitFor(() => expect(configOf(root)).toEqual(springFor('spatial.default', 'expressive')));
  },
};

/** The speed control slows the playback of what the demo plays. */
export const SpeedSlowsThePlayback = {
  render: () => <SpringPlayground reduced={false} />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-playground]');
    const view = within(canvasElement);
    await userEvent.click(view.getByRole('radio', { name: /¼×/ }));
    await waitFor(() => expect(root.dataset.speed).toBe('0.25'));
  },
};

/** The two ends of the dial, as a Popup opening. */
export const StiffAndSoft = {
  render: () => <MotionDemo {...PLAYGROUND_DEMOS.extremes} reduced={false} />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-motion-demo]');
    await waitFor(() => expect(root.dataset.phase).toBe('settled'), PASS);
    for (const scene of PLAYGROUND_DEMOS.extremes.scenes) {
      await expect(JSON.parse(canvasElement.querySelector(`[data-tile="${scene.id}"]`).dataset.state)).toMatchObject(scene.landing);
    }
  },
};

/** The blocked Save shakes once and comes to rest. */
export const TheShake = {
  render: () => <MotionDemo {...PLAYGROUND_DEMOS.shake} reduced={false} />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-motion-demo]');
    await waitFor(() => expect(root.dataset.phase).toBe('settled'), PASS);
    await expect(JSON.parse(canvasElement.querySelector('[data-tile="shake"]').dataset.state)).toMatchObject({ x: 0, shook: 1 });
  },
};

/** The three Productive speeds, each on its own job. */
export const ThreeSpeeds = {
  render: () => <MotionDemo {...PLAYGROUND_DEMOS.speeds} reduced={false} />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-motion-demo]');
    await waitFor(() => expect(root.dataset.phase).toBe('settled'), PASS);
    for (const scene of PLAYGROUND_DEMOS.speeds.scenes) {
      await expect(JSON.parse(canvasElement.querySelector(`[data-tile="${scene.id}"]`).dataset.state)).toMatchObject(scene.landing);
    }
  },
};

/** Under reduced motion each demo shows its landing, still: the same end frame as the animated pass. */
export const StiffAndSoftReduced = reducedStory(PLAYGROUND_DEMOS.extremes);
export const TheShakeReduced = reducedStory(PLAYGROUND_DEMOS.shake);
export const ThreeSpeedsReduced = reducedStory(PLAYGROUND_DEMOS.speeds);

/** The spring controls under reduced motion: Play lands on the end frame with no travel. */
export const PlayLandsStillWhenReduced = {
  render: () => <SpringPlayground reduced />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-playground]');
    await userEvent.click(within(canvasElement).getByRole('button', { name: /play/i }));
    await waitFor(() => expect(root.dataset.phase).toBe('settled'), PASS);
  },
};
