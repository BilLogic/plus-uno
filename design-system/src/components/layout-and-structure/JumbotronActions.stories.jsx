import React from 'react';
import { expect, within } from 'storybook/test';

import Jumbotron from './Jumbotron/Jumbotron';

/**
 * The appearance and spacing `Jumbotron` hands its buttons.
 *
 * `Jumbotron` renders `primaryButton` as a primary Button and `secondaryButton`
 * as a default one, at Button's default spacing. The defaults are spread first,
 * so a caller's `appearance` or `spacing` in the button object still wins. The
 * assertions are on the classes, because the classes are what the stylesheet
 * reads.
 */

export default {
    title: 'Components/Layout and structure/Jumbotron actions',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'The buttons a Jumbotron renders take Button\'s appearance and spacing, '
                    + 'and a caller\'s own values win.',
            },
        },
    },
};

export const DefaultButtonsTakeButtonDefaults = () => (
    <Jumbotron
        title="Autumn 2026"
        subtitle="12 weeks, 48 sessions"
        primaryButton={{ text: 'Enroll' }}
        secondaryButton={{ text: 'Read the outline' }}
    />
);

DefaultButtonsTakeButtonDefaults.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const enroll = canvas.getByRole('button', { name: 'Enroll' });
    const outline = canvas.getByRole('button', { name: 'Read the outline' });
    await expect(enroll.classList.contains('plus-btn--primary')).toBe(true);
    await expect(outline.classList.contains('plus-btn--default')).toBe(true);
    for (const button of [enroll, outline]) {
        await expect(button.classList.contains('plus-btn--compact')).toBe(false);
    }
};

/** And the override still overrides: the default is spread first for a reason. */
export const CallerSpacingStillWins = () => (
    <Jumbotron
        title="Autumn 2026"
        primaryButton={{ text: 'Enroll', spacing: 'compact' }}
    />
);

CallerSpacingStillWins.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Enroll' });
    await expect(button.classList.contains('plus-btn--compact')).toBe(true);
};
