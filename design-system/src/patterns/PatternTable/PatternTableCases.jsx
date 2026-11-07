import React from 'react';
import PatternTable from '@/patterns/PatternTable';
import PatternSection from '@/patterns/PatternSection';
import { DynamicTable, TableBulkActions, TreeTable } from '@/components';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { iconClass } from '../../lib/icon';

/**
 * The do and don't examples of the Table page: the composition pairs and the
 * type pairs, each side built from the table pattern and the components a real
 * table would use.
 */

/**
 * Storybook styles every table in a docs page except inside `.sb-unstyled`,
 * which is what its own canvases use. The examples sit outside a canvas, so
 * each carries the class, and the pattern keeps its own borders and padding.
 */
const unstyled = (Case) => {
    const Wrapped = () => <div className="sb-unstyled"><Case /></div>;
    return Wrapped;
};

const numeric = { textAlign: 'right' };
const subtle = { color: 'var(--ds-text-subtle)' };
const icon = (name) => <i className={iconClass(name)} aria-hidden="true" style={{ fontSize: 'var(--icon-sm)' }} />;

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
    const toolbar = selected.length > 0 ? (
        <TableBulkActions
            count={selected.length}
            actions={['Message', 'Export', 'Remove'].map((label) => ({ label, onClick: () => {} }))}
            onClear={() => setSelected([])}
        />
    ) : (
        <PatternSection.Toolbar count="340 students" />
    );
    return (
        <PatternSection title="Students" toolbar={toolbar}>
            <DynamicTable
                head={rosterHead}
                rows={rosterRows}
                label="Students"
                defaultSortKey="student"
                isSelectable
                selectedRowKeys={selected}
                onSelectionChange={setSelected}
                rowsPerPage={25}
                totalRows={340}
            />
        </PatternSection>
    );
};

/**
 * A roster people act on, as a `DynamicTable`: sortable heads, checkboxes, a
 * pager, and `TableBulkActions` in the Section header. It sits inside a docs section, so its title
 * stays out of the page outline.
 */
const DynamicRosterCase = () => (
    <HeadingLevelContext.Provider value={5}>
        <RosterSection />
    </HeadingLevelContext.Provider>
);

/** The same roster as a Static table: no sort, no selection, no paging. */
const RosterAsStaticCase = () => (
    <PatternTable>
        <thead>
            <tr><th>Student</th><th>School</th><th style={numeric}>Sessions</th></tr>
        </thead>
        <tbody>
            {[
                ['Ava Thompson', 'Lincoln Middle', 12],
                ['Marcus Lee', 'Lincoln Middle', 9],
                ['Sofia Ramirez', 'Lincoln Middle', 15],
                ['Jordan Patel', 'Lincoln Middle', 4],
                ['Emily Chen', 'Roosevelt K-8', 11],
            ].map(([student, school, sessions]) => (
                <tr key={student}><td>{student}</td><td>{school}</td><td style={numeric}>{sessions}</td></tr>
            ))}
        </tbody>
    </PatternTable>
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
    <PatternTable>
        <thead>
            <tr><th>School</th><th style={numeric}>Classes</th><th style={numeric}>Students</th><th style={numeric}>Sessions</th></tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--inline-md)' }}>
                        {icon('chevron-down')}Lincoln Middle
                    </span>
                </td>
                <td style={numeric}>2</td>
                <td style={numeric}>4</td>
                <td style={numeric}>40</td>
            </tr>
            <tr>
                <td colSpan={4} style={{ paddingInlineStart: 'calc(var(--table-indent) + var(--icon-sm))' }}>
                    <div style={{ font: 'var(--heading-xxsmall)', ...subtle }}>Classes</div>
                    <div>Grade 7 · Math: Ava Thompson, Sofia Ramirez. Grade 8 · Math: Marcus Lee, Jordan Patel.</div>
                </td>
            </tr>
            <tr>
                <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--inline-md)' }}>
                        {icon('chevron-right')}Roosevelt K-8
                    </span>
                </td>
                <td style={numeric}>3</td>
                <td style={numeric}>6</td>
                <td style={numeric}>31</td>
            </tr>
        </tbody>
    </PatternTable>
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
    <PatternTable>
        <thead>
            <tr><th>Student</th><th>Tutor</th><th style={numeric}>Sessions</th></tr>
        </thead>
        <tbody>
            {students.map(([student, tutor, sessions]) => (
                <tr key={student}><td>{student}</td><td>{tutor}</td><td style={numeric}>{sessions}</td></tr>
            ))}
        </tbody>
    </PatternTable>
);

const countToolbar = <PatternSection.Toolbar count="340 students" />;

const InSection = ({ children, toolbar = countToolbar }) => (
    <HeadingLevelContext.Provider value={5}>
        <PatternSection title="Students" toolbar={toolbar}>{children}</PatternSection>
    </HeadingLevelContext.Provider>
);

/** The table spans the Section under its header: no frame, no padding of its own. */
const PlainTableCase = () => <InSection>{studentTable}</InSection>;

/** The table in its own padded frame, out of line with the Section header. */
const FramedTableCase = () => (
    <InSection>
        <div style={{ padding: 'var(--pad-x-md)', border: 'var(--border-default) solid var(--ds-border)', borderRadius: 'var(--radius-md)' }}>
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
