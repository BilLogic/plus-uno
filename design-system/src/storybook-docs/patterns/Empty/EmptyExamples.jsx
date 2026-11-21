import React, { useState } from 'react';
import { Button, DynamicTable, EmptyState, Pagination, SearchField, StaticTable, Tabs } from '@/components';
import { Section } from '@/templates';

/**
 * The Empty page's do and don't examples, as PLUS parts only. Show code prints
 * each one from this file; the surface that holds them lives in
 * `EmptyCases.jsx`.
 */

const STUDENTS = [
    ['Ava Thompson', 'Grade 7', 'Oct 24'],
    ['Marcus Lee', 'Grade 8', 'Oct 23'],
    ['Sofia Ramirez', 'Grade 7', 'Oct 23'],
];

const HEAD = { cells: ['Name', 'Grade', 'Last session'].map((content) => ({ key: content, content, isSortable: true })) };

const rowsOf = (students) => students.map((cells) => ({ key: cells[0], cells: cells.map((content) => ({ key: content, content })) }));

export const WhatBelongsHere = () => {
    const [added, setAdded] = useState(false);
    return (
        <Section title="Students" description="Lincoln Middle">
            {added ? (
                <DynamicTable head={HEAD} rows={rowsOf(STUDENTS)} label="Students" isFixedSize />
            ) : (
                <EmptyState
                    spacing="compact"
                    icon="user-group"
                    header="No students in this group yet"
                    description="Add students to schedule sessions and track their progress."
                    primaryAction={<Button text="Add students" appearance="primary" spacing="compact" onClick={() => setAdded(true)} />}
                />
            )}
        </Section>
    );
};

export const BareString = () => (
    <Section title="Students" description="Lincoln Middle">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minBlockSize: 'calc(var(--control-xl) * 3)' }}>
            <p className="body-default color-secondary" style={{ margin: 0 }}>No results</p>
        </div>
    </Section>
);

export const ReplacedTable = () => {
    const [isFiltered, setIsFiltered] = useState(true);
    const rows = isFiltered ? [] : rowsOf(STUDENTS);
    return (
        <Section
            title="Students"
            description="Lincoln Middle"
            views={(
                <Tabs appearance="pill" defaultActiveKey="All students" aria-label="Views">
                    <Tabs.Tab eventKey="All students">All students</Tabs.Tab>
                    <Tabs.Tab eventKey="Needs follow-up">Needs follow-up</Tabs.Tab>
                </Tabs>
            )}
            search={<SearchField mode="active" spacing="compact" placeholder="Search students" />}
            filters={isFiltered ? [
                { key: 'grade', label: 'Grade', text: 'Grade 6', isSelected: true, onClick: () => {} },
                { key: 'subject', label: 'Subject', text: 'Math', isSelected: true, onClick: () => {} },
            ] : []}
            onClearAll={() => setIsFiltered(false)}
            hasNoMatches={rows.length === 0}
        >
            <DynamicTable
                head={HEAD}
                rows={rows}
                label="Students"
                state={rows.length === 0 ? 'no results' : undefined}
                noResultsView={(
                    <EmptyState
                        spacing="compact"
                        icon="magnifying-glass"
                        header="No students match these filters"
                        description="Nothing matches Grade 6 and Math. Reset the filters to see every student."
                        primaryAction={<Button text="Reset filters" spacing="compact" onClick={() => setIsFiltered(false)} />}
                    />
                )}
                isFixedSize
            />
        </Section>
    );
};

export const HeaderOverNothing = () => (
    <Section
        title="Students"
        description="Lincoln Middle"
        views={(
            <Tabs appearance="pill" defaultActiveKey="All students" aria-label="Views">
                <Tabs.Tab eventKey="All students">All students</Tabs.Tab>
                <Tabs.Tab eventKey="Needs follow-up">Needs follow-up</Tabs.Tab>
            </Tabs>
        )}
    >
        <StaticTable
            headers={['Name', 'Grade', 'Last session']}
            rows={[]}
            emptyState="No results"
            footer={<Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />}
        />
    </Section>
);
