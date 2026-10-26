import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import PrepChecklist from './PrepChecklist';
import { MATH_7 } from '../../data/mock';
import { DARK, LIGHT, onSurface } from '../storyModes';

/** PrepChecklist: a session's prep; items tick and expand. */
export default {
    title: 'Prototypes/Tutor revamp/Kit/Prep checklist',
    component: PrepChecklist,
    decorators: [(Story) => <div style={{ width: 640 }}><Story /></div>, onSurface],
    args: { items: MATH_7.prep, defaultOpenId: 'warm-up' },
};

export const Light = {
    ...LIGHT,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const first = canvas.getByRole('checkbox', { name: 'Celebrate Arlene’s fractions streak' });
        const third = canvas.getByRole('checkbox', { name: 'Ask Taylor to explain one step out loud' });
        await expect(first).toBeChecked();
        await userEvent.click(third);
        await expect(third).toBeChecked();
        const toggle = canvas.getByRole('button', { name: 'Ask Taylor to explain one step out loud' });
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await userEvent.click(toggle);
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(canvas.getByText('From the lesson Prompting Students to Explain.')).toBeVisible();
    },
};
export const Dark = { ...DARK };
