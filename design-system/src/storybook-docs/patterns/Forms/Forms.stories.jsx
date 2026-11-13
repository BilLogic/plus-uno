import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { BAR_TOKEN } from '@/storybook-docs/lib/focused-task.jsx';
import { fitsCanvas } from '@/storybook-docs/lib/anatomy-asserts.js';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { EMPTY, FILLED, FormInModal, FormInPage, FormInPanel, FormInSteps } from '../../../patterns/Form/formDemo.jsx';
import { BoundInputs, Marks, STAGE } from './formsDemo.jsx';

/**
 * Forms: the pattern page's examples, run in the Storybook tests. The hosts and
 * the Modal's key states are the Form template's own demos; each story here
 * asserts the ruling the pattern makes: a field checks itself when it loses
 * focus, the submit stays enabled and shows what is missing, a blocked submit
 * keeps the Modal open, a rejection shows at the top, a sending button keeps
 * its width, leaving with edits asks first, and a bound input cannot be wrong.
 *
 * Run: npx vitest run --project=storybook design-system/src/storybook-docs/patterns/Forms/Forms.stories.jsx
 */
export default {
    // A test harness and the page's figures: `!dev` keeps it out of the sidebar. The page is Patterns/Forms (Forms.mdx).
    title: 'Patterns/Forms/Examples',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'padded' },
};

const rect = (el) => el.getBoundingClientRect();
/** Stage heights that hold the whole form: the server message and the field errors each add a block above the pinned footer. */
const SERVER_HEIGHT = 720; // docs-literal
const MARKED_HEIGHT = 680; // docs-literal
const staged = (story, width = STAGE) => <FitStage width={width}>{story}</FitStage>;

/* ------------------------------------------------------------------- hosts */

export const HostPage = {
    name: 'Host: In a page',
    render: () => staged(<FormInPage />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const save = canvas.getByRole('button', { name: 'Save session' });
        await expect(rect(save).left, 'buttons left-aligned under the fields').toBeCloseTo(rect(canvasElement.querySelector('.plus-fieldset')).left, 0);
        await fitsCanvas(canvasElement);
    },
};

export const HostPanel = {
    name: 'Host: In a Panel',
    render: () => staged(<FormInPanel />),
    play: async ({ canvasElement }) => {
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        await expect(rect(footer).height, 'the full-bleed footer is 48 high').toBeCloseTo(tokenLength(footer, BAR_TOKEN), 0);
        await fitsCanvas(canvasElement);
    },
};

export const HostModal = {
    name: 'Host: In a Modal',
    render: () => staged(<FormInModal />),
    play: async ({ canvasElement }) => {
        const dialog = within(canvasElement).getByRole('dialog');
        await expect(within(dialog).getAllByRole('textbox').length, 'fewer than five fields').toBeLessThan(5);
        await fitsCanvas(canvasElement);
    },
};

export const HostSteps = {
    name: 'Host: In steps',
    render: () => staged(<FormInSteps />),
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('button', { name: 'Next' }), 'the bar carries Back and Next').toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/* --------------------------------------------------------- marks and help */

/** Required fields carry the mark and aria-required; an optional field says so only because most are required. */
export const RequiredMarks = {
    name: 'Required marks and help',
    render: () => staged(<Marks />, 480),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const student = canvas.getByLabelText(/Student/);
        await expect(student, 'a required field reports it').toHaveAttribute('aria-required', 'true');
        await expect(canvasElement.querySelector('label[for="' + student.id + '"]').textContent, 'and carries the mark').toMatch(/\*/);
        await expect(canvas.getByLabelText(/Notes \(optional\)/), 'an optional field says so').not.toHaveAttribute('aria-required', 'true');
        const caption = canvas.getByText('First and last name, as on the roster.');
        await expect(student.getAttribute('aria-describedby'), 'help sits in a caption the field points at').toContain(caption.id);
        await fitsCanvas(canvasElement);
    },
};

/* ------------------------------------------------------------- validation */

/* The four pictures below draw the state their heading names, from initial-state props: the docs page does not run plays.
   The stories after them test the same interaction from a clean start. */

/** Student was touched and left empty: its error is showing; Site was not touched, so it is not marked. */
export const ShownOnBlur = {
    name: 'Validation: On blur (shown)',
    render: () => staged(<FormInPage initial={EMPTY} marked="student" />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByLabelText(/Student/), 'touched and empty').toHaveAttribute('aria-invalid', 'true');
        await expect(canvas.getByText('Enter the student’s name.'), 'the error says what to fix').toBeInTheDocument();
        await expect(canvas.queryByText('Choose a site.'), 'an untouched field is not marked').toBeNull();
        await fitsCanvas(canvasElement);
    },
};

/** After the press: the Primary is still enabled and every missing field is marked. */
export const ShownSubmitStaysEnabled = {
    name: 'Validation: Submit stays enabled (shown)',
    render: () => staged(<FormInPage initial={EMPTY} marked />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByLabelText(/Student/)).toHaveAttribute('aria-invalid', 'true');
        await expect(canvas.getByText('Choose a site.'), 'every missing field is marked').toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Save session' }), 'still enabled').not.toBeDisabled();
        await fitsCanvas(canvasElement);
    },
};

/** The Modal after a blocked press, at rest after its shake: open, the fields marked, one dialog. */
export const ShownBlockedSubmit = {
    name: 'Validation: Blocked submit in a Modal (shown)',
    render: () => staged(<FormInModal initial={EMPTY} marked height="fill" stageHeight={MARKED_HEIGHT} />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryAllByRole('dialog'), 'one dialog').toHaveLength(1);
        await expect(canvas.getByLabelText(/Student/)).toHaveAttribute('aria-invalid', 'true');
        await expect(canvas.getByText('Choose a site.')).toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/** Sending: the Primary shows its spinner at its own width; Cancel is live. */
export const ShownSending = {
    name: 'Validation: Sending (shown)',
    render: () => staged(<FormInModal initial={FILLED} sending />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Save session' }), 'the spinner button is the one that disables').toBeDisabled();
        await expect(canvas.getByRole('button', { name: 'Cancel' }), 'Cancel stays live').not.toBeDisabled();
        await fitsCanvas(canvasElement);
    },
};

/** A field checks itself when it loses focus, and clears once the rule is met. */
export const OnBlur = {
    name: 'Test: On blur',
    render: () => staged(<FormInPage />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const student = canvas.getByLabelText(/Student/);
        await userEvent.click(student);
        await expect(student, 'nothing is checked before the field is left').not.toHaveAttribute('aria-invalid', 'true');
        await userEvent.tab();
        await waitFor(() => expect(student).toHaveAttribute('aria-invalid', 'true'));
        await expect(canvas.getByText('Enter the student’s name.'), 'the error says what to fix').toBeInTheDocument();
        await userEvent.type(student, 'Ana Ruiz');
        await userEvent.tab();
        await waitFor(() => expect(student, 'the error clears once the rule is met').not.toHaveAttribute('aria-invalid', 'true'));
        await fitsCanvas(canvasElement);
    },
};

/** The submit stays enabled with a field missing; pressing it marks the field and moves focus there. */
export const SubmitStaysEnabled = {
    name: 'Test: Submit stays enabled',
    render: () => staged(<FormInPage />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const save = canvas.getByRole('button', { name: 'Save session' });
        await expect(save, 'enabled with a field missing').not.toBeDisabled();
        await userEvent.click(save);
        const student = canvas.getByLabelText(/Student/);
        await waitFor(() => expect(student).toHaveAttribute('aria-invalid', 'true'));
        await expect(student, 'focus moves to the first field that needs fixing').toHaveFocus();
        await expect(save, 'still enabled').not.toBeDisabled();
        await fitsCanvas(canvasElement);
    },
};

/** A blocked submit keeps the Modal open, marks the field and never raises a second dialog; the footer holds still. */
export const BlockedSubmit = {
    name: 'Test: Blocked submit in a Modal',
    // A filled Modal keeps its size when the errors appear, so the footer holds still; a hugging one grows from the middle.
    render: () => staged(<FormInModal height="fill" stageHeight={MARKED_HEIGHT} />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const before = rect(footer);
        await userEvent.click(canvas.getByRole('button', { name: 'Save session' }));
        const student = canvas.getByLabelText(/Student/);
        await waitFor(() => expect(student).toHaveAttribute('aria-invalid', 'true'));
        await expect(canvas.queryAllByRole('dialog'), 'never a second dialog').toHaveLength(1);
        await expect(student).toHaveFocus();
        await expect({ top: rect(footer).top, height: rect(footer).height }, 'the footer does not move').toEqual({ top: before.top, height: before.height });
        await fitsCanvas(canvasElement);
    },
};

/** The server says no: a danger message at the top of the body, announced, and nothing shakes. */
export const ServerRefuses = {
    name: 'Validation: Rejected by the server',
    render: () => staged(<FormInModal server initial={FILLED} height="fill" stageHeight={SERVER_HEIGHT} />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const message = canvasElement.querySelector('[data-probe="message"]');
        const body = canvasElement.querySelector('[data-probe="body"], .plus-pattern-modal-body');
        if (body) await expect(body.scrollHeight, 'the whole form shows: the body does not scroll').toBeLessThanOrEqual(body.clientHeight + 1);
        await expect(within(message).getByRole('alert'), 'announced when it appears').toBeInTheDocument();
        await expect(rect(message).top, 'at the top of the body').toBeLessThanOrEqual(rect(canvas.getByLabelText(/Student/)).top);
        await fitsCanvas(canvasElement);
    },
};

/** Sending: the one time a button disables; it keeps its width and Cancel stays live. */
export const Sending = {
    name: 'Test: Sending',
    render: () => staged(<FormInModal initial={FILLED} sendingForever />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const save = canvas.getByRole('button', { name: 'Save session' });
        const width = rect(save).width;
        await userEvent.click(save);
        await waitFor(() => expect(save).toBeDisabled());
        await expect(rect(save).width, 'the button keeps its width').toBeCloseTo(width, 0);
        await expect(canvas.getByRole('button', { name: 'Cancel' }), 'Cancel stays live').not.toBeDisabled();
        await fitsCanvas(canvasElement);
    },
};

/* ---------------------------------------------------- leaving, bound input */

/** Leaving with edits asks first, in the same Modal; Back keeps what was typed. */
export const LeavingWithEdits = {
    name: 'Leaving with edits',
    render: () => staged(<FormInModal />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
        await expect(canvas.queryByRole('heading', { name: 'Discard changes?' }), 'a form with no edits leaves at once').toBeNull();
        await userEvent.type(canvas.getByLabelText(/Student/), 'Ana');
        await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
        await expect(await canvas.findByRole('heading', { level: 1, name: 'Discard changes?' })).toBeInTheDocument();
        await expect(canvas.queryAllByRole('dialog'), 'the same Modal, never a third layer').toHaveLength(1);
        await expect(canvas.getByRole('button', { name: 'Discard' }).className, 'Discard is the one that loses work, so it is the Primary cell').toContain('primary');
        await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
        await expect(canvas.getByLabelText(/Student/), 'Back returns without losing anything typed').toHaveValue('Ana');
        await fitsCanvas(canvasElement);
    },
};

/** A bound input cannot be wrong: a radio group starts unanswered, a select holds six or more. */
export const BoundInput = {
    name: 'Bound inputs',
    render: () => staged(<BoundInputs />, 480),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByRole('radio'), 'three choices are visible at once').toHaveLength(3);
        for (const radio of canvas.getAllByRole('radio')) await expect(radio, 'a radio group starts unanswered').not.toBeChecked();
        await expect(canvas.getByRole('combobox', { name: /Grade/ }), 'six choices open from a select').toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};
