import React from 'react';
import PatternSection from '@/patterns/PatternSection';
import { DynamicTable, Icon, StaticTable, TreeTable } from '@/components';
import { HeadingLevelContext } from '@/lib/headingLevel';

/**
 * The do and don't examples of the Table page: the composition pairs and the
 * type pairs, each side built from the table components a real table would use.
 */

/**
 * Storybook styles every table in a docs page except inside `.sb-unstyled`,
 * which is what its own canvases use. The examples sit outside a canvas, so
 * each carries the class, and the table keeps its own borders and padding.
 */
const unstyled = (Case) => {
    const Wrapped = () => <div className="sb-unstyled"><Case /></div>;
    return Wrapped;
};

const subtle = { color: 'var(--ds-text-subtle)' };
const icon = (name) => <Icon name={name} size={12} />;

const roster = [
    ['Ava Thompson', 'Priya Nair', 'Oct 24', 12, '92%'],
    ['Marcus Lee', 'Daniel Kim', 'Oct 23', 9, '78%'],
    ['Sofia Ramirez', 'Priya Nair', 'Oct 23', 15, '100%'],
    ['Jordan Patel', 'Grace Okafor', 'Oct 21', 4, '50%'],
    ['Emily Chen', 'Daniel Kim', 'Oct 20', 11, '85%'],
];

const rosterHead = {
    cells: [
        { key: 'student', content: 'Student', isSortable: true },
        { key: 'tutor', content: 'Tutor', isSortable: true },
        { key: 'last', content: 'Last session', isSortable: true },
        { key: 'sessions', content: 'Sessions', isSortable: true, align: 'number' },
        { key: 'attendance', content: 'Attendance', isSortable: true, align: 'number' },
    ],
};

const rosterRows = roster.map(([student, tutor, last, sessions, attendance]) => ({
    key: student,
    cells: [
        { key: student, content: student },
        { key: tutor, content: tutor },
        { key: last, content: last },
        { key: sessions, content: String(sessions) },
        { key: parseInt(attendance, 10), content: attendance },
    ],
}));

const RosterSection = () => {
    const [selected, setSelected] = React.useState(['Ava Thompson', 'Marcus Lee']);
    return (
        <PatternSection title="Students" toolbar={<PatternSection.Toolbar count="340 students" />}>
            <DynamicTable
                head={rosterHead}
                rows={rosterRows}
                label="Students"
                defaultSortKey="student"
                isSelectable
                selectedRowKeys={selected}
                onSelectionChange={setSelected}
                bulkActions={['Message', 'Export', 'Remove'].map((label) => ({ label, onClick: () => {} }))}
                rowsPerPage={25}
                totalRows={340}
            />
        </PatternSection>
    );
};

/**
 * A roster people act on, as a `DynamicTable`: sortable heads, checkboxes, a
 * pager, and the bulk bar in the head row while rows are selected. It sits inside a docs section, so its title
 * stays out of the page outline.
 */
const DynamicRosterCase = () => (
    <HeadingLevelContext.Provider value={5}>
        <RosterSection />
    </HeadingLevelContext.Provider>
);

/** The same roster as a Static table: no sort, no selection, no paging. */
const RosterAsStaticCase = () => (
    <StaticTable
        headers={['Student', 'School', { text: 'Sessions', align: 'number' }]}
        rows={[
            ['Ava Thompson', 'Lincoln Middle', { content: 12, align: 'number' }],
            ['Marcus Lee', 'Lincoln Middle', { content: 9, align: 'number' }],
            ['Sofia Ramirez', 'Lincoln Middle', { content: 15, align: 'number' }],
            ['Jordan Patel', 'Lincoln Middle', { content: 4, align: 'number' }],
            ['Emily Chen', 'Roosevelt K-8', { content: 11, align: 'number' }],
        ]}
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

/** School, class, student, as a `TreeTable`: each level indents and keeps the columns. */
const TreeHierarchyCase = () => (
    <TreeTable
        head={{ cells: [{ key: 'name', content: 'Name' }, { key: 'type', content: 'Type' }, { key: 'sessions', content: 'Sessions', align: 'number' }] }}
        items={schools}
        label="Schools"
        defaultExpandedIds={['lincoln', 'g7']}
    />
);

/** A hierarchy faked with expandable rows: the nested rows lose their columns. */
const TreeAsExpandableCase = () => (
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
                            <div style={{ font: 'var(--heading-xxs)', ...subtle }}>Classes</div>
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

export const DynamicRoster = unstyled(DynamicRosterCase);
export const RosterAsStatic = unstyled(RosterAsStaticCase);
export const TreeHierarchy = unstyled(TreeHierarchyCase);
export const TreeAsExpandable = unstyled(TreeAsExpandableCase);

/* ---------------------------------------------- composition, as Figma's pairs */

const students = [
    ['Ava Thompson', 'Priya Nair', 12],
    ['Marcus Lee', 'Daniel Kim', 9],
    ['Sofia Ramirez', 'Priya Nair', 15],
];

const studentTable = (
    <StaticTable
        headers={['Student', 'Tutor', { text: 'Sessions', align: 'number' }]}
        rows={students.map(([student, tutor, sessions]) => [student, tutor, { content: sessions, align: 'number' }])}
    />
);

const countToolbar = <PatternSection.Toolbar count="340 students" />;

const InSection = ({ children, toolbar = countToolbar }) => (
    <HeadingLevelContext.Provider value={5}>
        <PatternSection title="Students" toolbar={<PatternSection.Toolbar count="340 students" />}>{children}</PatternSection>
    </HeadingLevelContext.Provider>
);

/** The table spans the Section under its header: no frame, no padding of its own. */
const PlainTableCase = () => <InSection>{studentTable}</InSection>;

/** The table in its own padded frame, out of line with the Section header. */
const FramedTableCase = () => (
    <InSection>
        <div style={{ padding: 'var(--pad-x-md)', border: 'var(--border-width-default) solid var(--ds-border)', borderRadius: 'var(--radius-md)' }}>
            {studentTable}
        </div>
    </InSection>
);

/** A second toolbar between the Section header and the head row. */
const SecondToolbarCase = () => (
    <InSection>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)' }}>
            <PatternSection.Toolbar count="12 records" />
            {studentTable}
        </div>
    </InSection>
);

/** Two tables share one Section and one header. */
const TwoTablesCase = () => (
    <InSection>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)' }}>
            {studentTable}
            {studentTable}
        </div>
    </InSection>
);

export const PlainTable = unstyled(PlainTableCase);
export const FramedTable = unstyled(FramedTableCase);
export const SecondToolbar = unstyled(SecondToolbarCase);
export const TwoTables = unstyled(TwoTablesCase);
