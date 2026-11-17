import React, { useState } from 'react';
import { Button, DynamicTable, EmptyState, Pagination, Table } from '@/components';
import { PatternSection } from '@/patterns';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { STUDENT_HEAD, StudentsTable, ViewBar, studentRows } from '@/storybook-docs/lib/view-bar.jsx';

/**
 * The live do and don't examples on the Empty pattern page, composed from
 * `PatternSection`, `EmptyState`, `DynamicTable`, `Table`, `Pagination`,
 * `ViewBar` and `Button`.
 */

/** Do: say what belongs here, why it is empty, and give the one action that fills it. */
export const WhatBelongsHereCase = () => {
    const [added, setAdded] = useState(false);
    return (
        <CaseSurface>
            <PatternSection
                title="Students"
                description="Lincoln Middle"
                actions={added ? <Button text="Reset" appearance="subtle" onClick={() => setAdded(false)} /> : undefined}
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

/** Do: replace the whole table with the empty state while the view bar stays above. */
export const ReplacedTableCase = () => {
    const [view, setView] = useState('All students');
    const [filtered, setFiltered] = useState(true);
    const rows = filtered ? [] : studentRows(4, { view });

    return (
        <CaseSurface>
            <PatternSection
                title="Students"
                description="Lincoln Middle"
                tabs={(
                    <ViewBar
                        views={['All students', 'Needs follow-up']}
                        activeView={view}
                        onViewChange={(next) => {
                            setView(next);
                            setFiltered(next === 'All students');
                        }}
                        filters={null}
                        search={false}
                        more={false}
                        primary={null}
                    />
                )}
            >
                <DynamicTable
                    head={STUDENT_HEAD}
                    rows={rows}
                    label="Students"
                    state={rows.length === 0 ? 'no results' : undefined}
                    noResultsView={(
                        <EmptyState
                            spacing="compact"
                            icon="magnifying-glass"
                            header="No students match these filters"
                            description="Nothing matches Grade 6 and Math. Reset the filters to see every student."
                            primaryAction={<Button text="Reset filters" appearance="default" spacing="compact" onClick={() => setFiltered(false)} />}
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
            tabs={<ViewBar views={['All students', 'Needs follow-up']} filters={null} search={false} more={false} primary={null} />}
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
