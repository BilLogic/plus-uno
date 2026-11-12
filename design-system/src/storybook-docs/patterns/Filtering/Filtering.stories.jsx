import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { SECTION_DETAIL_FLOOR } from '@/patterns';
import { FRAME_LAYOUT } from '@/patterns/Frame/frameLayout';
import { fitsCanvas } from '@/storybook-docs/lib/anatomy-asserts.js';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { FilteredStudents, PageTabs, STAGE, ViewPicker } from './filteringDemo.jsx';

/**
 * Filtering: the pattern page's examples, run in the Storybook tests. Each
 * composes the real Section, its view bar and the real menus (FilterButton,
 * Popup select, FilterMenu), and each asserts the ruling it shows: one tier
 * per bar at the bar's end, what is on shown on the control that holds it,
 * Reset in a menu and "Reset filters" everywhere else.
 *
 * Run: npx vitest run --project=storybook design-system/src/storybook-docs/patterns/Filtering/Filtering.stories.jsx
 */
export default {
    // A test harness and the page's figures: `!dev` keeps it out of the sidebar. The page is Patterns/Finding things/Filtering (Filtering.mdx).
    title: 'Patterns/Finding things/Filtering/Examples',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'padded' },
};

const rect = (el) => el.getBoundingClientRect();
const staged = (story, width = STAGE) => <FitStage width={width}>{story}</FitStage>;

/** The picture's scale: drawn width over laid-out width. */
const scaleOf = (canvasElement) => {
    const inner = canvasElement.querySelector('[data-fit-stage] > div');
    return rect(inner).width / inner.offsetWidth;
};

const parts = (canvasElement) => {
    const canvas = within(canvasElement);
    const bar = canvasElement.querySelector('.plus-section-view-bar');
    return {
        canvas,
        bar,
        views: () => bar.querySelector('[role="tablist"]'),
        filterIcon: () => canvas.queryByRole('button', { name: /^Filters/ }),
        popup: () => canvasElement.querySelector('[data-filter-stage] [role="dialog"], [data-filter-stage] .plus-popup'),
        status: () => canvas.getByRole('status'),
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

/** Filters sit at the bar's end: after the views, never among them. */
const expectAtEnd = async (canvasElement, controls) => {
    const p = parts(canvasElement);
    const views = rect(p.views());
    for (const control of controls) {
        await expect(rect(control).left, 'the filters sit at the end of the bar, after the views').toBeGreaterThan(views.right);
    }
};

/* ------------------------------------------------------------------ tiers */

/** Tier 1: a FilterButton per category, the Grade list open at the bar's end. */
export const TierQuickFilters = {
    name: 'Tier 1: Quick filters',
    render: () => staged(<FilteredStudents tier="1" categories={['grade', 'school', 'subject']} initial={{ grade: ['Grade 7'] }} openMenu="grade" />),
    play: async ({ canvasElement }) => {
        const p = parts(canvasElement);
        const buttons = ['Grade', 'School', 'Subject'].map((name) => p.canvas.getByRole('button', { name: new RegExp(`^${name}`) }));
        await expect(p.filterIcon(), 'one tier per bar: no Filter icon beside quick filters').toBeNull();
        await expectAtEnd(canvasElement, buttons);
        await expect(buttons[0], 'what is on shows on the button: its count').toHaveTextContent('1');
        await expectHungFrom(canvasElement, buttons[0], 'end');
        await expect(within(p.popup()).queryByRole('button', { name: /Apply|Reset/ }), 'one list applies as you pick: no footer').toBeNull();
        await fitsCanvas(canvasElement);
    },
};

/** Tier 2a: the Filter icon opens one list, applied as you pick. */
export const TierOneList = {
    name: 'Tier 2a: Menu, one category',
    render: () => staged(<FilteredStudents tier="2a" categories={['grade']} initial={{ grade: ['Grade 7'] }} openMenu="filters" />),
    play: async ({ canvasElement }) => {
        const p = parts(canvasElement);
        await expect(p.filterIcon(), 'the Filter icon reads its count').toHaveAccessibleName('Filters, 1 applied');
        await expect(p.canvas.queryByRole('button', { name: /^Grade/ }), 'one tier per bar: no quick filter beside the menu').toBeNull();
        await expectAtEnd(canvasElement, [p.filterIcon()]);
        await expectHungFrom(canvasElement, p.filterIcon(), 'end');
        await expect(within(p.popup()).getByRole('listbox'), 'one list').toBeInTheDocument();
        await expect(within(p.popup()).queryByRole('button', { name: /Apply|Reset/ }), 'no footer').toBeNull();
        await fitsCanvas(canvasElement);
    },
};

/** Tier 2b: two or three short categories side by side, Reset and Apply full bleed. */
export const TierSideBySide = {
    name: 'Tier 2b: Menu, side by side',
    render: () => staged(<FilteredStudents tier="2b" categories={['grade', 'school']} initial={{ grade: ['Grade 7'], school: ['Lincoln Middle'] }} openMenu="filters" />),
    play: async ({ canvasElement }) => {
        const p = parts(canvasElement);
        await expect(p.filterIcon()).toHaveAccessibleName('Filters, 2 applied');
        await expectHungFrom(canvasElement, p.filterIcon(), 'end');
        const menu = within(p.popup());
        await expect(p.popup().closest('.plus-filter-menu') ?? p.popup().querySelector('.plus-filter-menu') ?? p.popup(), 'side by side').toHaveClass('plus-filter-menu--side-by-side');
        await expect(menu.getByRole('button', { name: 'Reset' }), 'a menu says Reset').toBeInTheDocument();
        await expect(menu.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
        await expect(menu.queryByRole('button', { name: 'Reset filters' }), 'never "Reset filters" in a menu').toBeNull();
        await fitsCanvas(canvasElement);
    },
};

/** Tier 2c: four or more categories, or long lists, stacked. */
export const TierStacked = {
    name: 'Tier 2c: Menu, stacked',
    render: () => staged(<FilteredStudents tier="2c" categories={['grade', 'school', 'subject', 'tutor']} initial={{ subject: ['Math'] }} openMenu="filters" />),
    play: async ({ canvasElement }) => {
        const p = parts(canvasElement);
        await expect(p.filterIcon()).toHaveAccessibleName('Filters, 1 applied');
        await expectHungFrom(canvasElement, p.filterIcon(), 'end');
        await expect(p.popup().closest('.plus-filter-menu') ?? p.popup().querySelector('.plus-filter-menu') ?? p.popup(), 'stacked').toHaveClass('plus-filter-menu--stacked');
        await expect(within(p.popup()).getAllByRole('group'), 'one group per category').toHaveLength(4);
        await fitsCanvas(canvasElement);
    },
};

/** Tier 3: filtering is the main job, so the filters take a side at the Section's start. */
export const TierFilterSide = {
    name: 'Tier 3: Filter side',
    render: () => staged(<FilteredStudents tier="3" categories={['grade', 'subject']} initial={{ grade: ['Grade 7'] }} />),
    play: async ({ canvasElement }) => {
        const p = parts(canvasElement);
        const side = p.canvas.getByRole('region', { name: 'Filters' });
        await expect(p.filterIcon(), 'no Filter icon in the bar while the side shows').toBeNull();
        const reset = within(side).getByRole('button', { name: 'Reset filters' });
        const first = within(side).getAllByRole('group')[0];
        await expect(rect(reset).bottom, '"Reset filters" at the side\'s top').toBeLessThanOrEqual(rect(first).top);
        await expect(rect(side).right, 'the side sits at the Section\'s start').toBeLessThan(rect(p.canvas.getByRole('table')).left);
        await expect(first, 'a count beside each category').toHaveTextContent('1');
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
        const p = parts(canvasElement);
        const menu = () => within(p.popup());

        await step('With nothing on, the icon is named "Filters" and shows no count', async () => {
            await expect(p.filterIcon()).toHaveAccessibleName('Filters');
            await expect(p.filterIcon()).not.toHaveClass('plus-icon-btn--metric');
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
            await waitFor(() => expect(p.filterIcon()).toHaveAccessibleName('Filters, 2 applied'));
            await expect(p.filterIcon(), 'the button widens for its count').toHaveClass('plus-icon-btn--metric');
            await expect(p.filterIcon()).toHaveTextContent('2');
            await waitFor(() => expect(p.filterIcon(), 'focus returns to the trigger').toHaveFocus());
        });

        await step('The result count narrows in words, announced politely', async () => {
            const status = p.status();
            await expect(status).toHaveTextContent('1 of 8 students');
            await expect(status.getAttribute('aria-live') ?? 'polite', 'a polite live region').toBe('polite');
            await expect(p.canvas.getAllByRole('row'), 'the header row and the one match').toHaveLength(2);
        });

        await step('No chip row repeats what is on', async () => {
            await expect(canvasElement.querySelector('.plus-section-view-bar ~ * .plus-tag, .plus-tag-group'), 'no chips under the bar').toBeNull();
        });

        await step('Reset clears the menu; Apply clears the count', async () => {
            await userEvent.click(p.filterIcon());
            await waitFor(() => expect(p.popup()).not.toBeNull());
            await userEvent.click(menu().getByRole('button', { name: 'Reset' }));
            await expect(p.filterIcon(), 'Reset applies nothing yet').toHaveAccessibleName('Filters, 2 applied');
            await userEvent.click(menu().getByRole('button', { name: 'Apply' }));
            await waitFor(() => expect(p.filterIcon()).toHaveAccessibleName('Filters'));
            await expect(p.status()).toHaveTextContent('8 students');
        });
    },
};

/* -------------------------------------------------------------- key cases */

/** The Section's width, as a control: below 768 quick filters fold into a stacked menu behind the Filter icon. */
export const NarrowWidth = {
    name: 'Width behavior',
    args: { width: STAGE },
    parameters: { controls: { include: ['width'] } },
    argTypes: {
        width: { control: { type: 'range', min: 600, max: 1280, step: 8 }, description: 'The Section\'s own width, in px.', table: { category: 'Docs' } },
    },
    render: ({ width }) => staged(<FilteredStudents tier="1" categories={['grade', 'school', 'subject']} initial={{ grade: ['Grade 7'], subject: ['Math'] }} />, width),
    play: async ({ canvasElement }) => {
        const p = parts(canvasElement);
        const stage = canvasElement.querySelector('[data-fit-stage] > div');
        const setWidth = (px) => { stage.style.inlineSize = `${px}px`; };
        const quick = () => p.canvas.queryByRole('button', { name: /^Grade/ });

        await waitFor(() => expect(quick(), 'from 768, a FilterButton per category').not.toBeNull());
        await expect(p.filterIcon()).toBeNull();

        setWidth(FRAME_LAYOUT.fullWidthBelow - 64);
        await waitFor(() => expect(quick(), 'below 768 the quick filters fold').toBeNull());
        await expect(p.filterIcon(), 'into the Filter icon, which carries their count').toHaveAccessibleName('Filters, 2 applied');
        await userEvent.click(p.filterIcon());
        await waitFor(() => expect(p.popup()).not.toBeNull());
        await expect(p.popup().closest('.plus-filter-menu') ?? p.popup().querySelector('.plus-filter-menu') ?? p.popup(), 'a stacked menu').toHaveClass('plus-filter-menu--stacked');
        await userEvent.keyboard('{Escape}');

        setWidth(SECTION_DETAIL_FLOOR + 64);
        await waitFor(() => expect(quick(), 'back to quick filters').not.toBeNull());
    },
};

/** No matches: the empty state replaces the table and offers "Reset filters"; the count stays on the icon until then. */
export const NoMatches = {
    name: 'No matches',
    render: () => staged(<FilteredStudents tier="2b" categories={['grade', 'subject']} initial={{ grade: ['Grade 6'], subject: ['Math'] }} />),
    play: async ({ canvasElement }) => {
        const p = parts(canvasElement);
        await expect(p.canvas.queryByRole('table'), 'the empty state replaces the whole table').toBeNull();
        await expect(p.canvas.getByText(/Grade 6 and Math/), 'it names the filters that are on').toBeInTheDocument();
        await expect(p.filterIcon(), 'the count stays on the icon').toHaveAccessibleName('Filters, 2 applied');
        await userEvent.click(p.canvas.getByRole('button', { name: 'Reset filters' }));
        await waitFor(() => expect(p.canvas.getByRole('table')).toBeInTheDocument());
        await expect(p.filterIcon(), '"Reset filters" clears the count').toHaveAccessibleName('Filters');
        await expect(p.status()).toHaveTextContent('8 students');
        await fitsCanvas(canvasElement);
    },
};

/** Under page tabs: the view picker at the bar's start picks a view; the filters stay at its end. */
export const UnderPageTabs = {
    name: 'Under page tabs',
    render: () => staged(
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
            <PageTabs />
            <FilteredStudents
                tier="2b"
                categories={['grade', 'school']}
                initial={{ grade: ['Grade 7'] }}
                openMenu="view"
                start={(mount) => <ViewPicker open mount={mount} />}
            />
        </div>,
    ),
    play: async ({ canvasElement }) => {
        const p = parts(canvasElement);
        const picker = p.canvas.getByRole('button', { name: /^View/ });
        await expect(rect(picker).left, 'the view picker sits at the bar\'s start').toBeCloseTo(rect(p.bar).left, 0);
        await expect(rect(p.filterIcon()).left, 'the filters stay at the end').toBeGreaterThan(rect(picker).right);
        await expectHungFrom(canvasElement, picker, 'start');
        await fitsCanvas(canvasElement);
    },
};
