import { expect, within } from 'storybook/test';
import Sparkline from './Sparkline';
import { DARK, LIGHT, onSurface } from '../storyModes';

/** Sparkline: recent values as one line, the last point marked. */
export default {
    title: 'Prototypes/Tutor revamp/Kit/Sparkline',
    component: Sparkline,
    decorators: [onSurface],
    args: { points: [11, 8, 5, 6, 3, 12, 15], label: 'Practice minutes, last 7 sessions' },
};

export const Light = {
    ...LIGHT,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('img', { name: 'Practice minutes, last 7 sessions' })).toBeInTheDocument();
        await expect(canvasElement.querySelector('[data-part="last"]')).toBeTruthy();
    },
};
export const Dark = { ...DARK };
