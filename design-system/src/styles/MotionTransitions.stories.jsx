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

// ---------- Within a place ----------
export const ScrollToSpot = story(TRANSITION_DEMOS.scroll);
export const ScrollToSpotReduced = reducedStory(TRANSITION_DEMOS.scroll);
export const SwapContent = story(TRANSITION_DEMOS.swap);
export const SwapContentReduced = reducedStory(TRANSITION_DEMOS.swap);
export const AddAnItem = story(TRANSITION_DEMOS.add);
export const AddAnItemReduced = reducedStory(TRANSITION_DEMOS.add);
export const RemoveAnItem = story(TRANSITION_DEMOS.remove);
export const RemoveAnItemReduced = reducedStory(TRANSITION_DEMOS.remove);
export const ReorderItems = story(TRANSITION_DEMOS.reorder);
export const ReorderItemsReduced = reducedStory(TRANSITION_DEMOS.reorder);
export const ExpandARow = story(TRANSITION_DEMOS.expand);
export const ExpandARowReduced = reducedStory(TRANSITION_DEMOS.expand);
export const CollapseARow = story(TRANSITION_DEMOS.collapse);
export const CollapseARowReduced = reducedStory(TRANSITION_DEMOS.collapse);
export const LoadContent = story(TRANSITION_DEMOS.load);
export const LoadContentReduced = reducedStory(TRANSITION_DEMOS.load);

// ---------- Above a place ----------
export const ModalOpens = story(TRANSITION_DEMOS.modalOpen);
export const ModalOpensReduced = reducedStory(TRANSITION_DEMOS.modalOpen);
export const ModalCloses = story(TRANSITION_DEMOS.modalClose);
export const ModalClosesReduced = reducedStory(TRANSITION_DEMOS.modalClose);
export const DrawerOpens = story(TRANSITION_DEMOS.drawerOpen);
export const DrawerOpensReduced = reducedStory(TRANSITION_DEMOS.drawerOpen);
export const DrawerCloses = story(TRANSITION_DEMOS.drawerClose);
export const DrawerClosesReduced = reducedStory(TRANSITION_DEMOS.drawerClose);
export const FlagOpens = story(TRANSITION_DEMOS.flagOpen);
export const FlagOpensReduced = reducedStory(TRANSITION_DEMOS.flagOpen);
export const FlagCloses = story(TRANSITION_DEMOS.flagClose);
export const FlagClosesReduced = reducedStory(TRANSITION_DEMOS.flagClose);
export const ConfirmOrCancel = story(TRANSITION_DEMOS.confirm);
export const ConfirmOrCancelReduced = reducedStory(TRANSITION_DEMOS.confirm);
export const DockAPanel = story(TRANSITION_DEMOS.dock);
export const DockAPanelReduced = reducedStory(TRANSITION_DEMOS.dock);

// ---------- Feedback ----------
export const UpdateAValue = story(TRANSITION_DEMOS.update);
export const UpdateAValueReduced = reducedStory(TRANSITION_DEMOS.update);
export const CallAttention = story(TRANSITION_DEMOS.attention);
export const CallAttentionReduced = reducedStory(TRANSITION_DEMOS.attention);
export const ErrorInAField = story(TRANSITION_DEMOS.errField);
export const ErrorInAFieldReduced = reducedStory(TRANSITION_DEMOS.errField);
export const ErrorInAModal = story(TRANSITION_DEMOS.errModal);
export const ErrorInAModalReduced = reducedStory(TRANSITION_DEMOS.errModal);
export const ErrorOnAPage = story(TRANSITION_DEMOS.errPage);
export const ErrorOnAPageReduced = reducedStory(TRANSITION_DEMOS.errPage);

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
    // Within a place: a swap leaves no half-faded overlap; the Don't cross-fades.
    await expect(scene(TRANSITION_DEMOS.swap, 'swap-do').landing).toMatchObject({ f: 1, o: 0, n: 1 });
    await expect(scene(TRANSITION_DEMOS.swap, 'swap-dont').landing).toMatchObject({ o: 0, n: 1 });
    // A removed row fades, then the gap closes; an added row opens, then its content fades in.
    await expect(scene(TRANSITION_DEMOS.remove, 'remove-row').landing).toMatchObject({ h: 0, c: 0 });
    await expect(scene(TRANSITION_DEMOS.add, 'add-row').landing).toMatchObject({ h: 1, c: 1 });
    // Load: the Skeleton is gone and every part has arrived; the Don't never showed one.
    await expect(scene(TRANSITION_DEMOS.load, 'load-do').landing).toMatchObject({ sk: 0, ch: 1 });
    await expect(scene(TRANSITION_DEMOS.load, 'load-dont').landing).toMatchObject({ sk: 0, ch: 1 });
    // A docked Panel makes room for itself; a floating one leaves the page alone.
    await expect(scene(TRANSITION_DEMOS.dock, 'dock-docked').landing).toMatchObject({ p: 1, c: 1 });
    await expect(scene(TRANSITION_DEMOS.dock, 'dock-floating').landing).toMatchObject({ x: 0 });
    await expect(scene(TRANSITION_DEMOS.dock, 'dock-floating').landing).not.toHaveProperty('p');
    // Call attention plays once and ends unmarked; the shake is only the blocked Modal's.
    await expect(scene(TRANSITION_DEMOS.attention, 'attention-once').landing).toMatchObject({ h: 0, seen: 1 });
    await expect(scene(TRANSITION_DEMOS.errModal, 'err-modal-do').landing).toMatchObject({ h: 1, m: 1 });
    await expect(scene(TRANSITION_DEMOS.errModal, 'err-modal-do').landing).not.toHaveProperty('shook');
    await expect(scene(TRANSITION_DEMOS.errModal, 'err-modal-dont').landing).toMatchObject({ shook: 1 });
    await expect(scene(TRANSITION_DEMOS.errPage, 'err-page-dont').landing).toMatchObject({ shook: 1 });
  },
};
