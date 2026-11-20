import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { fitsCanvas } from '@/storybook-docs/lib/anatomy-asserts.js';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { expectFullScale, expectNotInert } from '@/storybook-docs/lib/live-example-asserts.js';
import { CHECKLIST_FRAME_STAGE, ChecklistInPage, ChecklistInSidebar, ChecklistOnHome } from './checklistDemo.jsx';

/**
 * The checklist: the Page docs' examples, run in the Storybook tests. Each
 * composes the real Card, Section and ProgressBar and asserts the ruling it
 * shows: one 128 action column, open steps above done steps, a dismissible
 * card on Home, a persistent card in a page and a compact card at the foot of
 * the Sidebar.
 *
 * Run: npx vitest run --project=storybook design-system/src/templates/Page/Checklist.stories.jsx
 */
export default {
    title: 'Templates/Page/Checklist',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'padded' },
};

/** The width a picture lays out at, in px: docs geometry. */
const STAGE = 640; // docs-literal

const staged = (story, width = STAGE) => <FitStage width={width} scrollable>{story}</FitStage>;
const rect = (el) => el.getBoundingClientRect();

/**
 * Checklist — card on Home: dismissible setup list inside Section and
 * Card. The ProgressBar is 96 wide beside the 32 dismiss X, aligned to
 * the 128 action column; completing all steps shrinks the card to one line,
 * and pressing X dismisses it.
 */
export const ChecklistCardOnHome = {
    name: 'Checklist: card on Home',
    render: () => staged(<ChecklistOnHome />),
    play: async ({ canvas, canvasElement }) => {
        const card = canvasElement.querySelector('.plus-template-card');
        await expect(canvasElement.querySelector('.plus-template-section'), 'hosted in Section').not.toBeNull();

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

/** Dismissing an optional Home-page checklist directly from its header X hides the card. */
export const ChecklistDismiss = {
    name: 'Checklist: dismiss',
    render: () => staged(<ChecklistOnHome />),
    play: async ({ canvas, canvasElement }) => {
        await expect(canvas.getByRole('heading', { name: 'Get ready for your first session' })).toBeInTheDocument();
        await userEvent.click(canvas.getByRole('button', { name: 'Dismiss checklist' }));
        await expect(canvas.queryByRole('heading', { name: 'Get ready for your first session' })).toBeNull();
        await fitsCanvas(canvasElement);
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
        const card = canvasElement.querySelector('.plus-template-card');
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
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const foot = canvasElement.querySelector('[data-checklist-sidebar-foot]');
        await expect(foot, 'compact checklist sits at the foot of the sidebar').not.toBeNull();
        await expect(within(foot).getByText('2 of 5 done')).toBeInTheDocument();
        await expect(within(foot).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');

        const nextBtn = within(foot).getByRole('button', { name: 'Connect your calendar' });
        await fitsCanvas(canvasElement);

        await userEvent.click(nextBtn);
        // Move the pointer off the row and wait for the Sidebar selection glide from
        // Sessions to Home to finish so axe does not sample the mid-flight pill behind Toolkit.
        await userEvent.unhover(nextBtn);
        await expect(canvas.getByRole('heading', { name: 'Get ready for your first session' })).toBeInTheDocument();
        await waitFor(() => expect(canvasElement.querySelector('[data-gliding]')).toBeNull());
        await fitsCanvas(canvasElement);
    },
};
