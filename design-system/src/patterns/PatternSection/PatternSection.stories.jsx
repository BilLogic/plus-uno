import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
    Button,
    EmptyState,
    FilterButton,
    IconButton,
    PanelBody,
    PanelCloseAction,
    PanelContainer,
    PanelHeader,
    SearchField,
    Select,
    StatusTag,
    TextField,
    Toggle,
    Tabs as TabsComponent,
} from '@/components';
import { PANEL_STORAGE_KEY, PatternCard, PatternSection, SECTION_DETAIL_FLOOR, usePanelControl } from '@/patterns';
import { FRAME_LAYOUT } from '../Frame/frameLayout';
import { useOwnWidth } from '../Frame/useOwnWidth';
import { withTestViewport } from '@/storybook-docs/lib/test-viewport.js';
import { tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { InAppFrame, slotContent } from '@/storybook-docs/lib/pattern-demo.jsx';
import { FilterSide, STUDENTS, StudentsTable, ViewBar, row } from '@/storybook-docs/lib/view-bar.jsx';
import { iconClass } from '../../lib/icon';

const col = { display: 'flex', flexDirection: 'column', gap: 'var(--space-200)' };

const Actions = () => (
    <>
        <Button text="Secondary" onClick={() => {}} />
        <Button text="Primary" appearance="primary" onClick={() => {}} />
    </>
);

const ViewTabs = ({ label = 'Views' }) => {
    const [active, setActive] = useState('all');
    return (
        <TabsComponent activeKey={active} onSelect={setActive} aria-label={label}>
            <TabsComponent.Tab eventKey="all">All students</TabsComponent.Tab>
            <TabsComponent.Tab eventKey="active">Active</TabsComponent.Tab>
            <TabsComponent.Tab eventKey="paused">Paused</TabsComponent.Tab>
        </TabsComponent>
    );
};

const DefaultToolbar = () => (
    <PatternSection.Toolbar
        search={<TextField label="Search students" isLabelHidden placeholder="Search students" elemBeforeInput={<i className={iconClass('magnifying-glass')} aria-hidden="true" />} type="search" />}
        filters={(
            <>
                <Button text="Status" appearance="subtle" iconAfter="chevron-down" onClick={() => {}} />
                <Button text="Tutor" appearance="subtle" iconAfter="chevron-down" onClick={() => {}} />
            </>
        )}
        count="48 students"
        actions={(
            <>
                <Button text="Export" spacing="compact" iconBefore="download" onClick={() => {}} />
                <Button text="Add student" appearance="primary" spacing="compact" iconBefore="user-plus" onClick={() => {}} />
            </>
        )}
    />
);

const description = 'Optional supporting description for this section.';

const StatCard = ({ title, body }) => (
    <PatternCard style={{ flex: 1 }} minWidth="var(--card-min-width-sm)">
        <p style={{ margin: 0, font: 'var(--body-default)' }}>{title}</p>
        <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>{body}</p>
    </PatternCard>
);

export default {
    title: 'Templates/Section/Section',
    component: PatternSection,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        actions: { table: { disable: true } },
        tabs: { table: { disable: true } },
        toolbar: { table: { disable: true } },
        header: { table: { disable: true } },
        side: { table: { disable: true } },
        footer: { table: { disable: true } },
        onAddView: { table: { disable: true } },
        level: { control: false, table: { category: 'Design' } },
        title: { control: 'text', table: { category: 'Slots' } },
        description: { control: 'text', table: { category: 'Slots' } },
        type: {
            control: 'select',
            options: ['default', 'tabs', 'toolbar', 'custom', 'tabs-only'],
            table: { category: 'Design' },
        },
        layout: {
            control: 'select',
            options: ['single', 'split', 'subsections'],
            table: { category: 'Design' },
        },
        loading: { control: 'boolean', table: { category: 'State' } },
        gap: { control: false, table: { category: 'Design' } },
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

export const HeaderTabs = {
    name: 'Tabs header',
    render: () => (
        <PatternSection title="Students" description={description} actions={<Actions />} tabs={<ViewTabs />} onAddView={() => {}}>
            {slotContent('Content slot')}
        </PatternSection>
    ),
};

export const HeaderToolbar = {
    name: 'Toolbar header',
    render: () => (
        <PatternSection title="Students" description={description} toolbar={<DefaultToolbar />}>
            {slotContent('Table')}
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
                    <p style={{ margin: 0, font: 'var(--heading-medium)' }}>Week of October 20</p>
                    <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>12 sessions · 3 tutors out</p>
                </>
            )}
        >
            {slotContent('Content slot')}
        </PatternSection>
    ),
};

export const HeaderTabsOnly = {
    name: 'Tabs only header',
    render: () => (
        <PatternSection type="tabs-only" title="Students" tabs={<ViewTabs label="Students" />}>
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

/** `fill="subtle"`: the sunken surface with a pad and a radius, for a section that stands apart. */
export const FillSubtle = {
    name: 'Subtle fill',
    render: () => (
        <PatternSection title="Flag 3 of 12" description={description} fill="subtle">
            {slotContent('Record')}
        </PatternSection>
    ),
    play: async ({ canvasElement }) => {
        await expect(getComputedStyle(canvasElement.querySelector('.plus-pattern-section-fill-subtle')).borderTopLeftRadius, 'Section radius is 16').toBe('16px');
    },
};

/** A Card in a Section with a fill is nested and takes the compact radius; in an unfilled Section it keeps the Card radius. */
export const CardNesting = {
    name: 'Card in a Section',
    render: () => (
        <div style={col}>
            <PatternSection title="With a fill" fill="subtle" data-testid="filled">
                <StatCard title="Sessions this week" body="12 scheduled · 2 need a tutor" />
            </PatternSection>
            <PatternSection title="Without a fill" data-testid="plain">
                <StatCard title="Sessions this week" body="12 scheduled · 2 need a tutor" />
            </PatternSection>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const radius = (id) => getComputedStyle(canvasElement.querySelector(`[data-testid="${id}"] .plus-pattern-card`)).borderTopLeftRadius;
        await expect(radius('filled'), 'Card in a filled Section: 12').toBe('12px');
        await expect(radius('plain'), 'Card in an unfilled Section: 16').toBe('16px');
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

/** Every part of a section: header with actions and a tabs row, content, side and footer. */
export const Anatomy = () => (
    <PatternSection
        title="Upcoming sessions"
        description={description}
        actions={<Actions />}
        tabs={<ViewTabs />}
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
 * The view bar's Search: the icon grows left into the field. Esc clears, a
 * second Esc closes; it stays open while it holds text. The count is a polite
 * live region, and Reset filters clears the search with the filters.
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
            toolbar={(
                <PatternSection.Toolbar
                    count={narrowed ? `${rows.length} of ${SEARCH_STUDENTS.length} students` : `${SEARCH_STUDENTS.length} students`}
                    filters={narrowed ? <Button text="Reset filters" appearance="subtle" spacing="compact" onClick={reset} /> : null}
                    actions={(
                        <>
                            <SearchField mode="active" isCollapsible spacing="compact" placeholder="Search students" value={query} onValueChange={setQuery} />
                            <IconButton icon="filter" label="Filters" appearance="subtle" trailingMetric={activeOnly ? 1 : undefined} isSelected={activeOnly} onClick={() => setActiveOnly((on) => !on)} />
                            <Button text="Add student" appearance="primary" spacing="compact" iconBefore="user-plus" onClick={() => {}} />
                        </>
                    )}
                />
            )}
        >
            <ul style={{ margin: 0, paddingInlineStart: 'var(--space-250)', font: 'var(--body-default)' }}>
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

        await step('Reset filters clears the search too', async () => {
            await userEvent.click(icon());
            await userEvent.type(field(), 'sam');
            await userEvent.click(canvas.getByRole('button', { name: /^Filters/ }));
            expect(canvas.getByRole('status')).toHaveTextContent('1 of 6 students');
            await userEvent.click(canvas.getByRole('button', { name: 'Reset filters' }));
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
    name: 'Loading, toolbar',
    render: () => (
        <PatternSection title="Students" description={description} toolbar={<DefaultToolbar />} loading>
            {slotContent('Table')}
        </PatternSection>
    ),
};

export const LoadingTabsOnly = {
    name: 'Loading, tabs only',
    render: () => (
        <PatternSection type="tabs-only" title="Students" tabs={<ViewTabs label="Students" />} loading>
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
        const bottom = args.type === 'toolbar' ? { toolbar: <DefaultToolbar /> }
            : (args.type === 'tabs' || args.type === 'tabs-only') ? { tabs: <ViewTabs /> }
            : args.type === 'custom' ? { header: slotContent('Custom header') }
            : {};
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
            <div data-probe="wide" style={{ width: 960 }}>
                <PatternSection title="Wide" layout="split" side={slotContent('Side')}>{slotContent('Main')}</PatternSection>
            </div>
            <div data-probe="narrow" style={{ width: 600 }}>
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

/** Header to body is Section/stack-md; the tabs row sits Section/stack-sm under the title row. */
export const Spacing = {
    render: () => (
        <PatternSection title="Students" description={description} tabs={<ViewTabs />}>
            {slotContent('Content slot')}
        </PatternSection>
    ),
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        const q = (s) => canvasElement.querySelector(s).getBoundingClientRect();
        await expect(q('.plus-pattern-section-content').top - q('.plus-pattern-section-header').bottom, 'header to body')
            .toBeCloseTo(tokenLength(canvasElement, '--section-stack-md'), 0);
        await expect(q('.plus-pattern-section-tabs').top - q('.plus-pattern-section-title-row').bottom, 'title row to tabs')
            .toBeCloseTo(tokenLength(canvasElement, '--section-stack-sm'), 0);
        await expect(q('.plus-pattern-section-description').top - q('.plus-pattern-section-title').bottom, 'title to description')
            .toBeCloseTo(tokenLength(canvasElement, '--stack-sm'), 0);
    },
};

/* ------------------------------------------------- detail region */
/*
 * A Section with a `detail` region: a Compliance queue with the selected flag
 * beside it. Each width story sets the viewport first, then reads what a person
 * sees: the columns the list and the detail take, whether the Sidebar gave way
 * to the Panel, and what replaces what below 960.
 */

const resetPanel = () => { window.sessionStorage.removeItem(PANEL_STORAGE_KEY); };
const DETAIL_HEIGHT = 900;
const atViewport = (width, run) => withTestViewport(width, DETAIL_HEIGHT, run);

const FLAGS = [
    { id: 'f1', tutor: 'Maya Chen', reason: 'Session ended early', status: 'Open' },
    { id: 'f2', tutor: 'Jordan Reyes', reason: 'Missing reflection', status: 'Open' },
    { id: 'f3', tutor: 'Priya Nair', reason: 'Late start', status: 'In review' },
    { id: 'f4', tutor: 'Sam Okafor', reason: 'No student check-in', status: 'Open' },
];

const ChatPanel = () => {
    const panel = usePanelControl();
    return (
        <PanelContainer>
            <PanelHeader title="AI chat" actions={<PanelCloseAction onClick={() => panel?.setOpen(false)} />} />
            <PanelBody>Ask about this flag.</PanelBody>
        </PanelContainer>
    );
};

const ComplianceQueue = ({ withPanel = false, ...frameArgs }) => {
    const [index, setIndex] = useState(0);
    const [open, setOpen] = useState(true);
    const flag = FLAGS[index];
    const select = (i) => { setIndex(i); setOpen(true); };

    const list = (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)', listStyle: 'none', paddingLeft: 0, margin: 0 }}>
                {FLAGS.map((f, i) => (
                    <li key={f.id}>
                        <Button
                            text={`${f.tutor}: ${f.reason}`}
                            appearance={i === index && open ? 'default' : 'subtle'}
                            isSelected={i === index && open}
                            onClick={() => select(i)}
                        />
                    </li>
                ))}
            </ul>
    );

    return (
        <InAppFrame
            sectionDetail
            panel={withPanel ? <ChatPanel /> : undefined}
            defaultPanelOpen={withPanel}
            panelStorageKey={null}
            {...frameArgs}
        >
            <PatternSection
                title="Compliance queue"
                description={`${FLAGS.length} flags to review`}
                hasSelection={open}
                detail={(
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                        <StatusTag appearance={flag.status === 'Open' ? 'warning' : 'info'}>{flag.status}</StatusTag>
                        <p style={{ margin: 0 }}>{flag.reason}. Review the session notes, then decide.</p>
                    </div>
                )}
                detailTitle={`Flag: ${flag.tutor}`}
                detailDescription={flag.reason}
                detailFooter={<Button text="Open full review" appearance="subtle" iconAfter="arrow-up-right-from-square" onClick={() => {}} />}
                onBack={() => setOpen(false)}
                backLabel="Back to queue"
                onPrevious={() => select(index - 1)}
                onNext={() => select(index + 1)}
                previousDisabled={index === 0}
                nextDisabled={index === FLAGS.length - 1}
            >
                {list}
            </PatternSection>
        </InAppFrame>
    );
};

/* ------------------------------------------------------------- probes */

const rect = (el) => el.getBoundingClientRect();
const probes = (canvasElement) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('.plus-pattern-section-with-detail');
    return {
        canvas,
        root,
        list: () => root.querySelector('.plus-pattern-section-list'),
        detail: () => root.querySelector('.plus-pattern-section-detail'),
        sidebar: () => canvas.queryByRole('navigation', { name: 'Main' })?.closest('.plus-frame__sidebar') ?? null,
    };
};

/** `n` of the 12 columns across `total` pixels, with the 16 gutters between them. */
const spanWidth = (total, gutter, n) => ((total - 11 * gutter) / 12) * n + (n - 1) * gutter;

const expectSplit = async (p, contentWidth) => {
    const gutter = parseFloat(getComputedStyle(p.root).columnGap);
    const total = rect(p.root).width;
    await expect(total, 'content holds the split floor').toBeGreaterThanOrEqual(SECTION_DETAIL_FLOOR);
    await expect(total, 'content is the Frame minus Sidebar, Panel and the 48 pad').toBeCloseTo(contentWidth, 0);
    await expect(rect(p.list()).width, 'list spans 7 columns').toBeCloseTo(spanWidth(total, gutter, 7), 0);
    await expect(rect(p.detail()).width, 'detail spans 5 columns').toBeCloseTo(spanWidth(total, gutter, 5), 0);
    await expect(rect(p.detail()).left - rect(p.list()).right, 'a gutter apart').toBeCloseTo(gutter, 0);
    const section = p.detail().querySelector('section');
    await expect(getComputedStyle(section).backgroundColor, 'the detail has a fill').not.toBe('rgba(0, 0, 0, 0)');
    await expect(p.canvas.queryByRole('button', { name: 'Back to queue' }), 'no back link at the split').toBeNull();
};

/** A Section with a detail region: a Compliance queue with the selected flag beside it. */
export const Detail = { render: (args) => <ComplianceQueue {...args} />, parameters: { layout: 'fullscreen' },
    beforeEach: resetPanel };

/** The same layout with the Panel open, for the docs page. */
export const DetailWithPanel = { render: (args) => <ComplianceQueue {...args} />, parameters: { layout: 'fullscreen' },
    beforeEach: resetPanel, args: { withPanel: true } };

/** The Panel open without `sectionDetail`: the Frame keeps the Sidebar, so the detail replaces the list. For the Frame page's pair. */
export const DetailWithPanelNoSectionDetail = {
    render: (args) => <ComplianceQueue {...args} withPanel sectionDetail={false} />,
    parameters: { layout: 'fullscreen' },
    beforeEach: resetPanel,
};

/** 1440, no Panel: content is 1152, so the split holds with the Sidebar docked. */
export const DetailSplitAt1440 = {
    render: (args) => <ComplianceQueue {...args} />,
    parameters: { layout: 'fullscreen' },
    beforeEach: resetPanel,
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const p = probes(canvasElement);
        await waitFor(() => expect(p.detail(), 'the detail opens beside the list').not.toBeNull());
        await expect(p.sidebar(), 'the Sidebar stays docked').not.toBeNull();
        await expectSplit(p, 1440 - 240 - 48);
        const detail = within(p.detail());
        await expect(detail.getByRole('button', { name: 'Previous' }), 'first flag: no previous').toBeDisabled();
        await userEvent.click(detail.getByRole('button', { name: 'Next' }));
        await waitFor(() => expect(within(p.detail()).getByRole('heading', { name: 'Flag: Jordan Reyes' })).toBeInTheDocument());
        await expect(p.list(), 'the list stays while the detail steps').not.toBeNull();
    }),
};

/** 1440 with the 400 Panel open: the Sidebar collapses to keep 960, and the split holds. */
export const DetailSplitHoldsWithPanelAt1440 = {
    render: (args) => <ComplianceQueue {...args} />,
    parameters: { layout: 'fullscreen' },
    beforeEach: resetPanel,
    args: { withPanel: true },
    play: async ({ canvasElement }) => atViewport(1440, async () => {
        const p = probes(canvasElement);
        await waitFor(() => expect(canvasElement.querySelector('.plus-frame__panel'), 'the Panel is open').not.toBeNull());
        await waitFor(() => expect(p.sidebar(), 'the Sidebar collapsed to keep 960').toBeNull());
        await waitFor(() => expect(rect(p.root).width).toBeGreaterThanOrEqual(SECTION_DETAIL_FLOOR));
        await expectSplit(p, 1440 - 400 - 48);
        await expect(canvasElement.querySelector('.plus-frame__backdrop'), 'the Panel stays docked').toBeNull();
    }),
};

/** 1024: content is 736, under 960, so the detail replaces the list behind a back link. */
export const DetailReplacesListBelow960 = {
    render: (args) => <ComplianceQueue {...args} />,
    parameters: { layout: 'fullscreen' },
    beforeEach: resetPanel,
    play: async ({ canvasElement }) => atViewport(1024, async () => {
        const p = probes(canvasElement);
        await waitFor(() => expect(p.list(), 'the list is replaced').toBeNull());
        await expect(rect(p.root).width, 'content under the floor').toBeLessThan(SECTION_DETAIL_FLOOR);
        await expect(rect(p.detail()).width, 'the detail takes the row').toBeCloseTo(rect(p.root).width, 0);
        await userEvent.click(p.canvas.getByRole('button', { name: 'Back to queue' }));
        await waitFor(() => expect(p.list(), 'back to the list').not.toBeNull());
        await expect(p.detail(), 'the detail closes').toBeNull();
        await userEvent.click(p.canvas.getByRole('button', { name: /Maya Chen/ }));
        await waitFor(() => expect(p.list()).toBeNull());
        await expect(p.canvas.getByRole('heading', { name: 'Flag: Maya Chen' })).toBeInTheDocument();
    }),
};

/* ------------------------------------------------------ template page */
/*
 * The Section template page's examples: its types, its header types, the
 * side and the detail, its key states and its width behavior. Each is a
 * live Section of real PLUS components holding tutoring content. The view bar
 * slot is planned, so these stories compose it in the `tabs` row: pill views
 * at the start, then format switch, Search, filters, More and the labeled
 * Primary at the end.
 */

/** The width the queue and filter-side stories lay out at: past the 960 floor, so the detail and the side sit beside the list. */
const STAGE = SECTION_DETAIL_FLOOR + 64;

/** The Filter icon with its count, on the shipped FilterButton: named "Filters", read "Filters, 2 applied". */
const FiltersButton = ({ applied, onClick }) => (
    <FilterButton
        text="Filters"
        iconBefore="filter"
        hasChevronDown={false}
        appearance="subtle"
        trailingMetric={applied || undefined}
        isSelected={applied > 0}
        aria-label={applied ? `Filters, ${applied} applied` : 'Filters'}
        onClick={onClick}
    />
);



const SESSIONS = [
    ['Lincoln Middle', 'Tue 4:30 PM · 6 students'],
    ['Roosevelt K-8', 'Wed 3:00 PM · 4 students'],
    ['North High', 'Thu 5:00 PM · 5 students'],
];
const SessionCards = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--grid-gutter)' }}>
        {SESSIONS.map(([title, when]) => <PatternCard key={title} title={title} description={when} />)}
    </div>
);

/** Label and value pairs, in two columns. */
const Facts = ({ pairs, columns = 2 }) => (
    <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 'var(--stack-lg) var(--grid-gutter)' }}>
        {pairs.map(([label, value]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                <dt style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>{label}</dt>
                <dd style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>{value}</dd>
            </div>
        ))}
    </dl>
);

const STUDENT_FACTS = [['School', 'Lincoln Middle School'], ['Grade', 'Grade 7'], ['Tutor', 'Priya Nair'], ['Sessions', '12 this term']];

/* ---- types */

/** List: the view bar alone, one table, paging. */
export const TypeList = {
    name: 'Type: List',
    render: () => (
        <PatternSection title="Students" type="tabs-only" tabs={<ViewBar views={['All students', 'Needs follow-up']} />}>
            <StudentsTable count={6} rowsPerPage={4} />
        </PatternSection>
    ),
};

/** Queue: a list with a detail, worked through one record at a time. */
export const TypeQueue = {
    name: 'Type: Queue',
    render: () => {
        const [index, setIndex] = useState(0);
        const [name, grade] = STUDENTS[index];
        return (
            <div style={{ inlineSize: STAGE }}>
                <PatternSection
                    title="Reflections to review"
                    tabs={<ViewBar views={['To review']} primary={null} />}
                    detailTitle={name}
                    detailDescription={grade}
                    detail={<p style={{ margin: 0, font: 'var(--body-default)' }}>The reflection names two goals for next week.</p>}
                    detailFooter={<Button text="Open full review" appearance="subtle" onClick={() => {}} />}
                    onPrevious={() => setIndex(index - 1)}
                    onNext={() => setIndex(index + 1)}
                    previousDisabled={index === 0}
                    nextDisabled={index === 3}
                >
                    <StudentsTable count={4} />
                </PatternSection>
            </div>
        );
    },
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

/** Main and side: the side at the end, no fill, facts beside the main content. */
export const TypeMainAndSide = {
    name: 'Type: Main and side',
    render: () => (
        <PatternSection title="Lincoln Middle" description="Tuesdays at 4:30 PM" layout="split" side={<Facts pairs={STUDENT_FACTS.slice(0, 3)} columns={1} />}>
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

/* ---- header types */

/** Title: a title and a description, nothing to act on. */
export const HeaderTypeTitle = {
    name: 'Header: Title',
    render: () => (
        <PatternSection title="Upcoming sessions" description="Next 7 days">
            <SessionCards />
        </PatternSection>
    ),
};

/** Title and actions: actions in the title row, only when there is no view bar. */
export const HeaderTypeTitleAndActions = {
    name: 'Header: Title and actions',
    render: () => (
        <PatternSection
            title="Students"
            description="Lincoln Middle · 24 students"
            actions={(
                <>
                    <Button text="Export" iconBefore="download" onClick={() => {}} />
                    <Button text="Add students" iconBefore="user-plus" appearance="primary" onClick={() => {}} />
                </>
            )}
        >
            <StudentsTable count={3} />
        </PatternSection>
    ),
};

/** View bar, one view: one pill names the rows and stays. */
export const HeaderTypeViewBarOneView = {
    name: 'Header: View bar, one view',
    render: () => (
        <PatternSection title="Students" description="Lincoln Middle · 24 students" tabs={<ViewBar views={['All students']} />}>
            <StudentsTable count={3} />
        </PatternSection>
    ),
};

/** View bar, several views of the same rows. */
export const HeaderTypeViewBarSeveralViews = {
    name: 'Header: View bar, several views',
    render: () => (
        <PatternSection title="Students" description="Lincoln Middle · 24 students" tabs={<ViewBar views={['All students', 'Needs follow-up', 'Paused']} />}>
            <StudentsTable count={3} />
        </PatternSection>
    ),
};

/** Format switch: equal-width segments, first on the right. */
export const HeaderTypeFormatSwitch = {
    name: 'Header: Format switch',
    render: () => (
        <PatternSection title="Sessions" description="This term" tabs={<ViewBar views={['Upcoming', 'Past']} format primary="New session" />}>
            <StudentsTable count={3} />
        </PatternSection>
    ),
};

/** View bar alone: the page title names the collection, so the title row is hidden from sight. */
export const HeaderTypeViewBarAlone = {
    name: 'Header: View bar alone',
    render: () => (
        <PatternSection title="Students" type="tabs-only" tabs={<ViewBar views={['All students', 'Needs follow-up']} />}>
            <StudentsTable count={3} />
        </PatternSection>
    ),
};

/** Under page tabs: the views become one labeled Select at the start of the bar. */
export const HeaderTypeUnderPageTabs = {
    name: 'Header: Under page tabs',
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)' }}>
            <TabsComponent defaultActiveKey="sessions" aria-label="Student pages">
                <TabsComponent.Tab eventKey="overview">Overview</TabsComponent.Tab>
                <TabsComponent.Tab eventKey="sessions">Sessions</TabsComponent.Tab>
                <TabsComponent.Tab eventKey="notes">Notes</TabsComponent.Tab>
            </TabsComponent>
            <PatternSection
                title="Sessions"
                type="tabs-only"
                tabs={(
                    <ViewBar
                        start={(
                            <div style={{ inlineSize: 'var(--card-min-width-sm)' }}>
                                <Select
                                    aria-label="Status"
                                    spacing="compact"
                                    clearable={false}
                                    defaultValue="upcoming"
                                    options={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }, { value: 'canceled', label: 'Canceled' }]}
                                />
                            </div>
                        )}
                        primary="New session"
                    />
                )}
            >
                <StudentsTable count={3} />
            </PatternSection>
        </div>
    ),
};

/** Subsection: any type nests once; the title drops to an h3 and the view bar keeps its size. */
export const HeaderTypeSubsection = {
    name: 'Header: Subsection',
    render: () => (
        <PatternSection title="Lincoln Middle">
            <PatternSection title="Students" tabs={<ViewBar views={['All students']} />}>
                <StudentsTable count={3} />
            </PatternSection>
        </PatternSection>
    ),
};

/* ---- side and detail */

/** Side at the end: a summary beside the body, no fill; the header spans the full width. */
export const SideAtEnd = {
    name: 'Side at the end',
    render: () => (
        <PatternSection
            title="Lincoln Middle"
            tabs={<ViewBar views={['All students']} />}
            layout="split"
            side={<Facts pairs={[['Tutor', 'Priya Nair'], ['Meets', 'Tuesdays, 4:30 PM'], ['Room', 'Library 2']]} columns={1} />}
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
    const table = <StudentsTable count={5} />;
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
                description="Lincoln Middle · 24 students"
                tabs={(
                    <ViewBar
                        views={['All students']}
                        narrow={narrow}
                        filters={sideFits ? null : <FiltersButton applied={checked.length} onClick={() => setShowFilters(true)} />}
                    />
                )}
            >
                {body}
            </PatternSection>
        </div>
    );
};

/** Filter side at the start, when filtering is the main job. */
export const FilterSideAtStart = {
    name: 'Filter side at the start',
    render: () => <div style={{ inlineSize: STAGE }}><FilterSideSection /></div>,
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
        await expect(filters(), 'the Filter icon returns, named with its count').toHaveAccessibleName('Filters, 2 applied');
        await expect(filters()).toHaveTextContent('2');
        await expect(canvas.getByRole('button', { name: 'Add students' }), 'the Primary keeps its label').toHaveTextContent('Add students');

        await userEvent.click(filters());
        await waitFor(() => expect(side(), 'the filters take the whole width').not.toBeNull());
        await expect(canvas.queryByRole('table'), 'in place of the table').toBeNull();
        await userEvent.click(canvas.getByRole('button', { name: 'Show results' }));
        await waitFor(() => expect(canvas.getByRole('table')).toBeInTheDocument());

        setWidth(FRAME_LAYOUT.fullWidthBelow - 64);
        await waitFor(() => expect(canvas.getByRole('button', { name: 'Add students' }), 'below 768 the Primary keeps only its icon').not.toHaveTextContent('Add students'));
        await expect(filters()).toHaveAccessibleName('Filters, 2 applied');

        setWidth(SECTION_DETAIL_FLOOR + 64);
        await waitFor(() => expect(side(), 'back to the side').not.toBeNull());
        await expect(filters()).toBeNull();
    },
};

/* ---- key states */

/** Rows selected: the Dynamic table's head row becomes the bulk bar; no Cancel. */
export const RowsSelected = {
    name: 'Rows selected',
    render: () => (
        <PatternSection title="Students" description="Lincoln Middle · 24 students" tabs={<ViewBar views={['All students', 'Needs follow-up']} />}>
            <StudentsTable
                count={4}
                isSelectable
                defaultSelectedRowKeys={[STUDENTS[0][0], STUDENTS[2][0]]}
                bulkActions={[{ label: 'Move to group' }, { label: 'Remove from group' }]}
            />
        </PatternSection>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const head = within(canvasElement.querySelector('thead'));
        await expect(head.getByText('2 selected'), 'the head row says how many').toBeInTheDocument();
        await expect(head.getByRole('button', { name: 'Move to group' })).toBeInTheDocument();
        await expect(head.getByRole('checkbox', { name: 'Select all rows' })).toBePartiallyChecked();
        await expect(canvas.queryByRole('button', { name: /Cancel|Clear/ }), 'no Cancel: the checkboxes clear it').toBeNull();
        await expect(canvas.getByRole('tab', { name: 'All students' }), 'the view bar stays put').toBeInTheDocument();
        await userEvent.click(canvas.getByRole('checkbox', { name: 'Select all rows' }));
        await userEvent.click(canvas.getByRole('checkbox', { name: 'Select all rows' }));
        await waitFor(() => expect(head.queryByText(/selected/), 'clearing brings the column heads back').toBeNull());
        await expect(head.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    },
};

/** Empty, in a table: the empty state replaces the whole table, headers and footer too. */
export const EmptyInTable = {
    name: 'Empty, in a table',
    render: () => (
        <PatternSection title="Students" description="Lincoln Middle · 24 students" tabs={<ViewBar views={['All students', 'Needs follow-up']} />}>
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

/** Every part once: a queue with a view bar, a detail and a footer. */
export const AnatomyQueue = {
    name: 'Anatomy',
    render: () => (
        <div style={{ inlineSize: STAGE }}>
            <PatternSection
                data-anatomy-root
                title="Reflections to review"
                description="Week of Oct 20"
                tabs={<ViewBar views={['To review', 'Done']} primary={null} />}
                detailTitle="Ava Thompson"
                detailDescription="Grade 7"
                detail={<p style={{ margin: 0, font: 'var(--body-default)' }}>The reflection names two goals for next week.</p>}
                detailFooter={<Button text="Open full review" appearance="subtle" onClick={() => {}} />}
                onPrevious={() => {}}
                onNext={() => {}}
                previousDisabled
                footer={<Button text="View all" appearance="subtle" onClick={() => {}} />}
            >
                <StudentsTable count={4} />
            </PatternSection>
        </div>
    ),
};
