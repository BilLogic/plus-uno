import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { fitsCanvas } from '@/storybook-docs/lib/anatomy-asserts.js';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import {
    ClippedCell,
    FOLD_STAGE,
    FoldedTags,
    LONG_ERROR,
    LONG_NOTE,
    LONG_STATUS,
    LONG_TAG,
    LONG_TITLE,
    LongTags,
    NARROW,
    PagedTable,
    SUBJECTS,
    TABLE_STAGE,
    Wrap,
} from './overflowDemo.jsx';

/**
 * Overflow: the pattern page's examples, run in the Storybook tests. Each
 * composes the real parts holding text longer than their room and asserts the
 * answer: titles and messages wrap, cells and tags end in an ellipsis with the
 * full text reachable only while clipped, a TagGroup folds the rest into +n,
 * and a table pages in its footer.
 *
 * Run: npx vitest run --project=storybook design-system/src/storybook-docs/patterns/Overflow/Overflow.stories.jsx
 */
export default {
    // A test harness and the page's figures: `!dev` keeps it out of the sidebar. The page is Patterns/States/Overflow (Overflow.mdx).
    title: 'Patterns/States/Overflow/Examples',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'padded' },
};

const rect = (el) => el.getBoundingClientRect();
const staged = (story, width) => <FitStage width={width}>{story}</FitStage>;

/** True while an element's text is cut: its content is wider than its box. */
const isClipped = (el) => el.scrollWidth > el.clientWidth;

/** The element that holds a label's text and ellipsizes, inside a tag. */
const textOf = (root, label) => {
    const hit = [...root.querySelectorAll('*')].find((el) => el.children.length === 0 && el.textContent === label);
    return hit;
};

/* ------------------------------------------------------------------- wrap */

/** A long title and a long error take more lines; nothing is cut. */
export const WrapTitlesAndErrors = {
    name: 'Wrap: titles and messages',
    render: () => staged(<Wrap />, NARROW),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const title = canvas.getByRole('heading', { name: LONG_TITLE });
        const error = canvas.getByText(LONG_ERROR);
        for (const [name, el] of [['title', title], ['error', error]]) {
            await expect(el.scrollWidth, `the ${name} is never wider than its box`).toBeLessThanOrEqual(el.clientWidth + 1);
            await expect(getComputedStyle(el).textOverflow, `the ${name} has no ellipsis`).not.toBe('ellipsis');
        }
        const lineHeight = parseFloat(getComputedStyle(title).lineHeight);
        await expect(rect(title).height, 'the title runs to more than one line').toBeGreaterThan(lineHeight * 1.5);
        await expect(rect(error).height, 'the error runs to more than one line').toBeGreaterThan(parseFloat(getComputedStyle(error).lineHeight) * 1.5);
        await fitsCanvas(canvasElement);
    },
};

/* --------------------------------------------------------------- truncate */

/** A cell longer than its column ends in an ellipsis on one line, and is a tab stop only while clipped. */
export const TruncatedCell = {
    name: 'Truncate: a cell',
    render: () => staged(<ClippedCell />, TABLE_STAGE),
    play: async ({ canvasElement }) => {
        const clipped = textOf(canvasElement, LONG_NOTE);
        await expect(getComputedStyle(clipped).textOverflow, 'the cell ends in an ellipsis').toBe('ellipsis');
        await expect(getComputedStyle(clipped).whiteSpace, 'on one line').toBe('nowrap');
        await expect(isClipped(clipped), 'the note is cut').toBe(true);
        await expect(clipped.closest('[title]'), 'never the browser title attribute').toBeNull();
        await expect(clipped.closest('[tabindex="0"]') ?? clipped.getAttribute('tabindex') !== null, 'a clipped cell is a tab stop').toBeTruthy();
        const fits = textOf(canvasElement, 'On track');
        await expect(isClipped(fits), 'a short note is not cut').toBe(false);
        await expect(fits.getAttribute('tabindex'), 'an unclipped cell is not a tab stop').toBeNull();
        await fitsCanvas(canvasElement);
    },
};

/** A clipped cell opens its full text in a Tooltip on focus; the full text is in the DOM throughout. */
export const TruncatedCellTooltip = {
    name: 'Test: a clipped cell opens its text',
    render: () => staged(<ClippedCell />, TABLE_STAGE),
    play: async ({ canvasElement }) => {
        const clipped = textOf(canvasElement, LONG_NOTE);
        await expect(clipped.textContent, 'the full text is always in the DOM').toBe(LONG_NOTE);
        const stop = clipped.getAttribute('tabindex') !== null ? clipped : clipped.closest('[tabindex="0"]');
        stop.focus();
        await waitFor(() => expect(within(document.body).getAllByRole('tooltip').some((tip) => tip.textContent === LONG_NOTE), 'the Tooltip opens on focus').toBe(true));
    },
};

/** A short cell gets no Tooltip. */
export const UnclippedCellNoTooltip = {
    name: 'Test: an unclipped cell has no Tooltip',
    render: () => staged(<ClippedCell note="Starts with number lines" />, TABLE_STAGE),
    play: async ({ canvasElement }) => {
        const short = textOf(canvasElement, 'Starts with number lines');
        await expect(isClipped(short)).toBe(false);
        await expect(short.getAttribute('tabindex'), 'not a tab stop').toBeNull();
        await expect(short.closest('[title]'), 'no title attribute either').toBeNull();
        await userEvent.hover(short);
        await new Promise((resolve) => setTimeout(resolve, 400));
        await expect(within(document.body).queryAllByRole('tooltip').some((tip) => tip.textContent === 'Starts with number lines'), 'no Tooltip for a value that fits').toBe(false);
    },
};

/** A Tag past 180 and a StatusTag past 200 end in an ellipsis, with the full text in a Tooltip. */
export const TruncatedTags = {
    name: 'Truncate: a Tag and a StatusTag',
    render: () => staged(<LongTags />, NARROW),
    play: async ({ canvasElement }) => {
        const tag = textOf(canvasElement, LONG_TAG);
        const status = textOf(canvasElement, LONG_STATUS);
        await expect(isClipped(tag), 'the Tag is clipped').toBe(true);
        await expect(isClipped(status), 'the StatusTag is clipped').toBe(true);
        const box = (el) => el.closest('.plus-tag, .plus-status');
        await expect(rect(box(tag)).width, 'a Tag stops at 180').toBeLessThanOrEqual(180.5);
        await expect(rect(box(status)).width, 'a StatusTag stops at 200').toBeLessThanOrEqual(200.5);
        await expect(tag.textContent, 'the full text stays in the DOM').toBe(LONG_TAG);
        await fitsCanvas(canvasElement);
    },
};

/* ------------------------------------------------------------------- fold */

/** A TagGroup that collapses keeps one line and folds the rest behind +n. */
export const FoldedTagGroup = {
    name: 'Fold: a TagGroup',
    render: () => staged(<FoldedTags />, FOLD_STAGE),
    play: async ({ canvasElement }) => {
        const list = within(canvasElement).getByRole('list', { name: 'Subjects' });
        const fold = () => within(list).queryByRole('button', { name: /more tags?$/ });
        // A tag on the row, not a measuring copy and not one hidden past the edge.
        const shown = () => SUBJECTS.flatMap((subject) => within(list).queryAllByText(subject)
            .filter((el) => el.checkVisibility({ visibilityProperty: true })));
        await waitFor(() => expect(fold(), 'the rest fold behind a +n').toBeTruthy());
        await expect(fold().textContent, 'the fold says how many it holds').toMatch(/^\+\d+$/);
        await expect(shown().length + Number(fold().textContent.slice(1)), 'shown plus folded is every tag').toBe(SUBJECTS.length);
        await expect(new Set(shown().map((el) => Math.round(rect(el).top))).size, 'one line').toBe(1);
        await fitsCanvas(canvasElement);
    },
};

/* ------------------------------------------------------------------- page */

/** A table pages in its Section's footer, at the end, instead of growing. */
export const PagedInFooter = {
    name: 'Page: a table',
    render: () => staged(<PagedTable />, TABLE_STAGE),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const footer = canvasElement.querySelector('.plus-pattern-section-footer');
        const pager = within(footer).getByRole('navigation', { name: 'Page navigation' });
        await expect(rect(pager).right, 'the pager sits at the end of the footer').toBeCloseTo(rect(footer).right, -1);
        await expect(canvas.getAllByRole('row').length, 'the rows stay at one page').toBe(5);
        await fitsCanvas(canvasElement);
    },
};
