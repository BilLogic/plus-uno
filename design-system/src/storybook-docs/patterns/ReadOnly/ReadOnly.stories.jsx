import React from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { fitsCanvas } from '@/storybook-docs/lib/anatomy-asserts.js';
import { FitStage, ScreenStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { CARD_STAGE, LongValue, OwnedForm, PAGE_WIDTH, PlainText, ReadOnlyChoices, ReadOnlyField, ReadOnlyPickers } from './readOnlyDemo.jsx';

/**
 * Read-only: the pattern page's examples, run in the Storybook tests. Each is
 * drawn in the state its heading names, from props, and asserts the ruling it
 * shows: a read-only value stays in the tab order at full contrast, reports
 * `aria-readonly` where the control has the role, drops its interactive cues,
 * ignores a click, and is never swapped with disabled.
 *
 * Run: npx vitest run --project=storybook design-system/src/storybook-docs/patterns/ReadOnly/ReadOnly.stories.jsx
 */
export default {
    // A test harness and the page's figures: `!dev` keeps it out of the sidebar. The page is Patterns/States/Read-only (ReadOnly.mdx).
    title: 'Patterns/States/Read-only/Examples',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'padded' },
};

const staged = (story, width = CARD_STAGE) => <FitStage width={width}>{story}</FitStage>;

/* ---------------------------------------------------------------- key cases */

/** A read-only field: focusable, full contrast, selectable, the reason in the caption. */
export const KeyField = {
    name: 'Key case: A read-only field',
    render: () => staged(<ReadOnlyField />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const field = canvas.getByLabelText('Session time');
        await expect(field, 'read-only, not disabled').toHaveAttribute('readonly');
        await expect(field).not.toBeDisabled();
        await userEvent.tab();
        await expect(document.activeElement, 'it stays in the tab order').toBe(field);
        await expect(getComputedStyle(field).opacity, 'at full contrast').toBe('1');
        await expect(canvas.getByText('Set by your supervisor.'), 'the caption says why').toBeVisible();
        await expect(canvasElement.querySelectorAll('[role="tooltip"], [title]'), 'no reason in a tooltip').toHaveLength(0);
        await fitsCanvas(canvasElement);
    },
};

/** A Select and a DatePicker: no chevron, no calendar button. */
export const KeyPickers = {
    name: 'Key case: A Select and a date',
    render: () => staged(<ReadOnlyPickers />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvasElement.querySelector('.plus-select-readonly'), 'the Select is read-only').toBeInTheDocument();
        await expect(canvas.getByLabelText('Date'), 'the date reports it').toHaveAttribute('aria-readonly', 'true');
        await expect(canvas.queryByRole('button', { name: /calendar|Choose/i }), 'no calendar button').toBeNull();
        await fitsCanvas(canvasElement);
    },
};

/** Checkbox, RadioGroup and Toggle keep their state and ignore a click. */
export const KeyChoices = {
    name: 'Key case: Choices',
    render: () => staged(<ReadOnlyChoices />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const checkbox = canvas.getByRole('checkbox', { name: /Parent notified/ });
        await userEvent.click(checkbox);
        await expect(checkbox, 'a click changes nothing').toBeChecked();
        await expect(checkbox, 'it reports read-only').toHaveAttribute('aria-readonly', 'true');
        await expect(canvas.getByRole('switch', { name: /Send a reminder/ })).toHaveAttribute('aria-readonly', 'true');
        await expect(canvas.getByRole('radio', { name: /Video/ }), 'the radio keeps its answer').toBeChecked();
        await fitsCanvas(canvasElement);
    },
};

/** A whole form someone else owns: every field read-only, one caption on the group, no Save. */
export const KeyOwnedForm = {
    name: 'Key case: A form someone else owns',
    render: () => <ScreenStage width={PAGE_WIDTH}><OwnedForm /></ScreenStage>,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByLabelText('Student')).toHaveAttribute('readonly');
        await expect(canvas.getByLabelText('Time')).toHaveAttribute('readonly');
        await expect(canvas.queryByRole('button', { name: /Save/ }), 'no Save').toBeNull();
        await expect(canvas.getByText("Set by Lincoln's supervisor."), 'one caption on the group').toBeVisible();
        await fitsCanvas(canvasElement);
    },
};

/** A long value is shown whole, not clipped. */
export const KeyLongValue = {
    name: 'Key case: A long value',
    render: () => staged(<LongValue />),
    play: async ({ canvasElement }) => {
        const area = within(canvasElement).getByLabelText('Session notes');
        await expect(area.scrollHeight, 'the rows show the whole value').toBeLessThanOrEqual(area.clientHeight + 1);
        await fitsCanvas(canvasElement);
    },
};

/** A value nobody changes here is plain text, not a field. */
export const CasePlainText = {
    name: 'Case: Plain text',
    render: () => staged(<PlainText />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryAllByRole('textbox'), 'no field').toHaveLength(0);
        await expect(canvas.getByText('Lincoln Middle School')).toBeVisible();
        await fitsCanvas(canvasElement);
    },
};
