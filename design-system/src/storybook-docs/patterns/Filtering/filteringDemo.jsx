import React, { useEffect, useRef, useState } from 'react';

import { Button, DynamicTable, EmptyState, FilterButton, FilterMenu, IconButton, PopupSelect, Tabs } from '@/components';
import { PatternSection, SECTION_DETAIL_FLOOR } from '@/patterns';
import { FRAME_LAYOUT } from '@/patterns/Frame/frameLayout';
import { useOwnWidth } from '@/patterns/Frame/useOwnWidth';
import { FilterSide, ViewBar, useLayerMount } from '@/storybook-docs/lib/view-bar.jsx';

/**
 * The Filtering pattern's examples: a real Section with its view bar, the
 * filters at the bar's end in one tier, and the real menus. A held-open menu
 * mounts inside its picture (`container`), so it scales and clips with it.
 *
 *   FilteredStudents   the Section, its bar in one tier, its rows narrowing
 *   ROSTER             tutoring rows the filters narrow
 */

/** The width a tier's picture lays out at: past the Section's 960, so a filter side sits beside its rows. Docs geometry, in px. */
export const STAGE = 1024;

/** The room a held-open picture keeps, so its menu hangs below its trigger whole: a stacked menu runs to its max height. Docs geometry, in px. */
const OPEN_ROOM = { short: 440, stacked: 640 };

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

const HEAD = { cells: ['Name', 'Grade', 'School', 'Subject'].map((content) => ({ key: content, content })) };

const StudentsTable = ({ rows }) => (
    <DynamicTable
        head={HEAD}
        rows={rows.map(([name, grade, school, subject]) => ({
            key: name,
            cells: [name, grade, school, subject].map((content) => ({ key: content, content })),
        }))}
        label="Students"
        isFixedSize
    />
);

const noop = () => {};

/** A filter side's values, one flat list; the side counts each category. */
const flat = (value) => Object.values(value).flat();

/**
 * Tier 1: a FilterButton per category, each opening its own list at the
 * bar's end, applied as you pick. The list is a Popup select, one value at a
 * time; several at once is Planned on it.
 */
const QuickFilter = ({ category, value, onPick, open, mount }) => {
    const picked = value[category.id][0];
    return (
        <PopupSelect
            label={category.label}
            options={category.options}
            value={picked ?? null}
            onChange={(next) => onPick(category.id, next === picked ? [] : [next])}
            isSearchable={false}
            placement="bottom-end"
            {...(open ? { open: true, onOpenChange: noop } : {})}
            container={mount ?? undefined}
            trigger={<FilterButton text={category.label} appearance="subtle" trailingMetric={picked ? 1 : undefined} isSelected={Boolean(picked)} />}
        />
    );
};

/** Tier 2a: the Filter icon opens one list, applied as you pick, with no footer. */
const OneListMenu = ({ category, value, onPick, open, mount }) => {
    const picked = value[category.id][0];
    return (
        <PopupSelect
            label={category.label}
            options={category.options}
            value={picked ?? null}
            onChange={(next) => onPick(category.id, next === picked ? [] : [next])}
            isSearchable={false}
            placement="bottom-end"
            {...(open ? { open: true, onOpenChange: noop } : {})}
            container={mount ?? undefined}
            trigger={<IconButton icon="filter" label="Filters" appearance="subtle" trailingMetric={picked ? 1 : undefined} />}
        />
    );
};

/**
 * The view bar's filters in one tier, and what the rows show.
 *
 * @param {object} props
 * @param {'1'|'2a'|'2b'|'2c'|'3'} props.tier
 * @param {string[]} props.categories  category ids, in order
 * @param {object} [props.initial]  the values applied at first, by category id
 * @param {string} [props.openMenu]  holds a menu open for a picture: a category id (tier 1) or `filters`
 * @param {string[]} [props.views]  the pill views at the bar's start
 * @param {(mount: Element | null) => React.ReactNode} [props.start]  the bar's start in place of the pills (a view picker), given the picture's mount
 */
export const FilteredStudents = ({ tier, categories, initial = {}, openMenu, views = ['All students', 'Needs follow-up'], start }) => {
    const ref = useRef(null);
    const width = useOwnWidth(ref, STAGE);
    const [setMount, mount] = useLayerMount();
    const blank = Object.fromEntries(categories.map((id) => [id, []]));
    const [value, setValue] = useState({ ...blank, ...initial });
    const [showSide, setShowSide] = useState(false);
    const cats = categories.map((id) => CATEGORIES[id]);
    const pick = (id, next) => setValue((current) => ({ ...current, [id]: next }));
    const reset = () => setValue(blank);
    const rows = narrow(value);
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
    // A held-open menu waits for the picture's element: opened on the first render it would mount on the page, and stay there.
    const held = (id) => mount !== null && openMenu === id;

    let filters = null;
    if (tier === '1' && !folded) {
        filters = cats.map((category) => (
            <QuickFilter key={category.id} category={category} value={value} onPick={pick} open={held(category.id)} mount={mount} />
        ));
    } else if (tier === '2a') {
        filters = <OneListMenu category={cats[0]} value={value} onPick={pick} open={held('filters')} mount={mount} />;
    } else if (tier === '2b' || tier === '2c' || folded) {
        filters = (
            <FilterMenu
                categories={cats}
                value={value}
                onApply={setValue}
                layout={tier === '2b' ? 'side-by-side' : 'stacked'}
                {...(held('filters') ? { open: true, onOpenChange: noop } : {})}
                container={mount ?? undefined}
            />
        );
    } else if (tier === '3' && !sideFits) {
        filters = <IconButton icon="filter" label="Filters" appearance="subtle" trailingMetric={count || undefined} onClick={() => setShowSide(true)} />;
    }

    const status = <span role="status" style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>{countWords(rows, value)}</span>;
    const results = rows.length > 0 ? <StudentsTable rows={rows} /> : (
        <EmptyState
            spacing="compact"
            icon="user-group"
            header="No students match these filters"
            description={`Nothing matches ${flat(value).join(' and ')}. Reset the filters to see every student.`}
            primaryAction={<Button text="Reset filters" appearance="primary" onClick={reset} />}
        />
    );

    let body = <>{status}{results}</>;
    if (tier === '3') {
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
        if (sideFits) {
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
                    boxSizing: 'border-box',
                    // The page's own pad, so a menu at the bar's start is not pushed off its trigger by the picture's edge.
                    padding: 'var(--page-pad)',
                    minBlockSize: openMenu ? OPEN_ROOM[tier === '2c' ? 'stacked' : 'short'] : undefined,
                    '--plus-overlay-screen': `${READ_SCREEN}px`,
                }}
            >
                <PatternSection
                    title="Students"
                    description="Algebra B"
                    tabs={<ViewBar views={views} start={start ? start(mount) : undefined} filters={filters} primary="Add students" narrow={width < FRAME_LAYOUT.fullWidthBelow} />}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>{body}</div>
                </PatternSection>
            </div>
        </div>
    );
};

/** The view picker under page tabs: a Popup select at the bar's start, picking a view, not a filter. */
export const ViewPicker = ({ open = false, mount }) => (
    <PopupSelect
        label="View"
        options={['All students', 'Needs follow-up', 'New this term']}
        defaultValue="All students"
        isSearchable={false}
        placement="bottom-start"
        {...(open && mount ? { open: true, onOpenChange: noop } : {})}
        container={mount ?? undefined}
    />
);

/** Page tabs above the Section: the student's pages. */
export const PageTabs = () => (
    <Tabs defaultActiveKey="students" aria-label="Group pages">
        <Tabs.Tab eventKey="overview">Overview</Tabs.Tab>
        <Tabs.Tab eventKey="students">Students</Tabs.Tab>
        <Tabs.Tab eventKey="sessions">Sessions</Tabs.Tab>
    </Tabs>
);
