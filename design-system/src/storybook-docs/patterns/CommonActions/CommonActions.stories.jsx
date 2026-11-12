import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { BAR_TOKEN } from '@/storybook-docs/lib/focused-task.jsx';
import { fitsCanvas } from '@/storybook-docs/lib/anatomy-asserts.js';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { TierActive, TierDanger, TierTypeName } from '../../../patterns/PatternModal/modalDemo.jsx';
import {
    APPEARANCES,
    Appearances,
    CardAction,
    Copy,
    EditOne,
    EditRecord,
    FocusedBar,
    ManyRows,
    ModalFooter,
    Page,
    Reset,
    STAGE,
    Sending,
} from './commonActionsDemo.jsx';

/**
 * Common actions: the pattern page's examples, run in the Storybook tests. Each
 * composes the real Button, IconButton and the hosts the buttons sit in, and
 * each asserts the ruling it shows: one Primary per area, left-aligned under a
 * page form and full bleed in a Modal, Close apart from Cancel, a sending
 * button that keeps its width, the destructive tiers, and the bulk bar.
 *
 * Run: npx vitest run --project=storybook design-system/src/storybook-docs/patterns/CommonActions/CommonActions.stories.jsx
 */
export default {
    // A test harness and the page's figures: `!dev` keeps it out of the sidebar. The page is Patterns/Actions and input/Common actions (CommonActions.mdx).
    title: 'Patterns/Actions and input/Common actions/Examples',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'padded' },
};

const rect = (el) => el.getBoundingClientRect();
const staged = (story, width = STAGE) => <FitStage width={width}>{story}</FitStage>;

/* -------------------------------------------------------------- appearances */

/** Every appearance with the word it takes: one Primary, one AI. */
export const AppearancesRow = {
    name: 'Appearances',
    render: () => staged(<Appearances />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const [appearance, label] of APPEARANCES) {
            const button = canvas.getByRole('button', { name: label });
            await expect(button.className, `${label} takes the ${appearance} appearance`).toContain(appearance);
        }
        const primaries = canvasElement.querySelectorAll('.plus-btn--primary, .plus-btn-primary');
        await expect(primaries.length, 'one Primary in the area').toBe(1);
        await fitsCanvas(canvasElement);
    },
};

/* --------------------------------------------------------------- placement */

/** A page form: left-aligned under the fields, Primary first, Cancel Subtle. */
export const PlacementPage = {
    name: 'Placement: In a page',
    render: () => staged(<Page />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const save = canvas.getByRole('button', { name: 'Save session' });
        const cancel = canvas.getByRole('button', { name: 'Cancel' });
        const fieldset = canvasElement.querySelector('.plus-fieldset');
        await expect(rect(save).left, 'the buttons start at the fields\' edge').toBeCloseTo(rect(fieldset).left, 0);
        await expect(rect(save).left, 'Primary first').toBeLessThan(rect(cancel).left);
        await expect(cancel.className, 'Cancel is Subtle beside a Primary').toContain('subtle');
        await fitsCanvas(canvasElement);
    },
};

/** A Modal: Close in the header, Cancel (Default) and the Primary full bleed, 48 high. */
export const PlacementModal = {
    name: 'Placement: In a Modal',
    render: () => staged(<ModalFooter />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const dialog = canvas.getByRole('dialog');
        const close = within(dialog).getByRole('button', { name: 'Close' });
        const cancel = canvas.getByRole('button', { name: 'Cancel' });
        const save = canvas.getByRole('button', { name: 'Save session' });
        await expect(close, 'Close is an icon button in the header').toHaveTextContent('');
        await expect(rect(close).bottom, 'and sits above the footer').toBeLessThan(rect(footer).top);
        await expect(close, 'Close is not Cancel').not.toBe(cancel);
        await expect(rect(cancel).right, 'Cancel is left of the Primary').toBeLessThanOrEqual(rect(save).left + 1);
        await expect(rect(footer).height, 'the footer is 48 high').toBeCloseTo(tokenLength(footer, BAR_TOKEN), 0);
        await expect(rect(cancel).width + rect(save).width, 'the buttons fill the footer').toBeCloseTo(rect(footer).width, 0);
        await fitsCanvas(canvasElement);
    },
};

/** A focused task: Cancel (Subtle) at the start, Back and Next at the end, 48 high. */
export const PlacementFocused = {
    name: 'Placement: In a focused task',
    render: () => staged(<FocusedBar />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const bar = canvasElement.querySelector('[data-probe="bar"]');
        const cancel = canvas.getByRole('button', { name: 'Cancel' });
        const back = canvas.getByRole('button', { name: 'Back' });
        const next = canvas.getByRole('button', { name: 'Next' });
        await expect(rect(cancel).left, 'Cancel at the start').toBeLessThan(rect(back).left);
        await expect(rect(back).right, 'Back, then Next last').toBeLessThanOrEqual(rect(next).left + 1);
        await expect(rect(bar).height, 'the bar is 48 high').toBeCloseTo(tokenLength(bar, BAR_TOKEN), 0);
        await fitsCanvas(canvasElement);
    },
};

/** A card: its main action is Subtle in the footer. */
export const PlacementCard = {
    name: 'Placement: In a card',
    render: () => staged(<CardAction />),
    play: async ({ canvasElement }) => {
        const open = within(canvasElement).getByRole('button', { name: 'Open session' });
        await expect(open.className, 'the main action is Subtle').toContain('subtle');
        await expect(open.closest('.plus-pattern-card-footer'), 'in the card\'s footer').not.toBeNull();
        await fitsCanvas(canvasElement);
    },
};

/* ------------------------------------------------------------------- small */

/** Reset clears the choices without applying them anywhere else. */
export const ResetChoices = {
    name: 'Reset',
    render: () => staged(<Reset />, 480),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('checkbox', { name: 'Grade 7' })).toBeChecked();
        await userEvent.click(canvas.getByRole('button', { name: 'Reset filters' }));
        await expect(canvas.getByRole('checkbox', { name: 'Grade 7' }), 'Reset clears the choices').not.toBeChecked();
        await fitsCanvas(canvasElement);
    },
};

/** Copy: an icon button beside the value; the confirmation is a "Copied" tooltip, not a Flag. */
export const CopyValue = {
    name: 'Copy',
    render: () => staged(<Copy />, 480),
    play: async ({ canvasElement }) => {
        const copy = within(canvasElement).getByRole('button', { name: 'Copy' });
        await expect(copy.textContent, 'an icon button').toBe('');
        await userEvent.click(copy);
        await expect(await within(document.body).findByText('Copied'), 'the tooltip says Copied').toBeInTheDocument();
        await expect(document.body.querySelector('[role="alert"], .plus-flag'), 'no Flag').toBeNull();
    },
};

/** Edit one value in place: the read view is one button and opens an editor. */
export const EditValue = {
    name: 'Edit: one value',
    render: () => staged(<EditOne />, 480),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: /Algebra B/ }));
        const field = await canvas.findByRole('textbox');
        await userEvent.clear(field);
        await userEvent.type(field, 'Algebra C{Enter}');
        await expect(await canvas.findByRole('button', { name: /Algebra C/ }), 'Enter saves it in place').toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/** Edit the whole record from More. */
export const EditWholeRecord = {
    name: 'Edit: the whole record',
    render: () => staged(<EditRecord />, 480),
    play: async ({ canvasElement }) => {
        const more = within(canvasElement).getByRole('button', { name: 'More' });
        await userEvent.click(more);
        await waitFor(() => expect(within(document.body).getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument());
        await expect(within(document.body).getByRole('menuitem', { name: 'Remove from group' }), 'Remove sits beside Edit, Default, not Danger').toBeInTheDocument();
        await userEvent.keyboard('{Escape}');
    },
};

/* ------------------------------------------------------- destructive tiers */

/** Active: a change that can be undone; the action takes Primary. */
export const TierActiveModal = {
    name: 'Destructive tier: Active',
    render: () => staged(<TierActive />),
    play: async ({ canvasElement }) => {
        const action = within(canvasElement).getByRole('button', { name: 'Remove from this week' });
        await expect(action.className, 'Primary').toContain('primary');
        await fitsCanvas(canvasElement);
    },
};

/** Active with Danger: a delete; the action takes Danger. */
export const TierDangerModal = {
    name: 'Destructive tier: Active with Danger',
    render: () => staged(<TierDanger />),
    play: async ({ canvasElement }) => {
        const action = within(canvasElement).getByRole('button', { name: 'Delete note' });
        await expect(action.className, 'Danger').toContain('danger');
        await fitsCanvas(canvasElement);
    },
};

/** Danger, type the name: Danger enables once the name matches, and the caption carries the reason. */
export const TierTypeNameModal = {
    name: 'Destructive tier: Danger, type the name',
    render: () => staged(<TierTypeName />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const action = canvas.getByRole('button', { name: 'Delete group' });
        await expect(action, 'disabled until the name matches').toBeDisabled();
        await expect(canvas.getByText(/Type Fractions group to enable/), 'the caption says why').toBeInTheDocument();
        await expect(action.getAttribute('title'), 'never a tooltip').toBeNull();
        await userEvent.type(canvas.getByLabelText('Group name'), 'Fractions group');
        await waitFor(() => expect(action).toBeEnabled());
        await fitsCanvas(canvasElement);
    },
};

/* -------------------------------------------------------------- many rows */

/** The bulk bar: the head row holds the select-all, the count, then the actions; no Cancel. */
export const BulkBar = {
    name: 'Many rows: the bulk bar',
    render: () => staged(<ManyRows />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const head = within(canvasElement.querySelector('thead'));
        await expect(head.getByText('2 selected')).toBeInTheDocument();
        await expect(head.getByRole('checkbox', { name: 'Select all rows' }), 'the select-all reports its mixed state').toBePartiallyChecked();
        await expect(head.getByRole('button', { name: 'Remove from group' })).toBeInTheDocument();
        await expect(canvas.queryByRole('button', { name: /Cancel|Clear/ }), 'no Cancel: the checkboxes clear it').toBeNull();
        await expect(canvas.queryByRole('button', { name: /Delete/ }), 'Delete never sits in the bar').toBeNull();
        await fitsCanvas(canvasElement);
    },
};

/* -------------------------------------------------------------- key states */

/** Sending: the button swaps its label for a spinner in place; Cancel stays live. */
export const SendingKeepsWidth = {
    name: 'Key state: Sending',
    render: () => staged(<Sending />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const save = canvas.getByRole('button', { name: 'Save session' });
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const before = { width: rect(save).width, height: rect(footer).height };
        await userEvent.click(save);
        await waitFor(() => expect(save).toBeDisabled());
        await expect(rect(save).width, 'the button keeps its width').toBeCloseTo(before.width, 0);
        await expect(rect(footer).height, 'the footer keeps its height').toBeCloseTo(before.height, 0);
        await expect(canvas.getByRole('button', { name: 'Cancel' }), 'Cancel stays live').not.toBeDisabled();
        await fitsCanvas(canvasElement);
    },
};
