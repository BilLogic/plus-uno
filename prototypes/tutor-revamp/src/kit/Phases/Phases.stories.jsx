import { expect, within } from 'storybook/test';
import Phases from './Phases';
import { DARK, LIGHT, onSurface } from '../storyModes';

/** Phases: Before, During and After, with done, current and upcoming states and times. */
export default {
    title: 'Prototypes/Tutor revamp/Kit/Phases',
    component: Phases,
    decorators: [onSurface],
    args: {
        phases: [
            { id: 'before', label: 'Before', state: 'done', href: '#before' },
            { id: 'during', label: 'During', state: 'current', time: '1:00 pm', href: '#during' },
            { id: 'after', label: 'After', state: 'upcoming', time: '2:00 pm', href: '#after' },
        ],
    },
};

export const Light = {
    ...LIGHT,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const list = canvas.getByRole('list', { name: 'Session stage' });
        await expect(within(list).getAllByRole('link')).toHaveLength(3);
        await expect(canvas.getByRole('link', { name: /During/ })).toHaveAttribute('aria-current', 'step');
        await expect(canvas.getByRole('link', { name: /Before/ })).toHaveTextContent('(done)');
    },
};
export const Dark = { ...DARK };
