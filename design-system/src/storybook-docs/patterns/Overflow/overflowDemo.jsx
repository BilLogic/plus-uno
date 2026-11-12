import React from 'react';

import { DynamicTable, Pagination, SectionMessage, StatusTag, Tag, TagGroup } from '@/components';
import { PatternSection } from '@/patterns';
import { STUDENTS, StudentsTable } from '@/storybook-docs/lib/view-bar.jsx';

/**
 * The Overflow pattern's examples: real parts holding text longer than their
 * room, each at a narrow stage so the answer shows. Nothing here draws a
 * clip of its own; the components decide what wraps and what truncates.
 *
 *   Wrap        a Section title and a SectionMessage that run to more lines
 *   ClippedCell a table cell that ends in an ellipsis
 *   LongTags    a Tag and a StatusTag past their widths
 *   FoldedTags  a TagGroup that keeps one line and folds the rest into +n
 *   PagedTable  a table that pages in its footer instead of growing
 */

/** The width a narrow picture lays out at, in px: docs geometry. */
export const NARROW = 360; // docs-literal

/** The width a table picture lays out at, in px: docs geometry. */
export const TABLE_STAGE = 800; // docs-literal

/** The width the folded Tag group's picture lays out at, in px: docs geometry. */
export const FOLD_STAGE = 280; // docs-literal

export const LONG_TITLE = 'Fractions, decimals and percentages: weekly review for the seventh grade group';
export const LONG_ERROR = 'We could not save the session because Ms. Ortiz is already booked from 4:00 PM to 5:00 PM on Thursday.';
export const LONG_NOTE = 'Ava found equivalent fractions easy but stalled on mixed numbers, so next week starts with number lines';
export const LONG_TAG = 'Fractions, decimals and percentages review';
export const LONG_STATUS = 'Waiting on the supervisor to review';

const frame = { padding: 'var(--page-pad)' };

/** A Section title and a SectionMessage: both take more lines, never an ellipsis. */
export const Wrap = () => (
    <div style={{ ...frame, display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)' }}>
        <PatternSection title={LONG_TITLE}>
            <SectionMessage appearance="danger" dismissible={false}>{LONG_ERROR}</SectionMessage>
        </PatternSection>
    </div>
);

/** A table whose note cell is longer than its column: one line, an ellipsis. */
export const ClippedCell = ({ note = LONG_NOTE }) => (
    <div style={frame}>
        <DynamicTable
            label="Session notes"
            head={{ cells: [{ key: 'name', content: 'Student', width: '30%' }, { key: 'note', content: 'Note', width: '70%' }] }}
            rows={STUDENTS.slice(0, 3).map(([name], i) => ({
                key: name,
                cells: [{ key: `${name}-n`, content: name }, { key: `${name}-t`, content: i === 0 ? note : 'On track' }],
            }))}
        />
    </div>
);

/** A Tag and a StatusTag past their widths: each ends in an ellipsis. */
export const LongTags = ({ tag = LONG_TAG, status = LONG_STATUS }) => (
    <div style={{ ...frame, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--stack-md)' }}>
        <Tag text={tag} color="blue" />
        <StatusTag appearance="warning">{status}</StatusTag>
    </div>
);

export const SUBJECTS = ['Science', 'Mathematics', 'History', 'Geography', 'Music', 'Art', 'Drama'];

/** A TagGroup that keeps one line and folds the rest into +n. */
export const FoldedTags = () => (
    <div style={frame}>
        <TagGroup label="Subjects" overflow="collapse">
            {SUBJECTS.map((subject) => <Tag key={subject} text={subject} color="gray" />)}
        </TagGroup>
    </div>
);

/** A table that pages in its Section's footer instead of growing. */
export const PagedTable = ({ page = 1 }) => (
    <div style={frame}>
        <PatternSection title="Students" footer={<Pagination currentPage={page} totalPages={8} onPageChange={() => {}} />}>
            <StudentsTable count={4} />
        </PatternSection>
    </div>
);
