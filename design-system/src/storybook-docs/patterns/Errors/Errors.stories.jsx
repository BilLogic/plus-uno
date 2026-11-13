import React from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { fitsCanvas } from '@/storybook-docs/lib/anatomy-asserts.js';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { EMPTY, FILLED, FormInModal, FormInPage } from '../../../patterns/Form/formDemo.jsx';
import { BackgroundJob, FieldError, FlagOnPage, InPage, LoadFailure, MenuError, NoAccess, PLACE_STAGE, PageCondition, STAGE } from './errorsDemo.jsx';

/**
 * Errors: the pattern page's examples, run in the Storybook tests. Each is
 * drawn in the state its heading names, from initial-state props, and asserts
 * the ruling it shows: the message is visible text where the cause is, a load
 * failure takes the empty-state slot, no access offers no action, a failed
 * background job stays until dismissed, and nothing carries a message in a
 * tooltip.
 *
 * Run: npx vitest run --project=storybook design-system/src/storybook-docs/patterns/Errors/Errors.stories.jsx
 */
export default {
    // A test harness and the page's figures: `!dev` keeps it out of the sidebar. The page is Patterns/States/Errors (Errors.mdx).
    title: 'Patterns/States/Errors/Examples',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'padded' },
};

const staged = (story, width = STAGE) => <FitStage width={width}>{story}</FitStage>;

/** No message in this picture lives in a tooltip or a title attribute. */
const noTooltipCopy = async (canvasElement) => {
    await expect(canvasElement.querySelectorAll('[role="tooltip"], [title]'), 'no message in a tooltip').toHaveLength(0);
};

/* ------------------------------------------------------------------ places */

/** A field: invalid, the message under it in words. */
export const PlaceField = {
    name: 'Place: A field',
    render: () => staged(<FieldError />, PLACE_STAGE),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const field = canvas.getByLabelText(/School email/);
        await expect(field, 'the field is invalid').toHaveAttribute('aria-invalid', 'true');
        await expect(canvas.getByText('Enter a full email, like name@school.org'), 'the message says what to fix').toBeInTheDocument();
        await noTooltipCopy(canvasElement);
        await fitsCanvas(canvasElement);
    },
};

/** A view that could not load: the error in the empty-state slot, with Try again; the view bar stays. */
export const PlaceLoadFailure = {
    name: 'Place: A view that could not load',
    render: () => staged(<LoadFailure />, PLACE_STAGE),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('heading', { name: "Couldn't load this week's sessions" }), 'the heading says what failed').toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Try again' }), 'the way forward').toBeInTheDocument();
        await expect(canvas.queryByRole('table'), 'the table is replaced whole').toBeNull();
        await expect(canvas.getByRole('tab', { name: 'This week' }), 'the view bar stays').toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/** No access: the same slot says who can help and offers no action the person cannot take. */
export const PlaceNoAccess = {
    name: 'Place: No access',
    render: () => staged(<NoAccess />, PLACE_STAGE),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(/Ask the supervisor/), 'it says who can help').toBeInTheDocument();
        await expect(canvas.queryByRole('button', { name: /Try again|Request/ }), 'no action the person cannot take').toBeNull();
        await fitsCanvas(canvasElement);
    },
};

/** A background job: a danger Flag that does not hide on its own and offers Try again. */
export const PlaceBackgroundJob = {
    name: 'Place: A background job',
    render: () => staged(<BackgroundJob />, PLACE_STAGE),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText("Couldn't save your session note"), 'the title names the event').toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
        await expect(canvas.getByRole('alert'), 'a danger Flag is an alert').toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/** The whole page: one danger Banner for a condition that holds for everything on it. */
export const PlacePageCondition = {
    name: 'Place: The whole page',
    render: () => staged(<PageCondition />, PLACE_STAGE),
    play: async ({ canvasElement }) => {
        const banner = canvasElement.querySelector('.plus-banner--danger');
        await expect(banner, 'a danger Banner').toBeInTheDocument();
        await expect(within(banner).queryByRole('button'), 'a Banner has no dismiss').toBeNull();
        await fitsCanvas(canvasElement);
    },
};

/** A menu's options: a "Couldn't load options" row with Retry. */
export const PlaceMenu = {
    name: 'Place: A menu’s options',
    render: () => staged(<MenuError />, PLACE_STAGE),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText("Couldn't load options"), 'the row says what failed').toBeInTheDocument();
        await expect(canvas.getByRole('menuitem', { name: 'Retry' }), 'and offers Retry').toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/* --------------------------------------------------------------- key cases */

/** The Modal after a blocked press: open, the fields marked, one dialog. The shake is Planned, so the picture is at rest. */
export const KeyBlockedSubmit = {
    name: 'Key case: Blocked submit',
    render: () => staged(<FormInModal initial={EMPTY} marked height="fill" stageHeight={680} />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryAllByRole('dialog'), 'one dialog, never a second').toHaveLength(1);
        await expect(canvas.getByLabelText(/Student/), 'the field is marked').toHaveAttribute('aria-invalid', 'true');
        await expect(canvas.getByText('Choose a site.'), 'the message is on the field').toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/** The server said no: a danger SectionMessage at the top of the form, announced. */
export const KeyRejectedSubmit = {
    name: 'Key case: Rejected submit',
    render: () => staged(<FormInPage server initial={FILLED} />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const message = canvasElement.querySelector('[data-probe="message"]');
        await expect(within(message).getByRole('alert'), 'announced when it appears').toBeInTheDocument();
        await expect(message.getBoundingClientRect().top, 'at the top of the form').toBeLessThanOrEqual(canvas.getByLabelText(/Student/).getBoundingClientRect().top);
        await fitsCanvas(canvasElement);
    },
};

/** A Section that could not load: the rest of the page works. */
export const KeySectionFailed = {
    name: 'Key case: A Section that could not load',
    render: () => staged(<InPage />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('heading', { name: 'Lincoln Middle', level: 1 }), 'the page around it is up').toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/** A failed save in the background: the Flag finds the person at the top right. */
export const KeyFlagOnPage = {
    name: 'Key case: A failed save in the background',
    render: () => staged(<FlagOnPage />),
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('alert')).toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/* ------------------------------------------------------------------- tests */

/** A load failure that counts its retries, to test the button from a clean start. */
const RetryProbe = () => {
    const [tries, setTries] = React.useState(0);
    return (
        <div>
            <LoadFailure onRetry={() => setTries((n) => n + 1)} />
            <p role="status">{`Tried ${tries} times`}</p>
        </div>
    );
};

/** Test: Try again runs the retry, and stays so the person can press it again. */
export const TestRetry = {
    name: 'Test: Try again',
    render: () => <RetryProbe />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
        await expect(canvas.getByRole('status'), 'the retry ran').toHaveTextContent('Tried 1 times');
        await expect(canvas.getByRole('button', { name: 'Try again' })).toBeEnabled();
    },
};
