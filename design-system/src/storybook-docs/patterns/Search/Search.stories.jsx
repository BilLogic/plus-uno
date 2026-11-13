import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { fitsCanvas } from '@/storybook-docs/lib/anatomy-asserts.js';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { BasicPage, BasicStudents, BodySearch, FocusedPage, FocusedStudents, PANEL, SCOPE, STAGE, SearchStudents } from './searchDemo.jsx';

/**
 * Search: the pattern page's examples, run in the Storybook tests. Each is a
 * real SearchField, in the real Section's view bar or in a page body. Docs
 * pictures hold the state their heading names through props and args (no
 * plays); the test-only stories at the end press, type and Esc from a clean
 * start.
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
const page = (canvasElement) => within(canvasElement.ownerDocument.body);
const field = (canvas) => canvas.getByRole('searchbox', { name: SCOPE });
const status = (canvas) => canvas.getByRole('status');
const bodyRows = (canvasElement) => canvasElement.querySelectorAll('tbody tr');

/* ---------- the three types, as the page's opening grid ---------- */

/** Active: the field in the view bar, rows narrow as you type. */
export const TypeActive = {
    name: 'Type: active',
    render: () => staged(<SearchStudents initialQuery="ia" />),
    play: async ({ canvasElement }) => {
        await expect(bodyRows(canvasElement).length, 'the rows narrowed in place').toBe(2);
        await fitsCanvas(canvasElement);
    },
};

/** Focused: the field in a page header with its panel open under it, grouped matches and "See all results". */
export const TypeFocused = {
    name: 'Type: focused',
    render: () => staged(<FocusedPage />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('combobox', { name: SCOPE })).toBeTruthy();
        await waitFor(() => expect(canvasElement.querySelector('[role="listbox"]'), 'the panel is open inside the picture').toBeTruthy());
        await expect(canvas.getByText(/See all results for/), 'the last row runs a basic search').toBeTruthy();
        await fitsCanvas(canvasElement);
    },
};

/** Basic: the field with its text in the page header, and the results page Enter leads to. */
export const TypeBasic = {
    name: 'Type: basic',
    render: () => staged(<BasicPage />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(field(canvas).value).toBe('Ava');
        await expect(canvasElement.querySelector('[aria-busy="true"]'), 'the results page waits under the bar').toBeTruthy();
        await expect(canvasElement.querySelector('[role="listbox"]'), 'no panel in basic').toBeNull();
        await fitsCanvas(canvasElement);
    },
};

/** Basic, the field alone: no panel and no per-keystroke work. */
export const BasicField = {
    name: 'Type: basic, the field',
    render: () => staged(<BasicStudents />),
    play: async ({ canvasElement }) => {
        await expect(field(within(canvasElement))).toBeTruthy();
    },
};

/* ---------- active: states ---------- */

/** Closed: the compact icon in the view bar, named for its scope. */
export const Closed = {
    name: 'State: closed',
    render: () => staged(<SearchStudents />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const bar = canvasElement.querySelector('.plus-section-view-bar');
        const search = canvas.getByRole('button', { name: SCOPE });
        await expect(bar.contains(search), 'the icon sits in the view bar').toBe(true);
        await expect(canvas.queryByRole('searchbox'), 'no field while closed').toBeNull();
        await expect(status(canvas).textContent, 'the count shows with nothing typed').toBe('6 students');
        await fitsCanvas(canvasElement);
    },
};

/** Narrowing: rows filter, the count is in words, the clear button is in the field. */
export const Narrowing = {
    name: 'State: narrowing',
    render: () => staged(<SearchStudents initialQuery="ia" />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(field(canvas).value).toBe('ia');
        await expect(status(canvas).textContent, 'the count in words, in the results header').toBe('2 of 6 students');
        await expect(bodyRows(canvasElement).length).toBe(2);
        await expect(canvas.getByRole('button', { name: 'Clear search' })).toBeTruthy();
        await fitsCanvas(canvasElement);
    },
};

/** No matches: the count reads zero, the empty state fills the results body and the bar stays. */
export const NoMatches = {
    name: 'State: no matches',
    render: () => staged(<SearchStudents initialQuery="Zoe" />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(status(canvas).textContent, 'zero is a count too').toBe('0 of 6 students');
        await expect(canvas.getByText('No students match "Zoe".')).toBeTruthy();
        await expect(canvasElement.querySelector('table'), 'the table is replaced whole').toBeNull();
        await expect(canvas.getByRole('button', { name: 'Reset filters' })).toBeTruthy();
        await expect(field(canvas), 'the bar keeps the field').toBeTruthy();
        await fitsCanvas(canvasElement);
    },
};

/** Loading: the same results body, Skeleton bars where the rows (or the empty state) will be. */
export const Loading = {
    name: 'State: loading',
    render: () => staged(<SearchStudents initialQuery="ia" isLoading />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Searching students'), 'the count slot says what is happening').toBeTruthy();
        await expect(canvasElement.querySelector('.plus-search-field__spinner'), 'a spinner takes the search icon').toBeTruthy();
        await expect(canvasElement.querySelector('[aria-busy="true"]'), 'the body is marked busy').toBeTruthy();
        await expect(canvasElement.querySelector('table'), 'no rows while loading').toBeNull();
        await expect(field(canvas), 'the bar does not move').toBeTruthy();
    },
};

/* ---------- placement and scope ---------- */

/** Default: a search in a page body takes default spacing, open, 40 high. */
export const BodyDefault = {
    name: 'Placement: page body',
    render: () => staged(<BodySearch initialQuery="ia" />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvasElement.querySelector('.plus-search-field--compact'), 'default spacing').toBeNull();
        await expect(field(canvas).value).toBe('ia');
        await fitsCanvas(canvasElement);
    },
};

/** Scope: the filter before the field, All first and selected. */
export const WithScope = {
    name: 'Scope filter',
    render: () => staged(<BodySearch scoped />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('All'), 'All is first and selected').toBeTruthy();
        await fitsCanvas(canvasElement);
    },
};

/* ---------- focused panel ---------- */

/** The panel under a focused field: empty text lists recent searches, text lists grouped results. */
export const FocusedPanel = {
    name: 'Focused panel',
    args: { text: '' },
    argTypes: { text: { control: 'inline-radio', options: ['', 'a', 'zzz'] } },
    parameters: { controls: { include: ['text'] } },
    render: ({ text }) => <FocusedStudents text={text} holdFocus />,
};

/* ---------- test-only: interaction from a clean start ---------- */

/** Test: press the icon, type, Esc clears, a second Esc closes and returns focus. */
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
        await expect(status(canvas).textContent).toBe('6 students');
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(canvas.queryByRole('searchbox')).toBeNull());
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
        await expect(status(canvas).textContent).toBe('6 students');
    },
};

/** Test: basic runs on Enter, never per keystroke. */
export const BasicRunsOnEnter = {
    name: 'Test: basic runs on Enter',
    args: { onSearch: fn() },
    render: ({ onSearch }) => <BasicStudents onSearch={onSearch} />,
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await userEvent.type(field(canvas), 'ava');
        await expect(args.onSearch, 'typing alone runs nothing').not.toHaveBeenCalled();
        await userEvent.keyboard('{Enter}');
        await expect(args.onSearch).toHaveBeenCalledWith('ava');
    },
};

/** Test: focused lists recent, then grouped results; Esc closes the panel, a second Esc clears, Tab closes. */
export const FocusedKeyboard = {
    name: 'Test: focused panel and keys',
    render: () => <FocusedStudents />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const body = page(canvasElement);
        const input = canvas.getByRole('combobox', { name: SCOPE });
        await userEvent.click(input);
        await waitFor(() => expect(body.getByText('Recent searches')).toBeVisible());
        await userEvent.keyboard('a');
        await waitFor(() => expect(body.getByRole('listbox', { name: PANEL })).toBeVisible());
        await expect(body.getByText(/^Students \(/), 'results are grouped, with counts').toBeTruthy();
        await expect(body.getByRole('option', { name: /See all results for/ }), 'the last row widens the search').toBeTruthy();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(body.queryByRole('listbox', { name: PANEL })).toBeNull());
        await expect(input.value, 'the first Esc closes the panel and keeps the text').toBe('a');
        await userEvent.keyboard('{Escape}');
        await expect(input.value, 'the second Esc clears').toBe('');
        await userEvent.keyboard('b');
        await waitFor(() => expect(body.getByRole('listbox', { name: PANEL })).toBeVisible());
        await userEvent.tab();
        await waitFor(() => expect(body.queryByRole('listbox', { name: PANEL })).toBeNull());
    },
};
