import React from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { fitsCanvas } from '@/storybook-docs/lib/anatomy-asserts.js';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import {
    BesideTitle,
    CHECKLIST_FRAME_STAGE,
    ChecklistInPage,
    ChecklistInSidebar,
    ChecklistOnHome,
    InARow,
    NARROW,
    NotColorOnly,
    OnNavigation,
    ROLL_UP_STAGE,
    RollUp,
    STAGE,
    STATUSES,
    Tags,
    UpIsBad,
} from './indicatorsDemo.jsx';

/**
 * Indicators: the pattern page's examples, run in the Storybook tests. Each
 * composes the real Status tag, Count tag, Change tag, ProgressBar, PatternCard
 * and PatternSection and asserts the ruling it shows: one job per tag, one
 * status per row, a count that is quiet and absent at zero, a change whose
 * tone follows the good direction, a meaning that never rests on color alone,
 * and the checklist in its three layouts.
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

/* --------------------------------------------------------------- checklist */

/**
 * Checklist — card on Home: dismissible setup list inside PatternSection and
 * PatternCard. The ProgressBar is 96 wide beside the 32 dismiss X, aligned to
 * the 128 action column; completing all steps shrinks the card to one line,
 * and pressing X dismisses it.
 */
export const ChecklistCardOnHome = {
    name: 'Checklist: card on Home',
    render: () => staged(<ChecklistOnHome />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const card = canvasElement.querySelector('.plus-pattern-card');
        await expect(canvasElement.querySelector('.plus-pattern-section'), 'hosted in PatternSection').not.toBeNull();

        const title = within(card).getByRole('heading', { name: 'Get ready for your first session' });
        const count = within(card).getByText('2 of 5 done');
        const barWrap = card.querySelector('[data-checklist-bar]');
        const dismissBtn = within(card).getByRole('button', { name: 'Dismiss checklist' });
        const actionCols = [...card.querySelectorAll('[data-checklist-action]')];

        await expect(rect(title).right, 'title sits at the start before the count').toBeLessThanOrEqual(rect(count).left);
        await expect(barWrap.offsetWidth, 'ProgressBar is 96 wide when X takes the last 32').toBe(96);
        await expect(dismissBtn.offsetWidth, 'dismiss IconButton X takes the last 32').toBe(32);
        await expect(actionCols[0].offsetWidth, 'action column is 128 wide').toBe(128);
        await expect(
            Math.abs(rect(barWrap).left - rect(actionCols[0]).left),
            'ProgressBar left edge sits on the action column left edge'
        ).toBeLessThan(1.5);

        const openBtns = actionCols.slice(0, 3).map((col) => within(col).getByRole('button'));
        for (const btn of openBtns) {
            await expect(btn.offsetWidth, 'every step button fills the 128 action column').toBe(128);
            await expect(Math.abs(rect(btn).left - rect(openBtns[0]).left), 'button starts line up').toBeLessThan(1.5);
            await expect(Math.abs(rect(btn).right - rect(openBtns[0]).right), 'button ends line up').toBeLessThan(1.5);
        }

        for (const doneCol of actionCols.slice(3)) {
            await expect(within(doneCol).queryByRole('button'), 'done step renders text, never a button').toBeNull();
            const completed = doneCol.querySelector('[data-checklist-completed]');
            await expect(completed.textContent).toContain('Completed');
            const leftPad = rect(completed).left - rect(doneCol).left;
            const rightPad = rect(doneCol).right - rect(completed).right;
            await expect(Math.abs(leftPad - rightPad), 'Completed is centered in the 128 action column').toBeLessThan(2);
        }

        await fitsCanvas(canvasElement);

        // Complete all open steps -> shrinks to one line; then dismiss via X.
        await userEvent.click(within(card).getByRole('button', { name: 'Connect' }));
        await userEvent.click(within(card).getByRole('button', { name: 'Upload file' }));
        await userEvent.click(within(card).getByRole('button', { name: 'Start check-in' }));

        await expect(canvas.getByText(/All 5 steps completed/)).toBeInTheDocument();
        await expect(canvasElement.querySelectorAll('[data-checklist-step]').length, 'shrinks to one line').toBe(0);

        await userEvent.click(canvas.getByRole('button', { name: 'Dismiss checklist' }));
        await expect(canvas.queryByText(/All 5 steps completed/)).toBeNull();
    },
};

/** Dismissing an optional Home checklist directly from its header X hides the card. */
export const ChecklistDismiss = {
    name: 'Checklist: dismiss',
    render: () => staged(<ChecklistOnHome />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('heading', { name: 'Get ready for your first session' })).toBeInTheDocument();
        await userEvent.click(canvas.getByRole('button', { name: 'Dismiss checklist' }));
        await expect(canvas.queryByRole('heading', { name: 'Get ready for your first session' })).toBeNull();
    },
};

/**
 * Checklist — card in a page: persistent compliance list with no X. The
 * ProgressBar fills the full 128 action column, and completing every step
 * keeps the card on screen with all five steps ticked.
 */
export const ChecklistCardInPage = {
    name: 'Checklist: card in a page',
    render: () => staged(<ChecklistInPage />),
    play: async ({ canvasElement }) => {
        const card = canvasElement.querySelector('.plus-pattern-card');
        const barWrap = card.querySelector('[data-checklist-bar]');
        const actionCols = [...card.querySelectorAll('[data-checklist-action]')];

        await expect(within(card).queryByRole('button', { name: /dismiss/i }), 'persistent checklist has no X').toBeNull();
        await expect(barWrap.offsetWidth, 'ProgressBar is 128 wide with no X').toBe(128);
        await expect(actionCols[0].offsetWidth, 'action column is 128 wide').toBe(128);
        await expect(
            Math.abs(rect(barWrap).left - rect(actionCols[0]).left),
            'ProgressBar left edge sits on the action column left edge'
        ).toBeLessThan(1.5);

        await fitsCanvas(canvasElement);

        await userEvent.click(within(card).getByRole('button', { name: 'Start module' }));
        await userEvent.click(within(card).getByRole('button', { name: 'Take quiz' }));
        await userEvent.click(within(card).getByRole('button', { name: 'Acknowledge' }));

        await expect(within(card).getByText('5 of 5 done')).toBeInTheDocument();
        await expect(card.querySelectorAll('[data-checklist-step]').length, 'persistent checklist stays with all steps ticked').toBe(5);
        await expect(within(card).getAllByText('Completed').length).toBe(5);
    },
};

/**
 * Checklist — compact in the sidebar: sits at the foot of the Sidebar showing
 * the count, ProgressBar and next step, and opens the full checklist on press.
 */
export const ChecklistCompactInSidebar = {
    name: 'Checklist: compact in the sidebar',
    render: () => staged(<ChecklistInSidebar />, CHECKLIST_FRAME_STAGE),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const foot = canvasElement.querySelector('[data-checklist-sidebar-foot]');
        await expect(foot, 'compact checklist sits at the foot of the sidebar').not.toBeNull();
        await expect(within(foot).getByText('2 of 5 done')).toBeInTheDocument();
        await expect(within(foot).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');

        const nextBtn = within(foot).getByRole('button', { name: 'Connect your calendar' });
        await fitsCanvas(canvasElement);

        await userEvent.click(nextBtn);
        await expect(canvas.getByRole('heading', { name: 'Get ready for your first session' })).toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};
