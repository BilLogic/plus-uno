import React from 'react';
import { expect, within } from 'storybook/test';

import Jumbotron from './Jumbotron/Jumbotron';

/**
 * The size `Jumbotron` hands its buttons.
 *
 * WHY THIS FILE EXISTS (#317). `Jumbotron` rendered both action buttons with
 * `size="default"`. `Button.propTypes.size` is `oneOf(['small','medium','large'])`
 * and `Button` interpolates the value straight into a class name, so every
 * jumbotron button failed the prop type AND carried a size class that
 * `Button.scss` has no rule for — falling back to base metrics and, in the
 * typography map, to `h6`.
 *
 * It stayed invisible because the default is spread FIRST: any caller who
 * passed a `size` in the button object overrode it, so the broken value only
 * reached the DOM when nobody said otherwise, which is the case nobody writes a
 * story for. `propTypes` warnings go to the console, and a console warning is
 * not a failing check.
 *
 * The assertion is on the class rather than the prop, because the class is what
 * the stylesheet reads. A size that fails its own prop type still renders; a
 * size with no rule renders wrong.
 */

export default {
    title: 'Components/Layout and structure/Jumbotron actions',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Regression cover for #317: the default button size has to be one the '
                    + 'stylesheet defines.',
            },
        },
    },
};

export const DefaultButtonsTakeADefinedSize = () => (
    <Jumbotron
        title="Autumn 2026"
        subtitle="12 weeks, 48 sessions"
        primaryButton={{ text: 'Enrol' }}
        secondaryButton={{ text: 'Read the outline' }}
    />
);

DefaultButtonsTakeADefinedSize.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const name of ['Enrol', 'Read the outline']) {
        const button = canvas.getByRole('button', { name });
        // The discriminator: `plus-btn--default` before the fix, and no rule
        // anywhere matches it.
        await expect(button.classList.contains('plus-btn--medium')).toBe(true);
        await expect(button.classList.contains('plus-btn--default')).toBe(false);
    }
};

/**
 * And the override still overrides — the default is spread first for a reason.
 */
export const CallerSizeStillWins = () => (
    <Jumbotron
        title="Autumn 2026"
        primaryButton={{ text: 'Enrol', size: 'large' }}
    />
);

CallerSizeStillWins.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Enrol' });
    await expect(button.classList.contains('plus-btn--large')).toBe(true);
};
