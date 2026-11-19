import React, { useState } from 'react';
import { Button, DynamicTable } from '@/components';
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

const StudentsTable = ({ count }) => (
    <DynamicTable
        head={{ cells: ['Name', 'Grade', 'Last session'].map((content) => ({ key: content, content })) }}
        rows={STUDENTS.slice(0, count).map((cells) => ({ key: cells[0], cells: cells.map((content) => ({ key: content, content })) }))}
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
            <StudentsTable count={2} />
        </Section>
    </div>
);

export const ClippedSectionTitle = () => (
    <div style={{ maxInlineSize: 'var(--card-min-width-md)' }}>
        <Section title={<span style={clipStyle}>{LONG_TITLE}</span>}>
            <StudentsTable count={2} />
        </Section>
    </div>
);

export const ClippedCellOpensText = () => <NotesTable note={LONG_NOTE} />;

export const ClippedCellNoText = () => (
    <NotesTable note={<span className="plus-table-cell-text" style={clipStyle}>{LONG_NOTE}</span>} />
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
            <StudentsTable count={expanded ? 6 : 2} />
        </Section>
    );
};

export const FadedList = () => (
    <Section title="Students">
        <div style={{ position: 'relative' }}>
            <StudentsTable count={4} />
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
