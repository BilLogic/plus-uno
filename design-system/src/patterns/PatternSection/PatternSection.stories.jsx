import React, { useState } from 'react';
import { MotionPreferenceContext } from '@/lib/motionPreference';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
    Button,
    DynamicTable,
    EmptyState,
    FilterButton,
    IconButton,
    PanelBody,
    PanelCloseAction,
    PanelContainer,
    PanelDownAction,
    PanelFooter,
    PanelHeader,
    PanelSubheader,
    PanelUpAction,
    PopupSelect,
    SearchField,
    StatusTag,
    TextField,
    Toggle,
} from '@/components';
import { PANEL_STORAGE_KEY, PatternCard, PatternSection, SECTION_DETAIL_FLOOR } from '@/patterns';
import { FRAME_LAYOUT } from '../Frame/frameLayout';
import { useOwnWidth } from '../Frame/useOwnWidth';
import { PAST_SESSIONS, SessionsTable, STUDENT_SESSION_CARDS, UPCOMING_SESSIONS } from '../Page/pageDemo.jsx';
import { withTestViewport } from '@/storybook-docs/lib/test-viewport.js';
import { tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { InAppFrame, slotContent } from '@/storybook-docs/lib/pattern-demo.jsx';
import { FilterSide, FormatSwitch, STUDENTS, StudentsTable, ViewPills, filterStudentList } from '@/storybook-docs/lib/view-bar.jsx';
import { HeaderSearch, SectionActions } from '@/storybook-docs/lib/section-header.jsx';
import { LiveAnatomy } from '@/storybook-docs/lib/template-page.jsx';
import { leadersCrossNoOtherPart, markersLevelWithParts } from '@/storybook-docs/lib/anatomy-asserts.js';
import { ScreenStage } from '@/storybook-docs/lib/fit-stage.jsx';

const col = { display: 'flex', flexDirection: 'column', gap: 'var(--page-pad)' };

const Actions = () => (
    <>
        <Button text="Secondary" onClick={() => {}} />
        <Button text="Primary" appearance="primary" onClick={() => {}} />
    </>
);

const description = 'Optional supporting description for this section.';

const StatCard = ({ title, body }) => (
    <PatternCard style={{ flex: 1 }} minWidth="var(--card-min-width-sm)">
        <p style={{ margin: 0, font: 'var(--body-default)' }}>{title}</p>
        <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>{body}</p>
    </PatternCard>
);

/** These stories read settled layouts, so the Frame's space motion is held off; its own motion stories live in Frame.stories. */
const settledLayout = (Story) => <MotionPreferenceContext.Provider value><Story /></MotionPreferenceContext.Provider>;

export default {
    decorators: [settledLayout],
    title: 'Templates/Section',
    component: PatternSection,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        actions: { table: { disable: true } },
        header: { table: { disable: true } },
        side: { table: { disable: true } },
        footer: { table: { disable: true } },
        onAddView: { table: { disable: true } },
        level: { control: false, table: { category: 'Design' } },
        title: { control: 'text', table: { category: 'Slots' } },
        description: { control: 'text', table: { category: 'Slots' } },
        type: {
            control: 'select',
            options: ['default', 'custom', 'tabs', 'tabs-only', 'toolbar'],
            table: { category: 'Design' },
        },
        layout: {
            control: 'select',
            options: ['single', 'split', 'subsections'],
            table: { category: 'Design' },
        },
        loading: { control: 'boolean', table: { category: 'State' } },
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
    <PatternSection title="Section title" description={description} actions={<Actions />}>
        {slotContent('Content · cards, tables, rows or forms')}
    </PatternSection>
);

/* Header types, one per story. The type is read from the slots you fill. */

export const HeaderDefault = {
    name: 'Default header',
    render: () => (
        <PatternSection title="Section title" description={description} actions={<Actions />}>
            {slotContent('Content slot')}
        </PatternSection>
    ),
};

export const HeaderCustom = {
    name: 'Custom header',
    render: () => (
        <PatternSection
            title="This week"
            header={(
                <>
                    <p style={{ margin: 0, font: 'var(--heading-md)' }}>Week of October 20</p>
                    <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>12 sessions · 3 tutors out</p>
                </>
            )}
        >
            {slotContent('Content slot')}
        </PatternSection>
    ),
};

/* Body layouts, one per story. */

export const LayoutSingle = {
    name: 'Single',
    render: () => (
        <PatternSection title="Section title" description={description} actions={<Actions />}>
            <div style={{ display: 'flex', gap: 'var(--grid-gutter)', flexWrap: 'wrap' }}>
                <StatCard title="Sessions this week" body="12 scheduled · 2 need a tutor" />
                <StatCard title="Attendance" body="94% across 38 students" />
                <StatCard title="Notes due" body="3 sessions without notes" />
            </div>
        </PatternSection>
    ),
};

export const LayoutSplit = {
    name: 'Split',
    render: () => (
        <PatternSection title="Section title" description={description} layout="split" side={slotContent('Side · span 4')}>
            {slotContent('Main · span 8')}
        </PatternSection>
    ),
};

export const LayoutSubsections = {
    name: 'Subsections',
    render: () => (
        <PatternSection title="Settings" description="Manage your tutor profile, reminders and who can see your availability." layout="subsections">
            <PatternSection title="Profile" description="Name, photo and time zone." actions={<Actions />}>
                {slotContent('Subsection body')}
            </PatternSection>
            <PatternSection title="Notifications" description="Email and text reminders.">
                {slotContent('Subsection body')}
            </PatternSection>
            <PatternSection title="Privacy" description="Who can see your availability.">
                {slotContent('Subsection body')}
            </PatternSection>
        </PatternSection>
    ),
};

/** A box with a fill is a Card: a sunken Card sits in a Section, and the Section draws nothing of its own. */
export const SunkenCard = {
    name: 'Sunken Card in a Section',
    render: () => (
        <PatternSection title="Flag 3 of 12" description={description} data-testid="host">
            <PatternCard surface="sunken" title="Record" description="Needs a follow-up call this week." data-testid="sunken-card" />
        </PatternSection>
    ),
    play: async ({ canvasElement }) => {
        const card = getComputedStyle(canvasElement.querySelector('[data-testid="sunken-card"]'));
        await expect(card.backgroundColor, 'the Card is on the sunken surface').toBe(tokenColor(canvasElement, '--ds-surface-sunken'));
        await expect(card.borderTopLeftRadius, 'Card radius is 16').toBe('16px');
        await expect(getComputedStyle(canvasElement.querySelector('.plus-pattern-card-inner')).paddingTop, 'Card pad is 16').toBe('16px');
    },
};

/** The inline detail is a sunken Card, so it takes the Card's surface, pad and radius. */
export const DetailIsSunkenCard = {
    name: 'Detail is a sunken Card',
    render: () => (
        <PatternSection title="Session reflections" detail={<p style={{ margin: 0 }}>Two goals for next week.</p>} detailTitle="Ava Thompson">
            {slotContent('Rows')}
        </PatternSection>
    ),
    play: async ({ canvasElement }) => {
        const detail = canvasElement.querySelector('.plus-pattern-section-detail');
        const style = getComputedStyle(detail);
        await expect(style.backgroundColor, 'the detail is on the sunken surface').toBe(tokenColor(canvasElement, '--ds-surface-sunken'));
        await expect(style.borderTopLeftRadius, 'detail radius is 16').toBe('16px');
        await expect(getComputedStyle(detail.querySelector('.plus-pattern-card-inner')).paddingTop, 'detail pad is 16').toBe('16px');
    },
};

/** A Card in a Section keeps the Card radius. */
export const CardNesting = {
    name: 'Card in a Section',
    render: () => (
        <PatternSection title="Sessions" data-testid="plain">
            <StatCard title="Sessions this week" body="12 scheduled · 2 need a tutor" />
        </PatternSection>
    ),
    play: async ({ canvasElement }) => {
        const radius = (id) => getComputedStyle(canvasElement.querySelector(`[data-testid="${id}"] .plus-pattern-card`)).borderTopLeftRadius;
        await expect(radius('plain'), 'Card in a Section: 16').toBe('16px');
    },
};

/** No Section draws a surface or a pad of its own, however it is composed. */
export const NoSurfaceNoPad = {
    name: 'No fill, no pad',
    render: () => (
        <PatternSection title="Sessions" layout="subsections" detail={<p style={{ margin: 0 }}>Notes</p>} detailTitle="Ava Thompson">
            <PatternSection title="This week" spacing="compact">{slotContent('Rows')}</PatternSection>
            <PatternSection title="Next week" spacing="spacious">{slotContent('Rows')}</PatternSection>
        </PatternSection>
    ),
    play: async ({ canvasElement }) => {
        const sections = [...canvasElement.querySelectorAll('.plus-pattern-section')];
        await expect(sections.length).toBe(3);
        sections.forEach((section) => {
            const style = getComputedStyle(section);
            expect(style.backgroundColor, 'no fill').toBe('rgba(0, 0, 0, 0)');
            ['Top', 'Right', 'Bottom', 'Left'].forEach((side) => expect(style[`padding${side}`], `no ${side} pad`).toBe('0px'));
        });
    },
};

export const Footer = () => (
    <PatternSection
        title="Upcoming sessions"
        description={description}
        footer={<Button text="View all" appearance="subtle" onClick={() => {}} />}
    >
        {slotContent('Rows')}
    </PatternSection>
);

/** Every part of a section: header with actions and views, content, side and footer. */
export const Anatomy = () => (
    <PatternSection
        title="Upcoming sessions"
        description={description}
        actions={<Actions />}
        views={<ViewPills views={['All students', 'Active', 'Paused']} />}
        layout="split"
        side={slotContent('Side · span 4')}
        footer={<Button text="View all" appearance="subtle" onClick={() => {}} />}
    >
        {slotContent('Content · span 8')}
    </PatternSection>
);

/** Level comes from nesting: a page title, a section inside it, a subsection inside that. */
export const Levels = () => (
    <PatternSection level="page" title="Page title" description={description}>
        <PatternSection title="Section title" description={description}>
            <PatternSection title="Subsection title" description={description}>
                {slotContent('Content slot')}
            </PatternSection>
        </PatternSection>
    </PatternSection>
);

const SEARCH_STUDENTS = [
    { name: 'Maya Chen', active: true },
    { name: 'Marcus Lee', active: false },
    { name: 'Ana Ruiz', active: true },
    { name: 'Jordan Park', active: true },
    { name: 'Priya Shah', active: false },
    { name: 'Sam Okafor', active: true },
];

/**
 * The header's Search: the icon grows left into the field. Esc clears, a
 * second Esc closes; it stays open while it holds text. The count is a polite
 * live region, and Clear all clears the search with the filters.
 */
const SearchableStudents = () => {
    const [query, setQuery] = useState('');
    const [activeOnly, setActiveOnly] = useState(false);
    const rows = SEARCH_STUDENTS.filter((student) => (!activeOnly || student.active)
        && student.name.toLowerCase().includes(query.trim().toLowerCase()));
    const narrowed = query !== '' || activeOnly;
    const reset = () => {
        setQuery('');
        setActiveOnly(false);
    };
    return (
        <PatternSection
            title="Students"
            actions={<SectionActions primary="Add student" more={false} />}
            search={<SearchField mode="active" isCollapsible spacing="compact" placeholder="Search students" value={query} onValueChange={setQuery} />}
            filters={[{ key: 'status', label: 'Status', text: activeOnly ? 'Active' : 'All', isSelected: activeOnly, onClick: () => setActiveOnly((on) => !on) }]}
            onClearAll={reset}
        >
            <p role="status" style={{ margin: 0, font: 'var(--body-sm)', color: 'var(--ds-text-subtle)' }}>
                {narrowed ? `${rows.length} of ${SEARCH_STUDENTS.length} students` : `${SEARCH_STUDENTS.length} students`}
            </p>
            <ul style={{ margin: 0, paddingInlineStart: 'var(--page-pad)', font: 'var(--body-default)' }}>
                {rows.map((student) => <li key={student.name}>{student.name}</li>)}
            </ul>
        </PatternSection>
    );
};

export const ToolbarSearch = {
    name: 'Search',
    render: () => <SearchableStudents />,
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

        await step('Clear all clears the search too', async () => {
            await userEvent.click(icon());
            await userEvent.type(field(), 'sam');
            await userEvent.click(canvas.getByRole('button', { name: 'Status: All' }));
            expect(canvas.getByRole('status')).toHaveTextContent('1 of 6 students');
            await userEvent.click(canvas.getByRole('button', { name: 'Clear all' }));
            await waitFor(() => expect(canvas.queryByRole('searchbox')).toBeNull());
            expect(canvas.getByRole('status')).toHaveTextContent('6 students');
        });
    },
};

/** Loading: skeleton bars in place of the header. */
export const LoadingDefault = {
    name: 'Loading',
    render: () => (
        <PatternSection title="Section title" description={description} loading>
            {slotContent('Content slot')}
        </PatternSection>
    ),
};

export const LoadingToolbar = {
    name: 'Loading, search and filters',
    render: () => (
        <PatternSection
            title="Students"
            description={description}
            search={<HeaderSearch />}
            filters={[{ key: 'status', label: 'Status', text: 'All' }]}
            loading
        >
            {slotContent('Table')}
        </PatternSection>
    ),
};

export const LoadingTabsOnly = {
    name: 'Loading, views',
    render: () => (
        <PatternSection title="Students" views={<ViewPills views={['All students', 'Active', 'Paused']} />} loading>
            {slotContent('Content slot')}
        </PatternSection>
    ),
};

export const Interactive = {
    args: {
        title: 'Section title',
        description,
        type: 'default',
        layout: 'single',
        loading: false,
    },
    render: (args) => {
        const bottom = args.type === 'custom' ? { header: slotContent('Custom header') } : {};
        return (
            <PatternSection
                title={args.title || undefined}
                description={args.description || undefined}
                actions={<Actions />}
                type={args.type}
                layout={args.layout}
                loading={args.loading}
                side={args.layout === 'split' ? slotContent('Side') : undefined}
                {...bottom}
            >
                {args.layout === 'subsections' ? (
                    <>
                        <PatternSection title="Subsection title">{slotContent('Subsection body')}</PatternSection>
                        <PatternSection title="Subsection title">{slotContent('Subsection body')}</PatternSection>
                    </>
                ) : slotContent('Content slot')}
            </PatternSection>
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
            <PatternSection data-probe="plain" title="Section title" description="A short description.">
                {slotContent('Content slot')}
            </PatternSection>
        </div>
    ),
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        const plain = canvasElement.querySelector('[data-probe="plain"]');
        const title = plain.querySelector('.plus-pattern-section-title');
        const desc = plain.querySelector('.plus-pattern-section-description');
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
                <PatternSection title="Wide" layout="split" side={slotContent('Side')}>{slotContent('Main')}</PatternSection>
            </div>
            <div data-probe="narrow" style={{ width: 600 /* token gap: 600px */ }}>
                <PatternSection title="Narrow" layout="split" side={slotContent('Side')}>{slotContent('Main')}</PatternSection>
            </div>
        </div>
    ),
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        const gutter = tokenLength(canvasElement, '--grid-gutter');
        const box = (probe, part) => canvasElement.querySelector(`[data-probe="${probe}"] .plus-pattern-section-${part}`).getBoundingClientRect();
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
    render: () => (
        <PatternSection title="Students" description={description} views={<ViewPills views={['All students', 'Active', 'Paused']} />}>
            {slotContent('Content slot')}
        </PatternSection>
    ),
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        const q = (s) => canvasElement.querySelector(s).getBoundingClientRect();
        await expect(q('.plus-pattern-section-content').top - q('.plus-pattern-section-header').bottom, 'header to body')
            .toBeCloseTo(tokenLength(canvasElement, '--section-stack-md'), 0);
        await expect(q('.plus-section-rows').top - q('.plus-pattern-section-title-row').bottom, 'title row to header rows')
            .toBeCloseTo(tokenLength(canvasElement, '--section-stack-sm'), 0);
        await expect(q('.plus-pattern-section-description').top - q('.plus-pattern-section-title').bottom, 'title to description')
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
    render: (args) => (
        <div style={{ inlineSize: STAGE }}>
            <PatternSection
                title="Reflections"
                description="Week of Oct 20"
                views={<ViewPills views={['All reflections', 'Needs follow-up']} />}
                detailTitle="Ava Thompson"
                detailDescription="Grade 7"
                detail={(
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                        <StatusTag appearance="warning">Needs follow-up</StatusTag>
                        <p style={{ margin: 0, font: 'var(--body-default)' }}>
                            The reflection names two goals for next week and asks for extra fraction practice.
                        </p>
                    </div>
                )}
                detailFooter={<Button text="Open full review" appearance="subtle" onClick={() => {}} />}
                footer={<Button text="View all" appearance="subtle" onClick={() => {}} />}
                {...args}
            >
                <StudentsTable count={4} />
            </PatternSection>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { name: /Ava Thompson/ });
        const footer = canvasElement.querySelector('.plus-pattern-section-footer');

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
            getComputedStyle(canvasElement.querySelector('.plus-pattern-section-detail-panel')).opacity,
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
        {items.map(([title, when]) => <PatternCard key={title} title={title} description={when} />)}
    </div>
);

/** Label and value pairs, in two columns. */
const Facts = ({ pairs, columns = 2 }) => (
    <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 'var(--stack-lg) var(--grid-gutter)' }}>
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

/** List: the views alone, one table, paging. */
const TypeListDemo = () => {
    const [view, setView] = useState('All students');
    return (
        <PatternSection
            title="Students"
            actions={<SectionActions />}
            views={<ViewPills views={['All students', 'Needs follow-up']} activeView={view} onViewChange={setView} />}
        >
            <StudentsTable count={6} rowsPerPage={4} sortable view={view} />
        </PatternSection>
    );
};

export const TypeList = {
    name: 'Type: List',
    render: () => <TypeListDemo />,
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

/** Queue: a queue page docks the Panel beside the list, and the record opens on demand. */
export const TypeQueue = {
    name: 'Type: Queue',
    parameters: { layout: 'fullscreen' },
    beforeEach: resetPanel,
    render: () => {
        const queueRows = STUDENTS.slice(0, 4);
        const [index, setIndex] = useState(0);
        const [open, setOpen] = useState(true);
        const [name, grade, lastSession, , , tutor] = queueRows[index];
        const selectRow = (i) => {
            setIndex(i);
            setOpen(true);
        };
        const panel = (
            <PanelContainer>
                <div>
                    <PanelHeader
                        title={name}
                        actions={(
                            <>
                                <PanelUpAction
                                    disabled={index === 0}
                                    onClick={() => setIndex((i) => Math.max(0, i - 1))}
                                />
                                <PanelDownAction
                                    disabled={index === queueRows.length - 1}
                                    onClick={() => setIndex((i) => Math.min(queueRows.length - 1, i + 1))}
                                />
                                <PanelCloseAction onClick={() => setOpen(false)} />
                            </>
                        )}
                    />
                    <PanelSubheader>
                        <StatusTag appearance="warning">To review</StatusTag>
                    </PanelSubheader>
                </div>
                <PanelBody>
                    <p style={{ margin: 0, font: 'var(--body-default)' }}>
                        {grade} · Tutor: {tutor} · {lastSession}. The reflection names two goals for next week.
                    </p>
                </PanelBody>
                <PanelFooter>
                    <Button text="Open full review" appearance="subtle" onClick={() => {}} />
                </PanelFooter>
            </PanelContainer>
        );
        return (
            <InAppFrame
                panel={panel}
                panelLabel="Reflection"
                panelOpen={open}
                onPanelOpenChange={setOpen}
                panelStorageKey={null}
            >
                <PatternSection
                    title="Reflections to review"
                    views={<ViewPills views={['To review']} />}
                >
                    <DynamicTable
                        label="Reflections to review"
                        isFixedSize
                        highlightedRowIndex={open ? index : undefined}
                        head={{
                            cells: [
                                { key: 'name', content: 'Name' },
                                { key: 'grade', content: 'Grade' },
                                { key: 'last', content: 'Last session' },
                                { key: 'action', content: 'Action' },
                            ],
                        }}
                        rows={queueRows.map(([studentName, studentGrade, studentDate], i) => ({
                            key: studentName,
                            cells: [
                                { key: 'name', content: studentName },
                                { key: 'grade', content: studentGrade },
                                { key: 'last', content: studentDate },
                                {
                                    key: 'action',
                                    content: (
                                        <Button
                                            text="Review"
                                            appearance="default"
                                            spacing="compact"
                                            isSelected={open && i === index}
                                            onClick={() => selectRow(i)}
                                        />
                                    ),
                                },
                            ],
                        }))}
                    />
                </PatternSection>
            </InAppFrame>
        );
    },
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const canvas = within(canvasElement);
        await waitFor(() => expect(
            canvasElement.querySelector('.plus-frame__panel--docked'),
            'queue pages dock the Panel beside the list',
        ).not.toBeNull());
        await expect(canvasElement.querySelector('.plus-frame__blanket'), 'no Blanket on a docked Panel').toBeNull();

        const panel = within(canvas.getByRole('complementary', { name: 'Reflection' }));
        await expect(panel.getByRole('heading', { name: 'Ava Thompson' })).toBeInTheDocument();

        await userEvent.click(panel.getByRole('button', { name: 'Next' }));
        await waitFor(() => expect(panel.getByRole('heading', { name: 'Marcus Lee' })).toBeInTheDocument());

        await userEvent.click(panel.getByRole('button', { name: 'Close' }));
        await waitFor(() => expect(canvas.queryByRole('complementary', { name: 'Reflection' })).toBeNull());

        await userEvent.click(canvas.getAllByRole('button', { name: 'Review' })[0]);
        await waitFor(() => expect(canvas.getByRole('complementary', { name: 'Reflection' })).toBeInTheDocument());
    }),
};

/** Cards: title and actions, a grid of cards three across. */
export const TypeCards = {
    name: 'Type: Cards',
    render: () => (
        <PatternSection title="Upcoming sessions" description="Next 7 days" actions={<Button text="View calendar" onClick={() => {}} />}>
            <SessionCards />
        </PatternSection>
    ),
};

/** Stats: a row of cards, each one number and its label. */
export const TypeStats = {
    name: 'Type: Stats',
    render: () => (
        <PatternSection title="This week">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 'var(--grid-gutter)' }}>
                {[['18', 'Sessions held'], ['94%', 'Attendance'], ['6', 'Reflections due'], ['3', 'New students']].map(([value, label]) => (
                    <PatternCard key={label} title={value} description={label} />
                ))}
            </div>
        </PatternSection>
    ),
};

/** Details: label and value pairs in two columns, Edit in the title row. */
export const TypeDetails = {
    name: 'Type: Details',
    render: () => (
        <PatternSection title="Student details" actions={<Button text="Edit" iconBefore="pen" onClick={() => {}} />}>
            <Facts pairs={STUDENT_FACTS} />
        </PatternSection>
    ),
};

const GROUP_FACTS = [['Tutor', 'Priya Nair'], ['Meets', 'Tuesdays, 4:30 PM'], ['Room', 'Library 2']];

/** Main and side: the side at the end, no fill, facts beside the main content. */
export const TypeMainAndSide = {
    name: 'Type: Main and side',
    render: () => (
        <PatternSection title="Lincoln Middle" description="Tuesdays at 4:30 PM" layout="split" side={<Facts pairs={GROUP_FACTS} columns={1} />}>
            <StudentsTable count={4} />
        </PatternSection>
    ),
};

/** Form: fields in a card, with its own Cancel and Save. */
export const TypeForm = {
    name: 'Type: Form',
    render: () => (
        <PatternSection title="Contact details">
            <PatternCard
                footer={(
                    <>
                        <Button text="Save" appearance="primary" onClick={() => {}} />
                        <Button text="Cancel" appearance="subtle" onClick={() => {}} />
                    </>
                )}
            >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--stack-lg) var(--grid-gutter)' }}>
                    <TextField label="Guardian name" defaultValue="Dana Thompson" />
                    <TextField label="Phone" defaultValue="(412) 555-0148" />
                </div>
            </PatternCard>
        </PatternSection>
    ),
};

/** Subsections: Sections nested one level, each an h3, for a long settings page. */
export const TypeSubsections = {
    name: 'Type: Subsections',
    render: () => (
        <PatternSection title="Notifications" layout="subsections">
            <PatternSection title="Email">
                <Toggle label="Session reminders" defaultChecked />
            </PatternSection>
            <PatternSection title="Text messages">
                <Toggle label="Schedule changes" />
            </PatternSection>
        </PatternSection>
    ),
};

/* ---- header rows */

const HEADER_SESSIONS = [
    ['Tue Nov 18', '3:30 PM', 'Whitaker · period 6', '4'],
    ['Thu Nov 20', '3:30 PM', 'Whitaker · period 6', '4'],
    ['Tue Nov 25', '3:30 PM', 'Whitaker · period 6', '4'],
    ['Tue Dec 2', '3:30 PM', 'Whitaker · period 6', '4'],
];
const HEADER_STUDENTS = [
    ['Maya R.', 'Grade 7', 'Whitaker', '12'],
    ['Jonah T.', 'Grade 8', 'Lincoln', '9'],
];
const rowsOf = (list) => list.map((cells) => ({ key: cells.join(), cells: cells.map((content, i) => ({ key: `${i}`, content })) }));
const headOf = (names) => ({ cells: names.map((content) => ({ key: content, content })) });
const HeaderTable = ({ list = HEADER_SESSIONS.slice(0, 3), names = ['Date', 'Time', 'Group', 'Students'], ...props }) => (
    <DynamicTable head={headOf(names)} rows={rowsOf(list)} label="Sessions" isFixedSize {...props} />
);

const signUp = <SectionActions primary="Sign up" icon="plus" />;

const headerSearch = <HeaderSearch label="Search" />;

const STATUS_FILTERS = [
    { key: 'status', label: 'Status', text: 'Upcoming', onClick: () => {} },
    { key: 'group', label: 'Group', text: 'All', onClick: () => {} },
    { key: 'date', label: 'Date', text: 'All time', onClick: () => {} },
];

const fullHeader = {
    title: 'Sessions',
    actions: signUp,
    views: <ViewPills views={['Upcoming', 'Past', 'All']} />,
    format: <FormatSwitch />,
    search: headerSearch,
    filters: STATUS_FILTERS,
};

/** Every control in a header row is 32 (Tag 20): measured, not assumed. */
const expectOneHeight = async (canvasElement) => {
    const header = canvasElement.querySelector('.plus-pattern-section-header');
    const controls = [...header.querySelectorAll('button, input')].filter((el) => {
        const box = el.getBoundingClientRect();
        return box.height > 0 && !el.closest('.plus-section-row__views') && el.type !== 'hidden';
    });
    controls.forEach((el) => {
        const box = (el.closest('.plus-search-field') ?? el).getBoundingClientRect();
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
    render: () => (
        <PatternSection {...fullHeader}>
            <HeaderTable />
        </PatternSection>
    ),
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

/** Filters applied: the applied triggers take the selected state; the row ends with the count and Clear all. */
const FiltersAppliedDemo = () => {
    const [applied, setApplied] = useState(true);
    const filters = STATUS_FILTERS.map((filter, i) => (
        applied && i < 2 ? { ...filter, text: i === 0 ? 'Upcoming' : 'Whitaker', label: i === 0 ? 'Status' : 'Group', isSelected: true } : filter
    ));
    return (
        <PatternSection {...fullHeader} filters={filters} count="3 of 12" onClearAll={() => setApplied(false)}>
            <HeaderTable />
        </PatternSection>
    );
};

export const FiltersApplied = {
    name: 'Filters applied',
    render: () => <FiltersAppliedDemo />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectOneHeight(canvasElement);
        await expect(canvas.getByText('3 of 12')).toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Status: Upcoming' })).toHaveAttribute('aria-pressed', 'true');
        await expect(canvas.getByRole('button', { name: 'Group: Whitaker' })).toHaveAttribute('aria-pressed', 'true');
        await userEvent.click(canvas.getByRole('button', { name: 'Clear all' }));
        await waitFor(() => expect(canvas.queryByRole('button', { name: 'Clear all' })).toBeNull());
    },
};

/** No views: row 2 goes and the format switch joins the end of row 3. */
export const NoViews = {
    name: 'No views',
    render: () => (
        <PatternSection
            title="Students"
            actions={<SectionActions primary="Add student" />}
            format={<FormatSwitch />}
            search={headerSearch}
            filters={[
                { key: 'group', label: 'Group', text: 'All', onClick: () => {} },
                { key: 'grade', label: 'Grade', text: 'All', onClick: () => {} },
                { key: 'status', label: 'Status', text: 'Active', onClick: () => {} },
            ]}
        >
            <HeaderTable list={HEADER_STUDENTS} names={['Name', 'Grade', 'Group', 'Sessions']} />
        </PatternSection>
    ),
    play: async ({ canvasElement }) => {
        await expectOneHeight(canvasElement);
        const found = rowsIn(canvasElement);
        await expect(found, 'row 2 is gone').toHaveLength(1);
        await expect(found[0].querySelector('.plus-section-row__end'), 'the format switch ends row 3').not.toBeNull();
    },
};

/** Views only: nothing to search or filter, so row 3 goes. */
export const ViewsOnly = {
    name: 'Views only',
    render: () => (
        <PatternSection title="Reflections" views={<ViewPills views={['Owed', 'Submitted']} />}>
            <HeaderTable list={HEADER_STUDENTS} names={['Name', 'Grade', 'Group', 'Sessions']} />
        </PatternSection>
    ),
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
    render: () => (
        <PatternSection
            {...fullHeader}
            filters={[
                ...STATUS_FILTERS,
                { key: 'grade', label: 'Grade', text: 'All', onClick: () => {} },
                { key: 'tutor', label: 'Tutor', text: 'Any', onClick: () => {} },
            ]}
            onMoreFilters={() => {}}
        >
            <HeaderTable />
        </PatternSection>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectOneHeight(canvasElement);
        await expect(canvas.queryByRole('button', { name: 'Grade: All' }), 'the fourth trigger is folded').toBeNull();
        await expect(canvas.getByRole('button', { name: /More filters/ })).toHaveTextContent('2');
    },
};

/** Wrapped filters: when the triggers no longer fit beside Search they take their own row, end-aligned. */
export const WrappedFilters = {
    name: 'Wrapped filters',
    render: () => (
        <div data-probe="stage" style={{ inlineSize: 800 }}>
            <PatternSection
                {...fullHeader}
                filters={[
                    ...STATUS_FILTERS,
                    { key: 'grade', label: 'Grade', text: 'All', onClick: () => {} },
                    { key: 'tutor', label: 'Tutor', text: 'Any', onClick: () => {} },
                ]}
                onMoreFilters={() => {}}
            >
                <HeaderTable />
            </PatternSection>
        </div>
    ),
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
    render: () => (
        <PatternSection {...fullHeader}>
            <HeaderTable
                list={HEADER_SESSIONS}
                isSelectable
                defaultSelectedRowKeys={HEADER_SESSIONS.slice(0, 3).map((cells) => cells.join())}
                bulkActions={[{ label: 'Call off' }, { label: 'Export' }, { label: 'Move to group' }, { label: 'Remove from group' }]}
            />
        </PatternSection>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const head = within(canvasElement.querySelector('thead'));
        await expectOneHeight(canvasElement);
        await expect(rowsIn(canvasElement), 'the header keeps its rows').toHaveLength(2);
        await expect(head.getByText('3 selected')).toBeInTheDocument();
        await expect(head.getByRole('checkbox', { name: 'Select all rows' })).toBePartiallyChecked();
        await expect(head.getByRole('button', { name: 'Call off' })).toBeInTheDocument();
        await expect(head.getByRole('button', { name: 'Export' })).toBeInTheDocument();
        await expect(head.getByRole('button', { name: 'More actions' }), 'the rest sit behind the ellipsis').toBeInTheDocument();
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
            <PatternSection
                {...fullHeader}
                filters={STATUS_FILTERS.map((filter, i) => (i === 0 ? { ...filter, isSelected: true } : filter))}
                count="3 of 12"
                onClearAll={() => {}}
                onOpenFilters={() => {}}
            >
                <HeaderTable list={HEADER_SESSIONS.slice(0, 3).map((cells) => cells.slice(0, 3))} names={['Date', 'Time', 'Group']} maxHeight={320} />
            </PatternSection>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectOneHeight(canvasElement);
        await expectRowOne(canvasElement);
        const filter = await canvas.findByRole('button', { name: /^Filter/ });
        await expect(filter).toHaveTextContent('1');
        await expect(canvas.getAllByRole('button', { name: /^Filter/ }), 'one Filter button').toHaveLength(1);
        const clear = canvas.getByRole('button', { name: 'Clear all' });
        await expect(canvas.getByText('3 of 12'), 'the count stays under 768').toBeInTheDocument();
        await expect(clear.getBoundingClientRect().right, 'Clear all ends the Search row').toBeCloseTo(canvasElement.querySelector('.plus-section-row--filters').getBoundingClientRect().right, 0);
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
    render: () => (
        <PatternSection title="Lincoln Middle">
            <PatternSection
                {...fullHeader}
                title="This week"
            >
                <HeaderTable />
            </PatternSection>
        </PatternSection>
    ),
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
    render: () => (
        <PatternSection
            title="Lincoln Middle"
            actions={<SectionActions />}
            views={<ViewPills views={['All students']} />}
            layout="split"
            side={<Facts pairs={GROUP_FACTS} columns={1} />}
        >
            <StudentsTable count={4} />
        </PatternSection>
    ),
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
    const [checked, setChecked] = useState(['Grade 7', 'Active']);
    const [showFilters, setShowFilters] = useState(false);
    const sideFits = width >= SECTION_DETAIL_FLOOR;
    const narrow = width < FRAME_LAYOUT.fullWidthBelow;
    const toggle = (v) => setChecked(checked.includes(v) ? checked.filter((c) => c !== v) : [...checked, v]);
    const side = <FilterSide checked={checked} onToggle={toggle} onReset={() => setChecked([])} />;
    const matching = filterStudentList({ count: STUDENTS.length, checked });
    const table = matching.length > 0 ? (
        <StudentsTable count={STUDENTS.length} checked={checked} />
    ) : (
        <EmptyState
            spacing="compact"
            icon="user-group"
            header="No students match"
            description="Try other filters, or reset them to see every student."
            primaryAction={<Button text="Reset filters" appearance="primary" onClick={() => setChecked([])} />}
        />
    );
    let body = table;
    if (sideFits) {
        body = (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(var(--section-min-width-side), 3fr) minmax(0, 9fr)', gap: 'var(--grid-gutter)' }}>
                {side}
                {table}
            </div>
        );
    } else if (showFilters) {
        body = (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
                {side}
                <div><Button text="Show results" appearance="primary" onClick={() => setShowFilters(false)} /></div>
            </div>
        );
    }
    return (
        <div ref={ref}>
            <PatternSection
                title="Students"
                description={`Lincoln Middle · ${matching.length} ${matching.length === 1 ? 'student' : 'students'}`}
                actions={<SectionActions narrow={narrow} />}
                views={<ViewPills views={['All students']} />}
                filters={sideFits ? undefined : [{
                    key: 'filters',
                    text: 'Filters',
                    iconBefore: 'filter',
                    hasChevronDown: false,
                    trailingMetric: checked.length || undefined,
                    isSelected: checked.length > 0,
                    onClick: () => setShowFilters(true),
                }]}
            >
                {body}
            </PatternSection>
        </div>
    );
};

/** Filter side at the start, when filtering is the main job. */
export const FilterSideAtStart = {
    name: 'Filter side at the start',
    render: () => <ScreenStage width={STAGE}><FilterSideSection /></ScreenStage>,
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
    parameters: { controls: { include: ['width'] } },
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
        const side = () => canvasElement.querySelector('.plus-section-filter-side');
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
    render: () => (
        <PatternSection title="Students" description="Lincoln Middle · 24 students" views={<ViewPills views={['All students', 'Needs follow-up']} />}>
            <EmptyState
                spacing="compact"
                icon="user-group"
                header="No students match"
                description="Try other filters, or reset them to see every student."
                primaryAction={<Button text="Reset filters" appearance="primary" onClick={() => {}} />}
            />
        </PatternSection>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByRole('table'), 'no table, no column headers').toBeNull();
        await expect(canvas.getByRole('button', { name: 'Reset filters' })).toBeInTheDocument();
    },
};

/* ---- anatomy */

const ANATOMY_PARTS = [
    { selector: '[data-anatomy-root] > .plus-pattern-section-header .plus-pattern-section-title-row', label: 'Title row' },
    { selector: '[data-anatomy-root] > .plus-pattern-section-header .plus-section-rows', label: 'Header rows' },
    { selector: '[data-anatomy-root] .plus-pattern-section-list', label: 'Body' },
    { selector: '[data-anatomy-root] .plus-pattern-section-detail', label: 'Detail', side: 'end' },
    { selector: '[data-anatomy-root] > .plus-pattern-section-footer', label: 'Footer' },
];

/** Every part once: a Section with its header rows, an inline detail and a footer. */
export const AnatomyQueue = {
    name: 'Anatomy',
    render: () => (
        <LiveAnatomy live title="A Section with its header, body, detail and footer numbered" parts={ANATOMY_PARTS}>
            <PatternSection
                data-anatomy-root
                title="Reflections"
                description="Week of Oct 20"
                views={<ViewPills views={['All reflections', 'Needs follow-up']} />}
                detailTitle="Ava Thompson"
                detailDescription="Grade 7"
                detail={<p style={{ margin: 0, font: 'var(--body-default)' }}>The reflection names two goals for next week.</p>}
                detailFooter={<Button text="Open full review" appearance="subtle" onClick={() => {}} />}
                defaultDetailOpen
                footer={<Button text="View all" appearance="subtle" onClick={() => {}} />}
            >
                <StudentsTable count={4} />
            </PatternSection>
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
