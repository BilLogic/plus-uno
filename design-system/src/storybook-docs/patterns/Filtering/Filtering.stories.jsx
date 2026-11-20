import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { MotionPreferenceContext } from '@/lib/motionPreference';
import { SECTION_DETAIL_FLOOR } from '@/templates';
import { FRAME_LAYOUT } from '@/templates/Frame/frameLayout';
import { fitsCanvas } from '@/storybook-docs/lib/anatomy-asserts.js';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { expectFullScale, expectNotInert } from '@/storybook-docs/lib/live-example-asserts.js';
import { settleAnimations, withReducedMotion } from '@/storybook-docs/lib/overlay-motion-plays';
import { expectSectionHeader } from '@/storybook-docs/lib/section-header-asserts.js';
import { FilteredStudents, STAGE, ViewPicker } from './filteringDemo.jsx';

/**
 * Filtering: the pattern page's examples, run in the Storybook tests. Each
 * composes the real Section, its view bar and the real menus (FilterButton,
 * Popup select, FilterMenu), and each asserts the ruling it shows: one tier
 * per bar at the bar's end, what is on shown on the control that holds it,
 * Clear in a menu and "Reset filters" everywhere else.
 *
 * Run: npx vitest run --project=storybook design-system/src/storybook-docs/patterns/Filtering/Filtering.stories.jsx
 */
export default {
    // A test harness and the page's figures: `!dev` keeps it out of the sidebar. The page is Patterns/Filtering (Filtering.mdx).
    title: 'Patterns/Filtering/Examples',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'padded' },
};

const rect = (el) => el.getBoundingClientRect();

/** The room the picture keeps inside its own clip edge, in px: `--inline-xl`. Docs geometry. */
const INSET = 16;

/**
 * A picture at `width`, with a little room inside the stage that clips it. A menu held open from the first trigger
 * hangs 15 px past that trigger's start (a 160 menu on a 145 trigger) and the layer keeps an 8 px screen gap: with
 * the Section flush to the clip edge only 15 px was there and the end alignment overflowed by 0.3 px, so Base UI
 * flipped it to the start edge. That is the settled answer, but the first measure, taken as the stage lays out,
 * sometimes still read "end", so Tier 1 passed or failed by timing. With the room, "end" fits at every measure. An
 * app's Section sits beside a Sidebar and has this room already.
 */
const staged = (story, width = STAGE) => (
    <FitStage width={width + 2 * INSET} scrollable>
        <div style={{ paddingInline: 'var(--inline-xl)' }}>{story}</div>
    </FitStage>
);

/** The picture's scale: drawn width over laid-out width. */
const scaleOf = (canvasElement) => {
    const inner = canvasElement.querySelector('[data-fit-stage]');
    return rect(inner).width / inner.offsetWidth;
};

const parts = (canvasElement) => {
    const canvas = within(canvasElement);
    const bar = canvasElement.querySelector('.plus-section-rows');
    return {
        canvas,
        bar,
        views: () => bar.querySelector('[role="tablist"]'),
        filterIcon: () => canvas.queryByRole('button', { name: /^Filters/ }),
        rows: () => bar.querySelectorAll('.plus-section-row'),
        popup: () => canvasElement.querySelector('[data-filter-stage] [role="dialog"], [data-filter-stage] .plus-popup'),
        status: () => canvasElement.querySelector('.plus-template-section-content span[role="status"]'),
    };
};

/** A held-open menu mounts in its picture, hangs 4 below its trigger and meets it on the trigger's side. */
const expectHungFrom = async (canvasElement, trigger, side) => {
    const p = parts(canvasElement);
    await waitFor(() => expect(p.popup(), 'the menu is open inside the picture').not.toBeNull());
    await waitFor(() => {
        const menu = rect(p.popup());
        const from = rect(trigger);
        const scale = scaleOf(canvasElement);
        expect((menu.top - from.bottom) / scale, 'it hangs 4 below its trigger').toBeCloseTo(4, 0);
        if (side === 'end') expect(menu.right, 'its end edge meets the trigger\'s').toBeCloseTo(from.right, 0);
        else expect(menu.left, 'its start edge meets the trigger\'s').toBeCloseTo(from.left, 0);
    });
};

/** Filters sit in the Section's third row: under the views, never among them. */
const expectInRow3 = async (canvasElement, controls) => {
    const p = parts(canvasElement);
    for (const control of controls) {
        const viewsRow = p.bar.querySelector('.plus-section-row--views');
        await expect(control.closest('.plus-section-row--filters'), 'the filters sit in the third header row').not.toBeNull();
        await expect(rect(control).top, 'under the views').toBeGreaterThanOrEqual(rect(viewsRow).bottom);
    }
};

/** The Filter icon button's count: its name reads "Filters" and, once values are on, "Filters, 2 applied". */
const expectFilterCount = async (button, count) => {
    await expect(button.getAttribute('aria-label'), 'the name, then the count once values are on').toBe(count > 0 ? `Filters, ${count} applied` : 'Filters');
};

/* ------------------------------------------------------------------ tiers */

/** Tier 1: a "Field: value" trigger per category in the Section's third row, the Grade list held open from its end edge; what is on takes the selected state. */
export const TierQuickFilters = {
    name: 'Tier 1: Quick filters',
    render: () => staged(<FilteredStudents tier="1" categories={['grade', 'school', 'subject']} initial={{ grade: ['Grade 7'] }} openMenu="grade" />),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        await expectSectionHeader(canvasElement, 2);
        const p = parts(canvasElement);
        const buttons = [['Grade', 'Grade 7'], ['School', 'All'], ['Subject', 'All']].map(([field, value]) => p.canvas.getByRole('button', { name: `${field}: ${value}` }));
        await expect(p.filterIcon(), 'one tier per bar: no Filter button beside quick filters').toBeNull();
        await expectInRow3(canvasElement, buttons);
        await expect(buttons[0], 'what is on takes the selected state').toHaveAttribute('aria-pressed', 'true');
        await expect(buttons[1], 'what is off does not').not.toHaveAttribute('aria-pressed', 'true');
        await expectHungFrom(canvasElement, buttons[0], 'end');
        await expect(within(p.popup()).queryByRole('button', { name: /Apply|Clear/ }), 'one list applies as you pick: no footer').toBeNull();
        await userEvent.click(within(p.popup()).getByRole('option', { name: 'Grade 8' }));
        await expect(p.status()).toHaveTextContent('3 of 8 students');
        await waitFor(() => expect(p.canvas.getByRole('button', { name: 'Grade: Grade 8' })).toBeInTheDocument());
        await userEvent.click(p.canvas.getByRole('button', { name: 'Reset filters' }));
        await expect(p.status()).toHaveTextContent('8 students');
        await fitsCanvas(canvasElement);
    },
};

/** Tier 2a: the Filter icon opens one list, applied as you pick. */
export const TierOneList = {
    name: 'Tier 2a: Menu, one category',
    render: () => staged(<FilteredStudents tier="2a" categories={['grade']} initial={{ grade: ['Grade 7'] }} openMenu="filters" />),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const p = parts(canvasElement);
        await expectFilterCount(p.filterIcon(), 1);
        await expect(p.canvas.queryByRole('button', { name: /^Grade/ }), 'one tier per bar: no quick filter beside the menu').toBeNull();
        await expectInRow3(canvasElement, [p.filterIcon()]);
        await expectHungFrom(canvasElement, p.filterIcon(), 'start');
        await expect(within(p.popup()).getByRole('listbox'), 'one list').toBeInTheDocument();
        await expect(within(p.popup()).queryByRole('button', { name: /Apply|Clear/ }), 'no footer').toBeNull();
        await userEvent.click(within(p.popup()).getByRole('option', { name: 'Grade 6' }));
        await expect(p.status()).toHaveTextContent('2 of 8 students');
        await fitsCanvas(canvasElement);
    },
};

/** Tier 2b: two or three short categories side by side, Clear and Apply at the end. */
export const TierSideBySide = {
    name: 'Tier 2b: Menu, side by side',
    render: () => staged(<FilteredStudents tier="2b" categories={['grade', 'school']} initial={{ grade: ['Grade 7'], school: ['Lincoln Middle'] }} openMenu="filters" />),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const p = parts(canvasElement);
        await expectFilterCount(p.filterIcon(), 2);
        await expectInRow3(canvasElement, [p.filterIcon()]);
        await expectHungFrom(canvasElement, p.filterIcon(), 'start');
        const menu = within(p.popup());
        await expect(p.popup().closest('.plus-filter-menu') ?? p.popup().querySelector('.plus-filter-menu') ?? p.popup(), 'side by side').toHaveClass('plus-filter-menu--side-by-side');
        await expect(menu.getByRole('button', { name: 'Clear' }), 'a menu says Clear').toBeInTheDocument();
        await expect(menu.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
        await expect(menu.queryByRole('button', { name: 'Reset filters' }), 'never "Reset filters" in a menu').toBeNull();
        await userEvent.click(menu.getByRole('checkbox', { name: 'Grade 8' }));
        await userEvent.click(menu.getByRole('button', { name: 'Apply' }));
        await waitFor(() => expectFilterCount(p.filterIcon(), 3));
        await fitsCanvas(canvasElement);
    },
};

/** Tier 2c: four or more categories, or long lists, stacked. */
export const TierStacked = {
    name: 'Tier 2c: Menu, stacked',
    render: () => staged(<FilteredStudents tier="2c" categories={['grade', 'school', 'subject', 'tutor']} initial={{ subject: ['Math'] }} openMenu="filters" />),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const p = parts(canvasElement);
        await expectFilterCount(p.filterIcon(), 1);
        await expectInRow3(canvasElement, [p.filterIcon()]);
        await expectHungFrom(canvasElement, p.filterIcon(), 'start');
        await expect(p.popup().closest('.plus-filter-menu') ?? p.popup().querySelector('.plus-filter-menu') ?? p.popup(), 'stacked').toHaveClass('plus-filter-menu--stacked');
        await expect(within(p.popup()).getAllByRole('group'), 'one group per category').toHaveLength(4);
        await userEvent.click(within(p.popup()).getByRole('checkbox', { name: 'Grade 7' }));
        await userEvent.click(within(p.popup()).getByRole('button', { name: 'Apply' }));
        await waitFor(() => expectFilterCount(p.filterIcon(), 2));
        await fitsCanvas(canvasElement);
    },
};

/** Tier 3: filtering is the main job, so the filters take a side at the Section's start. */
export const TierFilterSide = {
    name: 'Tier 3: Filter side',
    render: () => staged(<FilteredStudents tier="3" categories={['grade', 'subject']} initial={{ grade: ['Grade 7'] }} />),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const p = parts(canvasElement);
        const side = p.canvas.getByRole('region', { name: 'Filters' });
        await expect(p.filterIcon(), 'no Filter icon in the bar while the side shows').toBeNull();
        const reset = within(side).getByRole('button', { name: 'Reset filters' });
        const first = within(side).getAllByRole('group')[0];
        await expect(rect(reset).bottom, '"Reset filters" at the side\'s top').toBeLessThanOrEqual(rect(first).top);
        await expect(rect(side).right, 'the side sits at the Section\'s start').toBeLessThan(rect(p.canvas.getByRole('table')).left);
        await expect(first, 'a count beside each category').toHaveTextContent('1');
        await userEvent.click(within(side).getByRole('checkbox', { name: 'Math' }));
        await expect(p.status()).toHaveTextContent('2 of 8 students');
        await fitsCanvas(canvasElement);
    },
};

/* ----------------------------------------------------------- what is on */

/**
 * The Filter icon's count, live: tick, Apply, and the count lands on the
 * icon's selected fill; the result count narrows in a polite live region.
 */
export const FilterCount = {
    name: 'The Filter icon\'s count',
    render: () => staged(<FilteredStudents tier="2b" categories={['grade', 'school']} />),
    play: async ({ canvasElement, step }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const p = parts(canvasElement);
        const menu = () => within(p.popup());
        // The filters wait for the picture's element, so a menu the press opens mounts inside it.
        await waitFor(() => expect(p.filterIcon()).not.toBeNull());

        await step('With nothing on, the icon is named "Filters" and shows no count', async () => {
            await expectFilterCount(p.filterIcon(), 0);
            await expect(p.status()).toHaveTextContent('8 students');
        });

        await step('Ticking changes the menu, not the rows', async () => {
            await userEvent.click(p.filterIcon());
            await waitFor(() => expect(p.popup()).not.toBeNull());
            await userEvent.click(menu().getByRole('checkbox', { name: 'Grade 7' }));
            await userEvent.click(menu().getByRole('checkbox', { name: 'Lincoln Middle' }));
            await expect(p.status(), 'nothing applies before Apply').toHaveTextContent('8 students');
        });

        await step('Apply puts the count on the icon and reads "Filters, 2 applied"', async () => {
            await userEvent.click(menu().getByRole('button', { name: 'Apply' }));
            await waitFor(() => expectFilterCount(p.filterIcon(), 2));
            await expect(p.filterIcon(), 'what is on takes the selected fill').toHaveClass('plus-btn--selected');
            await waitFor(() => expect(p.filterIcon(), 'focus returns to the trigger').toHaveFocus());
        });

        await step('The result count narrows in words, announced politely', async () => {
            const status = p.status();
            await expect(status).toHaveTextContent('1 of 8 students');
            await expect(status.getAttribute('aria-live') ?? 'polite', 'a polite live region').toBe('polite');
            await expect(p.canvas.getAllByRole('row'), 'the header row and the one match').toHaveLength(2);
        });

        await step('No row of tags repeats what is on', async () => {
            await expect(canvasElement.querySelector('.plus-template-section-content .plus-tag, .plus-tag-group'), 'no tags under the header').toBeNull();
        });

        await step('Clear clears the menu; Apply clears the count', async () => {
            await userEvent.click(p.filterIcon());
            await waitFor(() => expect(p.popup()).not.toBeNull());
            await userEvent.click(menu().getByRole('button', { name: 'Clear' }));
            await expectFilterCount(p.filterIcon(), 2);
            await userEvent.click(menu().getByRole('button', { name: 'Apply' }));
            await waitFor(() => expectFilterCount(p.filterIcon(), 0));
            await expect(p.status()).toHaveTextContent('8 students');
        });
    },
};

/* -------------------------------------------------------------- key cases */

/** The Section's width, as a control: below 768 the triggers fold into one Filter button that opens the filters. */
export const NarrowWidth = {
    name: 'Width behavior',
    args: { width: STAGE },
    parameters: { controls: { include: ['width'] } },
    argTypes: {
        width: { control: { type: 'range', min: 600, max: 1280, step: 8 }, description: 'The Section\'s own width, in px.', table: { category: 'Docs' } },
    },
    render: ({ width }) => staged(<FilteredStudents tier="1" categories={['grade', 'school', 'subject']} initial={{ grade: ['Grade 7'], subject: ['Math'] }} />, width),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const p = parts(canvasElement);
        const stage = canvasElement.querySelector('[data-fit-stage]');
        const setWidth = (px) => { stage.style.inlineSize = `${px}px`; };
        const quick = () => p.canvas.queryByRole('button', { name: /^Grade:/ });

        await waitFor(() => expect(quick(), 'from 768, a trigger per category').not.toBeNull());
        await expect(p.filterIcon()).toBeNull();

        setWidth(FRAME_LAYOUT.fullWidthBelow - 64);
        await waitFor(() => expect(quick(), 'below 768 the triggers fold').toBeNull());
        const filter = await p.canvas.findByRole('button', { name: /^Filter/ });
        await expect(filter, 'into one Filter button, which carries their count').toHaveTextContent('2');
        await userEvent.click(filter);
        await expect(p.canvas.getByRole('region', { name: 'Filters' }), 'it opens the filters').toBeInTheDocument();

        setWidth(SECTION_DETAIL_FLOOR + 64);
        await waitFor(() => expect(quick(), 'back to quick filters').not.toBeNull());
    },
};

/** No matches: the empty state replaces the table and offers "Reset filters"; the count stays on the icon until then. */
export const NoMatches = {
    name: 'No matches',
    render: () => staged(<FilteredStudents tier="2b" categories={['grade', 'subject']} initial={{ grade: ['Grade 6'], subject: ['Math'] }} />),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const p = parts(canvasElement);
        await waitFor(() => expect(p.filterIcon()).not.toBeNull());
        await expect(p.canvas.queryByRole('table'), 'the empty state replaces the whole table').toBeNull();
        await expect(p.canvas.getByText(/Grade 6 and Math/), 'it names the filters that are on').toBeInTheDocument();
        await expectFilterCount(p.filterIcon(), 2);
        await expect(p.canvas.getAllByRole('button', { name: 'Reset filters' }), 'one Reset filters: the empty state offers it, the header hides its own').toHaveLength(1);
        await userEvent.click(p.canvas.getByRole('button', { name: 'Reset filters' }));
        await waitFor(() => expect(p.canvas.getByRole('table')).toBeInTheDocument());
        await expectFilterCount(p.filterIcon(), 0);
        await expect(p.status()).toHaveTextContent('8 students');
        await fitsCanvas(canvasElement);
    },
};

/** Under page tabs: the view picker at the bar's start picks a view; the filters stay at its end. */
export const UnderPageTabs = {
    name: 'Under page tabs',
    render: () => staged(
        <FilteredStudents
            tier="2b"
            categories={['grade', 'school']}
            initial={{ grade: ['Grade 7'] }}
            openMenu="view"
            pageTabs
            start={(mount, { activeView, onViewChange, open, onOpenChange }) => (
                <ViewPicker open={open} onOpenChange={onOpenChange} mount={mount} value={activeView} onChange={onViewChange} />
            )}
        />,
    ),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const p = parts(canvasElement);
        const picker = p.canvas.getByRole('button', { name: /^View/ });
        await expect(rect(picker).left, 'the view picker sits at the bar\'s start').toBeCloseTo(rect(p.bar).left, 0);
        await expectInRow3(canvasElement, [p.filterIcon()]);
        await expectHungFrom(canvasElement, picker, 'start');

        await expect(p.status()).toHaveTextContent('3 of 8 students');
        await expect(p.canvas.getByRole('cell', { name: 'Ava Thompson' })).toBeInTheDocument();
        await userEvent.click(within(p.popup()).getByRole('option', { name: 'Needs follow-up' }));
        await expect(p.canvas.getByRole('button', { name: 'View: Needs follow-up' })).toBeInTheDocument();
        await expect(p.status()).toHaveTextContent('1 of 8 students');
        await expect(p.canvas.queryByRole('cell', { name: 'Ava Thompson' })).toBeNull();
        await expect(p.canvas.getByRole('cell', { name: 'Sofia Ramirez' })).toBeInTheDocument();

        await userEvent.click(p.canvas.getByRole('button', { name: 'View: Needs follow-up' }));
        await waitFor(() => expect(p.popup()).not.toBeNull());
        await userEvent.click(within(p.popup()).getByRole('option', { name: 'All students' }));
        await expect(p.status()).toHaveTextContent('3 of 8 students');

        await userEvent.click(p.canvas.getByRole('tab', { name: 'Overview' }));
        await expect(p.canvas.getByRole('heading', { name: 'Lincoln Middle' })).toBeInTheDocument();

        await userEvent.click(p.canvas.getByRole('tab', { name: 'Sessions' }));
        await expect(p.canvas.getByRole('table', { name: 'Sessions' })).toBeInTheDocument();

        await userEvent.click(p.canvas.getByRole('tab', { name: 'Students' }));
        await expect(p.canvas.getByRole('heading', { name: 'Students' })).toBeInTheDocument();
        await fitsCanvas(canvasElement);
    },
};

/* ------------------------------------------------------------------- motion */

const withProductiveMotion = (Story) => (
    <MotionPreferenceContext.Provider value={false}>
        <Story />
    </MotionPreferenceContext.Provider>
);

const playSwapResults = (reduced = false) => async ({ canvasElement }) => {
    await settleAnimations(canvasElement);
    const p = parts(canvasElement);
    await waitFor(() => expect(p.filterIcon()).not.toBeNull());

    const swapStage = canvasElement.querySelector('[data-swap-stage]');
    await expect(swapStage, 'filtering results sit inside SwapInPlace').not.toBeNull();
    await expect(swapStage).toHaveAttribute('data-swap-phase', 'settled');
    await expect(swapStage).toHaveAttribute('data-reduced', reduced ? 'true' : 'false');

    // Apply a filter: old rows fade out on appearance.fast before new rows fade in after CLEAN_FADE_GAP_MS.
    await userEvent.click(p.filterIcon());
    await waitFor(() => expect(p.popup()).not.toBeNull());
    await userEvent.click(within(p.popup()).getByRole('checkbox', { name: 'Grade 7' }));

    const phases = [];
    let incomingOpacityDuringOut = null;
    const observer = new MutationObserver(() => {
        const phase = swapStage.getAttribute('data-swap-phase');
        if (phase != null) phases.push(phase);
        if (phase === 'out' && incomingOpacityDuringOut == null) {
            const incomingEl = swapStage.querySelector('[data-swap-incoming]');
            if (incomingEl) incomingOpacityDuringOut = getComputedStyle(incomingEl).opacity;
        }
    });
    observer.observe(swapStage, { attributes: true, attributeFilter: ['data-swap-phase'] });

    try {
        await userEvent.click(within(p.popup()).getByRole('button', { name: 'Apply' }));
        await waitFor(() => expect(swapStage).toHaveAttribute('data-swap-phase', 'settled'), { timeout: 4000 });
    } finally {
        observer.disconnect();
    }

    await expect(phases[0], 'clean-fade swap enters out phase first').toBe('out');
    await expect(phases.indexOf('in'), 'clean-fade swap enters in phase after out').toBeGreaterThan(phases.indexOf('out'));
    await expect(incomingOpacityDuringOut, 'incoming results hold hidden during clean-fade gap').toBe('0');

    await settleAnimations(canvasElement);
    const incoming = swapStage.querySelector('[data-swap-incoming]');
    await expect(p.status()).toHaveTextContent('3 of 8 students');
    await expect(getComputedStyle(incoming).opacity).toBe('1');
};

export const MotionSwapResults = {
    name: 'Motion: Swap content in place',
    decorators: [withProductiveMotion],
    render: () => staged(<FilteredStudents tier="2b" categories={['grade', 'school']} />),
    play: playSwapResults(false),
};

export const MotionSwapResultsReduced = {
    name: 'Motion: Swap content in place (reduced)',
    decorators: [withReducedMotion],
    render: () => staged(<FilteredStudents tier="2b" categories={['grade', 'school']} />),
    play: playSwapResults(true),
};

