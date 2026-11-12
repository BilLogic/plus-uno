import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button, IconButton, PanelBody, PanelCloseAction, PanelContainer, PanelHeader, StatusTag, TextField, Tabs as TabsComponent } from '@/components';
import { PANEL_STORAGE_KEY, PatternCard, PatternSection, SECTION_DETAIL_FLOOR, usePanelControl } from '@/patterns';
import { withTestViewport } from '@/storybook-docs/lib/test-viewport.js';
import { tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { InAppFrame, slotContent } from '@/storybook-docs/lib/pattern-demo.jsx';
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
    title: 'Patterns/Section/Section',
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
        padding: { table: { disable: true } },
        background: { table: { disable: true } },
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

const STUDENTS = [
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
    const rows = STUDENTS.filter((student) => (!activeOnly || student.active)
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
                    count={narrowed ? `${rows.length} of ${STUDENTS.length} students` : `${STUDENTS.length} students`}
                    filters={narrowed ? <Button text="Reset filters" appearance="subtle" spacing="compact" onClick={reset} /> : null}
                    actions={(
                        <>
                            <PatternSection.Search label="Search students" value={query} onValueChange={setQuery} />
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
            const root = field().closest('.plus-section-search');
            expect(getComputedStyle(root).animationName).toBe('plus-section-search-grow');
            expect(getComputedStyle(root).justifyContent).toBe('flex-end');
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
            expect(icon().closest('.plus-section-search')).toHaveClass('plus-section-search--shrink');
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
        await expect(canvasElement.querySelector('.plus-frame__blanket'), 'the Panel stays docked').toBeNull();
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
