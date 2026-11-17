import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { settleAnimations } from '@/storybook-docs/lib/overlay-motion-plays';
import { BAR_TOKEN } from '@/storybook-docs/lib/focused-task.jsx';
import { fitsCanvas } from '@/storybook-docs/lib/anatomy-asserts.js';
import { expectFullScale, expectNotInert } from '@/storybook-docs/lib/live-example-asserts.js';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { alpha, tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { EMPTY, FILLED, FormInModal, FormInPage, FormInPanel, FormInSteps, PAGE_WIDTH } from '../../../patterns/Form/formDemo.jsx';
import { BoundInputs, FIVE_QUESTION_STEPS, Marks, QuestionStepInWindow, SettingsPageInWindow, STAGE } from './formsDemo.jsx';

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
const staged = (story, width = STAGE) => <FitStage width={width} scrollable>{story}</FitStage>;

/* ------------------------------------------------------------------- hosts */

export const HostPage = {
    name: 'Host: In a page',
    render: () => staged(<FormInPage />, PAGE_WIDTH),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const save = canvas.getByRole('button', { name: 'Save session' });
        await expect(rect(save).left, 'buttons left-aligned under the fields').toBeCloseTo(rect(canvasElement.querySelector('.plus-fieldset')).left, 0);
        const student = canvas.getByRole('textbox', { name: /Student/ });
        await userEvent.type(student, 'Ana Ruiz');
        await expect(student).toHaveValue('Ana Ruiz');
        await fitsCanvas(canvasElement);
    },
};

/** Instant settings on a page: grouped SettingRows with Toggle, compact Select, and Button + StatusTag, confirming saves with a Flag. */
export const SettingsInPage = {
    name: 'Host: Settings on a page',
    render: () => staged(<SettingsPageInWindow />, PAGE_WIDTH),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);

        await expect(canvas.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
        await expect(canvas.getByRole('heading', { level: 2, name: 'Notifications' })).toBeInTheDocument();
        await expect(canvas.getByRole('heading', { level: 2, name: 'Connected accounts' })).toBeInTheDocument();
        await expect(canvasElement.querySelector('.plus-pattern-card'), 'no card per row').toBeNull();
        await expect(canvas.queryByRole('button', { name: /^Save/i }), 'instant settings need no Save button').toBeNull();

        const rows = canvasElement.querySelectorAll('.plus-setting-row');
        await expect(rows.length).toBeGreaterThanOrEqual(4);
        await expect(tokenLength(rows[0], '--setting-row-pad-y')).toBe(12);
        await expect(parseFloat(getComputedStyle(rows[1]).borderTopWidth), 'adjacent rows divide with --border-width-default').toBe(
            tokenLength(rows[1], '--border-width-default')
        );

        const reminders = canvas.getByRole('switch', { name: 'Session reminders' });
        const leadTime = canvas.getByRole('combobox', { name: 'Reminder lead time' });
        const status = canvas.getByText('Connected');
        const disconnect = canvas.getByRole('button', { name: 'Disconnect Google Calendar' });
        const calendarEnd = rows[rows.length - 1].querySelector('.plus-setting-row__end');

        await expect(reminders).toHaveAttribute('aria-checked', 'true');
        await expect(leadTime).toBeInTheDocument();
        await expect(calendarEnd.contains(status), 'StatusTag sits beside the label, never in the end slot').toBe(false);
        await expect(disconnect).toBeInTheDocument();

        await userEvent.click(reminders);
        await expect(reminders).toHaveAttribute('aria-checked', 'false');
        await expect(await canvas.findByText('Session reminders turned off')).toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

export const HostPanel = {
    name: 'Host: In a Panel',
    render: () => staged(<FormInPanel />),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        await expect(rect(footer).height, 'the full-bleed footer is 48 high').toBeCloseTo(tokenLength(footer, BAR_TOKEN), 0);
        const student = canvas.getByRole('textbox', { name: /Student/ });
        await userEvent.clear(student);
        await userEvent.type(student, 'Marcus Lee');
        await expect(student).toHaveValue('Marcus Lee');
        await fitsCanvas(canvasElement);
    },
};

export const HostModal = {
    name: 'Host: In a Modal',
    render: () => staged(<FormInModal />),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const dialog = canvas.getByRole('dialog');
        await expect(within(dialog).getAllByRole('textbox').length, 'fewer than five fields').toBeLessThan(5);
        const student = within(dialog).getByRole('textbox', { name: /Student/ });
        await userEvent.type(student, 'Ana Ruiz');
        await expect(student).toHaveValue('Ana Ruiz');
        await fitsCanvas(canvasElement);
    },
};

export const HostSteps = {
    name: 'Host: In steps',
    render: () => staged(<FormInSteps />),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const next = canvas.getByRole('button', { name: 'Next' });
        await expect(next, 'the bar carries Back and Next').toBeInTheDocument();
        await userEvent.click(next);
        await expect(await canvas.findByRole('textbox', { name: /Session date/ })).toBeInTheDocument();
        await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
        await expect(await canvas.findByRole('textbox', { name: /Student/ })).toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/** One question per step in the In steps host: centered dots under five steps, tiles, centered Back and Continue, and validation on press. */
export const OneQuestionPerStep = {
    name: 'Host: In steps (one question per step)',
    render: () => staged(<QuestionStepInWindow />),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const centerX = (el) => {
            const box = rect(el);
            return (box.left + box.right) / 2;
        };

        await expect(canvas.queryByRole('navigation', { name: 'Main' }), 'Frame is focused without a Sidebar').toBeNull();
        await expect(canvas.queryByRole('navigation', { name: 'Steps' }), 'under five steps omits the left step list').toBeNull();

        const progress = canvas.getByRole('group', { name: 'Setup progress' });
        const heading = canvas.getByRole('heading', { level: 1, name: 'How would you like to tutor?' });
        const group = canvas.getByRole('radiogroup', { name: 'How would you like to tutor?' });
        const actions = canvas.getByRole('group', { name: 'Step actions' });
        const back = canvas.getByRole('button', { name: 'Back' });
        const next = canvas.getByRole('button', { name: 'Continue' });

        await expect(progress.children).toHaveLength(3);
        await expect(progress.children[0]).toHaveAttribute('aria-current', 'step');
        await expect(rect(progress).bottom, 'dots sit above the heading').toBeLessThanOrEqual(rect(heading).top);
        await expect(centerX(progress), 'dots are centered above the question').toBeCloseTo(centerX(heading), 0);

        await expect(rect(actions).top, 'actions sit under the tiles').toBeGreaterThanOrEqual(rect(group).bottom - 0.5);
        await expect(centerX(actions), 'Back and Continue are centered').toBeCloseTo(centerX(heading), 0);
        await expect(rect(back).right, 'Back sits before Continue').toBeLessThanOrEqual(rect(next).left);
        await expect(back, 'Back is disabled on the first step').toBeDisabled();
        await expect(next, 'Continue stays enabled while unanswered').not.toBeDisabled();
        await expect(alpha(getComputedStyle(back).backgroundColor), 'Back uses the subtle transparent fill').toBe(0);
        await expect(getComputedStyle(next).backgroundColor, 'Continue uses the primary fill').toBe(tokenColor(canvasElement, '--ds-background-brand-bold'));

        // Continue stays enabled and validates on press.
        await userEvent.click(next);
        await expect(await canvas.findByRole('alert')).toHaveTextContent('Choose a tutoring format to continue.');
        await expect(next, 'Continue remains enabled after validation').not.toBeDisabled();
        const firstOption = canvas.getByRole('radio', { name: 'One-on-one' });
        await expect(firstOption, 'focus moves to the first tile').toHaveFocus();

        // Step forward and back, keeping selections.
        await userEvent.click(canvas.getByText('One-on-one'));
        await waitFor(() => expect(canvas.queryByRole('alert')).toBeNull());
        await userEvent.click(next);

        await expect(await canvas.findByRole('heading', { level: 1, name: 'Which subjects can you tutor?' })).toBeInTheDocument();
        await expect(progress.children[1]).toHaveAttribute('aria-current', 'step');
        await expect(canvas.getByRole('button', { name: 'Back' })).not.toBeDisabled();

        await userEvent.click(canvas.getByText('Algebra'));
        await userEvent.click(canvas.getByRole('button', { name: 'Back' }));

        await expect(await canvas.findByRole('heading', { level: 1, name: 'How would you like to tutor?' })).toBeInTheDocument();
        await expect(progress.children[0]).toHaveAttribute('aria-current', 'step');
        await expect(canvas.getByRole('radio', { name: 'One-on-one' })).toHaveAttribute('aria-checked', 'true');

        await fitsCanvas(canvasElement);
    },
};

/** At five or more steps, the question step switches from dots to the host's left step list. */
export const QuestionStepFiveOrMore = {
    name: 'Test: In steps at five or more steps',
    render: () => staged(<QuestionStepInWindow steps={FIVE_QUESTION_STEPS} />),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);

        await expect(canvas.queryByRole('group', { name: 'Setup progress' }), 'dots give way to the step list at five steps').toBeNull();
        const tracker = canvas.getByRole('navigation', { name: 'Steps' });
        const heading = canvas.getByRole('heading', { level: 1, name: 'How would you like to tutor?' });
        await expect(rect(tracker).right, 'the left step list sits before the question').toBeLessThanOrEqual(rect(heading).left);

        const actions = canvas.getByRole('group', { name: 'Step actions' });
        await expect((rect(actions).left + rect(actions).right) / 2, 'Back and Continue stay centered under the question').toBeCloseTo((rect(heading).left + rect(heading).right) / 2, 0);

        await fitsCanvas(canvasElement);
    },
};

/* --------------------------------------------------------- marks and help */

/** Required fields set aria-required without a visible mark when they are the majority; the minority optional field says "(optional)". */
export const RequiredMarks = {
    name: 'Minority marker and help',
    render: () => staged(<Marks />, 480),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const student = canvas.getByRole('textbox', { name: 'Student' });
        await expect(student, 'a required field reports aria-required').toHaveAttribute('aria-required', 'true');
        await expect(canvasElement.querySelector('label[for="' + student.id + '"]'), 'majority required label stays unmarked').toHaveTextContent(/^Student$/);
        await expect(canvasElement.textContent, 'no star symbol in the form').not.toContain('*');
        const notes = canvas.getByRole('textbox', { name: 'Notes (optional)' });
        await expect(notes, 'the minority optional field says so').not.toHaveAttribute('aria-required', 'true');
        const caption = canvas.getByText('First and last name, as on the roster.');
        await expect(student.getAttribute('aria-describedby'), 'help sits in a caption the field points at').toContain(caption.id);
        await userEvent.type(notes, 'Bring calculator');
        await expect(notes).toHaveValue('Bring calculator');
        await fitsCanvas(canvasElement);
    },
};

/* ------------------------------------------------------------- validation */

/* The four pictures below draw the state their heading names, from initial-state props: the docs page does not run plays.
   The stories after them test the same interaction from a clean start. */

/** Student was touched and left empty: its error is showing; Site was not touched, so it is not marked. */
export const ShownOnBlur = {
    name: 'Validation: On blur (shown)',
    render: () => staged(<FormInPage initial={EMPTY} marked="student" />, PAGE_WIDTH),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const student = canvas.getByLabelText(/Student/);
        await expect(student, 'touched and empty').toHaveAttribute('aria-invalid', 'true');
        await expect(canvas.getByText('Enter the student’s name.'), 'the error says what to fix').toBeInTheDocument();
        await expect(canvas.queryByText('Choose a site.'), 'an untouched field is not marked').toBeNull();
        await userEvent.type(student, 'Ana Ruiz');
        await userEvent.tab();
        await waitFor(() => expect(student, 'typing clears the error once valid').not.toHaveAttribute('aria-invalid', 'true'));
        await settleAnimations(canvasElement);
        await fitsCanvas(canvasElement);
    },
};

/** After the press: the Primary is still enabled and every missing field is marked. */
export const ShownSubmitStaysEnabled = {
    name: 'Validation: Submit stays enabled (shown)',
    render: () => staged(<FormInPage initial={EMPTY} marked />, PAGE_WIDTH),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const student = canvas.getByLabelText(/Student/);
        await expect(student).toHaveAttribute('aria-invalid', 'true');
        await expect(canvas.getByText('Choose a site.'), 'every missing field is marked').toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Save session' }), 'still enabled').not.toBeDisabled();
        await userEvent.type(student, 'Ana Ruiz');
        await expect(student).toHaveValue('Ana Ruiz');
        await settleAnimations(canvasElement);
        await fitsCanvas(canvasElement);
    },
};

/** The Modal after a blocked press, at rest after its shake: open, the fields marked, one dialog. */
export const ShownBlockedSubmit = {
    name: 'Validation: Blocked submit in a Modal (shown)',
    render: () => staged(<FormInModal initial={EMPTY} marked height="fill" stageHeight={MARKED_HEIGHT} />),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        await expect(canvas.queryAllByRole('dialog'), 'one dialog').toHaveLength(1);
        const student = canvas.getByLabelText(/Student/);
        await expect(student).toHaveAttribute('aria-invalid', 'true');
        await expect(canvas.getByText('Choose a site.')).toBeInTheDocument();
        await userEvent.type(student, 'Ana Ruiz');
        await expect(student).toHaveValue('Ana Ruiz');
        await settleAnimations(canvasElement);
        await fitsCanvas(canvasElement);
    },
};

/** Sending: the Primary shows its spinner at its own width; Discard is live. */
export const ShownSending = {
    name: 'Validation: Sending (shown)',
    render: () => staged(<FormInModal initial={FILLED} sending />),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Save session' }), 'the spinner button is the one that disables').toBeDisabled();
        await expect(canvas.getByRole('button', { name: 'Discard' }), 'Discard stays live').not.toBeDisabled();
        await fitsCanvas(canvasElement);
    },
};

/** A field checks itself when it loses focus, and clears once the rule is met. */
export const OnBlur = {
    name: 'Test: On blur',
    render: () => staged(<FormInPage />, PAGE_WIDTH),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
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
    render: () => staged(<FormInPage />, PAGE_WIDTH),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
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
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
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
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const message = canvasElement.querySelector('[data-probe="message"]');
        const body = canvasElement.querySelector('[data-probe="body"], .plus-pattern-modal-body');
        if (body) await expect(body.scrollHeight, 'the whole form shows: the body does not scroll').toBeLessThanOrEqual(body.clientHeight + 1);
        await expect(within(message).getByRole('alert'), 'announced when it appears').toBeInTheDocument();
        await expect(rect(message).top, 'at the top of the body').toBeLessThanOrEqual(rect(canvas.getByLabelText(/Student/)).top);
        await expect(canvas.getByRole('button', { name: 'Save session' })).toBeEnabled();
        await fitsCanvas(canvasElement);
    },
};

/** Sending: the one time a button disables; it keeps its width and Discard stays live. */
export const Sending = {
    name: 'Test: Sending',
    render: () => staged(<FormInModal initial={FILLED} sendingForever />),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const save = canvas.getByRole('button', { name: 'Save session' });
        const width = rect(save).width;
        await userEvent.click(save);
        await waitFor(() => expect(save).toBeDisabled());
        await expect(rect(save).width, 'the button keeps its width').toBeCloseTo(width, 0);
        await expect(canvas.getByRole('button', { name: 'Discard' }), 'Discard stays live').not.toBeDisabled();
        await fitsCanvas(canvasElement);
    },
};

/* ---------------------------------------------------- leaving, bound input */

/** Leaving with edits asks first, in the same Modal; Back keeps what was typed. */
export const LeavingWithEdits = {
    name: 'Leaving with edits',
    render: () => staged(<FormInModal />),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Discard' }));
        await expect(canvas.queryByRole('heading', { name: 'Discard changes?' }), 'a form with no edits leaves at once').toBeNull();
        await userEvent.type(canvas.getByLabelText(/Student/), 'Ana');
        await userEvent.click(canvas.getByRole('button', { name: 'Discard' }));
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
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        await expect(canvas.getAllByRole('radio'), 'three choices are visible at once').toHaveLength(3);
        for (const radio of canvas.getAllByRole('radio')) await expect(radio, 'a radio group starts unanswered').not.toBeChecked();
        const inPerson = canvas.getByRole('radio', { name: 'In person' });
        await userEvent.click(inPerson);
        await expect(inPerson).toBeChecked();
        const grade = canvas.getByRole('combobox', { name: /Grade/ });
        await expect(grade, 'six choices open from a select').toBeInTheDocument();
        await userEvent.click(grade);
        await userEvent.click(await within(canvasElement.ownerDocument.body).findByRole('option', { name: 'Grade 7' }));
        await expect(grade).toHaveValue('Grade 7');
        await fitsCanvas(canvasElement);
    },
};
