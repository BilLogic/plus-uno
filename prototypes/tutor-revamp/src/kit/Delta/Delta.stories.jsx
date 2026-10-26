import React from 'react';
import { expect, within } from 'storybook/test';
import Delta from './Delta';
import { DARK, LIGHT, onSurface } from '../storyModes';

/** Delta: up (success), down (warning, never danger) and flat. */
export default {
    title: 'Prototypes/Tutor revamp/Kit/Delta',
    component: Delta,
    decorators: [onSurface],
    render: () => (
        <div style={{ display: 'flex', gap: 'var(--space-200)' }}>
            <Delta direction="up">12% than November</Delta>
            <Delta direction="down">6 min a day</Delta>
            <Delta direction="flat">same as November</Delta>
        </div>
    ),
};

export const Light = {
    ...LIGHT,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(/12% than November/).closest('[data-direction]')).toHaveTextContent('Up 12% than November');
        await expect(canvas.getByText(/6 min a day/).closest('[data-direction]')).toHaveTextContent('Down 6 min a day');
    },
};
export const Dark = { ...DARK };
