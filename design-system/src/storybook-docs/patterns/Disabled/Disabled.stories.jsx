import React from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { fitsCanvas } from '@/storybook-docs/lib/anatomy-asserts.js';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { LockedToolkit } from '@/storybook-docs/illustrations/disabled.jsx';
import { ReadOnlyField } from '../ReadOnly/readOnlyDemo.jsx';
import { BlocksAction, CARD_STAGE, DisabledWithReason, Explains, HiddenForRole, OptionCannotApply, SelfEvident, Sending, WaitsOnField } from './disabledDemo.jsx';

/**
 * Disabled: the pattern page's examples, run in the Storybook tests. Each is
 * drawn in the state its heading names, from props, and asserts the ruling it
 * shows: an action stays enabled and explains, a disabled control leaves the
 * tab order and gives its reason as visible text at full contrast, nothing
 * carries a reason in a tooltip, and a button disables only while sending.
 *
 * Run: npx vitest run --project=storybook design-system/src/storybook-docs/patterns/Disabled/Disabled.stories.jsx
 */
export default {
    // A test harness and the page's figures: `!dev` keeps it out of the sidebar. The page is Patterns/States/Disabled (Disabled.mdx).
    title: 'Patterns/States/Disabled/Examples',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'padded' },
};

const staged = (story, width = CARD_STAGE) => <FitStage width={width}>{story}</FitStage>;

/** No reason in this picture lives in a tooltip or a title attribute. */
const noTooltipCopy = async (canvasElement) => {
    await expect(canvasElement.querySelectorAll('[role="tooltip"], [title]'), 'no reason in a tooltip').toHaveLength(0);
};

/** The reason is visible text: present, and at full contrast beside a faded control. */
const reasonIsVisible = async (canvasElement, reason) => {
    const text = within(canvasElement).getByText(reason);
    await expect(text, 'the reason is on the page').toBeVisible();
    await expect(getComputedStyle(text).opacity, 'at full contrast').toBe('1');
};

/* ------------------------------------------------------------ four answers */

/** Enabled, and it explains: the Primary still presses with a field missing. */
export const AnswerExplains = {
    name: 'Answer: Enabled, and it explains',
    render: () => staged(<Explains />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Save session' }), 'the action stays enabled').toBeEnabled();
        await expect(canvas.getByText("Enter the student's name."), 'and the field says what is missing').toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/** Disabled with a visible reason: out of the tab order, the caption the reason. */
export const AnswerDisabledWithReason = {
    name: 'Answer: Disabled with a visible reason',
    render: () => staged(<DisabledWithReason />),
    play: async ({ canvasElement }) => {
        const field = within(canvasElement).getByLabelText('Time');
        await expect(field, 'disabled').toBeDisabled();
        await userEvent.tab();
        await expect(document.activeElement, 'it leaves the tab order').not.toBe(field);
        await reasonIsVisible(canvasElement, 'Choose a date first.');
        await noTooltipCopy(canvasElement);
        await fitsCanvas(canvasElement);
    },
};

/** Read-only: its own pattern, drawn here to tell it from disabled. */
export const AnswerReadOnly = {
    name: 'Answer: Read-only',
    render: () => staged(<ReadOnlyField />),
    play: async ({ canvasElement }) => {
        const field = within(canvasElement).getByLabelText('Session time');
        await expect(field, 'read-only, not disabled').toHaveAttribute('readonly');
        await expect(field).not.toBeDisabled();
        await fitsCanvas(canvasElement);
    },
};

/** Hidden: the row menu has no Delete for this role. */
export const AnswerHidden = {
    name: 'Answer: Hidden',
    render: () => staged(<HiddenForRole />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
        await expect(canvas.queryByText(/Delete/), 'left out, not dimmed').toBeNull();
        await fitsCanvas(canvasElement);
    },
};

/* --------------------------------------------------------------- key cases */

/** A field that waits on another: the caption says what to do. */
export const KeyWaitsOnField = {
    name: 'Key case: A field that waits on another',
    render: () => staged(<WaitsOnField />),
    play: async ({ canvasElement }) => {
        const group = within(canvasElement).getByLabelText('Group');
        await expect(group, 'the Group waits').toBeDisabled();
        await reasonIsVisible(canvasElement, 'Choose a school first');
        await noTooltipCopy(canvasElement);
        await fitsCanvas(canvasElement);
    },
};

/** An option that cannot apply: its description line carries the reason; the rest are live. */
export const KeyOptionCannotApply = {
    name: 'Key case: An option that cannot apply',
    render: () => staged(<OptionCannotApply />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const taken = canvas.getByRole('radio', { name: /4:00 PM/ });
        await expect(taken, 'the option is disabled').toHaveAttribute('aria-disabled', 'true');
        await expect(taken.getAttribute('tabindex'), 'and out of the tab order').toBe('-1');
        await expect(canvas.getByRole('radio', { name: /3:00 PM/ }), 'the rest are live').not.toHaveAttribute('aria-disabled', 'true');
        await reasonIsVisible(canvasElement, 'Ms. Ortiz has a session then.');
        await noTooltipCopy(canvasElement);
        await fitsCanvas(canvasElement);
    },
};

/** It blocks several items: a warning SectionMessage above says how to turn them on. */
export const KeyBlocksAction = {
    name: 'Key case: It blocks the main action',
    render: () => staged(<BlocksAction />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const message = canvas.getByRole('alert');
        await expect(message, 'the warning names the way forward').toHaveTextContent('Add a school to this group to schedule sessions.');
        await expect(within(message).getByRole('button', { name: 'Add school' })).toBeEnabled();
        await expect(canvas.getByLabelText('Time')).toBeDisabled();
        await noTooltipCopy(canvasElement);
        await fitsCanvas(canvasElement);
    },
};

/** Self-evident: Back on the first step and Danger until the name matches need no reason of their own. */
export const KeySelfEvident = {
    name: 'Key case: Self-evident',
    render: () => staged(<SelfEvident />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Back' })).toBeDisabled();
        await expect(canvas.getByRole('button', { name: 'Remove school' })).toBeDisabled();
        await noTooltipCopy(canvasElement);
        await fitsCanvas(canvasElement);
    },
};

/** Sending: the only time a button disables; Cancel stays live. */
export const KeySending = {
    name: 'Key case: Sending',
    render: () => staged(<Sending />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: /Save session/ }), 'busy and not pressable').toBeDisabled();
        await expect(canvas.getByRole('button', { name: 'Cancel' }), 'Cancel stays live').toBeEnabled();
        await fitsCanvas(canvasElement);
    },
};

/** Locked, not hidden: the Toolkit during onboarding, drawn blocked out. The visible line is Planned; the real Sidebar carries its message in a hover and focus layer today. */
export const KeyLocked = {
    name: 'Key case: Locked, not hidden',
    render: () => <div style={{ padding: 'var(--page-pad)' }}><LockedToolkit /></div>,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('img'), 'the drawing is named').toHaveAccessibleName(/Toolkit rows are faded but shown/);
        await fitsCanvas(canvasElement);
    },
};
