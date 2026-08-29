import React from 'react';
import { expect, userEvent, within } from 'storybook/test';

import LessonWelcomeSection from './LessonWelcomeSection/LessonWelcomeSection';

/**
 * The lesson tabs, as tabs.
 *
 * WHAT WAS WRONG. The three tabs were plain buttons carrying
 * `aria-selected` — an attribute ARIA does not allow on a button, because a
 * button has no selected state. axe reported `aria-allowed-attr` on all six
 * rendered instances, and the attribute did nothing: which tab was current was
 * a colour and an underline, and nothing else. A screen-reader user was told
 * "button, Sign Up / Edit" three times with no indication that they were a set
 * or that one of them was showing.
 *
 * WHAT IT IS NOW. The roles the markup already meant: a `tablist` of `tab`s,
 * each pointing at the `tabpanel` it shows. That makes `aria-selected` both
 * legal and true.
 *
 * AND THE PART A ROLE ALONE WOULD HAVE BROKEN. The ARIA practices pair a
 * tablist with a roving `tabIndex` — one tab stop for the whole set — which
 * would have made two of the three tabs unreachable if the arrow keys did not
 * move between them. Adding the role without the keys is how an accessibility
 * fix becomes a cage, so the keys are asserted here rather than assumed:
 * Right wraps forward, Left wraps back, Home and End jump, and selection
 * follows focus.
 *
 * axe cannot see any of that — it checks that roles are used legally, not that
 * they are honoured. These assertions are the contract.
 */
export default {
    title: 'Specs/Training/Lesson tabs — roles and keys',
    component: LessonWelcomeSection,
    tags: ['!dev', '!autodocs'],
};

const TABS = [
    { id: 'sign-up', label: 'Sign Up / Edit' },
    { id: 'session-links', label: 'Session links' },
    { id: 'reflection', label: 'Reflection' },
];

const tabs = (canvas) => canvas.getAllByRole('tab');
const selected = (canvas) => tabs(canvas).find((tab) => tab.getAttribute('aria-selected') === 'true');

export const RolesAndKeyboard = {
    args: { tabs: TABS, activeTab: 'sign-up' },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        /* The roles, and the relationship between them. */
        const list = canvas.getByRole('tablist');
        await expect(list).toHaveAccessibleName('Lesson groups');
        await expect(tabs(canvas)).toHaveLength(TABS.length);
        const panel = canvas.getByRole('tabpanel');
        await expect(selected(canvas)).toHaveTextContent('Sign Up / Edit');
        await expect(panel.getAttribute('aria-labelledby')).toBe(selected(canvas).id);

        /* Exactly one tab stop. The rest are reached with the arrows. */
        for (const tab of tabs(canvas)) {
            const expected = tab.getAttribute('aria-selected') === 'true' ? '0' : '-1';
            await expect(tab.getAttribute('tabindex'), `${tab.textContent} tabindex`).toBe(expected);
        }

        /* Right moves and selection follows focus. */
        selected(canvas).focus();
        await userEvent.keyboard('{ArrowRight}');
        await expect(selected(canvas)).toHaveTextContent('Session links');
        await expect(document.activeElement).toBe(selected(canvas));

        /* Left from the first wraps to the last, and back. */
        await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
        await expect(selected(canvas)).toHaveTextContent('Reflection');

        /* Home and End are absolute. */
        await userEvent.keyboard('{Home}');
        await expect(selected(canvas)).toHaveTextContent('Sign Up / Edit');
        await userEvent.keyboard('{End}');
        await expect(selected(canvas)).toHaveTextContent('Reflection');

        /* The panel follows the selection, or the roles are decoration. */
        await expect(canvas.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe(selected(canvas).id);
    },
};
