import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import Disclosure from './Disclosure';
import { DARK, LIGHT, onSurface } from '../storyModes';

/** Disclosure: one line, the rest on demand; a chevron that turns. */
export default {
    title: 'Prototypes/Tutor revamp/Kit/Disclosure',
    component: Disclosure,
    decorators: [(Story) => <div style={{ width: 560 }}><Story /></div>, onSurface],
    args: { title: 'Warm up on unlike denominators' },
    render: (args) => (
        <Disclosure {...args}>
            <p>Morgan missed 3 of 4 tries last session. Five minutes is enough.</p>
        </Disclosure>
    ),
};

export const Light = {
    ...LIGHT,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const toggle = canvas.getByRole('button', { name: 'Warm up on unlike denominators' });
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(canvas.queryByText(/Five minutes/)).not.toBeVisible();
        await userEvent.click(toggle);
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(canvas.getByText(/Five minutes/)).toBeVisible();
    },
};
export const Dark = { ...DARK, args: { defaultOpen: true } };
