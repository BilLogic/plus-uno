import { expect, within } from 'storybook/test';
import ProgressSteps from './ProgressSteps';
import { DARK, LIGHT, onSurface } from '../storyModes';

/** ProgressSteps: one segment per step; done fill, current half-fills. */
export default {
    title: 'Prototypes/Tutor revamp/Kit/Progress steps',
    component: ProgressSteps,
    decorators: [(Story) => <div style={{ width: 240 }}><Story /></div>, onSurface],
    args: { total: 4, done: 2, current: 3 },
};

export const Light = {
    ...LIGHT,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('img', { name: 'Step 3 of 4' })).toBeInTheDocument();
        await expect(canvasElement.querySelectorAll('[data-state="done"]')).toHaveLength(2);
    },
};
export const Dark = { ...DARK };

/** A lesson's progress, with no step in progress. */
export const LessonProgress = {
    ...LIGHT,
    args: { total: 9, done: 4, current: undefined },
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('img', { name: '4 of 9 steps' })).toBeInTheDocument();
    },
};
