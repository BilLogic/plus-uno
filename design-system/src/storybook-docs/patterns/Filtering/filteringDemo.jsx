import React, { useEffect, useRef, useState } from 'react';

import { Button, EmptyState, FilterMenu, IconButton, PopupSelect, Skeleton } from '@/components';
import { LoadThenReveal } from '@/lib/loadRevealMotion';
import { SwapInPlace } from '@/lib/swapMotion';
import { Page, Card, Section, SECTION_DETAIL_FLOOR } from '@/templates';
import { FRAME_LAYOUT } from '@/templates/Frame/frameLayout';
import { useOwnWidth } from '@/templates/Frame/useOwnWidth';
import { PageTabs, SessionsTable } from '@/templates/Page/pageDemo.jsx';
import { SectionActions, categoryFilters } from '@/storybook-docs/lib/section-header.jsx';
import { FilterSide, StudentsTable, ViewPills, useLayerMount } from '@/storybook-docs/lib/view-bar.jsx';

/**
 * The Filtering pattern's examples: a real Section with its view bar, the
 * filters at the bar's end in one tier, and the real menus. A held-open menu
 * mounts inside its picture (`container`), so it scales and clips with it.
 *
 *   FilteredStudents   the Section, its bar in one tier, its rows narrowing
 *   ROSTER             tutoring rows the filters narrow
 */

/** The width a tier's picture lays out at: past the Section's 960, so a filter side sits beside its rows. Docs geometry, in px. */
export const STAGE = 1024; // docs-literal: stage width, px

/** The room a held-open picture keeps, so its menu hangs below its trigger whole: a stacked menu runs to its max height. Docs geometry, in px. */
const OPEN_ROOM = { short: 500, stacked: 700 };

/** A Popup reads its column steps against the screen; a picture reads them at this one, in px. Docs geometry. */
const READ_SCREEN = 1280;

/** The rows: name, grade, school, subject, tutor. */
export const ROSTER = [
    ['Ava Thompson', 'Grade 7', 'Lincoln Middle', 'Math', 'Priya Nair'],
    ['Marcus Lee', 'Grade 8', 'Lincoln Middle', 'Reading', 'Sam Ortiz'],
    ['Sofia Ramirez', 'Grade 7', 'Roosevelt Middle', 'Math', 'Priya Nair'],
    ['Jordan Patel', 'Grade 6', 'Roosevelt Middle', 'Science', 'Dana Kim'],
    ['Emily Chen', 'Grade 8', 'Lincoln Middle', 'Math', 'Sam Ortiz'],
    ['Noah Williams', 'Grade 6', 'Lincoln Middle', 'Reading', 'Dana Kim'],
    ['Leah Brooks', 'Grade 7', 'Roosevelt Middle', 'Science', 'Priya Nair'],
    ['Diego Flores', 'Grade 8', 'Roosevelt Middle', 'Math', 'Dana Kim'],
];

const COLUMN = { grade: 1, school: 2, subject: 3, tutor: 4 };

/** The categories a filter can narrow by, each a short list. */
export const CATEGORIES = {
    grade: { id: 'grade', label: 'Grade', options: ['Grade 6', 'Grade 7', 'Grade 8'] },
    school: { id: 'school', label: 'School', options: ['Lincoln Middle', 'Roosevelt Middle'] },
    subject: { id: 'subject', label: 'Subject', options: ['Math', 'Reading', 'Science'] },
    tutor: { id: 'tutor', label: 'Tutor', options: ['Dana Kim', 'Priya Nair', 'Sam Ortiz'] },
};

/** How many values are on, across every category. */
export const appliedCount = (value) => Object.values(value).reduce((sum, picked) => sum + picked.length, 0);

/** The rows every category keeps: a category with nothing picked keeps every row. */
export const narrow = (value) => ROSTER.filter((rowValues) => Object.entries(value)
    .every(([category, picked]) => picked.length === 0 || picked.includes(rowValues[COLUMN[category]])));

/** The result count in words, read politely as the rows narrow. */
export const countWords = (rows, value) => (appliedCount(value) > 0 ? `${rows.length} of ${ROSTER.length} students` : `${ROSTER.length} students`);

const ROSTER_COLUMNS = ['Name', 'Grade', 'School', 'Subject'];

/** A filter side's values, one flat list; the side counts each category. */
const flat = (value) => Object.values(value).flat();

/** The Filter trigger of a tier 2 menu: the Filter icon button in the third row, its count the values applied. */
export const filterTrigger = (count, menu) => [{
    key: 'filters',
    text: 'Filters',
    isSelected: count > 0,
    menu: () => menu(<IconButton icon="filter" label="Filters" trailingMetric={count} />),
}];

/** Tier 2a: the Filter trigger opens one list, applied as you pick, with no footer. */
const oneListFilters = ({ category, value, onPick, menuProps, mount }) => {
    const picked = value[category.id][0];
    return filterTrigger(picked ? 1 : 0, (trigger) => (
        <PopupSelect
            label={category.label}
            options={category.options}
            value={picked ?? null}
            onChange={(next) => onPick(category.id, next === picked ? [] : [next])}
            isSearchable={false}
            placement="bottom-start"
            {...menuProps}
            container={mount ?? undefined}
            trigger={trigger}
        />
    ));
};

/**
 * The Section's filters in one tier, in its third header row, and what the rows show.
 *
 * @param {object} props
 * @param {'1'|'2a'|'2b'|'2c'|'3'} props.tier
 * @param {string[]} props.categories  category ids, in order
 * @param {object} [props.initial]  the values applied at first, by category id
 * @param {string} [props.openMenu]  holds a menu open for a picture: a category id (tier 1) or `filters`
 * @param {string[]} [props.views]  the pill views at the bar's start
 * @param {(mount: Element | null) => React.ReactNode} [props.start]  the bar's start in place of the pills (a view picker), given the picture's mount
 */
export const FilteredStudents = ({
    tier,
    categories,
    initial = {},
    openMenu,
    views = ['All students', 'Needs follow-up'],
    start,
    loading = false,
    pageTabs = false,
}) => {
    const ref = useRef(null);
    const width = useOwnWidth(ref, STAGE);
    const [setMount, mount] = useLayerMount();
    const blank = Object.fromEntries(categories.map((id) => [id, []]));
    const [value, setValue] = useState({ ...blank, ...initial });
    const [activeView, setActiveView] = useState(views[0]);
    const [pageTab, setPageTab] = useState('students');
    const [showSide, setShowSide] = useState(false);
    const [activeMenu, setActiveMenu] = useState(openMenu ?? null);
    const cats = categories.map((id) => CATEGORIES[id]);
    const pick = (id, next) => setValue((current) => ({ ...current, [id]: next }));
    const reset = () => setValue(blank);
    const baseRows = narrow(value);
    const rows = activeView === 'Needs follow-up'
        ? baseRows.filter((_, index) => index % 2 === 1)
        : activeView === 'New this term'
            ? baseRows.slice(0, 3)
            : baseRows;
    const count = appliedCount(value);

    // A held-open picture shows the open layer, not the focus ring a real open moves into it.
    useEffect(() => {
        if (!mount || !openMenu) return undefined;
        // A picture drawn at a scale lays out after the layer first places itself, so the layer is placed again once it has settled.
        const replace = setTimeout(() => window.dispatchEvent(new Event('resize')), 250); // docs-literal: after the picture is scaled
        const blur = setTimeout(() => { if (mount.contains(document.activeElement)) document.activeElement.blur(); }, 400); // docs-literal: after the open settles
        return () => { clearTimeout(replace); clearTimeout(blur); };
    }, [mount, openMenu]);

    // Below 768 quick filters fold into a stacked menu behind the Filter icon; below 960 a filter side hides and the Filter icon returns.
    const folded = tier === '1' && width < FRAME_LAYOUT.fullWidthBelow;
    const sideFits = width >= SECTION_DETAIL_FLOOR;
    const menuProps = (id) => (openMenu
        ? {
            isOpen: mount !== null && activeMenu === id,
            onOpenChange: (next) => setActiveMenu(next ? id : null),
        }
        : {});

    // The Section draws row 3 itself: every tier hands it triggers, and a folded or side-less width opens the side. A menu a trigger opens is the trigger's `menu`.
    const opensSide = (entries) => entries.map(({ menu, ...entry }) => ({ ...entry, onClick: () => setShowSide(true) }));
    let filters;
    if (tier === '1') {
        filters = folded ? opensSide(categoryFilters(cats, value, pick)) : categoryFilters(cats, value, pick, { mount, menuProps });
    } else if (tier === '2a') {
        filters = oneListFilters({ category: cats[0], value, onPick: pick, menuProps: menuProps('filters'), mount });
    } else if (tier === '2b' || tier === '2c') {
        filters = filterTrigger(appliedCount(value), (trigger) => (
            <FilterMenu
                categories={cats}
                value={value}
                onApply={setValue}
                layout={tier === '2b' ? 'side-by-side' : 'stacked'}
                placement="bottom-start"
                {...menuProps('filters')}
                container={mount ?? undefined}
                trigger={trigger}
            />
        ));
    } else if (tier === '3' && !sideFits) {
        filters = opensSide(categoryFilters(cats, value, pick));
    }

    // A menu a press opens mounts where `container` points at that moment: until the picture's element is in state, that menu waits, so none lands on the page. A held-open menu waits on its own (`held`).
    if (mount === null && !openMenu && filters?.some((entry) => entry.menu)) filters = undefined;

    const status = <span role="status" style={{ font: 'var(--body-sm)', color: 'var(--ds-text-subtle)' }}>{countWords(rows, value)}</span>;
    const swapKey = `${activeView}:${JSON.stringify(value)}`;
    const rawResults = rows.length > 0 ? <StudentsTable rows={rows} columns={ROSTER_COLUMNS} /> : (
        <EmptyState
            spacing="compact"
            icon="user-group"
            header="No students match these filters"
            description={`Nothing matches ${flat(value).join(' and ')}. Reset the filters to see every student.`}
            primaryAction={<Button text="Reset filters" appearance="primary" spacing="compact" onClick={reset} />}
        />
    );
    const resultsSkeleton = ({ reduced }) => (
        <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
            {Array.from({ length: 4 }, (_, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 1fr', gap: 'var(--inline-lg)' }}>
                    <Skeleton shape="text" width="70%" isShimmering={!reduced} />
                    <Skeleton shape="text" width="60%" isShimmering={!reduced} />
                    <Skeleton shape="text" width="65%" isShimmering={!reduced} />
                    <Skeleton shape="text" width="55%" isShimmering={!reduced} />
                </div>
            ))}
        </div>
    );
    const results = (
        <LoadThenReveal loading={loading} skeleton={resultsSkeleton}>
            <SwapInPlace swapKey={swapKey}>
                {rawResults}
            </SwapInPlace>
        </LoadThenReveal>
    );

    let body = <>{status}{results}</>;
    if (tier === '3' || folded) {
        const toggle = (v) => {
            const id = cats.find((category) => category.options.includes(v)).id;
            pick(id, value[id].includes(v) ? value[id].filter((x) => x !== v) : [...value[id], v]);
        };
        const side = (
            <FilterSide
                checked={flat(value)}
                onToggle={toggle}
                onReset={reset}
                filters={cats.map((category) => [category.label, category.options])}
            />
        );
        if (tier === '3' && sideFits) {
            body = (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(var(--section-min-width-side), 3fr) minmax(0, 9fr)', gap: 'var(--grid-gutter)' }}>
                    <section aria-label="Filters">{side}</section>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>{status}{results}</div>
                </div>
            );
        } else if (showSide) {
            body = (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
                    <section aria-label="Filters">{side}</section>
                    <div><Button text="Show results" appearance="primary" onClick={() => setShowSide(false)} /></div>
                </div>
            );
        }
    }

    return (
        <div ref={ref}>
            <div
                ref={setMount}
                data-filter-stage
                style={{
                    position: 'relative',
                    '--plus-overlay-screen': `${READ_SCREEN}px`,
                }}
            >
                <Page
                    header={pageTabs ? <PageTabs active={pageTab} onSelect={setPageTab} labels={['Overview', 'Students', 'Sessions']} aria-label="Group pages" /> : undefined}
                    style={{ minBlockSize: openMenu ? OPEN_ROOM[tier === '2c' ? 'stacked' : 'short'] : undefined }}
                >
                    {pageTabs && pageTab === 'overview' && (
                        <Section title="Lincoln Middle">
                            <Card title="Tuesdays & Thursdays · 4:30 PM" description="Priya Nair · 8 students enrolled this term." />
                        </Section>
                    )}
                    {pageTabs && pageTab === 'sessions' && (
                        <Section title="Sessions">
                            <SessionsTable />
                        </Section>
                    )}
                    {(!pageTabs || pageTab === 'students') && (
                        <Section
                            title="Students"
                            description="Lincoln Middle"
                            actions={<SectionActions primary="Add students" more={false} />}
                            views={start
                                ? start(mount, {
                                    activeView,
                                    onViewChange: setActiveView,
                                    open: openMenu === 'view' ? mount !== null && activeMenu === 'view' : undefined,
                                    onOpenChange: openMenu === 'view' ? (next) => setActiveMenu(next ? 'view' : null) : undefined,
                                })
                                : <ViewPills views={views} activeView={activeView} onViewChange={setActiveView} />}
                            filters={filters}
                            onClearAll={reset}
                            onOpenFilters={() => setShowSide(true)}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>{body}</div>
                        </Section>
                    )}
                </Page>
            </div>
        </div>
    );
};

/** The view picker under page tabs: a Popup select at the bar's start, picking a view, not a filter. */
export const ViewPicker = ({ open = false, onOpenChange, mount, value, onChange }) => (
    <PopupSelect
        label="View"
        options={['All students', 'Needs follow-up', 'New this term']}
        {...(value !== undefined ? { value, onChange } : { defaultValue: 'All students' })}
        isSearchable={false}
        placement="bottom-start"
        {...(open && mount && onOpenChange ? { isOpen: open, onOpenChange } : {})}
        container={mount ?? undefined}
    />
);
