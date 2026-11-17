import React from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { fitsCanvas } from '@/storybook-docs/lib/anatomy-asserts.js';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { FocusedType } from '@/storybook-docs/lib/focused-task.jsx';
import { expectFullScale, expectNotInert } from '@/storybook-docs/lib/live-example-asserts.js';
import { ViewBar } from '@/storybook-docs/lib/view-bar.jsx';
import {
    AreaPagePicture,
    AreaPicture,
    DrillPicture,
    OpenItemsPicture,
    PageTabsPicture,
    SIDEBAR_STAGE,
    SMALL_STAGE,
    STAGE,
    TabsUnderPicture,
    ViewsPicture,
} from './navigationDemo.jsx';

/**
 * Navigation: the pattern page's examples, run in the Storybook tests. Each is
 * drawn in the state its heading names (the selected area, the drilled-in
 * record page, the page tabs on their Sessions tab), from initial-state props,
 * and asserts the ruling it shows: the breadcrumb only after a drill-in, one
 * tab system per page, the selected area marked as the current page.
 *
 * Run: npx vitest run --project=storybook design-system/src/storybook-docs/patterns/Navigation/Navigation.stories.jsx
 */
export default {
    // A test harness and the page's figures: `!dev` keeps it out of the sidebar. The page is Patterns/Navigation (Navigation.mdx).
    title: 'Patterns/Navigation/Examples',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'padded' },
};

const staged = (story, width = STAGE) => <FitStage width={width} scrollable>{story}</FitStage>;

/* ------------------------------------------------------------------- tiers */

/** Tier 1, Areas: the Sidebar's fixed items; the selected row is marked as the current page. */
export const TierAreas = {
    name: 'Tier: Areas',
    render: () => staged(<AreaPicture label="Tier 1 — areas" />, SIDEBAR_STAGE),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const canvas = within(canvasElement);
        const sessions = canvas.getByRole('button', { name: 'Sessions' });
        const students = canvas.getByRole('button', { name: 'Students' });
        await expect(sessions, 'Sessions starts as the selected area').toHaveAttribute('aria-current', 'page');
        await userEvent.click(students);
        await expect(students, 'clicking another area moves aria-current="page"').toHaveAttribute('aria-current', 'page');
        await expect(sessions).not.toHaveAttribute('aria-current', 'page');
        await userEvent.click(sessions);
        await expect(sessions).toHaveAttribute('aria-current', 'page');
        await fitsCanvas(canvasElement);
    },
};

/** Tier 1b, Open items: records opened earlier, named by time and who. */
export const TierOpenItems = {
    name: 'Tier: Open items',
    render: () => staged(<OpenItemsPicture label="Tier 1b — open items" />, SIDEBAR_STAGE),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvasElement.textContent, 'named by time and who').toContain('4:00 PM · Ms. Ortiz');
        const firstTab = canvas.getByRole('button', { name: '4:00 PM · Ms. Ortiz' });
        await userEvent.click(firstTab);
        await expect(firstTab, 'clicking an open item marks it current').toHaveAttribute('aria-current', 'page');
        await userEvent.click(canvas.getByRole('button', { name: 'Home' }));
        await expect(canvas.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
        await fitsCanvas(canvasElement);
    },
};

/** Tier 2, Views: pill views in the view bar; one is selected. */
export const TierViews = {
    name: 'Tier: Views',
    render: () => staged(<ViewsPicture />, SMALL_STAGE),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const canvas = within(canvasElement);
        const [upcomingTab, pastTab] = canvas.getAllByRole('tab');
        await expect([upcomingTab, pastTab], 'two views').toHaveLength(2);
        await expect(upcomingTab, 'Upcoming starts selected').toHaveAttribute('aria-selected', 'true');
        await expect(canvas.getByRole('cell', { name: 'Algebra' })).toBeInTheDocument();

        await userEvent.click(pastTab);
        await expect(pastTab, 'Past selected').toHaveAttribute('aria-selected', 'true');
        await expect(canvas.queryByRole('cell', { name: 'Algebra' })).toBeNull();
        await expect(canvas.getByRole('cell', { name: 'Two-step equations' })).toBeInTheDocument();

        await userEvent.click(upcomingTab);
        await expect(upcomingTab).toHaveAttribute('aria-selected', 'true');
        await expect(canvas.getByRole('cell', { name: 'Algebra' })).toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/** Tier 2, Page tabs: views of one record at the bottom of the page header. */
export const TierPageTabs = {
    name: 'Tier: Page tabs',
    render: () => staged(<PageTabsPicture />),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const canvas = within(canvasElement);
        const overviewTab = canvas.getByRole('tab', { name: 'Overview' });
        const sessionsTab = canvas.getByRole('tab', { name: 'Sessions' });
        const notesTab = canvas.getByRole('tab', { name: 'Notes' });
        await expect(sessionsTab, 'the selected tab').toHaveAttribute('aria-selected', 'true');
        await expect(canvas.getByRole('table', { name: 'Sessions' })).toBeInTheDocument();

        await userEvent.click(overviewTab);
        await expect(overviewTab).toHaveAttribute('aria-selected', 'true');
        await expect(canvas.getByRole('heading', { name: 'Upcoming sessions' })).toBeInTheDocument();

        await userEvent.click(notesTab);
        await expect(notesTab).toHaveAttribute('aria-selected', 'true');
        await expect(canvas.getByRole('heading', { name: 'Tutor notes' })).toBeInTheDocument();

        await userEvent.click(sessionsTab);
        await expect(sessionsTab).toHaveAttribute('aria-selected', 'true');
        await expect(canvas.getByRole('table', { name: 'Sessions' })).toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/** Tier 3, Drill in: the record page, the breadcrumb above the title with parents only. */
export const TierDrill = {
    name: 'Tier: Drill in and climb out',
    render: () => staged(<DrillPicture />),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const canvas = within(canvasElement);
        const nav = canvas.getByRole('navigation', { name: 'Breadcrumb' });
        await expect(within(nav).getAllByRole('link').map((a) => a.textContent), 'parents only, each a link').toEqual(['Students']);
        await expect(nav.querySelector('[aria-current="page"]'), 'the record is plain text, the current page').toHaveTextContent('Maya Rodriguez');
        const share = canvas.getByRole('button', { name: 'Share' });
        share.focus();
        await expect(share).toHaveFocus();
        await fitsCanvas(canvasElement);
    },
};

/* --------------------------------------------------------------- key cases */

/** An area page: no breadcrumb, and the collection's Primary ends its view bar. */
export const KeyAreaPage = {
    name: 'Key case: An area page',
    render: () => staged(<AreaPagePicture />),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvas.queryByRole('navigation', { name: 'Breadcrumb' }), 'nothing to climb out of').toBeNull();
        await expect(canvas.getByRole('button', { name: 'Add student' }).closest('.plus-section-view-bar'), 'the add action is in the view bar').not.toBeNull();
        await fitsCanvas(canvasElement);
    },
};

/** One tab system: page tabs, and the Section's views as one labeled PopupSelect. */
export const KeyOneTabSystem = {
    name: 'Key case: One tab system per page',
    render: () => staged(<TabsUnderPicture />),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvas.getAllByRole('tablist'), 'one tab system: the page tabs').toHaveLength(1);
        const trigger = canvas.getByRole('button', { name: 'Status: Upcoming' });
        await expect(trigger, 'the Section picks its view from a labeled PopupSelect').toBeInTheDocument();
        await expect(canvas.getByRole('cell', { name: 'Algebra' }), 'Subject column holds subjects').toBeInTheDocument();
        await userEvent.click(trigger);
        const body = within(canvasElement.ownerDocument.body);
        await userEvent.click(await body.findByRole('option', { name: 'Past' }));
        await expect(canvas.getByRole('button', { name: 'Status: Past' })).toBeInTheDocument();
        await expect(canvas.getByRole('cell', { name: 'Two-step equations' }), 'picking Past filters rows').toBeInTheDocument();
        await userEvent.click(canvas.getByRole('tab', { name: 'Overview' }));
        await expect(canvas.getByRole('heading', { name: 'Upcoming sessions' }), 'Overview tab shows upcoming sessions').toBeInTheDocument();
        await userEvent.click(canvas.getByRole('tab', { name: 'Notes' }));
        await expect(canvas.getByRole('heading', { name: 'Tutor notes' }), 'page tabs swap Section content').toBeInTheDocument();
        await userEvent.click(canvas.getByRole('tab', { name: 'Sessions' }));
        await userEvent.click(canvas.getByRole('button', { name: 'Status: Past' }));
        await userEvent.click(await body.findByRole('option', { name: 'Upcoming' }));
        await fitsCanvas(canvasElement);
    },
};

/** A focused task: Close at the start, no breadcrumb, no Sidebar; the steps down the left from five. */
export const KeyFocusedTask = {
    name: 'Key case: A focused task',
    render: () => staged(<FocusedType />),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Close' })).toBeInTheDocument();
        await expect(canvas.queryByRole('navigation', { name: 'Breadcrumb' }), 'no breadcrumb').toBeNull();
        await expect(canvasElement.querySelector('[data-steps="down"]'), 'five steps run down the left').not.toBeNull();
        await fitsCanvas(canvasElement);
    },
};

/* ------------------------------------------------------------------- tests */

/** A view bar from a clean start, to drive its views. */
const Bar = () => <ViewBar views={['Upcoming', 'Past']} filters={null} primary={null} more={false} search={false} />;

/** Test: a view change selects the other tab, with one tab stop and the arrow keys. */
export const TestViewsSwitch = {
    name: 'Test: views switch in place',
    render: () => <Bar />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const [first, second] = canvas.getAllByRole('tab');
        await expect(first, 'the first view starts selected').toHaveAttribute('aria-selected', 'true');
        await userEvent.click(second);
        await expect(second, 'the click selects the other view').toHaveAttribute('aria-selected', 'true');
        await expect(first).toHaveAttribute('aria-selected', 'false');
        await expect(canvas.getAllByRole('tab').filter((t) => t.tabIndex === 0), 'one tab stop').toHaveLength(1);
        second.focus();
        await userEvent.keyboard('{ArrowLeft}');
        await expect(first, 'Left moves selection back').toHaveAttribute('aria-selected', 'true');
    },
};
