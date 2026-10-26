import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import GoalMeter from './GoalMeter';
import { DARK, LIGHT, onSurface } from '../storyModes';

/**
 * GoalMeter: a value on a track with its goal as marks: a green tick for a
 * target, a green outline for a range. The words live in the tooltip, never
 * beside the bar.
 */
export default {
    title: 'Prototypes/Tutor revamp/Kit/Goal meter',
    component: GoalMeter,
    decorators: [onSurface],
    args: {
        value: 92,
        target: 95,
        label: 'Arlene McCoy goal progress, 92% of a 95% target',
        hint: '92% now, target 95% by Feb 1',
    },
    render: (args) => (
        <div style={{ width: 240, paddingTop: 'var(--space-300)' }}>
            <GoalMeter {...args} />
        </div>
    ),
};

export const Light = {
    ...LIGHT,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const meter = canvas.getByRole('meter', { name: /92% of a 95% target/ });
        await expect(meter).toHaveAttribute('aria-valuenow', '92');
        await expect(canvasElement.querySelector('[data-part="target"]').style.left).toBe('95%');
        const tip = canvas.getByRole('tooltip', { hidden: true });
        await userEvent.hover(meter);
        await waitFor(() => expect(tip).toHaveAttribute('data-open', 'true'));
        await userEvent.unhover(meter);
        await userEvent.tab();
        await expect(meter).toHaveFocus();
        await waitFor(() => expect(tip).toHaveAttribute('data-open', 'true'));
        meter.blur();
    },
};

export const Dark = { ...DARK };

/** A recommended range as a green outline; the value sits above it. */
export const Range = {
    ...LIGHT,
    args: {
        value: 18,
        max: 60,
        target: undefined,
        range: [8, 12],
        tone: 'warning',
        label: 'Observing, 18% of session time',
        hint: '18% of session time, recommended 8–12%',
        pinned: true,
    },
    play: async ({ canvasElement }) => {
        await expect(canvasElement.querySelector('[data-part="range"]')).toBeTruthy();
    },
};

/** Inside a link: no tab stop and no tooltip. */
export const Static = {
    ...LIGHT,
    args: { interactive: false, size: 'sm', value: 16.8, max: 20, target: 20, label: '16.8 of 20 paid hours' },
    play: async ({ canvasElement }) => {
        const meter = within(canvasElement).getByRole('meter');
        await expect(meter).not.toHaveAttribute('tabindex');
        await expect(within(canvasElement).queryByRole('tooltip', { hidden: true })).toBeNull();
    },
};
