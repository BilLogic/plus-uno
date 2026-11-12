/**
 * The Transitions page's figures, run in the Storybook tests: each group's tree,
 * then every transition's demo. The same play tests as Physics: first pass, arrows
 * before the move, landing, then the still frame under reduced motion.
 *
 * Run: npx vitest run --project=storybook design-system/src/styles/MotionTransitions.stories.jsx
 */
import { expect } from 'storybook/test';

import { TRANSITION_DEMOS, TRANSITION_TREES } from '@/storybook-docs/illustrations/motion-transitions.jsx';
import { reducedStory, story } from '@/storybook-docs/illustrations/motion-story-helpers.jsx';

export default {
  // A test harness and the page's figures: `!dev` keeps it out of the sidebar.
  // The page itself is Foundations/Motion/Transitions (MotionTransitions.mdx).
  title: 'Foundations/Motion/Transitions',
  tags: ['!dev', '!autodocs'],
  parameters: { layout: 'padded' },
};

// ---------- Between places: the trees ----------
export const TreeGoTo = story(TRANSITION_TREES.go);
export const TreeGoToReduced = reducedStory(TRANSITION_TREES.go);
export const TreeDrill = story(TRANSITION_TREES.drill);
export const TreeDrillReduced = reducedStory(TRANSITION_TREES.drill);
export const TreeSwitch = story(TRANSITION_TREES.switch);
export const TreeSwitchReduced = reducedStory(TRANSITION_TREES.switch);
export const TreeStep = story(TRANSITION_TREES.step);
export const TreeStepReduced = reducedStory(TRANSITION_TREES.step);

// ---------- Between places: the demos ----------
export const GoTo = story(TRANSITION_DEMOS.go);
export const GoToReduced = reducedStory(TRANSITION_DEMOS.go);
export const DrillGrow = story(TRANSITION_DEMOS.drill);
export const DrillGrowReduced = reducedStory(TRANSITION_DEMOS.drill);
export const DrillDeeper = story(TRANSITION_DEMOS.deeper);
export const DrillDeeperReduced = reducedStory(TRANSITION_DEMOS.deeper);
export const ClimbOut = story(TRANSITION_DEMOS.climb);
export const ClimbOutReduced = reducedStory(TRANSITION_DEMOS.climb);
export const FocusedTask = story(TRANSITION_DEMOS.focused);
export const FocusedTaskReduced = reducedStory(TRANSITION_DEMOS.focused);
export const SwitchViews = story(TRANSITION_DEMOS.switch);
export const SwitchViewsReduced = reducedStory(TRANSITION_DEMOS.switch);
export const Step = story(TRANSITION_DEMOS.step);
export const StepReduced = reducedStory(TRANSITION_DEMOS.step);

/** The rulings the page carries, read off the scenes so a copy cannot drift from them. */
export const Rulings = {
  render: () => null,
  play: async () => {
    const scene = (demo, id) => demo.scenes.find((s) => s.id === id);
    // Drill grows and the list fades out with nothing dimmed; the record's content follows.
    await expect(scene(TRANSITION_DEMOS.drill, 'drill-grow').landing).toMatchObject({ g: 1, l: 0, c: 1 });
    // Back two levels fades; a focused task fades; page tabs slide with no fade.
    await expect(scene(TRANSITION_DEMOS.climb, 'climb-two').landing).toMatchObject({ f: 0, n: 1 });
    await expect(scene(TRANSITION_DEMOS.focused, 'focused-fade').landing).toMatchObject({ fr: 0, f: 1 });
    await expect(scene(TRANSITION_DEMOS.switch, 'switch-slide').landing).toMatchObject({ p: 1, i: 1 });
    await expect(scene(TRANSITION_DEMOS.switch, 'switch-slide').landing).not.toHaveProperty('o');
    // Step states change in place: visited, current, unvisited.
    await expect(scene(TRANSITION_DEMOS.step, 'step-across').landing).toMatchObject({ cur: 1, p: 1 });
  },
};
