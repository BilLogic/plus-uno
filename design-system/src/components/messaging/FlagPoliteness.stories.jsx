import React from 'react';
import { expect, within } from 'storybook/test';

import { Flag } from './Flag';

/**
 * How loudly a flag speaks.
 *
 * WHY THIS FILE EXISTS (#325). Every flag was `role="alert"` with
 * `aria-live="assertive"`, whatever it said. Assertive means "stop what you are
 * reading and read this", so "Saved" and "Copied" cut across whatever a screen
 * reader was in the middle of — a sighted user's glanceable confirmation became
 * an interruption for everyone else.
 *
 * The rule is the one the ARIA practices give: assertive for something that has
 * gone wrong and changes what the user should do next, polite for everything
 * else. `role` and `aria-live` move together here because a mismatched pair —
 * `role="alert"` with `aria-live="polite"` — is less predictable than either
 * value alone.
 *
 * axe cannot help: both pairs are legal markup. This is a judgment about the
 * message, so the assertion has to name which styles are which.
 */

export default {
    title: 'Components/Messaging/Flag politeness',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Regression cover for #325: a flag interrupts only when its message is '
                    + 'worth interrupting for.',
            },
        },
    },
};

const stack = { display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' };

export const PolitenessFollowsTheMessage = () => (
    <div style={stack}>
        <Flag appearance="success" title="Saved" show autohide={false} data-testid="tp-success">
            Your changes are saved.
        </Flag>
        <Flag appearance="error" title="Upload failed" show autohide={false} data-testid="tp-danger">
            The file was larger than 10 MB.
        </Flag>
    </div>
);

PolitenessFollowsTheMessage.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // A confirmation waits its turn. This was `alert`/`assertive` before.
    const success = canvas.getByTestId('tp-success');
    await expect(success.getAttribute('role')).toBe('status');
    await expect(success.getAttribute('aria-live')).toBe('polite');

    // A failure does not.
    const danger = canvas.getByTestId('tp-danger');
    await expect(danger.getAttribute('role')).toBe('alert');
    await expect(danger.getAttribute('aria-live')).toBe('assertive');

    // Either way the whole flag is read as one thing, not word by word.
    await expect(success.getAttribute('aria-atomic')).toBe('true');

    // And the style icon is decoration — every other icon in these components
    // is hidden and this one was not.
    const icon = success.querySelector('.plus-flag-icon i');
    await expect(icon.getAttribute('aria-hidden')).toBe('true');
};
