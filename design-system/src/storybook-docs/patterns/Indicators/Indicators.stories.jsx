import React from 'react';
import { expect, within } from 'storybook/test';

import { fitsCanvas } from '@/storybook-docs/lib/anatomy-asserts.js';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { BesideTitle, InARow, NARROW, NotColorOnly, OnNavigation, ROLL_UP_STAGE, RollUp, STAGE, STATUSES, Tags, UpIsBad } from './indicatorsDemo.jsx';

/**
 * Indicators: the pattern page's examples, run in the Storybook tests. Each
 * composes the real Status tag, Count tag and Change tag and asserts the
 * ruling it shows: one job per tag, one status per row, a count that is quiet
 * and absent at zero, a change whose tone follows the good direction, and a
 * meaning that never rests on color alone.
 *
 * Run: npx vitest run --project=storybook design-system/src/storybook-docs/patterns/Indicators/Indicators.stories.jsx
 */
export default {
    // A test harness and the page's figures: `!dev` keeps it out of the sidebar. The page is Patterns/Indicators (Indicators.mdx).
    title: 'Patterns/Indicators/Examples',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'padded' },
};

const staged = (story, width = STAGE) => <FitStage width={width}>{story}</FitStage>;
const rect = (el) => el.getBoundingClientRect();

/** The tag element that holds a label (the nearest ancestor that carries its tone class). */
const tagOf = (el) => el.closest('.plus-status, .plus-count, .plus-change-tag, .plus-tag');

/* -------------------------------------------------------------- three tags */

/** Three jobs, three components: a state, how many, how much it moved. */
export const ThreeTags = {
    name: 'The three tags',
    render: () => staged(<Tags />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const [appearance, label] of STATUSES) {
            await expect(tagOf(canvas.getByText(label)).className, `${label} takes ${appearance}`).toContain(appearance);
        }
        await expect(canvas.getByText('4'), 'a count is the bare number').toBeInTheDocument();
        await expect(canvas.getByText('99+'), 'a count past max is capped with a plus').toBeInTheDocument();
        await expect(canvas.queryByText(/items?$/), 'a count never carries a word').toBeNull();
        await expect(canvas.getAllByText('vs last week', { exact: false })[0], 'a change names its comparison').toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/* ---------------------------------------------------------------- key cases */

/** One Status tag per row, at the default spacing, in a table cell. */
export const StatusInARow = {
    name: 'Status in a row',
    render: () => staged(<InARow />),
    play: async ({ canvasElement }) => {
        for (const row of within(canvasElement).getAllByRole('row').slice(1)) {
            await expect(row.querySelectorAll('.plus-status').length, 'one status per row').toBe(1);
            await expect(row.querySelector('.plus-status').textContent.trim().split(/\s+/).length, 'one or two words').toBeLessThanOrEqual(2);
        }
        await fitsCanvas(canvasElement);
    },
};

/** A spacious Status tag after the page title, never before it. */
export const StatusBesideHeading = {
    name: 'Status beside a heading',
    render: () => staged(<BesideTitle />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const title = canvas.getByRole('heading', { name: 'Session with Ana Ruiz' });
        const status = tagOf(canvas.getByText('Needs review'));
        await expect(rect(status).left, 'the tag follows the text').toBeGreaterThan(rect(title).right - 1);
        await expect(rect(status).height, 'spacious is taller than the 20 default').toBeGreaterThan(24);
        await fitsCanvas(canvasElement);
    },
};

/** Counts on items: quiet, one bold, nothing at zero, a cap past max. */
export const CountsOnNavigation = {
    name: 'Counts on navigation',
    render: () => staged(<OnNavigation />, NARROW),
    play: async ({ canvasElement }) => {
        const item = (name) => canvasElement.querySelector(`[data-nav-item="${name}"]`);
        await expect(within(item('Inbox')).getByText('3'), 'a quiet count').toBeInTheDocument();
        await expect(tagOf(within(item('Reflections')).getByText('5')).className, 'bold asks for action now').toContain('bold');
        await expect(item('Archive').children.length, 'nothing renders at zero').toBe(1);
        await expect(within(item('Messages')).getByText('99+'), 'capped past max').toBeInTheDocument();
        await expect(canvasElement.querySelectorAll('.plus-count--bold').length, 'at most one bold count in the area').toBe(1);
        await fitsCanvas(canvasElement);
    },
};

/** A status told apart at a glance adds a leading icon to its color. */
export const WhereColorIsNotEnough = {
    name: 'Where color is not enough',
    render: () => staged(<NotColorOnly />, NARROW),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const missed = tagOf(canvas.getByText('Missed'));
        await expect(missed.querySelector('svg, .fa-solid, [class*="icon"]'), 'the icon joins the color').not.toBeNull();
        await expect(missed.querySelector('svg, i, [class*="icon"]').getAttribute('aria-hidden'), 'the icon is decorative').toBe('true');
        await fitsCanvas(canvasElement);
    },
};

/** Absences rose by 3: the value is up, the tone is danger. */
export const ChangeWhereUpIsBad = {
    name: 'Change where up is bad',
    render: () => staged(<UpIsBad />, NARROW),
    play: async ({ canvasElement }) => {
        const tag = canvasElement.querySelector('.plus-change-tag');
        await expect(tag.textContent, 'the value is signed').toContain('+3');
        await expect(tag.className, 'up is danger when the good direction is down').toContain('danger');
        await expect(tag.textContent.includes('Up 3'), 'the words read the direction').toBe(true);
        await fitsCanvas(canvasElement);
    },
};

/** A group shows the worst state among its children. */
export const RollUpShowsWorst = {
    name: 'A roll-up',
    render: () => staged(<RollUp />, ROLL_UP_STAGE),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const group = tagOf(canvas.getAllByText('Missed')[0]);
        await expect(group.className, 'the group shows danger, the worst of its children').toContain('danger');
        await fitsCanvas(canvasElement);
    },
};
