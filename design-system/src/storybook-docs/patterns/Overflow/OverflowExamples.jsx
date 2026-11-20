import React, { useState } from 'react';
import { Button, DynamicTable, Pagination } from '@/components';
import { Section } from '@/templates';

/**
 * The Overflow page's do and don't examples, as PLUS parts only. Show code
 * prints each one from this file; the surface that holds them lives in
 * `OverflowCases.jsx`.
 */

const LONG_TITLE = 'Fractions, decimals and percentages: weekly review for the seventh grade group';
const LONG_NOTE = 'Ava found equivalent fractions easy but stalled on mixed numbers, so next week starts with number lines';

const STUDENTS = [
    ['Ava Thompson', 'Grade 7', 'Oct 24'],
    ['Marcus Lee', 'Grade 8', 'Oct 23'],
    ['Sofia Ramirez', 'Grade 7', 'Oct 23'],
    ['Jordan Patel', 'Grade 6', 'Oct 21'],
    ['Emily Chen', 'Grade 8', 'Oct 20'],
    ['Noah Williams', 'Grade 6', 'Oct 18'],
];

const StudentsTable = ({ rows: shown }) => (
    <DynamicTable
        head={{ cells: ['Name', 'Grade', 'Last session'].map((content) => ({ key: content, content })) }}
        rows={shown.map((cells) => ({ key: cells[0], cells: cells.map((content) => ({ key: content, content })) }))}
        label="Students"
        isFixedSize
    />
);

const clipStyle = { display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

const NotesTable = ({ note }) => (
    <DynamicTable
        label="Session notes"
        isFixedSize
        head={{ cells: ['Student', 'Note'].map((content) => ({ key: content, content })) }}
        rows={STUDENTS.slice(0, 3).map(([name], i) => ({
            key: name,
            cells: [{ key: `${name}-n`, content: name }, { key: `${name}-t`, content: i === 0 ? note : 'On track' }],
        }))}
    />
);

export const WrappedSectionTitle = () => (
    <div style={{ maxInlineSize: 'var(--card-min-width-md)' }}>
        <Section title={LONG_TITLE}>
            <StudentsTable rows={STUDENTS.slice(0, 2)} />
        </Section>
    </div>
);

export const ClippedSectionTitle = () => (
    <div style={{ maxInlineSize: 'var(--card-min-width-md)' }}>
        <Section title={<span style={clipStyle}>{LONG_TITLE}</span>}>
            <StudentsTable rows={STUDENTS.slice(0, 2)} />
        </Section>
    </div>
);

export const ClippedCellOpensText = () => <NotesTable note={LONG_NOTE} />;

export const ClippedCellNoText = () => <NotesTable note={<span style={clipStyle}>{LONG_NOTE}</span>} />;

const listStyle = { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' };

const StudentList = ({ count }) => (
    <ul style={listStyle} aria-label="Students">
        {STUDENTS.slice(0, count).map(([name, grade]) => (
            <li key={name}>{name}, {grade}</li>
        ))}
    </ul>
);

export const ShowMoreWithCount = () => {
    const [expanded, setExpanded] = useState(false);
    return (
        <Section
            title="Students"
            footer={(
                <Button
                    text={expanded ? 'Show less' : 'Show 4 more'}
                    appearance="subtle"
                    spacing="compact"
                    onClick={() => setExpanded((current) => !current)}
                />
            )}
        >
            <StudentList count={expanded ? 6 : 2} />
        </Section>
    );
};

export const FadedList = () => (
    <Section title="Students">
        <div style={{ position: 'relative' }}>
            <StudentList count={4} />
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    insetInline: 0,
                    insetBlockEnd: 0,
                    blockSize: 'calc(var(--control-lg) * 3)',
                    backgroundImage: 'linear-gradient(to bottom, transparent, var(--ds-surface))',
                }}
            />
        </div>
    </Section>
);

const PAGE_SIZE = 3;

export const PagedTable = () => {
    const [page, setPage] = useState(1);
    return (
        <Section
            title="Students"
            footer={(
                <Pagination
                    currentPage={page}
                    totalPages={Math.ceil(STUDENTS.length / PAGE_SIZE)}
                    onPageChange={setPage}
                />
            )}
        >
            <StudentsTable rows={STUDENTS.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)} />
        </Section>
    );
};

export const GrowingTable = () => {
    const [expanded, setExpanded] = useState(false);
    return (
        <Section
            title="Students"
            footer={(
                <Button
                    text={expanded ? 'Show less' : 'Show 3 more'}
                    appearance="subtle"
                    spacing="compact"
                    onClick={() => setExpanded((current) => !current)}
                />
            )}
        >
            <StudentsTable rows={STUDENTS.slice(0, expanded ? 6 : 3)} />
        </Section>
    );
};
