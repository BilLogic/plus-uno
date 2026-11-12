import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { fitsCanvas } from '@/storybook-docs/lib/anatomy-asserts.js';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { SCOPE, STAGE, SearchStudents } from './searchDemo.jsx';

/**
 * Search: the pattern page's examples, run in the Storybook tests. Each
 * composes the real Section, its view bar, the real IconButton and TextField and
 * a Dynamic table. Docs pictures hold the state their heading names through
 * `initialOpen` and `initialQuery`; the test-only stories at the end press,
 * type and Esc from a clean start.
 *
 * Run: npx vitest run --project=storybook design-system/src/storybook-docs/patterns/Search/Search.stories.jsx
 */
export default {
    // A test harness and the page's figures: `!dev` keeps it out of the sidebar. The page is Patterns/Finding things/Search (Search.mdx).
    title: 'Patterns/Finding things/Search/Examples',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'padded' },
};

const staged = (story) => <FitStage width={STAGE}>{story}</FitStage>;
const field = (canvas) => canvas.getByRole('textbox', { name: SCOPE });
const status = (canvas) => canvas.getByRole('status');
const bodyRows = (canvasElement) => canvasElement.querySelectorAll('tbody tr');

/** Closed: the Search icon in the view bar, before the filters, named for its scope. */
export const Closed = {
    name: 'State: closed',
    render: () => staged(<SearchStudents />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const bar = canvasElement.querySelector('.plus-section-view-bar');
        const search = canvas.getByRole('button', { name: SCOPE });
        const more = canvas.getByRole('button', { name: 'More' });
        await expect(bar.contains(search), 'the icon sits in the view bar').toBe(true);
        await expect(search.compareDocumentPosition(more) & Node.DOCUMENT_POSITION_FOLLOWING, 'before More').toBeTruthy();
        await expect(canvas.queryByRole('textbox'), 'no field while closed').toBeNull();
        await fitsCanvas(canvasElement);
    },
};

/** Open: the field names its scope, empty. */
export const Open = {
    name: 'State: open',
    render: () => staged(<SearchStudents initialOpen />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(field(canvas).getAttribute('placeholder'), 'the placeholder names the scope').toBe(SCOPE);
        await expect(canvas.queryByRole('button', { name: 'Clear search' }), 'nothing to clear yet').toBeNull();
        await expect(status(canvas).textContent).toBe('6 students');
    },
};

/** Narrowing: rows filter, the count is in words, "Clear search" is in the field. */
export const Narrowing = {
    name: 'State: narrowing',
    render: () => staged(<SearchStudents initialQuery="ia" />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(field(canvas).value).toBe('ia');
        await expect(status(canvas).textContent, 'the count in words').toBe('2 of 6 students');
        await expect(bodyRows(canvasElement).length, 'the table narrowed').toBe(2);
        await expect(canvas.getByRole('button', { name: 'Clear search' })).toBeTruthy();
        await fitsCanvas(canvasElement);
    },
};

/** No matches: the empty state replaces the table and names what was searched. */
export const NoMatches = {
    name: 'State: no matches',
    render: () => staged(<SearchStudents initialQuery="Zoe" />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('No students match "Zoe".')).toBeTruthy();
        await expect(canvasElement.querySelector('table'), 'the table is replaced whole').toBeNull();
        await expect(status(canvas).textContent).toBe('0 of 6 students');
        await expect(canvas.getByRole('button', { name: 'Reset filters' })).toBeTruthy();
        await expect(field(canvas), 'the field stays open for the next try').toBeTruthy();
        await fitsCanvas(canvasElement);
    },
};

/** Test: press, type, Esc clears, a second Esc closes and returns focus to the icon. */
export const EscClearsThenCloses = {
    name: 'Test: Esc clears, a second Esc closes',
    render: () => staged(<SearchStudents />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: SCOPE }));
        await waitFor(() => expect(document.activeElement, 'pressing the icon focuses the field').toBe(field(canvas)));
        await userEvent.keyboard('ia');
        await expect(status(canvas).textContent, 'the count updates as you type').toBe('2 of 6 students');
        await userEvent.keyboard('{Escape}');
        await expect(field(canvas).value, 'the first Esc empties the text').toBe('');
        await expect(document.activeElement, 'and keeps the field').toBe(field(canvas));
        await expect(status(canvas).textContent).toBe('6 students');
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(canvas.queryByRole('textbox')).toBeNull());
        await waitFor(() => expect(document.activeElement, 'closing returns focus to the icon').toBe(canvas.getByRole('button', { name: SCOPE })));
    },
};

/** Test: "Clear search" empties the text and the field stays open. */
export const ClearSearchKeepsFieldOpen = {
    name: 'Test: Clear search keeps the field open',
    render: () => staged(<SearchStudents initialQuery="ia" />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Clear search' }));
        await expect(field(canvas).value).toBe('');
        await expect(bodyRows(canvasElement).length).toBe(6);
    },
};

/** Test: an empty field shrinks back to the icon on blur; one holding text stays open. */
export const EmptyBlurShrinks = {
    name: 'Test: leaving an empty field shrinks it',
    render: () => staged(<SearchStudents initialOpen />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        field(canvas).focus();
        await userEvent.tab();
        await waitFor(() => expect(canvas.queryByRole('textbox'), 'empty: back to the icon').toBeNull());
    },
};

export const TextKeepsFieldOpen = {
    name: 'Test: leaving a field with text keeps it open',
    render: () => staged(<SearchStudents initialQuery="ia" />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        field(canvas).focus();
        await userEvent.tab();
        await expect(field(canvas).value, 'the field stays open with its text').toBe('ia');
    },
};

/** Test: switching views keeps the search. */
export const ViewsKeepSearch = {
    name: 'Test: switching views keeps the search',
    render: () => staged(<SearchStudents initialQuery="a" />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('tab', { name: 'Needs follow-up' }));
        await expect(field(canvas).value, 'the text is kept').toBe('a');
        await expect(status(canvas).textContent).toBe('2 of 2 students');
    },
};

/** Test: "Reset filters" in No matches clears the search. */
export const ResetClearsSearch = {
    name: 'Test: Reset filters clears the search',
    render: () => staged(<SearchStudents initialQuery="Zoe" />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Reset filters' }));
        await waitFor(() => expect(bodyRows(canvasElement).length).toBe(6));
        await expect(canvas.getByRole('button', { name: SCOPE }), 'the field is closed again').toBeTruthy();
    },
};
