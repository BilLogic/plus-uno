/**
 * The Principles page's Do/Don't pairs, run in the Storybook tests. Each pair is
 * one scene with one rule broken: the play test waits for the first pass and
 * checks both tiles landed where their scene says, and the arrows came first.
 *
 * Run: npx vitest run --project=storybook design-system/src/styles/MotionPrinciples.stories.jsx
 */
import { expect } from 'storybook/test';

import { PRINCIPLE_DEMOS } from '@/storybook-docs/illustrations/motion-principles.jsx';
import { reducedStory, story } from '@/storybook-docs/illustrations/motion-story-helpers.jsx';

export default {
  // A test harness and the page's figures: `!dev` keeps it out of the sidebar.
  // The page itself is Foundations/Motion/Principles (MotionPrinciples.mdx).
  title: 'Foundations/Motion/Principles',
  tags: ['!dev', '!autodocs'],
  parameters: { layout: 'padded' },
};

export const ShowWhatChanged = story(PRINCIPLE_DEMOS.showWhatChanged);
export const ShowWhatChangedReduced = reducedStory(PRINCIPLE_DEMOS.showWhatChanged);
export const AlwaysResponsive = story(PRINCIPLE_DEMOS.alwaysResponsive);
export const AlwaysResponsiveReduced = reducedStory(PRINCIPLE_DEMOS.alwaysResponsive);
export const MoveLikeRealThings = story(PRINCIPLE_DEMOS.moveLikeRealThings);
export const MoveLikeRealThingsReduced = reducedStory(PRINCIPLE_DEMOS.moveLikeRealThings);
export const QuietByDefault = story(PRINCIPLE_DEMOS.quietByDefault);
export const QuietByDefaultReduced = reducedStory(PRINCIPLE_DEMOS.quietByDefault);

/** Each pair is the same scene twice: a Do and a Don't, so a tile is never alone. */
export const PairsAreSameScene = {
  render: () => null,
  play: async () => {
    for (const demo of Object.values(PRINCIPLE_DEMOS)) {
      await expect(demo.scenes.length).toBe(2);
      const [a, b] = demo.scenes;
      await expect(a.viewBox).toBe(b.viewBox);
      await expect(Object.keys(a.landing)).toEqual(Object.keys(b.landing));
      // Arrows come before the move in both tiles, on the same path.
      await expect(a.arrows).toEqual(b.arrows);
    }
  },
};
