import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import HintTooltip from './HintTooltip';
import { DARK, LIGHT, onSurface } from '../storyModes';

/**
 * HintTooltip: the words behind a chart mark, on hover and on focus. The play
 * tests hover, focus and Escape, and that the trigger is described by the tip.
 */
export default {
    title: 'Prototypes/Tutor revamp/Kit/Hint tooltip',
    component: HintTooltip,
    decorators: [onSurface],
    args: { hint: '92% now, target 95% by Feb 1' },
    render: (args) => (
        <div style={{ paddingTop: 'var(--space-400)' }}>
            <HintTooltip {...args}>
                <button type="button">Arlene’s goal</button>
            </HintTooltip>
        </div>
    ),
};

const tipOf = (canvas) => canvas.getByRole('tooltip', { hidden: true });

export const Light = {
    ...LIGHT,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { name: 'Arlene’s goal' });
        const tip = tipOf(canvas);
        await expect(trigger).toHaveAttribute('aria-describedby', tip.id);
        await expect(tip).toHaveAttribute('data-open', 'false');

        await userEvent.hover(trigger);
        await waitFor(() => expect(tip).toHaveAttribute('data-open', 'true'));
        await userEvent.unhover(trigger);
        await waitFor(() => expect(tip).toHaveAttribute('data-open', 'false'));

        trigger.focus();
        await waitFor(() => expect(tip).toHaveAttribute('data-open', 'true'));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(tip).toHaveAttribute('data-open', 'false'));
        trigger.blur();
    },
};

export const Dark = { ...DARK, args: { pinned: true } };

/** Pinned open, for screenshots. */
export const Pinned = {
    ...LIGHT,
    args: { pinned: true },
    play: async ({ canvasElement }) => {
        await expect(tipOf(within(canvasElement))).toHaveAttribute('data-open', 'true');
    },
};
