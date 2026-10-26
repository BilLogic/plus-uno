import { expect, within } from 'storybook/test';
import ReadOnlyQuote from './ReadOnlyQuote';
import { DARK, LIGHT, onSurface } from '../storyModes';

/** ReadOnlyQuote: a lead tutor's note, filled, with a read-only marker and no side stripe. */
export default {
    title: 'Prototypes/Tutor revamp/Kit/Read-only quote',
    component: ReadOnlyQuote,
    decorators: [(Story) => <div style={{ maxWidth: 420 }}><Story /></div>, onSurface],
    args: {
        children: 'Arlene lights up when she gets to explain. Let her lead the warm-up.',
        author: 'Priya Shah',
        initials: 'PS',
        date: 'Jan 18',
    },
};

export const Light = {
    ...LIGHT,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Priya Shah')).toBeInTheDocument();
        await expect(canvasElement.querySelector('[data-part="marker"]')).toHaveTextContent('Read only');
        await expect(canvasElement.querySelector('textarea, input, [contenteditable="true"]')).toBeNull();
    },
};
export const Dark = { ...DARK };
