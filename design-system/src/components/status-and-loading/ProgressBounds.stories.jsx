import React from 'react';
import { expect, within } from 'storybook/test';

import Progress from './Progress/Progress';

/**
 * What a progress bar says when the number is out of range.
 *
 * WHY THIS FILE EXISTS (#325). The bar's WIDTH was clamped to 0–100% and the
 * announced value was not, so `value={140}` with `max={100}` drew a full bar
 * while reporting `aria-valuenow="140"` against `aria-valuemax="100"`. A value
 * above its own maximum is a state no assistive technology can render sensibly,
 * and it is the case that turns up in practice — a count that overshoots, a
 * percentage computed from a stale total.
 *
 * Nothing could have caught it. axe checks that a `progressbar` has the three
 * attributes, not that they agree with each other, and the bar looks right at
 * both ends because the width was the half that was already clamped.
 */

export default {
    title: 'Components/Status and loading/Progress bounds',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Regression cover for #325: the announced value stays inside the bounds the '
                    + 'bar announces.',
            },
        },
    },
};

const stack = { display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '420px' };

export const OutOfRangeValuesAreClamped = () => (
    <div style={stack}>
        <Progress value={140} max={100} label="Over" />
        <Progress value={-20} max={100} label="Under" />
        <Progress value={40} max={100} label="Within" />
    </div>
);

OutOfRangeValuesAreClamped.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const over = canvas.getByRole('progressbar', { name: 'Over' });
    await expect(over.getAttribute('aria-valuenow')).toBe('100');
    await expect(over.style.width).toBe('100%');

    const under = canvas.getByRole('progressbar', { name: 'Under' });
    await expect(under.getAttribute('aria-valuenow')).toBe('0');
    await expect(under.style.width).toBe('0%');

    // And an in-range value is reported as itself, not rounded to the width.
    const within40 = canvas.getByRole('progressbar', { name: 'Within' });
    await expect(within40.getAttribute('aria-valuenow')).toBe('40');
};
