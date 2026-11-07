import React from 'react';
import PatternTable from '@/patterns/PatternTable';
import PatternSection from '@/patterns/PatternSection';
import { Checkbox, Pagination, IconButton, DynamicTable, TableBulkActions, TreeTable } from '@/components';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { iconClass } from '../../lib/icon';

/**
 * The examples of "Which table?": one pair per table type, each side built
 * from the table pattern and the components a real table would use.
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

const SortHead = ({ children, sort, align }) => (
    <th aria-sort={sort === 'up' ? 'ascending' : undefined} style={align}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--inline-md)' }}>
            {children}
            {icon(sort === 'up' ? 'arrow-up' : 'sort')}
        </span>
    </th>
);

const RowActions = ({ label }) => (
    <IconButton icon="ellipsis" appearance="subtle" spacing="compact" label={label} onClick={() => {}} />
);

const Pager = ({ range, pages }) => (
    <>
        <span style={{ font: 'var(--body-default)', ...subtle }}>{range}</span>
        <Pagination currentPage={1} totalPages={pages} spacing="compact" onPageChange={() => {}} />
    </>
);

const weekdays = [
    ['Monday', 4, 120],
    ['Tuesday', 3, 90],
    ['Wednesday', 5, 150],
    ['Thursday', 2, 60],
    ['Friday', 4, 120],
];

/** A read-only weekly summary: the total sits in the summary row. */
const StaticSummaryCase = () => (
    <PatternTable>
        <thead>
            <tr><th>Day</th><th style={numeric}>Sessions</th><th style={numeric}>Minutes</th></tr>
        </thead>
        <tbody>
            {weekdays.map(([day, sessions, minutes]) => (
                <tr key={day}><td>{day}</td><td style={numeric}>{sessions}</td><td style={numeric}>{minutes}</td></tr>
            ))}
        </tbody>
        <tfoot>
            <tr>
                <th scope="row" style={{ font: 'var(--heading-xxsmall)' }}>Total</th>
                <td style={numeric}><strong>18</strong></td>
                <td style={numeric}><strong>540</strong></td>
            </tr>
        </tfoot>
    </PatternTable>
);

/** The same summary dressed as a Dynamic table: controls the summary does not have. */
const SummaryAsDynamicCase = () => (
    <PatternTable pagination={<Pager range="1–5 of 5" pages={1} />}>
        <thead>
            <tr>
                <th><span className="visually-hidden">Select</span></th>
                <SortHead sort="up">Day</SortHead>
                <SortHead align={numeric}>Sessions</SortHead>
                <SortHead align={numeric}>Minutes</SortHead>
                <th><span className="visually-hidden">Actions</span></th>
            </tr>
        </thead>
        <tbody>
            {weekdays.map(([day, sessions, minutes]) => (
                <tr key={day}>
                    <td><Checkbox aria-label={`Select ${day}`}/></td>
                    <td>{day}</td>
                    <td style={numeric}>{sessions}</td>
                    <td style={numeric}>{minutes}</td>
                    <td><RowActions label={`Actions for ${day}`} /></td>
                </tr>
            ))}
        </tbody>
    </PatternTable>
);

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

export const StaticSummary = unstyled(StaticSummaryCase);
export const SummaryAsDynamic = unstyled(SummaryAsDynamicCase);
export const DynamicRoster = unstyled(DynamicRosterCase);
export const RosterAsStatic = unstyled(RosterAsStaticCase);
export const TreeHierarchy = unstyled(TreeHierarchyCase);
export const TreeAsExpandable = unstyled(TreeAsExpandableCase);
