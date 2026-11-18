import React, { useState } from 'react';
import { Button, DynamicTable, EmptyState, Pagination, Table } from '@/components';
import { PatternSection } from '@/patterns';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { ResetExampleButton } from '@/storybook-docs/lib/reset-example.jsx';
import { HeaderSearch, SectionActions, categoryFilters } from '@/storybook-docs/lib/section-header.jsx';
import { StudentsTable, ViewPills } from '@/storybook-docs/lib/view-bar.jsx';
import { CATEGORIES, narrow } from '../Filtering/filteringDemo.jsx';

/**
 * The live do and don't examples on the Empty pattern page, composed from
 * `PatternSection`, `EmptyState`, `DynamicTable`, `Table`, `Pagination`,
 * `ViewPills`, the Section header props and `Button`.
 */

/** Do: say what belongs here, why it is empty, and give the one action that fills it. */
export const WhatBelongsHereCase = () => {
    const [added, setAdded] = useState(false);
    return (
        <CaseSurface>
            <PatternSection
                title="Students"
                description="Lincoln Middle"
                actions={added ? <ResetExampleButton onReset={() => setAdded(false)} /> : undefined}
            >
                {added ? (
                    <StudentsTable count={3} sortable />
                ) : (
                    <EmptyState
                        spacing="compact"
                        icon="user-group"
                        header="No students in this group yet"
                        description="Add students to schedule sessions and track their progress."
                        primaryAction={<Button text="Add students" appearance="primary" spacing="compact" onClick={() => setAdded(true)} />}
                    />
                )}
            </PatternSection>
        </CaseSurface>
    );
};

/** Don't: a bare string in an empty box reads as broken or still loading. */
export const BareStringCase = () => (
    <CaseSurface>
        <PatternSection title="Students" description="Lincoln Middle">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minBlockSize: 'calc(var(--control-xl) * 3)' }}>
                <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>No results</p>
            </div>
        </PatternSection>
    </CaseSurface>
);

const FILTERED_HEAD = {
    cells: ['Name', 'Grade', 'Subject'].map((content) => ({ key: content.toLowerCase(), content, isSortable: true })),
};

const NO_MATCHES_FILTERS = { grade: ['Grade 6'], subject: ['Math'] };
const CLEARED_FILTERS = { grade: [], subject: [] };

/** Do: replace the whole table with the empty state while the header rows stay above. */
export const ReplacedTableCase = () => {
    const [view, setView] = useState('All students');
    const [filters, setFilters] = useState(NO_MATCHES_FILTERS);
    const pickFilter = (id, next) => setFilters((current) => ({ ...current, [id]: next }));
    const matching = narrow(filters).slice(0, 4);
    const visible = view === 'Needs follow-up' ? matching.filter((_, index) => index % 2 === 1) : matching;
    const rows = visible.map(([name, grade, , subject]) => ({
        key: name,
        cells: [{ key: name, content: name }, { key: grade, content: grade }, { key: subject, content: subject }],
    }));

    return (
        <CaseSurface>
            <PatternSection
                title="Students"
                description="Lincoln Middle"
                actions={<SectionActions />}
                views={(
                    <ViewPills
                        views={['All students', 'Needs follow-up']}
                        activeView={view}
                        onViewChange={(next) => {
                            setView(next);
                            setFilters(next === 'All students' ? NO_MATCHES_FILTERS : CLEARED_FILTERS);
                        }}
                    />
                )}
                search={<HeaderSearch />}
                filters={categoryFilters([CATEGORIES.grade, CATEGORIES.subject], filters, pickFilter)}
                onClearAll={() => setFilters(CLEARED_FILTERS)}
            >
                <DynamicTable
                    head={FILTERED_HEAD}
                    rows={rows}
                    label="Students"
                    state={rows.length === 0 ? 'no results' : undefined}
                    noResultsView={(
                        <EmptyState
                            spacing="compact"
                            icon="magnifying-glass"
                            header="No students match these filters"
                            description="Nothing matches Grade 6 and Math. Reset the filters to see every student."
                            primaryAction={<Button text="Reset filters" appearance="default" spacing="compact" onClick={() => setFilters(CLEARED_FILTERS)} />}
                        />
                    )}
                    isFixedSize
                />
            </PatternSection>
        </CaseSurface>
    );
};

/** Don't: column headers and a footer left sitting over a short centered line. */
export const HeaderOverNothingCase = () => (
    <CaseSurface>
        <PatternSection
            title="Students"
            description="Lincoln Middle"
            views={<ViewPills views={['All students', 'Needs follow-up']} />}
        >
            <Table
                headers={['Name', 'Grade', 'Last session']}
                rows={[]}
                emptyState="No results"
                footer={<Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />}
            />
        </PatternSection>
    </CaseSurface>
);
