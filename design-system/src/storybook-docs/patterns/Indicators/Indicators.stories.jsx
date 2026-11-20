import React from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { fitsCanvas } from '@/storybook-docs/lib/anatomy-asserts.js';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { expectFullScale, expectNotInert } from '@/storybook-docs/lib/live-example-asserts.js';
import {
    BesideTitleCase,
    InARowCase,
    NotColorOnlyCase,
    OnNavigationCase,
    RollUpCase,
    UpIsBadCase,
} from './IndicatorsCases.jsx';
import {
    NARROW,
    ROLL_UP_STAGE,
    STAGE,
    STATUSES,
    Tags,
} from './indicatorsDemo.jsx';

/**
 * Indicators: the pattern page's examples, run in the Storybook tests. Each
 * composes the real Status tag, Count tag, Change tag, ProgressBar, Card
 * and Section and asserts the ruling it shows: one job per tag, one
 * status per row, a count that is quiet and absent at zero, a change whose
 * tone follows the good direction, and a meaning that never rests on color alone.
 *
 * Run: npx vitest run --project=storybook design-system/src/storybook-docs/patterns/Indicators/Indicators.stories.jsx
 */
export default {
    // A test harness and the page's figures: `!dev` keeps it out of the sidebar. The page is Patterns/Indicators (Indicators.mdx).
    title: 'Patterns/Indicators/Examples',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'padded' },
};

const staged = (story, width = STAGE) => <FitStage width={width} scrollable>{story}</FitStage>;
const rect = (el) => el.getBoundingClientRect();

/** The tag element that holds a label (the nearest ancestor that carries its tone class). */
const tagOf = (el) => el.closest('.plus-status, .plus-count, .plus-change-tag, .plus-tag');

/* -------------------------------------------------------------- three tags */

/** Three jobs, three components: a state, how many, how much it moved. */
export const ThreeTags = {
    name: 'The three tags',
    render: () => staged(<Tags />),
    play: async ({ canvas, canvasElement }) => {
        for (const [appearance, label] of STATUSES) {
            await expect(tagOf(canvas.getByText(label)).className, `${label} takes ${appearance}`).toContain(appearance);
        }
        await expect(canvas.getByText('4'), 'a count is the bare number').toBeInTheDocument();
        await expect(canvas.getByText('4').closest('.plus-count').getBoundingClientRect().height, 'count is 16 tall').toBe(16);
        await expect(canvas.getByText('99+'), 'a count past max is capped with a plus').toBeInTheDocument();
        await expect(canvas.queryByText(/items?$/), 'a count never carries a word').toBeNull();
        const change = canvas.getAllByText('vs last week', { exact: false })[0];
        await expect(change, 'a change names its comparison').toBeInTheDocument();
        await expect(change.closest('.plus-change-tag').querySelector('.plus-change-tag__tag').getBoundingClientRect().height, 'change tag is 16 tall').toBe(16);
        await fitsCanvas(canvasElement);
    },
};

/* ---------------------------------------------------------------- key cases */

/** One Status tag per row, at the default spacing, in a table cell. */
export const StatusInARow = {
    name: 'Status in a row',
    render: () => staged(<InARowCase />),
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        for (const row of canvas.getAllByRole('row').slice(1)) {
            await expect(row.querySelectorAll('.plus-status').length, 'one status per row').toBe(1);
            await expect(row.querySelector('.plus-status').textContent.trim().split(/\s+/).length, 'one or two words').toBeLessThanOrEqual(2);
        }
        const studentHeader = canvas.getByRole('columnheader', { name: /Student/ });
        await userEvent.click(within(studentHeader).getByRole('button'));
        await expect(studentHeader).toHaveAttribute('aria-sort', 'ascending');
        const firstBodyRow = canvas.getAllByRole('row')[1];
        await expect(within(firstBodyRow).getByText('Ana Ruiz')).toBeInTheDocument();
        await userEvent.click(within(studentHeader).getByRole('button'));
        await expect(studentHeader).toHaveAttribute('aria-sort', 'descending');
        await expect(within(canvas.getAllByRole('row')[1]).getByText('Sofia Ramirez')).toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/** A spacious Status tag after the page title, never before it. */
export const StatusBesideHeading = {
    name: 'Status beside a heading',
    render: () => staged(<BesideTitleCase />),
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const title = canvas.getByRole('heading', { name: 'Session with Ana Ruiz' });
        const status = tagOf(canvas.getByText('Needs review'));
        await expect(rect(status).left, 'the tag follows the text').toBeGreaterThan(rect(title).right - 1);
        await expect(rect(status).height, 'spacious is taller than the 20 default').toBeGreaterThan(24);
        await userEvent.click(canvas.getByRole('button', { name: 'Mark reviewed' }));
        await expect(tagOf(canvas.getByText('Completed')).className).toContain('success');
        await userEvent.click(canvas.getByRole('button', { name: 'Reopen review' }));
        await expect(tagOf(canvas.getByText('Needs review')).className).toContain('warning');
        await fitsCanvas(canvasElement);
    },
};

/** Counts on items: quiet, one bold, nothing at zero, a cap past max. */
export const CountsOnNavigation = {
    name: 'Counts on navigation',
    render: () => staged(<OnNavigationCase />, NARROW),
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const item = (name) => canvasElement.querySelector(`[data-nav-item="${name}"]`);
        await expect(within(item('Inbox')).getByText('3'), 'a quiet count').toBeInTheDocument();
        await expect(within(item('Inbox')).getByText('3').closest('.plus-count').getBoundingClientRect().height, 'nav count is 16 tall').toBe(16);
        await expect(tagOf(within(item('Reflections')).getByText('5')).className, 'bold asks for action now').toContain('bold');
        await expect(item('Archive').querySelector('.plus-count'), 'nothing renders at zero').toBeNull();
        await expect(within(item('Messages')).getByText('99+'), 'capped past max').toBeInTheDocument();
        await expect(canvasElement.querySelectorAll('.plus-count--bold').length, 'at most one bold count in the area').toBe(1);

        const reflectionsBtn = within(item('Reflections')).getByRole('button');
        await userEvent.click(reflectionsBtn);
        await expect(reflectionsBtn).toHaveAttribute('aria-pressed', 'true');
        await expect(within(item('Inbox')).getByRole('button')).toHaveAttribute('aria-pressed', 'false');

        await userEvent.click(canvas.getByRole('button', { name: 'Handle item' }));
        await expect(within(item('Reflections')).getByText('4'), 'handling an item decrements the selected count').toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/** A status told apart at a glance adds a leading icon to its color. */
export const WhereColorIsNotEnough = {
    name: 'Where color is not enough',
    render: () => staged(<NotColorOnlyCase />, NARROW),
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const rows = canvas.getByTestId('status-rows');
        const missed = tagOf(within(rows).getByText('Missed'));
        await expect(missed.querySelector('svg, .fa-solid, [class*="icon"]'), 'the icon joins the color').not.toBeNull();
        await expect(missed.querySelector('svg, i, [class*="icon"]').getAttribute('aria-hidden'), 'the icon is decorative').toBe('true');

        await userEvent.click(canvas.getByRole('tab', { name: 'Completed' }));
        await expect(within(rows).queryByText('Missed')).toBeNull();
        await expect(within(rows).getByText('Completed')).toBeInTheDocument();

        await userEvent.click(canvas.getByRole('tab', { name: 'All' }));
        await expect(within(rows).getByText('Missed')).toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/** Absences rose by 3: the value is up, the tone is danger. */
export const ChangeWhereUpIsBad = {
    name: 'Change where up is bad',
    render: () => staged(<UpIsBadCase />, NARROW),
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const tag = canvasElement.querySelector('.plus-change-tag');
        await expect(tag.textContent, 'the value is signed').toContain('+3');
        await expect(tag.className, 'up is danger when the good direction is down').toContain('danger');
        await expect(tag.textContent.includes('Up 3'), 'the words read the direction').toBe(true);

        await userEvent.click(canvas.getByRole('tab', { name: 'vs last month' }));
        await expect(canvasElement.querySelector('.plus-change-tag').textContent).toContain('−2');
        await expect(canvasElement.querySelector('.plus-change-tag').className).toContain('success');
        await fitsCanvas(canvasElement);
    },
};

/** A group shows the worst state among its children. */
export const RollUpShowsWorst = {
    name: 'A roll-up',
    render: () => staged(<RollUpCase />, ROLL_UP_STAGE),
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const group = () => canvas.getByTestId('rollup-group-status');
        await expect(group().className, 'the group shows danger, the worst of its children').toContain('danger');
        await expect(group()).toHaveTextContent('Missed');
        await userEvent.click(canvas.getByRole('button', { name: 'Resolve' }));
        await expect(group().className, 'resolving the missed child lowers the roll-up to warning').toContain('warning');
        await expect(group()).toHaveTextContent('Needs review');
        await userEvent.click(canvas.getByRole('button', { name: 'Undo' }));
        await expect(group().className).toContain('danger');
        await fitsCanvas(canvasElement);
    },
};
