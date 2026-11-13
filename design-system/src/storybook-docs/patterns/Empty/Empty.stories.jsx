import React from 'react';
import { expect, within } from 'storybook/test';

import { fitsCanvas } from '@/storybook-docs/lib/anatomy-asserts.js';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { EmptyType, FullPage, InCard, InPanel, InTable, SMALL_STAGE, STAGE, TYPE_STAGE } from './emptyDemo.jsx';

/**
 * Empty: the pattern page's examples, run in the Storybook tests. Each composes
 * the real EmptyState in the words its type takes, and each asserts the ruling
 * it shows: a heading that joins the outline, a decorative picture, one action
 * at most and only the one this person can take, and a table replaced whole.
 *
 * Run: npx vitest run --project=storybook design-system/src/storybook-docs/patterns/Empty/Empty.stories.jsx
 */
export default {
    // A test harness and the page's figures: `!dev` keeps it out of the sidebar. The page is Patterns/States/Empty (Empty.mdx).
    title: 'Patterns/States/Empty/Examples',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'padded' },
};

const staged = (story, width = STAGE) => <FitStage width={width}>{story}</FitStage>;
const box = (kind, props) => <div style={{ padding: 'var(--page-pad)' }}><EmptyType kind={kind} {...props} /></div>;

/** What every empty state keeps: a heading, a decorative picture, at most one action. */
const keepsTheBasics = async (canvasElement, { action }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('heading'), 'one heading names the view').toHaveLength(1);
    await expect(canvasElement.querySelector('.plus-empty-state__icon, .plus-empty-state__image'), 'the picture is decorative: hidden from assistive tech').toHaveAttribute('aria-hidden', 'true');
    await expect(canvas.queryAllByRole('button'), action ? 'one action' : 'no action').toHaveLength(action ? 1 : 0);
    await fitsCanvas(canvasElement);
};

/* ------------------------------------------------------------------ types */

/** First use: what will appear, and the one action that adds it. */
export const TypeFirstUse = {
    name: 'Type: First use',
    render: () => staged(box('first'), TYPE_STAGE),
    play: async ({ canvasElement }) => {
        await keepsTheBasics(canvasElement, { action: true });
        const add = within(canvasElement).getByRole('button', { name: 'Add students' });
        await expect(add.className, 'the one action is Primary').toContain('primary');
    },
};

/** No matches: names what is active and offers "Reset filters" as a Default button. */
export const TypeNoMatches = {
    name: 'Type: No matches',
    render: () => staged(box('matches'), TYPE_STAGE),
    play: async ({ canvasElement }) => {
        await keepsTheBasics(canvasElement, { action: true });
        const reset = within(canvasElement).getByRole('button', { name: 'Reset filters' });
        await expect(reset.className, '"Reset filters" is Default, not Primary').not.toContain('primary');
        await expect(within(canvasElement).getByText(/Grade 6 and Math/), 'it names the filters that are on').toBeInTheDocument();
    },
};

/** All done: says so, and when more arrives. No action. */
export const TypeAllDone = {
    name: 'Type: All done',
    render: () => staged(box('done'), TYPE_STAGE),
    play: async ({ canvasElement }) => {
        await keepsTheBasics(canvasElement, { action: false });
    },
};

/** Can't show, a load failure: the reason in plain words and Try again. */
export const TypeCantShow = {
    name: "Type: Can't show",
    render: () => staged(box('cant'), TYPE_STAGE),
    play: async ({ canvasElement }) => {
        await keepsTheBasics(canvasElement, { action: true });
        await expect(within(canvasElement).getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    },
};

/** Can't show, no access: the reason and who can help, with no action the person cannot take. */
export const TypeNoAccess = {
    name: 'Type: No access',
    render: () => staged(box('noAccess'), TYPE_STAGE),
    play: async ({ canvasElement }) => {
        await keepsTheBasics(canvasElement, { action: false });
        await expect(within(canvasElement).getByText(/Ask your supervisor/), 'it says who can help').toBeInTheDocument();
    },
};

/* ------------------------------------------------------------------ places */

/** A full page: the block under the page header. */
export const PlaceFullPage = {
    name: 'Place: A full page',
    render: () => staged(<FullPage />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const [title, empty] = canvas.getAllByRole('heading');
        await expect(title, 'the page title leads').toHaveTextContent('Lincoln Middle');
        await expect(empty, 'the empty state names the view').toHaveTextContent('No students in this group yet');
        await fitsCanvas(canvasElement);
    },
};

/** A table: the empty state replaces the whole table (no head row, no footer); the view bar stays. */
export const PlaceTable = {
    name: 'Place: In a table',
    render: () => staged(<InTable />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByRole('table'), 'no table, so no column headers and no footer').toBeNull();
        await expect(canvasElement.querySelector('.plus-section-view-bar'), 'the view bar stays').not.toBeNull();
        await expect(canvas.getByRole('heading', { name: 'No students in this group yet' })).toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/** A card: compact, the block centered in the card. */
export const PlaceCard = {
    name: 'Place: In a card',
    render: () => staged(<InCard />, SMALL_STAGE),
    play: async ({ canvasElement }) => {
        await expect(canvasElement.querySelector('.plus-empty-state--compact'), 'compact spacing in a card').not.toBeNull();
        await fitsCanvas(canvasElement);
    },
};

/** A Panel: the Details Panel for a removed record, the block at the top of the body with a way back. */
export const PlacePanel = {
    name: 'Place: In a Panel',
    render: () => staged(<InPanel />, SMALL_STAGE),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('heading', { name: 'This session no longer exists' })).toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Back to sessions' }), 'a way back').toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/* --------------------------------------------------------------- key cases */

/** No matches in a table: the whole table is replaced, and "Reset filters" is the way out. */
export const KeyNoMatchesInTable = {
    name: 'Key: No matches in a table',
    render: () => staged(<InTable kind="matches" />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByRole('table'), 'the table is replaced whole').toBeNull();
        await expect(canvas.getByRole('button', { name: 'Reset filters' })).toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/** A load failure in the empty-state slot, with Try again. */
export const KeyLoadFailure = {
    name: 'Key: A load failure',
    render: () => staged(<InTable kind="cant" />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('heading', { name: "Couldn't load sessions" }), 'the error sits in the empty-state slot').toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
        await expect(canvas.queryByRole('table')).toBeNull();
        await fitsCanvas(canvasElement);
    },
};
