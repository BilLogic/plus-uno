import React from 'react';
import { MotionPreferenceContext } from '@/lib/motionPreference';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
    Button,
    EmptyState,
    SearchField,
    TextField,
    Toggle,
} from '@/components';
import {
    PANEL_STORAGE_KEY,
    Card,
    Section,
    SECTION_DETAIL_FLOOR,
} from '@/templates';
import { FRAME_LAYOUT } from '../Frame/frameLayout';
import { useOwnWidth } from '../Frame/useOwnWidth';
import { PAST_SESSIONS, SessionsTable, STUDENT_SESSION_CARDS, UPCOMING_SESSIONS } from '../Page/pageDemo.jsx';
import { withTestViewport } from '@/storybook-docs/lib/test-viewport.js';
import { tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { slotContent } from '@/storybook-docs/lib/template-demo.jsx';
import { LiveAnatomy } from '@/storybook-docs/lib/template-page.jsx';
import { leadersCrossNoOtherPart, markersLevelWithParts } from '@/storybook-docs/lib/anatomy-asserts.js';
import { ScreenStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { STORY_CODE } from './SectionCases.jsx';
import * as Example from './SectionExamples.jsx';

const codeOf = (name) => ({ docs: { source: { code: STORY_CODE[name] } } });

const col = { display: 'flex', flexDirection: 'column', gap: 'var(--page-pad)' };

const Actions = () => (
    <>
        <Button text="Secondary" onClick={() => {}} />
        <Button text="Primary" appearance="primary" onClick={() => {}} />
    </>
);

const description = 'Optional supporting description for this section.';

const StatCard = ({ title, body }) => (
    <Card style={{ flex: 1 }} minWidth="var(--card-min-width-sm)">
        <p style={{ margin: 0, font: 'var(--body-default)' }}>{title}</p>
        <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>{body}</p>
    </Card>
);

/** These stories read settled layouts, so the Frame's space motion is held off; its own motion stories live in Frame.stories. */
const settledLayout = (Story) => <MotionPreferenceContext.Provider value><Story /></MotionPreferenceContext.Provider>;

export default {
    decorators: [settledLayout],
    title: 'Templates/Section',
    component: Section,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        actions: { table: { disable: true } },
        header: { table: { disable: true } },
        side: { table: { disable: true } },
        footer: { table: { disable: true } },
        level: { control: false, table: { category: 'Design' } },
        title: { control: 'text', table: { category: 'Slots' } },
        description: { control: 'text', table: { category: 'Slots' } },
        type: {
            control: 'select',
            options: ['default', 'custom'],
            table: { category: 'Design' },
        },
        layout: {
            control: 'select',
            options: ['single', 'split', 'subsections'],
            table: { category: 'Design' },
        },
        isLoading: { control: 'boolean', table: { category: 'State' } },
        spacing: {
            control: 'select',
            options: ['default', 'compact', 'spacious'],
            table: { category: 'Design' },
        },
        id: { control: false, table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
    },
};

export const Overview = () => (
    <Section title="Section title" description={description} actions={<Actions />}>
        {slotContent('Content · cards, tables, rows or forms')}
    </Section>
);
Overview.play = async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.plus-browser-frame'), 'a Section renders without browser chrome').toBeNull();
};

/* Header types, one per story. The type is read from the slots you fill. */

export const HeaderDefault = {
    name: 'Default header',
    render: () => (
        <Section title="Section title" description={description} actions={<Actions />}>
            {slotContent('Content slot')}
        </Section>
    ),
};

export const HeaderCustom = {
    name: 'Custom header',
    render: () => (
        <Section
            title="This week"
            header={(
                <>
                    <p style={{ margin: 0, font: 'var(--heading-md)' }}>Week of October 20</p>
                    <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>12 sessions · 3 tutors out</p>
                </>
            )}
        >
            {slotContent('Content slot')}
        </Section>
    ),
};

/* Body layouts, one per story. */

export const LayoutSingle = {
    name: 'Single',
    render: () => (
        <Section title="Section title" description={description} actions={<Actions />}>
            <div style={{ display: 'flex', gap: 'var(--grid-gutter)', flexWrap: 'wrap' }}>
                <StatCard title="Sessions this week" body="12 scheduled · 2 need a tutor" />
                <StatCard title="Attendance" body="94% across 38 students" />
                <StatCard title="Notes due" body="3 sessions without notes" />
            </div>
        </Section>
    ),
};

export const LayoutSplit = {
    name: 'Split',
    render: () => (
        <Section title="Section title" description={description} layout="split" side={slotContent('Side · span 4')}>
            {slotContent('Main · span 8')}
        </Section>
    ),
};

export const LayoutSubsections = {
    name: 'Subsections',
    render: () => (
        <Section title="Settings" description="Manage your tutor profile, reminders and who can see your availability." layout="subsections">
            <Section title="Profile" description="Name, photo and time zone." actions={<Actions />}>
                {slotContent('Subsection body')}
            </Section>
            <Section title="Notifications" description="Email and text reminders.">
                {slotContent('Subsection body')}
            </Section>
            <Section title="Privacy" description="Who can see your availability.">
                {slotContent('Subsection body')}
            </Section>
        </Section>
    ),
};

/** A box with a fill is a Card: a sunken Card sits in a Section, and the Section draws nothing of its own. */
export const SunkenCard = {
    name: 'Sunken Card in a Section',
    render: () => (
        <Section title="Flag 3 of 12" description={description} data-testid="host">
            <Card surface="sunken" title="Record" description="Needs a follow-up call this week." data-testid="sunken-card" />
        </Section>
    ),
    play: async ({ canvasElement }) => {
        const card = getComputedStyle(canvasElement.querySelector('[data-testid="sunken-card"]'));
        await expect(card.backgroundColor, 'the Card is on the sunken surface').toBe(tokenColor(canvasElement, '--ds-surface-sunken'));
        await expect(card.borderTopLeftRadius, 'Card radius is 16').toBe('16px');
        await expect(getComputedStyle(canvasElement.querySelector('.plus-template-card-inner')).paddingTop, 'Card pad is 16').toBe('16px');
    },
};

/** The inline detail is a sunken Card, so it takes the Card's surface, pad and radius. */
export const DetailIsSunkenCard = {
    name: 'Detail is a sunken Card',
    render: () => (
        <Section title="Session reflections" detail={<p style={{ margin: 0 }}>Two goals for next week.</p>} detailTitle="Ava Thompson">
            {slotContent('Rows')}
        </Section>
    ),
    play: async ({ canvasElement }) => {
        const detail = canvasElement.querySelector('.plus-template-section-detail');
        const style = getComputedStyle(detail);
        await expect(style.backgroundColor, 'the detail is on the sunken surface').toBe(tokenColor(canvasElement, '--ds-surface-sunken'));
        await expect(style.borderTopLeftRadius, 'detail radius is 16').toBe('16px');
        await expect(getComputedStyle(detail.querySelector('.plus-template-card-inner')).paddingTop, 'detail pad is 16').toBe('16px');
    },
};

/** A Card in a Section keeps the Card radius. */
export const CardNesting = {
    name: 'Card in a Section',
    render: () => (
        <Section title="Sessions" data-testid="plain">
            <StatCard title="Sessions this week" body="12 scheduled · 2 need a tutor" />
        </Section>
    ),
    play: async ({ canvasElement }) => {
        const radius = (id) => getComputedStyle(canvasElement.querySelector(`[data-testid="${id}"] .plus-template-card`)).borderTopLeftRadius;
        await expect(radius('plain'), 'Card in a Section: 16').toBe('16px');
    },
};

/** No Section draws a surface or a pad of its own, however it is composed. */
export const NoSurfaceNoPad = {
    name: 'No fill, no pad',
    render: () => (
        <Section title="Sessions" layout="subsections" detail={<p style={{ margin: 0 }}>Notes</p>} detailTitle="Ava Thompson">
            <Section title="This week" spacing="compact">{slotContent('Rows')}</Section>
            <Section title="Next week" spacing="spacious">{slotContent('Rows')}</Section>
        </Section>
    ),
    play: async ({ canvasElement }) => {
        const sections = [...canvasElement.querySelectorAll('.plus-template-section')];
        await expect(sections.length).toBe(3);
        sections.forEach((section) => {
            const style = getComputedStyle(section);
            expect(style.backgroundColor, 'no fill').toBe('rgba(0, 0, 0, 0)');
            ['Top', 'Right', 'Bottom', 'Left'].forEach((side) => expect(style[`padding${side}`], `no ${side} pad`).toBe('0px'));
        });
    },
};

export const Footer = () => (
    <Section
        title="Upcoming sessions"
        description={description}
        footer={<Button text="View all" appearance="subtle" onClick={() => {}} />}
    >
        {slotContent('Rows')}
    </Section>
);

/** Every part of a section: header with actions and views, content, side and footer. */
export const Anatomy = {
    render: () => <Example.SectionAnatomy />,
    parameters: codeOf('SectionAnatomy'),
};

/** Level comes from nesting: a page title, a section inside it, a subsection inside that. */
export const Levels = () => (
    <Section level="page" title="Page title" description={description}>
        <Section title="Section title" description={description}>
            <Section title="Subsection title" description={description}>
                {slotContent('Content slot')}
            </Section>
        </Section>
    </Section>
);

/**
 * The header's Search: the icon grows left into the field. Esc clears, a
 * second Esc closes; it stays open while it holds text. The count is a polite
 * live region, and Reset filters clears the search with the filters.
 */
export const SearchInHeader = {
    name: 'Search',
    render: () => <Example.SearchableStudents />,
    parameters: codeOf('SearchableStudents'),
    play: async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);
        const icon = () => canvas.getByRole('button', { name: 'Search students' });
        const field = () => canvas.getByRole('searchbox', { name: 'Search students' });

        await step('The icon grows left into the field, named for its scope', async () => {
            expect(canvas.queryByRole('searchbox')).toBeNull();
            await userEvent.click(icon());
            await waitFor(() => expect(field()).toHaveFocus());
            expect(field()).toHaveAttribute('placeholder', 'Search students');
            const root = field().closest('.plus-search-field');
            expect(getComputedStyle(root).animationName).toBe('plus-search-field-grow');
            // Some Chromium builds serialize the computed flex-end as flow-end; both pin the end edge.
            expect(getComputedStyle(root).justifyContent).toMatch(/^(flex|flow)-end$/);
        });

        await step('The count narrows in words, in a polite live region', async () => {
            await userEvent.type(field(), 'ma');
            const count = canvas.getByRole('status');
            await waitFor(() => expect(count).toHaveTextContent('2 of 6 students'));
            expect(canvas.getAllByRole('listitem')).toHaveLength(2);
        });

        await step('Esc clears and keeps the field open; a second Esc closes it', async () => {
            await userEvent.keyboard('{Escape}');
            expect(field()).toHaveValue('');
            expect(field()).toHaveFocus();
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(icon()).toHaveFocus());
            expect(canvas.queryByRole('searchbox')).toBeNull();
            expect(icon().closest('.plus-search-field')).toHaveClass('plus-search-field--shrink');
        });

        await step('It stays open while it holds text, and "Clear search" empties it', async () => {
            await userEvent.click(icon());
            await userEvent.type(field(), 'jordan');
            await userEvent.click(canvas.getByRole('heading', { name: 'Students' }));
            expect(field()).toHaveValue('jordan');
            await userEvent.click(canvas.getByRole('button', { name: 'Clear search' }));
            expect(field()).toHaveValue('');
            expect(field()).toHaveFocus();
            await userEvent.tab({ shift: true });
            await waitFor(() => expect(canvas.queryByRole('searchbox')).toBeNull());
        });

        await step('Reset filters clears the search too', async () => {
            await userEvent.click(icon());
            await userEvent.type(field(), 'sam');
            await userEvent.click(canvas.getByRole('button', { name: 'Status: All' }));
            expect(canvas.getByRole('status')).toHaveTextContent('1 of 6 students');
            await userEvent.click(canvas.getByRole('button', { name: 'Reset filters' }));
            await waitFor(() => expect(canvas.queryByRole('searchbox')).toBeNull());
            expect(canvas.getByRole('status')).toHaveTextContent('6 students');
        });
    },
};

/** A Search-only Section ends row 3 with the count, and a filtered one shows it only once a filter is applied. */
export const CountBesideSearch = {
    name: 'Count beside Search',
    render: () => (
        <div style={col}>
            <Section title="Search only" search={<SearchField mode="active" spacing="compact" placeholder="Search students" value="" onValueChange={() => {}} />} count="6 students">
                <p>Rows</p>
            </Section>
            <Section
                title="Filtered, none applied"
                search={<SearchField mode="active" spacing="compact" placeholder="Search sessions" value="" onValueChange={() => {}} />}
                filters={[{ key: 'status', label: 'Status', text: 'All', onClick: () => {} }]}
                count="9 sessions"
            >
                <p>Rows</p>
            </Section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const status = canvas.getAllByRole('status');
        await expect(status, 'only the Search-only Section shows a count').toHaveLength(1);
        await expect(status[0]).toHaveTextContent('6 students');
        await expect(canvas.queryByText('9 sessions'), 'a filtered Section with nothing applied shows no count').toBeNull();
    },
};

/** Loading: skeleton bars in place of the header. */
export const LoadingDefault = {
    name: 'Loading',
    render: () => (
        <Section title="Section title" description={description} isLoading>
            {slotContent('Content slot')}
        </Section>
    ),
};

export const LoadingSearchAndFilters = {
    name: 'Loading, search and filters',
    render: () => <Example.LoadingSearchAndFilters />,
    parameters: codeOf('LoadingSearchAndFilters'),
};

/** Loading: a skeleton shape at each control's real size and position, no text, and the header as tall as the loaded one. */
export const LoadingFullHeader = {
    name: 'Loading, full header',
    render: () => (
        <div style={col}>
            <div data-testid="loaded"><Example.FullHeaderRows /></div>
            <div data-testid="loading"><Example.LoadingFullHeader /></div>
        </div>
    ),
    parameters: codeOf('LoadingFullHeader'),
    play: async ({ canvasElement }) => {
        const header = (id) => canvasElement.querySelector(`[data-testid="${id}"] .plus-template-section-header`);
        const loaded = header('loaded');
        const loading = header('loading');
        await waitFor(() => expect(loading.querySelectorAll('.plus-skeleton').length).toBeGreaterThan(0));
        // Nothing shifts when data arrives: the loading header is as tall as the loaded one.
        expect(loading.getBoundingClientRect().height).toBe(loaded.getBoundingClientRect().height);
        // Title, description-free here: title + 3 pills + format + 2 actions + search + 3 filters.
        const shapes = loading.querySelectorAll('.plus-skeleton');
        expect(shapes.length).toBeGreaterThanOrEqual(10);
        // No text is shown: every label is in the unseen shell, and visible text is empty.
        // The only text left is the visually hidden heading that names the Section.
        expect(loading.innerText.trim()).toBe('Sessions');
        expect(within(loading).queryByRole('tab')).toBeNull();
        expect(within(loading).queryByRole('button')).toBeNull();
        // Each shape sits at the place of a loaded control.
        const loadedTabs = [...loaded.querySelectorAll('[role="tab"]')].map((el) => el.getBoundingClientRect());
        const rowTop = loading.getBoundingClientRect().top;
        const shapeTops = [...shapes].map((el) => Math.round(el.getBoundingClientRect().top - rowTop));
        loadedTabs.forEach((rect) => {
            expect(shapeTops).toContain(Math.round(rect.top - loaded.getBoundingClientRect().top));
        });
    },
};

/** Loading inside a scaled ancestor (a TypeCard preview): shapes keep local sizes, so they are not scaled twice. */
export const LoadingScaled = {
    name: 'Loading, scaled ancestor',
    render: () => (
        <div style={col}>
            <div data-testid="plain"><Example.LoadingFullHeader /></div>
            <div data-testid="scaled" style={{ transform: 'scale(0.5)', transformOrigin: 'top left', inlineSize: '200%' }}>
                <Example.LoadingFullHeader />
            </div>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const shapes = (id) => canvasElement.querySelectorAll(`[data-testid="${id}"] .plus-skeleton`);
        await waitFor(() => expect(shapes('scaled').length).toBeGreaterThan(0));
        const scaled = shapes('scaled')[1];
        // Screen size is half the local size; a double-scaled shape would be a quarter.
        const local = scaled.offsetWidth;
        expect(Math.abs(scaled.getBoundingClientRect().width - local / 2)).toBeLessThan(1);
        const parent = canvasElement.querySelector('[data-testid="scaled"] .plus-template-section-loading');
        const shell = parent.querySelector('.plus-template-section-loading__shell');
        // Every hidden view pill has a shape at its own local width (the overflow ghosts draw none).
        const widths = [...shapes('scaled')].map((el) => el.offsetWidth);
        const controls = [...shell.querySelectorAll('[role="tab"]')].filter((el) => el.offsetWidth > 0 && !el.closest('.plus-tabs-ghosts'));
        expect(controls.length).toBeGreaterThan(0);
        controls.forEach((el) => expect(widths.some((w) => Math.abs(w - el.offsetWidth) <= 1)).toBe(true));
    },
};

export const LoadingViews = {
    name: 'Loading, views',
    render: () => <Example.LoadingViews />,
    parameters: codeOf('LoadingViews'),
};

export const Interactive = {
    args: {
        title: 'Section title',
        description,
        type: 'default',
        layout: 'single',
        isLoading: false,
    },
    render: (args) => {
        const bottom = args.type === 'custom' ? { header: slotContent('Custom header') } : {};
        return (
            <Section
                title={args.title || undefined}
                description={args.description || undefined}
                actions={<Actions />}
                type={args.type}
                layout={args.layout}
                isLoading={args.isLoading}
                side={args.layout === 'split' ? slotContent('Side') : undefined}
                {...bottom}
            >
                {args.layout === 'subsections' ? (
                    <>
                        <Section title="Subsection title">{slotContent('Subsection body')}</Section>
                        <Section title="Subsection title">{slotContent('Subsection body')}</Section>
                    </>
                ) : slotContent('Content slot')}
            </Section>
        );
    },
};

/**
 * In every color mode a section has no fill, its title is the body text and
 * its description the subtle text.
 */
export const ColorModes = {
    render: () => (
        <div style={col}>
            <Section data-probe="plain" title="Section title" description="A short description.">
                {slotContent('Content slot')}
            </Section>
        </div>
    ),
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        const plain = canvasElement.querySelector('[data-probe="plain"]');
        const title = plain.querySelector('.plus-template-section-title');
        const desc = plain.querySelector('.plus-template-section-description');
        await inEveryColorMode(async (mode) => {
            await expect(getComputedStyle(plain).backgroundColor, `${mode}: no fill`).toBe('rgba(0, 0, 0, 0)');
            await expect(getComputedStyle(plain).paddingTop, `${mode}: no pad`).toBe('0px');
            await expect(getComputedStyle(title).color, `${mode}: the title`).toBe(tokenColor(canvasElement, '--ds-text'));
            await expect(getComputedStyle(desc).color, `${mode}: the description`).toBe(tokenColor(canvasElement, '--ds-text-subtle'));
        });
    },
};

/**
 * Split: at 960 the main column takes span 8 and the side span 4 of the
 * 12-column grid; at 600 the side drops below its minimum, so they stack.
 */
export const SplitLayout = {
    render: () => (
        <div style={col}>
            <div data-probe="wide" style={{ width: 960 /* token gap: 960px */ }}>
                <Section title="Wide" layout="split" side={slotContent('Side')}>{slotContent('Main')}</Section>
            </div>
            <div data-probe="narrow" style={{ width: 600 /* token gap: 600px */ }}>
                <Section title="Narrow" layout="split" side={slotContent('Side')}>{slotContent('Main')}</Section>
            </div>
        </div>
    ),
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        const gutter = tokenLength(canvasElement, '--grid-gutter');
        const box = (probe, part) => canvasElement.querySelector(`[data-probe="${probe}"] .plus-template-section-${part}`).getBoundingClientRect();
        const W = 960;
        const span = (n) => (n * (W - 11 * gutter)) / 12 + (n - 1) * gutter;
        await expect(box('wide', 'main').width, 'main is span 8').toBeCloseTo(span(8), 0);
        await expect(box('wide', 'side').width, 'side is span 4').toBeCloseTo(span(4), 0);
        await expect(box('wide', 'side').top, 'side beside main').toBeCloseTo(box('wide', 'main').top, 0);
        await expect(box('narrow', 'side').top, 'side stacks under main').toBeGreaterThan(box('narrow', 'main').bottom);
        await expect(box('narrow', 'main').width, 'main spans the section').toBeCloseTo(600, 0);
    },
};

/** Header to body is Section/stack-md; the header rows sit Section/stack-sm under the title row. */
export const Spacing = {
    render: () => <Example.ViewsSpacing />,
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        const q = (s) => canvasElement.querySelector(s).getBoundingClientRect();
        await expect(q('.plus-template-section-content').top - q('.plus-template-section-header').bottom, 'header to body')
            .toBeCloseTo(tokenLength(canvasElement, '--section-stack-md'), 0);
        await expect(q('.plus-section-rows').top - q('.plus-template-section-title-row').bottom, 'title row to header rows')
            .toBeCloseTo(tokenLength(canvasElement, '--section-stack-sm'), 0);
        await expect(q('.plus-template-section-description').top - q('.plus-template-section-title').bottom, 'title to description')
            .toBeCloseTo(tokenLength(canvasElement, '--stack-sm'), 0);
    },
};

/* ------------------------------------------------- detail region */
/*
 * A Section with a `detail` region: an inline expand built on Base UI's
 * Collapsible. The disclosure row opens in place inside the Section and pushes
 * the content below it down; Escape inside the open detail closes it and
 * returns focus to the disclosure trigger.
 */

const resetPanel = () => { window.sessionStorage.removeItem(PANEL_STORAGE_KEY); };
const DETAIL_HEIGHT = 900;
const atViewport = (width, run) => withTestViewport(width, DETAIL_HEIGHT, run);

/** A Section with an inline detail expand that opens in place and pushes the content below it down. */
export const Detail = {
    render: () => (
        <div style={{ inlineSize: STAGE }}>
            <Example.DetailExpand />
        </div>
    ),
    parameters: codeOf('DetailExpand'),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { name: /Ava Thompson/ });
        const footer = canvasElement.querySelector('.plus-template-section-footer');

        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await expect(canvas.queryByRole('region', { name: 'Ava Thompson' })).toBeNull();
        const closedFooterTop = footer.getBoundingClientRect().top;

        await userEvent.click(trigger);
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
        const region = canvas.getByRole('region', { name: 'Ava Thompson' });
        await expect(within(region).getByText(/extra fraction practice/)).toBeInTheDocument();
        await waitFor(() => expect(
            footer.getBoundingClientRect().top,
            'opening the inline detail pushes the content below it down',
        ).toBeGreaterThan(closedFooterTop));

        const reviewButton = within(region).getByRole('button', { name: 'Open full review' });
        reviewButton.focus();
        await expect(reviewButton).toHaveFocus();
        await userEvent.keyboard('{Escape}');
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await expect(trigger, 'Escape inside the detail returns focus to the trigger').toHaveFocus();
        await waitFor(() => expect(canvas.queryByRole('region', { name: 'Ava Thompson' })).toBeNull());

        await userEvent.keyboard('{Enter}');
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
        await expect(canvas.getByRole('region', { name: 'Ava Thompson' })).toBeInTheDocument();

        await userEvent.keyboard(' ');
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await waitFor(() => expect(canvas.queryByRole('region', { name: 'Ava Thompson' })).toBeNull());

        await userEvent.keyboard('{Enter}');
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
        await waitFor(() => expect(
            getComputedStyle(canvasElement.querySelector('.plus-template-section-detail-panel')).opacity,
        ).toBe('1'));
    },
};

/* ------------------------------------------------------ template page */
/*
 * The Section template page's examples: its types, its header types, the
 * side and the detail, its key states and its width behavior. Each is a
 * live Section of real PLUS components holding tutoring content. Each header
 * is the three rows: the title row with its actions, the views, then Search
 * and the filters.
 */

/** The width the queue and filter-side stories lay out at: past the 960 floor, so the detail and the side sit beside the list. */
const STAGE = SECTION_DETAIL_FLOOR + 64;

const SESSIONS = [
    ['Lincoln Middle', 'Tue 4:30 PM · 6 students'],
    ['Roosevelt K-8', 'Wed 3:00 PM · 4 students'],
    ['North High', 'Thu 5:00 PM · 5 students'],
];
const SessionCards = ({ items = SESSIONS }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--grid-gutter)' }}>
        {items.map(([title, when]) => <Card key={title} title={title} description={when} />)}
    </div>
);

/** Label and value pairs, in two columns. */
const Facts = ({ pairs, columns = 2 }) => (
    <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 'var(--stack-lg) var(--inline-xl)' }}>
        {pairs.map(([label, value]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                <dt style={{ font: 'var(--body-sm)', color: 'var(--ds-text-subtle)' }}>{label}</dt>
                <dd style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>{value}</dd>
            </div>
        ))}
    </dl>
);

const STUDENT_FACTS = [['School', 'Lincoln Middle School'], ['Grade', 'Grade 7'], ['Tutor', 'Priya Nair'], ['Sessions', '12 this term']];

/* ---- types */

export const TypeList = {
    name: 'Type: List',
    render: () => <Example.ListType />,
    parameters: codeOf('ListType'),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('tab', { name: 'Needs follow-up' }));
        await expect(canvas.queryByRole('cell', { name: 'Sofia Ramirez' })).toBeNull();
        await expect(canvas.getByRole('cell', { name: 'Marcus Lee' })).toBeInTheDocument();

        await userEvent.click(canvas.getByRole('tab', { name: 'All students' }));
        await expect(canvas.getByRole('cell', { name: 'Sofia Ramirez' })).toBeInTheDocument();

        const nameHeader = canvas.getByRole('columnheader', { name: /^Name/ });
        const sortBtn = within(nameHeader).getByRole('button');
        await userEvent.click(sortBtn);
        await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
        const rows = canvas.getAllByRole('row');
        await expect(rows[1]).toHaveTextContent('Ava Thompson');

        await userEvent.click(sortBtn);
        await expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
        await expect(canvas.getAllByRole('row')[1]).toHaveTextContent('Sofia Ramirez');
    },
};

/** Queue: a queue page opens a floating Details Panel over the list on demand, with no Blanket. */
export const TypeQueue = {
    name: 'Type: Queue',
    parameters: { layout: 'fullscreen', ...codeOf('ReflectionQueue') },
    beforeEach: resetPanel,
    render: () => <div style={{ height: '100vh' }}><Example.ReflectionQueue /></div>,
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const canvas = within(canvasElement);
        await waitFor(() => expect(
            canvasElement.querySelector('.plus-frame__panel--overlay'),
            'queue pages float the Details Panel over the list',
        ).not.toBeNull());
        await expect(canvasElement.querySelector('.plus-frame__sidebar--docked'), 'the Sidebar stays docked').not.toBeNull();
        await expect(canvasElement.querySelector('.plus-frame__blanket'), 'no Blanket on a floating Panel').toBeNull();

        const panelEl = canvas.getByRole('complementary', { name: 'Reflection' });
        const panel = within(panelEl);
        await expect(panel.getByRole('heading', { name: 'Ava Thompson' })).toBeInTheDocument();

        const table = canvas.getByRole('table');
        const reviewButtons = () => within(table).getAllByRole('button', { name: 'Review' });
        const selectedReviews = () => reviewButtons().map((b) => b.getAttribute('aria-pressed') === 'true');
        await expect(selectedReviews(), 'the first row is highlighted').toEqual([true, false, false, false]);

        await userEvent.click(panel.getByRole('button', { name: 'Next' }));
        await waitFor(() => expect(panel.getByRole('heading', { name: 'Marcus Lee' })).toBeInTheDocument());
        await expect(selectedReviews(), 'Next moves the highlighted row').toEqual([false, true, false, false]);

        await userEvent.click(reviewButtons()[2]);
        await expect(canvas.getByRole('complementary', { name: 'Reflection' }), 'clicking another row swaps the content in the same Panel').toBe(panelEl);
        await waitFor(() => expect(panel.getByRole('heading', { name: 'Priya Nair' })).toBeInTheDocument());
        await expect(selectedReviews(), 'picking another row updates the highlighted row').toEqual([false, false, true, false]);

        await userEvent.click(panel.getByRole('button', { name: 'Close' }));
        await waitFor(() => expect(canvas.queryByRole('complementary', { name: 'Reflection' })).toBeNull());
        await expect(selectedReviews(), 'Close clears the highlight').toEqual([false, false, false, false]);

        await userEvent.click(reviewButtons()[0]);
        await waitFor(() => expect(canvas.getByRole('complementary', { name: 'Reflection' })).toBeInTheDocument());
    }),
};

/** Cards: title and actions, a grid of cards three across. */
export const TypeCards = {
    name: 'Type: Cards',
    render: () => (
        <Section title="Upcoming sessions" description="Next 7 days" actions={<Button text="View calendar" onClick={() => {}} />}>
            <SessionCards />
        </Section>
    ),
};

/** Stats: a row of cards, each one number and its label. */
export const TypeStats = {
    name: 'Type: Stats',
    render: () => (
        <Section title="This week">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 'var(--grid-gutter)' }}>
                {[['18', 'Sessions held'], ['94%', 'Attendance'], ['6', 'Reflections due'], ['3', 'New students']].map(([value, label]) => (
                    <Card key={label} title={value} description={label} />
                ))}
            </div>
        </Section>
    ),
};

/** Details: label and value pairs in two columns, Edit in the title row. */
export const TypeDetails = {
    name: 'Type: Details',
    render: () => (
        <Section title="Student details" actions={<Button text="Edit" iconBefore="pen" onClick={() => {}} />}>
            <Facts pairs={STUDENT_FACTS} />
        </Section>
    ),
};

/** Main and side: the side at the end, no fill, facts beside the main content. */
export const TypeMainAndSide = {
    name: 'Type: Main and side',
    render: () => <Example.MainAndSide />,
    parameters: codeOf('MainAndSide'),
};

/** Form: fields in a card, with its own Cancel and Save. */
export const TypeForm = {
    name: 'Type: Form',
    render: () => (
        <Section title="Contact details">
            <Card
                footer={(
                    <>
                        <Button text="Save" appearance="primary" onClick={() => {}} />
                        <Button text="Cancel" appearance="subtle" onClick={() => {}} />
                    </>
                )}
            >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--stack-lg) var(--inline-xl)' }}>
                    <TextField label="Guardian name" defaultValue="Dana Thompson" />
                    <TextField label="Phone" defaultValue="(412) 555-0148" />
                </div>
            </Card>
        </Section>
    ),
};

/** Subsections: Sections nested one level, each an h3, for a long settings page. */
export const TypeSubsections = {
    name: 'Type: Subsections',
    render: () => (
        <Section title="Notifications" layout="subsections">
            <Section title="Email">
                <Toggle label="Session reminders" defaultChecked />
            </Section>
            <Section title="Text messages">
                <Toggle label="Schedule changes" />
            </Section>
        </Section>
    ),
};

/* ---- header rows */

/** Every control in a header row is 32 (Tag 20): measured, not assumed; a segmented control is measured by its track, not its inset segments. */
const expectOneHeight = async (canvasElement) => {
    const header = canvasElement.querySelector('.plus-template-section-header');
    const controls = [...header.querySelectorAll('button, input')].filter((el) => {
        const box = el.getBoundingClientRect();
        return box.height > 0 && !el.closest('.plus-section-row__views') && el.type !== 'hidden';
    });
    controls.forEach((el) => {
        const box = (el.closest('.plus-search-field, .plus-segmented-control') ?? el).getBoundingClientRect();
        expect(Math.round(box.height), `${el.getAttribute('aria-label') ?? el.textContent} draws 32`).toBe(32);
    });
    header.querySelectorAll('.plus-tag').forEach((tag) => {
        expect(Math.round(tag.getBoundingClientRect().height), 'a Tag draws 20').toBe(20);
    });
    header.querySelectorAll('.plus-section-row__views [role="tab"]').forEach((tab) => {
        expect(Math.round(tab.getBoundingClientRect().height), `${tab.textContent} draws 32`).toBe(32);
    });
};

/** Row 1: the default More button and the labeled primary with its plus icon. */
const expectRowOne = async (canvasElement, primary = 'Sign up') => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'More section actions' }), 'the default More button').toBeInTheDocument();
    const button = canvas.getByRole('button', { name: primary });
    await expect(button.querySelector('.fa-plus'), 'the primary leads with a plus icon').not.toBeNull();
    await expect(button, 'the primary is the primary appearance').toHaveClass('plus-btn--primary');
};

const rowsIn = (canvasElement) => [...canvasElement.querySelectorAll('.plus-section-rows > .plus-section-row')];

/** Full: a title with its actions, views and the format switch, then Search and three triggers. */
export const Full = {
    render: () => <Example.FullHeaderRows />,
    parameters: codeOf('FullHeaderRows'),
    play: async ({ canvasElement }) => {
        await expectOneHeight(canvasElement);
        await expectRowOne(canvasElement);
        await expect(rowsIn(canvasElement), 'rows 2 and 3').toHaveLength(2);
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Status: Upcoming' })).toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Date: All time' })).toBeInTheDocument();
        const field = canvasElement.querySelector('.plus-section-row__search .plus-search-field');
        await expect(Math.round(field.getBoundingClientRect().width), 'Search keeps its field width beside the triggers')
            .toBe(Math.round(tokenLength(canvasElement, '--field-width-md')));
    },
};

/** Filters applied: the applied triggers take the selected state; the row ends with the count and Reset filters. */
export const FiltersApplied = {
    name: 'Filters applied',
    render: () => <Example.FiltersApplied />,
    parameters: codeOf('FiltersApplied'),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectOneHeight(canvasElement);
        await expect(canvas.getByText('3 of 12')).toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Status: Upcoming' })).toHaveAttribute('aria-pressed', 'true');
        await expect(canvas.getByRole('button', { name: 'Group: Whitaker' })).toHaveAttribute('aria-pressed', 'true');
        await userEvent.click(canvas.getByRole('button', { name: 'Reset filters' }));
        await waitFor(() => expect(canvas.queryByRole('button', { name: 'Reset filters' })).toBeNull());
    },
};

/** No views: row 2 goes and the format switch joins the end of row 3. */
export const NoViews = {
    name: 'No views',
    render: () => <Example.NoViews />,
    parameters: codeOf('NoViews'),
    play: async ({ canvasElement }) => {
        await expectOneHeight(canvasElement);
        const found = rowsIn(canvasElement);
        await expect(found, 'row 2 is gone').toHaveLength(1);
        await expect(found[0].querySelector('.plus-section-row__end'), 'the format switch ends row 3').not.toBeNull();
    },
};

/** Views only: nothing to search or filter, so row 3 goes. */
/** The title is optional: a page with one Section has its page title, so the Section drops its own and keeps an accessible name. */
export const TitleHidden = {
    name: 'Title hidden',
    render: () => <Example.TitleHidden />,
    parameters: codeOf('TitleHidden'),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const region = canvas.getByRole('region', { name: 'Reflections' });
        const tabs = within(region).getAllByRole('tab')[0];
        const heading = within(region).getByRole('heading', { name: 'Reflections' });
        // Not shown: the heading is visually hidden and the header starts at the views row.
        expect(heading.getBoundingClientRect().width).toBeLessThanOrEqual(1);
        expect(canvasElement.querySelector('.plus-template-section-title-row')).toBeNull();
        const header = canvasElement.querySelector('.plus-template-section-header');
        expect(Math.round(tabs.getBoundingClientRect().top)).toBe(Math.round(header.getBoundingClientRect().top));
    },
};

export const ViewsOnly = {
    name: 'Views only',
    render: () => <Example.ViewsOnly />,
    parameters: codeOf('ViewsOnly'),
    play: async ({ canvasElement }) => {
        await expectOneHeight(canvasElement);
        await expect(rowsIn(canvasElement), 'row 3 is gone').toHaveLength(1);
        within(canvasElement).getAllByRole('tab').forEach((tab) => expect(Math.round(tab.getBoundingClientRect().height), 'a view draws 32').toBe(32));
        await expect(within(canvasElement).queryByRole('button', { name: /^(Table|Cards)$/ }), 'no format switch').toBeNull();
    },
};

/** Many filters: three triggers show, the rest sit in More filters with a count. */
export const ManyFilters = {
    name: 'Many filters',
    render: () => <Example.ManyFilters />,
    parameters: codeOf('ManyFilters'),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectOneHeight(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Status: Upcoming' })).toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Group: All' })).toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Date: All time' })).toBeInTheDocument();
        await expect(canvas.queryByRole('button', { name: 'Grade: All' }), 'the fourth trigger is folded').toBeNull();
        await expect(canvas.getByRole('button', { name: /More filters/ }), 'one filter sits behind it').toHaveTextContent('1');
    },
};

/** Wrapped filters: when the triggers no longer fit beside Search they take their own row, end-aligned. */
export const WrappedFilters = {
    name: 'Wrapped filters',
    render: () => (
        <div data-probe="stage" style={{ inlineSize: 800 }}>
            <Example.WrappedFilters />
        </div>
    ),
    parameters: codeOf('WrappedFilters'),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const stage = canvasElement.querySelector('[data-probe="stage"]');
        const triggers = () => canvasElement.querySelector('.plus-section-row__filters');
        const search = canvasElement.querySelector('.plus-section-row__search');
        const rowEnd = () => search.parentElement.getBoundingClientRect().right;

        await waitFor(() => expect(triggers(), 'too wide for one line: the triggers are marked wrapped').toHaveAttribute('data-wrapped'));
        await expect(triggers().getBoundingClientRect().top, 'on their own row, under Search').toBeGreaterThanOrEqual(search.getBoundingClientRect().bottom);
        await expect(canvas.getByRole('button', { name: /More filters/ }).getBoundingClientRect().right, 'the last trigger meets the end of the row').toBeCloseTo(rowEnd(), 0);
        await expectOneHeight(canvasElement);

        stage.style.inlineSize = '1100px';
        await waitFor(() => expect(triggers(), 'room again: back beside Search').not.toHaveAttribute('data-wrapped'));
        await expect(triggers().getBoundingClientRect().top, 'on the Search line').toBeLessThan(search.getBoundingClientRect().bottom);
    },
};

/** Rows selected: the header stays and the table's head row becomes the bulk bar. */
export const RowsSelected = {
    name: 'Rows selected',
    render: () => <Example.RowsSelected />,
    parameters: codeOf('RowsSelected'),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const head = within(canvasElement.querySelector('thead'));
        await expectOneHeight(canvasElement);
        await expect(rowsIn(canvasElement), 'the header keeps its rows').toHaveLength(2);
        await expect(head.getByText('3 selected')).toBeInTheDocument();
        await expect(head.getByRole('checkbox', { name: 'Select all rows' })).toBePartiallyChecked();
        await expect(head.getAllByRole('button').map((button) => button.getAttribute('aria-label') ?? button.textContent), 'the whole bar: three actions, then the ellipsis').toEqual(['Call off', 'Export', 'Move to group', 'More actions']);
        await expect(head.queryByRole('button', { name: 'Remove from group' }), 'the fourth action sits behind the ellipsis').toBeNull();
        await expect(canvas.queryByRole('button', { name: /Cancel|Clear/ }), 'no Clear: the checkboxes clear it').toBeNull();
        await expect(Math.round(canvasElement.querySelector('thead tr').getBoundingClientRect().height), 'the head row keeps its 40').toBe(40);
        await expect(canvasElement.querySelectorAll('tbody tr[aria-selected="true"]')).toHaveLength(3);
    },
};

/** Narrow, at 600 wide: Search fills row 3 and the triggers fold into one Filter button with a count. */
export const Narrow = {
    name: 'Narrow',
    render: () => (
        <div data-probe="stage" style={{ inlineSize: 600 }}>
            <Example.NarrowHeader />
        </div>
    ),
    parameters: codeOf('NarrowHeader'),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectOneHeight(canvasElement);
        await expectRowOne(canvasElement);
        const filter = await canvas.findByRole('button', { name: /^Filter/ });
        await expect(filter).toHaveTextContent('1');
        await expect(canvas.getAllByRole('button', { name: /^Filter/ }), 'one Filter button').toHaveLength(1);
        const clear = canvas.getByRole('button', { name: 'Reset filters' });
        await expect(canvas.getByText('3 of 12'), 'the count stays under 768').toBeInTheDocument();
        await expect(clear.getBoundingClientRect().right, 'Reset filters ends the Search row').toBeCloseTo(canvasElement.querySelector('.plus-section-row--filters').getBoundingClientRect().right, 0);
        await expect(clear.getBoundingClientRect().top, 'on the Search line').toBeLessThan(canvasElement.querySelector('.plus-section-row__search').getBoundingClientRect().bottom);
        await expect(canvas.queryByRole('button', { name: 'Status: Upcoming' }), 'the triggers are folded').toBeNull();
        const search = canvasElement.querySelector('.plus-section-row__search');
        const row = search.parentElement;
        await expect(search.getBoundingClientRect().width, 'Search takes the row').toBeGreaterThan(row.getBoundingClientRect().width / 2);
        const views = canvasElement.querySelector('.plus-section-row__views');
        await expect(getComputedStyle(views).overflowX, 'the views scroll sideways').toBe('auto');
    },
};

/** Subsection: the title drops to the subsection size; its primary acts on it alone. */
export const Subsection = {
    render: () => <Example.SubsectionHeader />,
    parameters: codeOf('SubsectionHeader'),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const title = canvas.getByRole('heading', { name: 'This week' });
        await expect(title.tagName).toBe('H3');
        await expect(parseFloat(getComputedStyle(title).fontSize)).toBeLessThan(parseFloat(getComputedStyle(canvas.getByRole('heading', { name: 'Lincoln Middle' })).fontSize));
        await expectOneHeight(canvasElement.querySelector('section section'));
        await expectRowOne(canvasElement);
    },
};

/* ---- side and detail */

/** Side at the end: a summary beside the body, no fill; the header spans the full width. */
export const SideAtEnd = {
    name: 'Side at the end',
    render: () => <Example.SideAtEnd />,
    parameters: codeOf('SideAtEnd'),
};

/**
 * A Section whose main job is filtering, read from its own width. From 960
 * the filter side sits at the start and the bar has no Filter icon. Below
 * 960 the side hides and the Filter icon returns with its count; pressing it
 * gives the filters the Section's whole width, and "Show results" goes back.
 * Below 768 the Primary keeps only its icon.
 */
const FilterSideSection = () => {
    const ref = React.useRef(null);
    const width = useOwnWidth(ref, SECTION_DETAIL_FLOOR);
    let Variant = Example.FilterSideStudents;
    if (width < FRAME_LAYOUT.fullWidthBelow) Variant = Example.FilterSideStudentsNarrow;
    else if (width < SECTION_DETAIL_FLOOR) Variant = Example.FilterSideStudentsCompact;
    return (
        <div ref={ref}>
            <Variant />
        </div>
    );
};

/** Filter side at the start, when filtering is the main job. */
export const FilterSideAtStart = {
    name: 'Filter side at the start',
    render: () => <ScreenStage width={STAGE}><FilterSideSection /></ScreenStage>,
    parameters: codeOf('FilterSideStudents'),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Lincoln Middle · 2 students')).toBeInTheDocument();
        await expect(canvas.getByRole('cell', { name: 'Ava Thompson' })).toBeInTheDocument();

        await userEvent.click(canvas.getByRole('checkbox', { name: 'Grade 8' }));
        await expect(canvas.getByText('Lincoln Middle · 4 students')).toBeInTheDocument();
        await expect(canvas.getByRole('cell', { name: 'Marcus Lee' })).toBeInTheDocument();

        await userEvent.click(canvas.getByRole('checkbox', { name: 'Paused' }));
        await userEvent.click(canvas.getByRole('checkbox', { name: 'Active' }));
        await expect(canvas.getByText('Lincoln Middle · 0 students')).toBeInTheDocument();

        await userEvent.click(canvas.getAllByRole('button', { name: 'Reset filters' })[0]);
        await expect(canvas.getByText('Lincoln Middle · 6 students')).toBeInTheDocument();

        await userEvent.click(canvas.getByRole('checkbox', { name: 'Grade 7' }));
        await userEvent.click(canvas.getByRole('checkbox', { name: 'Active' }));
        await expect(canvas.getByText('Lincoln Middle · 2 students')).toBeInTheDocument();
    },
};

/** The Section's width, as a control: drag through 960 and 768. */
export const ResponsiveWidth = {
    name: 'Width behavior',
    args: { width: 1024 },
    parameters: { controls: { include: ['width'] }, ...codeOf('FilterSideStudents') },
    argTypes: {
        width: { control: { type: 'range', min: 600, max: 1280, step: 8 }, description: 'The Section\'s own width, in px.', table: { category: 'Docs' } },
    },
    render: ({ width }) => (
        <div style={{ overflowX: 'auto' }}>
            <div data-probe="stage" style={{ inlineSize: width }}><FilterSideSection /></div>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const stage = canvasElement.querySelector('[data-probe="stage"]');
        const side = () => within(canvasElement).queryByRole('group', { name: 'Student filters' });
        const filters = () => canvas.queryByRole('button', { name: /^Filters/ });
        const setWidth = (px) => { stage.style.inlineSize = `${px}px`; };

        await waitFor(() => expect(side(), 'from 960 the filter side shows').not.toBeNull());
        await expect(filters(), 'no Filter icon while the side shows').toBeNull();

        setWidth(SECTION_DETAIL_FLOOR - 64);
        await waitFor(() => expect(side(), 'below 960 the side hides').toBeNull());
        await expect(filters(), 'the Filter button returns, with its count').toHaveTextContent('2');
        await expect(canvas.getByRole('button', { name: 'Add students' }), 'the Primary keeps its label').toHaveTextContent('Add students');

        await userEvent.click(filters());
        await waitFor(() => expect(side(), 'the filters take the whole width').not.toBeNull());
        await expect(canvas.queryByRole('table'), 'in place of the table').toBeNull();
        await userEvent.click(canvas.getByRole('button', { name: 'Show results' }));
        await waitFor(() => expect(canvas.getByRole('table')).toBeInTheDocument());

        setWidth(FRAME_LAYOUT.fullWidthBelow - 64);
        await waitFor(() => expect(canvas.getByRole('button', { name: 'Add students' }), 'below 768 the Primary keeps only its icon').not.toHaveTextContent('Add students'));
        await expect(filters()).toHaveTextContent('2');

        setWidth(SECTION_DETAIL_FLOOR + 64);
        await waitFor(() => expect(side(), 'back to the side').not.toBeNull());
        await expect(filters()).toBeNull();
    },
};

/* ---- key states */

/** Empty, in a table: the empty state replaces the whole table, headers and footer too. */
export const EmptyInTable = {
    name: 'Empty, in a table',
    render: () => <Example.EmptyInTable />,
    parameters: codeOf('EmptyInTable'),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByRole('table'), 'no table, no column headers').toBeNull();
        await expect(canvas.getByRole('button', { name: 'Reset filters' })).toBeInTheDocument();
    },
};

/* ---- anatomy */

const ANATOMY_PARTS = [
    { selector: '[data-anatomy-root] .plus-template-section-header .plus-template-section-title-row', label: 'Title row' },
    { selector: '[data-anatomy-root] .plus-template-section-header .plus-section-rows', label: 'Header rows' },
    { selector: '[data-anatomy-root] .plus-template-section-list', label: 'Body' },
    { selector: '[data-anatomy-root] .plus-template-section-detail', label: 'Detail', side: 'end' },
    { selector: '[data-anatomy-root] .plus-template-section-footer', label: 'Footer' },
];

/** Every part once: a Section with its header rows, an inline detail and a footer. */
export const AnatomyQueue = {
    name: 'Anatomy',
    parameters: codeOf('ReflectionsAnatomy'),
    render: () => (
        <LiveAnatomy live title="A Section with its header, body, detail and footer numbered" parts={ANATOMY_PARTS}>
            <div data-anatomy-root>
                <Example.ReflectionsAnatomy />
            </div>
        </LiveAnatomy>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await markersLevelWithParts(canvasElement, ANATOMY_PARTS);
        leadersCrossNoOtherPart(canvasElement, ANATOMY_PARTS);
        await expect(canvasElement.querySelector('[inert]'), 'anatomy story is not inert').toBeNull();
        const root = canvasElement.querySelector('[data-anatomy-root]');
        await expect(root.closest('[aria-hidden="true"]'), 'anatomy story is not aria-hidden').toBeNull();
        const viewAll = canvas.getByRole('button', { name: 'View all' });
        viewAll.focus();
        await expect(viewAll, 'anatomy story controls are focusable').toHaveFocus();
    },
};
