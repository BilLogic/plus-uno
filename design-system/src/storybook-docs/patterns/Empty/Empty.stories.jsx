import React from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { fitsCanvas } from '@/storybook-docs/lib/anatomy-asserts.js';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { expectSectionHeader } from '@/storybook-docs/lib/section-header-asserts.js';
import { expectFullScale, expectNotInert } from '@/storybook-docs/lib/live-example-asserts.js';
import { px, tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { EmptyTableBoxCase, EmptyType, FullPage, InCard, InPanel, InTable, SMALL_STAGE, STAGE, TYPE_STAGE } from './emptyDemo.jsx';

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

const staged = (story, width = STAGE) => <FitStage width={width} scrollable>{story}</FitStage>;
const box = (kind, props) => <div style={{ padding: 'var(--page-pad)' }}><EmptyType kind={kind} {...props} /></div>;

/** What every empty state keeps: a heading, a decorative picture, at most one action. */
const keepsTheBasics = async (canvasElement, { action }) => {
    const canvas = within(canvasElement);
    await expectNotInert(canvasElement);
    await expectFullScale(canvasElement);
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
    play: async ({ canvas, canvasElement }) => {
        await keepsTheBasics(canvasElement, { action: true });
        const add = canvas.getByRole('button', { name: 'Add students' });
        await expect(add.className, 'the one action is Primary').toContain('primary');
        await userEvent.click(add);
        await expect(canvas.getByRole('table')).toBeVisible();
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
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const [title, empty] = canvas.getAllByRole('heading');
        await expect(title, 'the page title leads').toHaveTextContent('Lincoln Middle');
        await expect(empty, 'the empty state names the view').toHaveTextContent('No students in this group yet');
        await fitsCanvas(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Add students' }));
        await expect(canvas.getByRole('table')).toBeVisible();
    },
};

/** A table: the empty state replaces the whole table (no head row, no footer); the header rows stay. */
export const PlaceTable = {
    name: 'Place: In a table',
    render: () => staged(<InTable />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        await expect(canvas.queryByRole('table'), 'no table, so no column headers and no footer').toBeNull();
        await expect(canvas.queryAllByRole('columnheader'), 'no column headers').toHaveLength(0);
        await expect(canvas.queryByRole('navigation'), 'no pagination').toBeNull();
        await expect(canvasElement.querySelector('.plus-section-rows'), 'the header rows stay').not.toBeNull();
        await expectSectionHeader(canvasElement, 1);
        await expect(canvas.getByRole('heading', { name: 'No students in this group yet' })).toBeVisible();
        await fitsCanvas(canvasElement);
    },
};

/** A card: compact, the block centered in the card. */
export const PlaceCard = {
    name: 'Place: In a card',
    render: () => staged(<InCard />, SMALL_STAGE),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        await expect(canvasElement.querySelector('.plus-empty-state--compact'), 'compact spacing in a card').not.toBeNull();
        await fitsCanvas(canvasElement);
    },
};

/** A Panel: the Details Panel for a removed record, the block at the top of the body with a way back. */
export const PlacePanel = {
    name: 'Place: In a Panel',
    render: () => staged(<InPanel />, SMALL_STAGE),
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        await expect(canvas.getByRole('heading', { name: 'This session no longer exists' })).toBeInTheDocument();
        const back = canvas.getByRole('button', { name: 'Back to sessions' });
        await expect(back, 'a way back').toBeInTheDocument();
        await fitsCanvas(canvasElement);
        await userEvent.click(back);
        await expect(canvas.getByRole('table')).toBeVisible();
    },
};

/* --------------------------------------------------------------- key cases */

/** No matches in a table: the whole table is replaced, and "Reset filters" is the way out. */
export const KeyNoMatchesInTable = {
    name: 'Key: No matches in a table',
    render: () => staged(<InTable kind="matches" />),
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        await expect(canvas.queryByRole('table'), 'the table is replaced whole').toBeNull();
        await expect(canvas.queryAllByRole('columnheader'), 'no column headers').toHaveLength(0);
        await expect(canvas.queryByRole('navigation'), 'no pagination').toBeNull();
        await expect(canvas.getByRole('heading', { name: 'No students match these filters' })).toBeVisible();
        const reset = canvas.getByRole('button', { name: 'Reset filters' });
        await expect(reset).toBeVisible();
        await fitsCanvas(canvasElement);

        await userEvent.click(reset);
        await expect(canvas.getByRole('table')).toBeVisible();
        await userEvent.click(canvas.getByRole('columnheader', { name: /Name/ }));
        await userEvent.click(canvas.getByRole('tab', { name: 'Needs follow-up' }));
        await expect(canvas.getByRole('tab', { name: 'Needs follow-up' })).toHaveAttribute('aria-selected', 'true');
        await userEvent.click(canvas.getByRole('tab', { name: 'All students' }));
        await expect(canvas.getByRole('heading', { name: 'No students match these filters' })).toBeVisible();
    },
};

/** A load failure in the empty-state slot, with Try again. */
export const KeyLoadFailure = {
    name: 'Key: A load failure',
    render: () => staged(<InTable kind="cant" />),
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        await expect(canvas.getByRole('heading', { name: "Couldn't load students" }), 'the error sits in the empty-state slot').toBeInTheDocument();
        const retry = canvas.getByRole('button', { name: 'Try again' });
        await expect(retry).toBeInTheDocument();
        await expect(canvas.queryByRole('table')).toBeNull();
        await fitsCanvas(canvasElement);
        await userEvent.click(retry);
        await expect(canvas.getByRole('table')).toBeVisible();
    },
};

/** Empty state box, nothing yet: sunken, card-rounded box with a default button matching the title row's primary action. */
export const KeyEmptyBoxNothingYet = {
    name: 'Key: Empty box — nothing yet',
    render: () => staged(<EmptyTableBoxCase variant="nothingYet" />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        await expect(canvas.queryByRole('table')).toBeNull();
        const box = canvasElement.querySelector('.plus-table-shell-empty');
        await expect(box, 'empty box rendered').not.toBeNull();
        await expect(getComputedStyle(box).backgroundColor).toBe(tokenColor(canvasElement, '--ds-surface-sunken'));
        await expect(px(getComputedStyle(box).borderTopLeftRadius)).toBe(tokenLength(canvasElement, '--table-empty-radius'));
        const action = within(box).getByRole('button', { name: 'Add students' });
        await expect(action.className, 'empty box action is default').not.toContain('primary');
        await expect(canvas.getAllByRole('button', { name: 'Add students' })[0], 'title row primary action stays above').toBeEnabled();
        await fitsCanvas(canvasElement);
        await userEvent.click(action);
        await expect(canvas.getByRole('table')).toBeVisible();
    },
};

/** Empty state box, hidden by a default filter: filter row stays above, button clears the filter to reveal rows. */
export const KeyEmptyBoxHiddenByFilter = {
    name: 'Key: Empty box — hidden by a default filter',
    render: () => staged(<EmptyTableBoxCase variant="hiddenByFilter" />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        await expect(canvas.queryByRole('table')).toBeNull();
        const box = canvasElement.querySelector('.plus-table-shell-empty');
        await expect(box, 'empty box rendered').not.toBeNull();
        await expect(getComputedStyle(box).backgroundColor).toBe(tokenColor(canvasElement, '--ds-surface-sunken'));
        await expect(px(getComputedStyle(box).borderTopLeftRadius)).toBe(tokenLength(canvasElement, '--table-empty-radius'));
        const reset = within(box).getByRole('button', { name: 'Reset filters' });
        await expect(reset.className).not.toContain('primary');
        await fitsCanvas(canvasElement);
        await userEvent.click(reset);
        await expect(canvas.getByRole('table')).toBeVisible();
    },
};

/** Empty state box, nothing to create: title and one line only, with no action button. */
export const KeyEmptyBoxNothingToCreate = {
    name: 'Key: Empty box — nothing to create',
    render: () => staged(<EmptyTableBoxCase variant="nothingToCreate" />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        await expect(canvas.queryByRole('table')).toBeNull();
        const box = canvasElement.querySelector('.plus-table-shell-empty');
        await expect(box, 'empty box rendered').not.toBeNull();
        await expect(getComputedStyle(box).backgroundColor).toBe(tokenColor(canvasElement, '--ds-surface-sunken'));
        await expect(px(getComputedStyle(box).borderTopLeftRadius)).toBe(tokenLength(canvasElement, '--table-empty-radius'));
        await expect(within(box).getByRole('heading', { name: 'Every reflection is reviewed' })).toBeVisible();
        await expect(canvas.queryAllByRole('button')).toHaveLength(0);
        await fitsCanvas(canvasElement);
    },
};
