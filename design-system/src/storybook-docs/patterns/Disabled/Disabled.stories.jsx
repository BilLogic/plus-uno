import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { fitsCanvas } from '@/storybook-docs/lib/anatomy-asserts.js';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { expectFullScale, expectNotInert } from '@/storybook-docs/lib/live-example-asserts.js';
import { settleAnimations } from '@/storybook-docs/lib/overlay-motion-plays';
import { ReadOnlyField } from '../ReadOnly/readOnlyDemo.jsx';
import {
    BlocksAction,
    CARD_STAGE,
    DisabledWithReason,
    Explains,
    HiddenForRole,
    LockedToolkitDemo,
    OptionCannotApply,
    SelfEvident,
    Sending,
    WaitsOnField,
} from './disabledDemo.jsx';

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

const staged = (story, width = CARD_STAGE) => <FitStage width={width} scrollable>{story}</FitStage>;

/** No reason in this picture lives in a tooltip or a title attribute. */
const noTooltipCopy = async (canvasElement) => {
    await expect(canvasElement.querySelectorAll('[role="tooltip"], [title]'), 'no reason in a tooltip').toHaveLength(0);
};

/** The reason is visible text: present, and at full contrast beside a faded control. */
const reasonIsVisible = async (canvas, reason) => {
    const text = canvas.getByText(reason);
    await expect(text, 'the reason is on the page').toBeVisible();
    await expect(getComputedStyle(text).opacity, 'at full contrast').toBe('1');
};

/* ------------------------------------------------------------ four answers */

/** Enabled, and it explains: the Primary still presses with a field missing. */
export const AnswerExplains = {
    name: 'Answer: Enabled, and it explains',
    render: () => staged(<Explains />),
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const save = canvas.getByRole('button', { name: 'Save session' });
        await expect(save, 'the action stays enabled').toBeEnabled();
        await expect(canvas.getByText("Enter the student's name."), 'and the field says what is missing').toBeInTheDocument();
        await fitsCanvas(canvasElement);
        const field = canvas.getByLabelText(/Student/);
        await userEvent.type(field, 'Ana Ruiz');
        await waitFor(() => expect(canvas.queryByText("Enter the student's name.")).toBeNull());
        await userEvent.click(save);
        await waitFor(() => expect(canvas.getByText('Session saved.')).toBeVisible());
        await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
        await waitFor(() => expect(canvas.getByText("Enter the student's name.")).toBeVisible());
        await settleAnimations(canvasElement);
    },
};

/** Disabled with a visible reason: out of the tab order, the caption the reason. */
export const AnswerDisabledWithReason = {
    name: 'Answer: Disabled with a visible reason',
    render: () => staged(<DisabledWithReason />),
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const field = canvas.getByLabelText('Time');
        await expect(field, 'disabled').toBeDisabled();
        await userEvent.tab();
        await expect(document.activeElement, 'it leaves the tab order').not.toBe(field);
        await reasonIsVisible(canvas, 'Choose a date first.');
        await noTooltipCopy(canvasElement);
        await fitsCanvas(canvasElement);
    },
};

/** Read-only: its own pattern, drawn here to tell it from disabled. */
export const AnswerReadOnly = {
    name: 'Answer: Read-only',
    render: () => staged(<ReadOnlyField />),
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const field = canvas.getByLabelText('Session time');
        await expect(field, 'read-only, not disabled').toHaveAttribute('readonly');
        await expect(field).not.toBeDisabled();
        await fitsCanvas(canvasElement);
    },
};

/** Hidden: the row menu has no Delete for this role. */
export const AnswerHidden = {
    name: 'Answer: Hidden',
    render: () => staged(<HiddenForRole />),
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        await expect(await canvas.findByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
        await expect(canvas.queryByText(/Delete/), 'left out, not dimmed').toBeNull();
        await fitsCanvas(canvasElement);
        await settleAnimations(canvasElement);
    },
};

/* --------------------------------------------------------------- key cases */

/** A field that waits on another: the caption says what to do, and picking a school enables Group. */
export const KeyWaitsOnField = {
    name: 'Key case: A field that waits on another',
    render: () => staged(<WaitsOnField />),
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const group = canvas.getByLabelText('Group');
        await expect(group, 'the Group waits').toBeDisabled();
        await reasonIsVisible(canvas, 'Choose a school first');
        await noTooltipCopy(canvasElement);
        await fitsCanvas(canvasElement);

        await userEvent.click(canvas.getByRole('combobox', { name: 'School' }));
        await userEvent.click(await canvas.findByRole('option', { name: 'Lincoln Middle School' }));
        await expect(group, 'picking a school enables Group').toBeEnabled();
        await userEvent.click(group);
        await userEvent.click(await canvas.findByRole('option', { name: /Algebra B/ }));
        await settleAnimations(canvasElement);
    },
};

/** An option that cannot apply: its description line carries the reason; the rest are live. */
export const KeyOptionCannotApply = {
    name: 'Key case: An option that cannot apply',
    render: () => staged(<OptionCannotApply />),
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const taken = canvas.getByRole('radio', { name: /4:00 PM/ });
        await expect(taken, 'the option is disabled').toHaveAttribute('aria-disabled', 'true');
        await expect(taken.getAttribute('tabindex'), 'and out of the tab order').toBe('-1');
        const live = canvas.getByRole('radio', { name: /3:00 PM/ });
        await expect(live, 'the rest are live').not.toHaveAttribute('aria-disabled', 'true');
        await reasonIsVisible(canvas, 'Ms. Ortiz has a session then.');
        await noTooltipCopy(canvasElement);
        await fitsCanvas(canvasElement);
        await userEvent.click(live);
        await expect(live).toBeChecked();
    },
};

/** It blocks several items: a warning SectionMessage above says how to turn them on. */
export const KeyBlocksAction = {
    name: 'Key case: It blocks the main action',
    render: () => staged(<BlocksAction />),
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const message = canvas.getByRole('alert');
        await expect(message, 'the warning names the way forward').toHaveTextContent('Add a school to this group to schedule sessions.');
        const addSchool = within(message).getByRole('button', { name: 'Add school' });
        await expect(addSchool).toBeEnabled();
        await expect(canvas.getByLabelText('Time')).toBeDisabled();
        await noTooltipCopy(canvasElement);
        await fitsCanvas(canvasElement);
        await userEvent.click(addSchool);
        await expect(canvas.getByLabelText('Group')).toBeEnabled();
        await expect(canvas.getByLabelText('Time')).toBeEnabled();
        await userEvent.click(canvas.getByRole('button', { name: 'Remove school' }));
        await expect(canvas.getByLabelText('Group')).toBeDisabled();
        await expect(canvas.getByLabelText('Time')).toBeDisabled();
        await settleAnimations(canvasElement);
    },
};

/** Self-evident: Back on the first step and Danger until the name matches need no reason of their own. */
export const KeySelfEvident = {
    name: 'Key case: Self-evident',
    render: () => staged(<SelfEvident />),
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const back = canvas.getByRole('button', { name: 'Back' });
        const next = canvas.getByRole('button', { name: 'Next' });
        const remove = canvas.getByRole('button', { name: 'Remove school' });
        await expect(back).toBeDisabled();
        await expect(remove).toBeDisabled();
        await noTooltipCopy(canvasElement);
        await fitsCanvas(canvasElement);

        await userEvent.click(next);
        await expect(back).toBeEnabled();
        await expect(next, 'Next does not disable on the last step').toBeEnabled();
        const confirm = canvas.getByLabelText('Type the school name to confirm');
        await userEvent.clear(confirm);
        await userEvent.type(confirm, 'Lincoln Middle School');
        await expect(remove).toBeEnabled();
    },
};

/** Sending: the only time a button disables; Cancel stays live. */
export const KeySending = {
    name: 'Key case: Sending',
    render: () => staged(<Sending />),
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const save = canvas.getByRole('button', { name: /Save session/ });
        const cancel = canvas.getByRole('button', { name: 'Cancel' });
        await expect(save, 'busy and not pressable').toBeDisabled();
        await expect(cancel, 'Cancel stays live').toBeEnabled();
        await fitsCanvas(canvasElement);
        await userEvent.click(cancel);
        await expect(save).toBeEnabled();
    },
};

/** Locked, not hidden: the live Sidebar shows the Toolkit locked during onboarding. */
export const KeyLocked = {
    name: 'Key case: Locked, not hidden',
    render: () => staged(<LockedToolkitDemo />, 320),
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const nav = canvas.getByRole('navigation', { name: 'Toolkit during onboarding' });
        await expect(nav).toBeVisible();
        const sessions = within(nav).getByRole('button', { name: 'Sessions' });
        const students = within(nav).getByRole('button', { name: 'Students' });
        await expect(sessions).toHaveAttribute('aria-disabled', 'true');
        await expect(students).toHaveAttribute('aria-disabled', 'true');
        await expect(
            within(nav).getByRole('img', { name: /Complete your assigned training to unlock the Toolkit/ }),
        ).toHaveAttribute('tabindex', '0');
        await fitsCanvas(canvasElement);

        const lessons = within(nav).getByRole('button', { name: /Lessons/ });
        await userEvent.click(lessons);
        await expect(lessons).toHaveAttribute('aria-current', 'page');
    },
};
