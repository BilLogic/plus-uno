import React from 'react';
import { FilterButton, Icon, SearchField, StaticTable } from '@/components';
import { Card, Section, Table } from '@/templates';

/**
 * The Table page's do and don't examples, as PLUS parts only: the composition
 * pairs and the type pairs, each side built from the table components a real
 * table would use, each pair on its own subject. Show code prints each one
 * from this file; the docs wrapper (Storybook's unstyled class, a heading
 * level below the page outline) lives in `TableCases.jsx`.
 */

const icon = (name) => <Icon name={name} size={12} />;

/** The header rows a list carries: Search, one applied filter, then the count in words. */
const listHeader = (noun, count) => ({
    search: <SearchField mode="active" spacing="compact" placeholder={`Search ${noun}`} />,
    filters: [{ key: 'status', label: 'Status', text: 'Active', isSelected: true, onClick: () => {} }],
    count: `${count} ${noun}`,
    onClearAll: () => {},
});

/* ------------------------------------------------------------ composition */

const studentsTable = {
    headers: ['Student', 'Tutor', { text: 'Sessions', align: 'number' }],
    rows: [
        ['Ava Thompson', 'Priya Nair', { content: 12, align: 'number' }],
        ['Marcus Lee', 'Daniel Kim', { content: 9, align: 'number' }],
        ['Sofia Ramirez', 'Priya Nair', { content: 15, align: 'number' }],
    ],
};

export const PlainTable = () => (
    <Table title="Students" {...listHeader('students', 340)} kind="static" tableProps={studentsTable} />
);

export const FramedTable = () => (
    <Section title="Students" {...listHeader('students', 340)}>
        <Card>
            <StaticTable {...studentsTable} />
        </Card>
    </Section>
);

const tutorsTable = {
    headers: ['Tutor', 'Site', { text: 'Students', align: 'number' }],
    rows: [
        ['Priya Nair', 'Lincoln Middle', { content: 14, align: 'number' }],
        ['Daniel Kim', 'Lincoln Middle', { content: 11, align: 'number' }],
        ['Grace Okafor', 'Roosevelt K-8', { content: 8, align: 'number' }],
    ],
};

export const FiltersInHeader = () => (
    <Table title="Tutors" {...listHeader('tutors', 12)} kind="static" tableProps={tutorsTable} />
);

export const SecondToolbar = () => (
    <Section title="Tutors" {...listHeader('tutors', 12)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--inline-md)' }}>
                <FilterButton label="Site" text="All" onClick={() => {}} />
                <span className="body-sm color-secondary">12 records</span>
            </div>
            <StaticTable {...tutorsTable} />
        </div>
    </Section>
);

const upcomingTable = {
    headers: ['Date', 'Student', 'Status'],
    rows: [
        ['Oct 28', 'Ava Thompson', 'Scheduled'],
        ['Oct 29', 'Marcus Lee', 'Scheduled'],
        ['Oct 30', 'Sofia Ramirez', 'Scheduled'],
    ],
};

const pastTable = {
    headers: ['Date', 'Student', 'Status'],
    rows: [
        ['Oct 24', 'Ava Thompson', 'Completed'],
        ['Oct 23', 'Marcus Lee', 'Canceled'],
        ['Oct 21', 'Jordan Patel', 'No-show'],
    ],
};

export const OneTablePerSection = () => (
    <Table title="Upcoming sessions" {...listHeader('sessions', 3)} kind="static" tableProps={upcomingTable} />
);

export const TwoTables = () => (
    <Section title="Sessions" {...listHeader('sessions', 6)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-xl)' }}>
            <StaticTable {...upcomingTable} />
            <StaticTable {...pastTable} />
        </div>
    </Section>
);

/* ------------------------------------------------------------------ types */

const roster = [
    ['Ava Thompson', 'Priya Nair', 'Oct 24', 12, 1],
    ['Marcus Lee', 'Daniel Kim', 'Oct 23', 9, 3],
    ['Sofia Ramirez', 'Priya Nair', 'Oct 23', 15, 0],
    ['Jordan Patel', 'Grace Okafor', 'Oct 21', 4, 8],
    ['Emily Chen', 'Daniel Kim', 'Oct 20', 11, 2],
];

const rosterHead = {
    cells: [
        { key: 'student', content: 'Student', isSortable: true },
        { key: 'tutor', content: 'Tutor', isSortable: true },
        { key: 'last', content: 'Last session', isSortable: true },
        { key: 'sessions', content: 'Sessions', isSortable: true, align: 'number' },
        { key: 'missed', content: 'Missed', isSortable: true, align: 'number' },
    ],
};

const rosterRows = roster.map(([student, tutor, last, sessions, missed]) => ({
    key: student,
    cells: [
        { key: student, content: student },
        { key: tutor, content: tutor },
        { key: last, content: last },
        { key: sessions, content: String(sessions) },
        { key: 'missed-' + student, content: String(missed) },
    ],
}));

export const DynamicRoster = () => {
    const [selected, setSelected] = React.useState(['Ava Thompson', 'Marcus Lee']);
    return (
        <Table
            title="Students"
            {...listHeader('students', 340)}
            kind="dynamic"
            tableProps={{
                head: rosterHead,
                rows: rosterRows,
                label: 'Students',
                defaultSortKey: 'student',
                isSelectable: true,
                selectedRowKeys: selected,
                onSelectionChange: setSelected,
                bulkActions: ['Message', 'Export', 'Remove'].map((label) => ({ label, onClick: () => {} })),
                rowsPerPage: 25,
                totalRows: 340,
            }}
        />
    );
};

export const RosterAsStatic = () => (
    <Table
        title="Students"
        {...listHeader('students', 340)}
        kind="static"
        tableProps={{
            headers: ['Student', 'Tutor', 'Last session', { text: 'Sessions', align: 'number' }, { text: 'Missed', align: 'number' }],
            rows: roster.map(([student, tutor, last, sessions, missed]) => [student, tutor, last, { content: sessions, align: 'number' }, { content: missed, align: 'number' }]),
        }}
    />
);

const treeNode = (id, name, type, sessions, more = {}) => ({
    id,
    cells: [{ content: name }, { content: type }, { content: String(sessions) }],
    ...more,
});

const schools = [
    treeNode('lincoln', 'Lincoln Middle', 'School', 54, {
        count: 3,
        children: [
            treeNode('g7', 'Grade 7 · Math', 'Class', 27, {
                count: 2,
                children: [treeNode('ava', 'Ava Thompson', 'Student', 12), treeNode('sofia', 'Sofia Ramirez', 'Student', 15)],
            }),
            treeNode('g8', 'Grade 8 · Math', 'Class', 19, { count: 3, children: [] }),
            treeNode('g6', 'Grade 6 · Reading', 'Class', 8, { count: 4, children: [] }),
        ],
    }),
];

export const TreeHierarchy = () => (
    <Table
        kind="tree"
        tableProps={{
            head: { cells: [{ key: 'name', content: 'Name' }, { key: 'type', content: 'Type' }, { key: 'sessions', content: 'Sessions', align: 'number' }] },
            items: schools,
            label: 'Schools',
            defaultExpandedIds: ['lincoln', 'g7'],
        }}
    />
);

export const TreeAsExpandable = () => (
    <StaticTable
        headers={[
            'School',
            { text: 'Classes', align: 'number' },
            { text: 'Students', align: 'number' },
            { text: 'Sessions', align: 'number' },
        ]}
        rows={[
            [
                {
                    content: (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--inline-md)' }}>
                            {icon('chevron-down')}Lincoln Middle
                        </span>
                    ),
                },
                { content: 2, align: 'number' },
                { content: 4, align: 'number' },
                { content: 40, align: 'number' },
            ],
            [
                {
                    colSpan: 4,
                    overflow: 'wrap',
                    style: { paddingInlineStart: 'calc(var(--table-indent) + var(--icon-sm))' },
                    content: (
                        <>
                            <div className="heading-xxs color-secondary">Classes</div>
                            <div>Grade 7 · Math: Ava Thompson, Sofia Ramirez. Grade 8 · Math: Marcus Lee, Jordan Patel.</div>
                        </>
                    ),
                },
            ],
            [
                {
                    content: (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--inline-md)' }}>
                            {icon('chevron-right')}Roosevelt K-8
                        </span>
                    ),
                },
                { content: 3, align: 'number' },
                { content: 6, align: 'number' },
                { content: 31, align: 'number' },
            ],
        ]}
    />
);
