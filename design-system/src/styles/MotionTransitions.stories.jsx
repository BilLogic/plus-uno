/**
 * The Transitions page's figures, run in the Storybook tests: each group's tree,
 * then every transition's demo. The same play tests as Physics: first pass, arrows
 * before the move, landing, then the still frame under reduced motion.
 *
 * Run: npx vitest run --project=storybook design-system/src/styles/MotionTransitions.stories.jsx
 */
import { expect, waitFor } from 'storybook/test';
import { userEvent as pointer } from 'vitest/browser';

import { TRANSITION_DEMOS, TRANSITION_TREES } from '@/storybook-docs/illustrations/motion-transitions.jsx';
import { DragReorder } from '@/storybook-docs/illustrations/motion-drag.jsx';
import { reducedStory, story } from '@/storybook-docs/illustrations/motion-story-helpers.jsx';

export default {
  // A test harness and the page's figures: `!dev` keeps it out of the sidebar.
  // The page itself is Foundations/Motion/Transitions (MotionTransitions.mdx).
  title: 'Foundations/Motion/Transitions',
  tags: ['!dev', '!autodocs', 'manifest'],
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

const TEST_SPEED = 8;

// ---------- Reorder items: dragging and the keyboard ----------
const orderOf = (el) => el.dataset.order;
const lists = (canvasElement) => [...canvasElement.querySelectorAll('[data-reorder-list]')];
const handle = (canvasElement, id) => canvasElement.querySelector(`[data-item="${id}"] [data-grab]`);
const settled = (canvasElement) => waitFor(() => expect(canvasElement.querySelector('[data-reorder-root]').dataset.phase).toBe('settled'), { timeout: 15000, interval: 50 });

const dragsWithPointer = async ({ canvasElement }) => {
  const [list] = lists(canvasElement);
  await expect(orderOf(list)).toBe('a,b,c');
  await pointer.dragAndDrop(handle(canvasElement, 'a'), canvasElement.querySelector('[data-item="c"]'));
  await waitFor(() => expect(orderOf(list)).toBe('b,c,a'), { timeout: 15000 });
  await settled(canvasElement);
};
const movesWithKeyboard = async ({ canvasElement }) => {
  const [list] = lists(canvasElement);
  handle(canvasElement, 'a').focus();
  await pointer.keyboard('{ }');
  await pointer.keyboard('{ArrowDown}');
  await expect(canvasElement.querySelector('[aria-live]').textContent).toMatch(/position 2 of 3/);
  await pointer.keyboard('{ }');
  await waitFor(() => expect(orderOf(list)).toBe('b,a,c'), { timeout: 15000 });
  await settled(canvasElement);
};

export const ReorderDrag = {
  render: () => <DragReorder fastForward={TEST_SPEED} />,
  play: dragsWithPointer,
};
export const ReorderKeyboard = {
  render: () => <DragReorder fastForward={TEST_SPEED} />,
  play: movesWithKeyboard,
};
export const ReorderDragReduced = {
  render: () => <DragReorder reduced />,
  play: dragsWithPointer,
};
export const ReorderKeyboardReduced = {
  render: () => <DragReorder reduced />,
  play: movesWithKeyboard,
};
export const DragBetweenLists = {
  render: () => <DragReorder between fastForward={TEST_SPEED} />,
  play: async ({ canvasElement }) => {
    const [from, to] = lists(canvasElement);
    await pointer.dragAndDrop(handle(canvasElement, 'a'), canvasElement.querySelector('[data-item="y"]'));
    await waitFor(() => expect([orderOf(from), orderOf(to)]).toEqual(['b,c', 'x,a,y,z']), { timeout: 15000 });
    await settled(canvasElement);
  },
};
export const DragBetweenListsKeyboard = {
  render: () => <DragReorder between reduced />,
  play: async ({ canvasElement }) => {
    const [from, to] = lists(canvasElement);
    handle(canvasElement, 'a').focus();
    await pointer.keyboard('{ }');
    await pointer.keyboard('{ArrowRight}');
    await pointer.keyboard('{ }');
    await waitFor(() => expect([orderOf(from), orderOf(to)]).toEqual(['b,c', 'a,x,y,z']), { timeout: 15000 });
  },
};

// The same demos, left alone for the page: the person drags them.
export const ReorderDragDemo = { render: () => <DragReorder /> };
export const DragBetweenListsDemo = { render: () => <DragReorder between /> };
