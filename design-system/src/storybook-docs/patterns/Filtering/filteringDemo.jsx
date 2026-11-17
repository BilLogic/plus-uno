import React, { useEffect, useRef, useState } from 'react';

import { Button, EmptyState, FilterButton, FilterMenu, IconButton, PopupSelect, Skeleton, Tag, TagGroup } from '@/components';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { LoadThenReveal } from '@/lib/loadRevealMotion';
import { SwapInPlace } from '@/lib/swapMotion';
import { Page, PatternCard, PatternSection, SECTION_DETAIL_FLOOR } from '@/patterns';
import { FRAME_LAYOUT } from '@/patterns/Frame/frameLayout';
import { useOwnWidth } from '@/patterns/Frame/useOwnWidth';
import { PageTabs, SessionsTable } from '@/patterns/Page/pageDemo.jsx';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { FilterSide, StudentsTable, ViewBar, ViewPills, row, useLayerMount } from '@/storybook-docs/lib/view-bar.jsx';

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

const ROSTER_COLUMNS = ['Name', 'Grade', 'School', 'Subject'];

/** A filter side's values, one flat list; the side counts each category. */
const flat = (value) => Object.values(value).flat();

/**
 * Tier 1: a FilterButton per category, each opening its own list at the
 * bar's end, applied as you pick. The list is a Popup select, one value at a
 * time; several at once is Planned on it.
 */
const QuickFilter = ({ category, value, onPick, open, onOpenChange, mount }) => {
    const picked = value[category.id][0];
    return (
        <PopupSelect
            label={category.label}
            options={category.options}
            value={picked ?? null}
            onChange={(next) => onPick(category.id, next === picked ? [] : [next])}
            isSearchable={false}
            placement="bottom-end"
            {...(open !== undefined ? { open, onOpenChange } : {})}
            container={mount ?? undefined}
            trigger={<FilterButton text={category.label} appearance="subtle" trailingMetric={picked ? 1 : undefined} isSelected={Boolean(picked)} />}
        />
    );
};

/** Tier 2a: the Filter icon opens one list, applied as you pick, with no footer. */
const OneListMenu = ({ category, value, onPick, open, onOpenChange, mount }) => {
    const picked = value[category.id][0];
    return (
        <PopupSelect
            label={category.label}
            options={category.options}
            value={picked ?? null}
            onChange={(next) => onPick(category.id, next === picked ? [] : [next])}
            isSearchable={false}
            placement="bottom-end"
            {...(open !== undefined ? { open, onOpenChange } : {})}
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
export const FilteredStudents = ({
    tier,
    categories,
    initial = {},
    openMenu,
    views = ['All students', 'Needs follow-up'],
    start,
    loading = false,
    sectionType,
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
            open: mount !== null && activeMenu === id,
            onOpenChange: (next) => setActiveMenu(next ? id : null),
        }
        : {});

    let filters = null;
    if (tier === '1' && !folded) {
        filters = cats.map((category) => (
            <QuickFilter key={category.id} category={category} value={value} onPick={pick} {...menuProps(category.id)} mount={mount} />
        ));
    } else if (tier === '2a') {
        filters = <OneListMenu category={cats[0]} value={value} onPick={pick} {...menuProps('filters')} mount={mount} />;
    } else if (tier === '2b' || tier === '2c' || folded) {
        filters = (
            <FilterMenu
                categories={cats}
                value={value}
                onApply={setValue}
                layout={tier === '2b' ? 'side-by-side' : 'stacked'}
                {...menuProps('filters')}
                container={mount ?? undefined}
            />
        );
    } else if (tier === '3' && !sideFits) {
        filters = <IconButton icon="filter" label="Filters" appearance="subtle" trailingMetric={count || undefined} onClick={() => setShowSide(true)} />;
    }

    // A menu a press opens mounts where `container` points at that moment: until the picture's element is in state, those filters wait, so no menu lands on the page. A held-open menu waits on its own (`held`).
    if (mount === null && !openMenu) filters = null;

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
                    '--plus-overlay-screen': `${READ_SCREEN}px`,
                }}
            >
                <Page
                    header={pageTabs ? <PageTabs active={pageTab} onSelect={setPageTab} labels={['Overview', 'Students', 'Sessions']} aria-label="Group pages" /> : undefined}
                    style={{ minBlockSize: openMenu ? OPEN_ROOM[tier === '2c' ? 'stacked' : 'short'] : undefined }}
                >
                    {pageTabs && pageTab === 'overview' && (
                        <PatternSection title="Lincoln Middle">
                            <PatternCard title="Tuesdays & Thursdays · 4:30 PM" description="Priya Nair · 8 students enrolled this term." />
                        </PatternSection>
                    )}
                    {pageTabs && pageTab === 'sessions' && (
                        <PatternSection title="Sessions">
                            <SessionsTable />
                        </PatternSection>
                    )}
                    {(!pageTabs || pageTab === 'students') && (
                        <PatternSection
                            title="Students"
                            description="Lincoln Middle"
                            type={pageTabs ? 'tabs-only' : sectionType}
                            tabs={(
                                <ViewBar
                                    views={views}
                                    activeView={activeView}
                                    onViewChange={setActiveView}
                                    start={start
                                        ? start(mount, {
                                            activeView,
                                            onViewChange: setActiveView,
                                            open: openMenu === 'view' ? mount !== null && activeMenu === 'view' : undefined,
                                            onOpenChange: openMenu === 'view' ? (next) => setActiveMenu(next ? 'view' : null) : undefined,
                                        })
                                        : undefined}
                                    filters={filters}
                                    primary="Add students"
                                    narrow={width < FRAME_LAYOUT.fullWidthBelow}
                                />
                            )}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>{body}</div>
                        </PatternSection>
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
        {...(open && mount && onOpenChange ? { open, onOpenChange } : {})}
        container={mount ?? undefined}
    />
);

const InDocs = ({ children }) => (
    <CaseSurface border="none" padding="md" surface={false}>
        <HeadingLevelContext.Provider value={4}>
            {children}
        </HeadingLevelContext.Provider>
    </CaseSurface>
);

/** Live Do: one filter tier per bar (three quick filters, no Filter icon). */
export const OneTierCase = () => {
    const [grade, setGrade] = useState(null);
    const [school, setSchool] = useState(null);
    const [subject, setSubject] = useState(null);
    const rows = narrow({ grade: grade ? [grade] : [], school: school ? [school] : [], subject: subject ? [subject] : [] }).slice(0, 3);
    return (
        <InDocs>
            <PatternSection
                title="Students"
                type="tabs-only"
                tabs={(
                    <ViewBar
                        views={['All students']}
                        search={false}
                        more={false}
                        primary={null}
                        filters={(
                            <>
                                <PopupSelect label="Grade" options={CATEGORIES.grade.options} value={grade} onChange={(next) => setGrade(next === grade ? null : next)} isSearchable={false} placement="bottom-end" trigger={<FilterButton text="Grade" appearance="subtle" trailingMetric={grade ? 1 : undefined} isSelected={Boolean(grade)} />} />
                                <PopupSelect label="School" options={CATEGORIES.school.options} value={school} onChange={(next) => setSchool(next === school ? null : next)} isSearchable={false} placement="bottom-end" trigger={<FilterButton text="School" appearance="subtle" trailingMetric={school ? 1 : undefined} isSelected={Boolean(school)} />} />
                                <PopupSelect label="Subject" options={CATEGORIES.subject.options} value={subject} onChange={(next) => setSubject(next === subject ? null : next)} isSearchable={false} placement="bottom-end" trigger={<FilterButton text="Subject" appearance="subtle" trailingMetric={subject ? 1 : undefined} isSelected={Boolean(subject)} />} />
                            </>
                        )}
                    />
                )}
            >
                <StudentsTable rows={rows} columns={['Name', 'Grade', 'School']} />
            </PatternSection>
        </InDocs>
    );
};

/** Live Don't: mixing quick filters with a Filter icon in the same bar. */
export const TwoTiersCase = () => {
    const [grade, setGrade] = useState('Grade 7');
    const [school, setSchool] = useState(null);
    const rows = narrow({ grade: grade ? [grade] : [], school: school ? [school] : [] }).slice(0, 3);
    return (
        <InDocs>
            <PatternSection
                title="Students"
                type="tabs-only"
                tabs={(
                    <ViewBar
                        views={['All students']}
                        search={false}
                        more={false}
                        primary={null}
                        filters={(
                            <>
                                <PopupSelect label="Grade" options={CATEGORIES.grade.options} value={grade} onChange={(next) => setGrade(next === grade ? null : next)} isSearchable={false} placement="bottom-end" trigger={<FilterButton text="Grade" appearance="subtle" trailingMetric={grade ? 1 : undefined} isSelected={Boolean(grade)} />} />
                                <PopupSelect label="School" options={CATEGORIES.school.options} value={school} onChange={(next) => setSchool(next === school ? null : next)} isSearchable={false} placement="bottom-end" trigger={<FilterButton text="School" appearance="subtle" trailingMetric={school ? 1 : undefined} isSelected={Boolean(school)} />} />
                                <IconButton icon="filter" label="Filters" appearance="subtle" onClick={() => {}} />
                            </>
                        )}
                    />
                )}
            >
                <StudentsTable rows={rows} columns={['Name', 'Grade', 'School']} />
            </PatternSection>
        </InDocs>
    );
};

/** Live Do: views at the start of the bar; Search and filters at the end. */
export const FiltersAtEndCase = () => {
    const [view, setView] = useState('All students');
    const [grade, setGrade] = useState(null);
    const [school, setSchool] = useState(null);
    const rows = narrow({ grade: grade ? [grade] : [], school: school ? [school] : [] }).slice(0, 3);
    return (
        <InDocs>
            <PatternSection
                title="Students"
                type="tabs-only"
                tabs={(
                    <ViewBar
                        views={['All students', 'Needs follow-up']}
                        activeView={view}
                        onViewChange={setView}
                        more={false}
                        primary={null}
                        filters={(
                            <>
                                <PopupSelect label="Grade" options={CATEGORIES.grade.options} value={grade} onChange={(next) => setGrade(next === grade ? null : next)} isSearchable={false} placement="bottom-end" trigger={<FilterButton text="Grade" appearance="subtle" trailingMetric={grade ? 1 : undefined} isSelected={Boolean(grade)} />} />
                                <PopupSelect label="School" options={CATEGORIES.school.options} value={school} onChange={(next) => setSchool(next === school ? null : next)} isSearchable={false} placement="bottom-end" trigger={<FilterButton text="School" appearance="subtle" trailingMetric={school ? 1 : undefined} isSelected={Boolean(school)} />} />
                            </>
                        )}
                    />
                )}
            >
                <StudentsTable rows={rows} columns={['Name', 'Grade', 'School']} />
            </PatternSection>
        </InDocs>
    );
};

/** Live Don't: filters squeezed beside the views at the start of the bar. */
export const FiltersAmongViewsCase = () => {
    const [view, setView] = useState('All students');
    const [grade, setGrade] = useState(null);
    const [school, setSchool] = useState(null);
    const rows = narrow({ grade: grade ? [grade] : [], school: school ? [school] : [] }).slice(0, 3);
    return (
        <InDocs>
            <PatternSection
                title="Students"
                type="tabs-only"
                tabs={(
                    <div className="plus-section-view-bar" style={{ ...row, inlineSize: '100%' }}>
                        <ViewPills views={['All students', 'Needs follow-up']} activeView={view} onViewChange={setView} />
                        <PopupSelect label="Grade" options={CATEGORIES.grade.options} value={grade} onChange={(next) => setGrade(next === grade ? null : next)} isSearchable={false} placement="bottom-start" trigger={<FilterButton text="Grade" appearance="subtle" trailingMetric={grade ? 1 : undefined} isSelected={Boolean(grade)} />} />
                        <PopupSelect label="School" options={CATEGORIES.school.options} value={school} onChange={(next) => setSchool(next === school ? null : next)} isSearchable={false} placement="bottom-start" trigger={<FilterButton text="School" appearance="subtle" trailingMetric={school ? 1 : undefined} isSelected={Boolean(school)} />} />
                        <div style={{ ...row, marginInlineStart: 'auto' }}>
                            <IconButton icon="magnifying-glass" label="Search students" appearance="subtle" onClick={() => {}} />
                        </div>
                    </div>
                )}
            >
                <StudentsTable rows={rows} columns={['Name', 'Grade', 'School']} />
            </PatternSection>
        </InDocs>
    );
};

/** Live Do: active count shown directly on the Filter icon's selected fill. */
export const CountOnIconCase = () => {
    const [value, setValue] = useState({ grade: ['Grade 7'], school: ['Lincoln Middle'] });
    const rows = narrow(value);
    return (
        <InDocs>
            <PatternSection
                title="Students"
                type="tabs-only"
                tabs={(
                    <ViewBar
                        views={['All students']}
                        search={false}
                        more={false}
                        primary={null}
                        filters={(
                            <FilterMenu
                                categories={[CATEGORIES.grade, CATEGORIES.school]}
                                value={value}
                                onApply={setValue}
                                layout="side-by-side"
                            />
                        )}
                    />
                )}
            >
                <StudentsTable rows={rows} columns={['Name', 'Grade', 'School']} />
            </PatternSection>
        </InDocs>
    );
};

/** Live Don't: a row of tags under the bar repeating what is on. */
export const TagRowCase = () => {
    const [tags, setTags] = useState(['Grade 7', 'Lincoln Middle']);
    const value = {
        grade: tags.includes('Grade 7') ? ['Grade 7'] : [],
        school: tags.includes('Lincoln Middle') ? ['Lincoln Middle'] : [],
    };
    const rows = narrow(value);
    return (
        <InDocs>
            <PatternSection
                title="Students"
                type="tabs-only"
                tabs={(
                    <ViewBar
                        views={['All students']}
                        search={false}
                        more={false}
                        primary={null}
                        filters={<IconButton icon="filter" label="Filters" appearance="subtle" onClick={() => {}} />}
                    />
                )}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                    {tags.length > 0 && (
                        <TagGroup label="Applied filters">
                            {tags.map((tag) => (
                                <Tag
                                    key={tag}
                                    text={tag}
                                    isRemovable
                                    onAfterRemoveAction={() => setTags((current) => current.filter((item) => item !== tag))}
                                />
                            ))}
                        </TagGroup>
                    )}
                    <StudentsTable rows={rows} columns={['Name', 'Grade', 'School']} />
                </div>
            </PatternSection>
        </InDocs>
    );
};
