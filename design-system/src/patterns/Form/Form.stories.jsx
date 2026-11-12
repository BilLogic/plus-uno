import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { LiveAnatomy } from '@/storybook-docs/lib/template-page.jsx';
import { leadersCrossNoOtherPart, markersLevelWithParts } from '@/storybook-docs/lib/anatomy-asserts.js';
import { BAR_TOKEN } from '@/storybook-docs/lib/focused-task.jsx';
import { tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { FILLED, FormInModal, FormInPage, FormInPanel, FormInSteps } from './formDemo.jsx';

/**
 * Form: the template page's examples, run in the Storybook tests. There is no
 * Form component, so these compose Fieldset, the fields, Section, Panel, Modal
 * and the focused Frame. Each key state asserts what a person sees: the
 * footer's height read from its token, the footer holding still while the body
 * changes, and the sending button keeping its width.
 *
 * Run: npx vitest run --project=storybook design-system/src/patterns/Form/Form.stories.jsx
 */
export default {
    // A test harness and the page's figures: `!dev` keeps it out of the sidebar. The page is Templates/Form (Form.mdx).
    title: 'Templates/Form/Examples',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'padded' },
};

const rect = (el) => el.getBoundingClientRect();

/** The page's stage: wide enough that the Frame's Page shows its grid. */
const STAGE = 1024; // docs-literal

export const TypePage = {
    name: 'Type: In a page',
    render: () => <div style={{ inlineSize: STAGE }}><FormInPage /></div>,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const save = canvas.getByRole('button', { name: 'Save session' });
        const cancel = canvas.getByRole('button', { name: 'Cancel' });
        await expect(rect(save).left, 'Primary comes first, left-aligned under the fields').toBeLessThan(rect(cancel).left);
        await expect(rect(footer).left, 'the footer starts at the fields’ edge').toBeCloseTo(rect(canvasElement.querySelector('.plus-fieldset')).left, 0);
        await expect(cancel.className, 'Cancel is Subtle').toContain('subtle');
    },
};

export const TypePanel = {
    name: 'Type: In a Panel',
    render: () => <div style={{ inlineSize: STAGE }}><FormInPanel /></div>,
    play: async ({ canvasElement }) => {
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        await expect(rect(footer).height, 'the full-bleed footer is 48 high').toBeCloseTo(tokenLength(footer, BAR_TOKEN), 0);
    },
};

export const TypeModal = {
    name: 'Type: In a Modal',
    render: () => <div style={{ inlineSize: STAGE }}><FormInModal /></div>,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        await expect(rect(footer).height, 'the full-bleed footer is 48 high').toBeCloseTo(tokenLength(footer, BAR_TOKEN), 0);
        await expect(rect(canvas.getByRole('button', { name: 'Cancel' }).parentElement).left, 'Cancel (Default) is the first cell').toBeLessThan(rect(canvas.getByRole('button', { name: 'Save session' })).left);
        await expect(canvas.getByRole('heading', { level: 1, name: 'Log a session' }), 'the title is the dialog’s h1').toBeInTheDocument();
        const modal = rect(canvasElement.querySelector('.plus-pattern-modal'));
        const halves = [canvas.getByRole('button', { name: 'Cancel' }), canvas.getByRole('button', { name: 'Save session' })].map(rect);
        for (const b of halves) {
            await expect(b.left, 'a footer button starts inside the Modal’s left edge').toBeGreaterThanOrEqual(modal.left - 0.5);
            await expect(b.right, 'a footer button ends inside the Modal’s right edge').toBeLessThanOrEqual(modal.right + 0.5);
        }
        await expect(halves[0].left, 'Cancel sits flush with the Modal’s left edge').toBeCloseTo(modal.left, 0);
        await expect(halves[1].right, 'Save sits flush with the Modal’s right edge').toBeCloseTo(modal.right, 0);
        await expect(halves[0].width, 'the two halves are equal').toBeCloseTo(halves[1].width, 0);
    },
};

export const TypeSteps = {
    name: 'Type: In steps',
    render: () => <div style={{ inlineSize: STAGE }}><FormInSteps /></div>,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('navigation', { name: 'Steps' }), 'four steps run across the top').toHaveClass('plus-progress-tracker--horizontal');
        await expect(canvas.getByRole('button', { name: 'Back' }), 'Back on the first step is disabled').toHaveAttribute('aria-disabled', 'true');
        await expect(canvas.queryByRole('navigation', { name: 'Main' }), 'no Sidebar').toBeNull();
    },
};

/* ------------------------------------------------------------------ anatomy */

const ANATOMY_PAGE_PARTS = [
    { selector: '[data-probe="message"]', label: 'Message slot', at: 'middle' },
    { selector: '.plus-fieldset', label: 'Group', at: 'start' },
    { selector: '.plus-field', label: 'Field', at: 'start' },
    { selector: '[data-probe="footer"]', label: 'Footer', at: 'middle' },
];

export const AnatomyPage = {
    name: 'Anatomy: In a page',
    render: () => (
        <LiveAnatomy width={STAGE} title="A form in a page with its parts numbered" parts={ANATOMY_PAGE_PARTS}>
            <FormInPage server />
        </LiveAnatomy>
    ),
    play: async ({ canvasElement }) => {
        await markersLevelWithParts(canvasElement, ANATOMY_PAGE_PARTS);
        leadersCrossNoOtherPart(canvasElement, ANATOMY_PAGE_PARTS);
    },
};

const ANATOMY_PANEL_PARTS = [
    { selector: '.plus-panel-header', label: 'Header', at: 'middle', side: 'end' },
    { selector: '[data-probe="body"]', label: 'Body', at: 'start', side: 'end' },
    { selector: '[data-probe="footer"]', label: 'Footer', at: 'middle', side: 'end' },
];

export const AnatomyPanel = {
    name: 'Anatomy: In a Panel',
    render: () => (
        <LiveAnatomy width={STAGE} title="A form in a Panel with its parts numbered" parts={ANATOMY_PANEL_PARTS}>
            <FormInPanel />
        </LiveAnatomy>
    ),
    play: async ({ canvasElement }) => {
        await markersLevelWithParts(canvasElement, ANATOMY_PANEL_PARTS);
        leadersCrossNoOtherPart(canvasElement, ANATOMY_PANEL_PARTS);
    },
};

const ANATOMY_MODAL_PARTS = [
    { selector: '.plus-pattern-modal-header', label: 'Header', at: 'middle' },
    { selector: '.plus-pattern-modal-body', label: 'Body', at: 'middle' },
    { selector: '.plus-pattern-modal-footer', label: 'Footer', at: 'middle' },
];

export const AnatomyModal = {
    name: 'Anatomy: In a Modal',
    render: () => (
        <LiveAnatomy width={STAGE} title="A form in a Modal with its parts numbered" parts={ANATOMY_MODAL_PARTS}>
            <FormInModal />
        </LiveAnatomy>
    ),
    play: async ({ canvasElement }) => {
        await markersLevelWithParts(canvasElement, ANATOMY_MODAL_PARTS);
        leadersCrossNoOtherPart(canvasElement, ANATOMY_MODAL_PARTS);
    },
};

const ANATOMY_STEPS_PARTS = [
    { selector: '[data-probe="steps"]', label: 'Steps', at: 'start' },
    { selector: '.plus-frame__content', label: 'Body', at: 'end' },
    { selector: '[data-probe="bar"]', label: 'Bar', at: 'middle' },
];

export const AnatomySteps = {
    name: 'Anatomy: In steps',
    render: () => (
        <LiveAnatomy width={STAGE} title="A stepped form with its parts numbered" parts={ANATOMY_STEPS_PARTS}>
            <FormInSteps />
        </LiveAnatomy>
    ),
    play: async ({ canvasElement }) => {
        await markersLevelWithParts(canvasElement, ANATOMY_STEPS_PARTS);
        leadersCrossNoOtherPart(canvasElement, ANATOMY_STEPS_PARTS);
    },
};

/* ------------------------------------------------------------------ key states */

/** A field takes its error look on blur, and the message says what to fix. */
export const KeyFieldError = {
    name: 'Key state: Field error on blur',
    render: () => <div style={{ inlineSize: STAGE }}><FormInPage /></div>,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const student = canvas.getByLabelText(/Student/);
        await userEvent.click(student);
        await userEvent.tab();
        await waitFor(() => expect(student).toHaveAttribute('aria-invalid', 'true'));
        await expect(canvas.getByText('Enter the student’s name.'), 'the error says how to fix it').toBeInTheDocument();
        await userEvent.type(student, 'Ana Ruiz');
        await userEvent.tab();
        await waitFor(() => expect(student, 'the error clears once the rule is met').not.toHaveAttribute('aria-invalid', 'true'));
    },
};

/** A field waiting on another says so in its caption; Save stays enabled. */
export const KeyDisabledReason = {
    name: 'Key state: Disabled with its reason',
    render: () => <div style={{ inlineSize: STAGE }}><FormInPage subjectWaits /></div>,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Choose a student first.'), 'the reason is visible text on the field').toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Save session' }), 'Save stays enabled').not.toBeDisabled();
    },
};

/** A blocked submit keeps the Modal open, marks the field, and the footer never moves. */
export const KeyBlockedSubmit = {
    name: 'Key state: Blocked submit',
    render: () => <div style={{ inlineSize: STAGE }}><FormInModal /></div>,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const before = rect(footer);
        await userEvent.click(canvas.getByRole('button', { name: 'Save session' }));
        const student = canvas.getByLabelText(/Student/);
        await waitFor(() => expect(student).toHaveAttribute('aria-invalid', 'true'));
        await expect(canvas.getByRole('dialog'), 'the Modal stays open').toBeInTheDocument();
        await expect(canvas.queryAllByRole('dialog'), 'never a second dialog').toHaveLength(1);
        await expect(student, 'focus moves to the first field that needs fixing').toHaveFocus();
        const after = rect(footer);
        await expect({ top: after.top, height: after.height }, 'the footer does not move').toEqual({ top: before.top, height: before.height });
        await expect(after.height, 'and stays 48 high').toBeCloseTo(tokenLength(footer, BAR_TOKEN), 0);
    },
};

/** The server says no: a danger message at the top of the body, plus field errors. */
export const KeyServerSaysNo = {
    name: 'Key state: The server says no',
    render: () => <div style={{ inlineSize: STAGE }}><FormInModal server initial={FILLED} /></div>,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const message = canvasElement.querySelector('[data-probe="message"]');
        const body = canvasElement.querySelector('.plus-pattern-modal-body');
        await expect(within(message).getByRole('alert'), 'announced').toBeInTheDocument();
        await expect(rect(message).top, 'at the top of the body').toBeLessThanOrEqual(rect(canvas.getByLabelText(/Student/)).top);
        await expect(body.contains(message)).toBe(true);
    },
};

/** Sending: the button swaps its label for a spinner in place at the same width; Cancel stays live. */
export const KeySending = {
    name: 'Key state: Sending',
    render: () => <div style={{ inlineSize: STAGE }}><FormInModal initial={FILLED} sendingForever /></div>,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const save = canvas.getByRole('button', { name: 'Save session' });
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const before = { save: rect(save).width, footer: rect(footer).height };
        await userEvent.click(save);
        await waitFor(() => expect(save).toBeDisabled());
        await expect(save.querySelector('.plus-btn-spinner'), 'a spinner in place of the label').not.toBeNull();
        await expect(rect(save).width, 'the button keeps its width').toBeCloseTo(before.save, 0);
        await expect(rect(footer).height, 'the footer keeps its height').toBeCloseTo(before.footer, 0);
        await expect(canvas.getByRole('button', { name: 'Cancel' }), 'only that button disables').not.toBeDisabled();
    },
};

/** Leaving with edits asks first, in the same Modal; Back keeps what was typed. */
export const KeyLeaving = {
    name: 'Key state: Leaving with edits',
    render: () => <div style={{ inlineSize: STAGE }}><FormInModal /></div>,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByLabelText(/Student/), 'Ana');
        await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
        await expect(await canvas.findByRole('heading', { level: 1, name: 'Discard changes?' })).toBeInTheDocument();
        await expect(canvas.queryAllByRole('dialog'), 'the same Modal, not a second one').toHaveLength(1);
        await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
        await expect(canvas.getByLabelText(/Student/), 'Back returns without losing anything typed').toHaveValue('Ana');
    },
};
