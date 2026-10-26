import React from 'react';
import PatternTable from '@/patterns/PatternTable';
import PatternSection from '@/patterns/PatternSection';
import { Button, Checkbox, Pagination } from '@/components';
import { HeadingLevelContext } from '@/lib/headingLevel';

/**
 * The examples of "Which table?": one pair per table type, each side built
 * from the table pattern and the components a real table would use. They are
 * drawn here with plain cells because the three table components are not in
 * code yet.
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
const icon = (name) => <i className={`fa-solid fa-${name}`} aria-hidden="true" style={{ fontSize: 'var(--icon-sm)' }} />;

const SortHead = ({ children, sort, align }) => (
    <th aria-sort={sort === 'up' ? 'ascending' : undefined} style={align}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--element-inline-md)' }}>
            {children}
            {icon(sort === 'up' ? 'arrow-up' : 'sort')}
        </span>
    </th>
);

const RowActions = ({ label }) => (
    <Button leadingVisual="ellipsis" style="default" fill="ghost" size="small" aria-label={label} onClick={() => {}} />
);

const Pager = ({ range, pages }) => (
    <>
        <span style={{ font: 'var(--body-default)', ...subtle }}>{range}</span>
        <Pagination currentPage={1} totalPages={pages} size="small" onPageChange={() => {}} />
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
                    <td><Checkbox aria-label={`Select ${day}`} /></td>
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

const RosterSection = () => (
    <PatternSection
        title="Students"
        toolbar={(
            <PatternSection.Toolbar
                state="selected"
                selection="2 selected"
                bulkActions={(
                    <>
                        <Button text="Message" style="default" fill="ghost" size="small" onClick={() => {}} />
                        <Button text="Export" style="default" fill="ghost" size="small" onClick={() => {}} />
                        <Button text="Remove" style="default" fill="ghost" size="small" onClick={() => {}} />
                    </>
                )}
                onClear={() => {}}
                clearLabel="Clear selection"
            />
        )}
    >
        <PatternTable pagination={<Pager range="1–25 of 340" pages={14} />}>
            <thead>
                <tr>
                    <th><span className="visually-hidden">Select</span></th>
                    <SortHead sort="up">Student</SortHead>
                    <SortHead>Tutor</SortHead>
                    <SortHead>Last session</SortHead>
                    <SortHead align={numeric}>Sessions</SortHead>
                    <SortHead align={numeric}>Attendance</SortHead>
                    <th><span className="visually-hidden">Actions</span></th>
                </tr>
            </thead>
            <tbody>
                {roster.map(([student, tutor, last, sessions, attendance], i) => (
                    <tr key={student} aria-selected={i < 2}>
                        <td><Checkbox aria-label={`Select ${student}`} checked={i < 2} readOnly /></td>
                        <td>{student}</td>
                        <td>{tutor}</td>
                        <td>{last}</td>
                        <td style={numeric}>{sessions}</td>
                        <td style={numeric}>{attendance}</td>
                        <td><RowActions label={`Actions for ${student}`} /></td>
                    </tr>
                ))}
            </tbody>
        </PatternTable>
    </PatternSection>
);

/**
 * A roster people act on: sortable heads, checkboxes, a pager, and bulk
 * actions in the Section header. It sits inside a docs section, so its title
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

/** A row of a hierarchy: the name indents by level and every level keeps the same columns. */
const TreeRow = ({ level, open, name, count, type, sessions }) => (
    <tr>
        <td>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--element-inline-md)', paddingInlineStart: `calc(${level} * var(--table-indent))` }}>
                <span style={{ display: 'inline-flex', width: 'var(--icon-sm)', justifyContent: 'center' }}>
                    {open === undefined ? null : icon(open ? 'chevron-down' : 'chevron-right')}
                </span>
                {name}
                {count !== undefined && <span style={subtle}>{count}</span>}
            </span>
        </td>
        <td>{type}</td>
        <td style={numeric}>{sessions}</td>
    </tr>
);

/** School, class, student: each level indents and keeps the columns. */
const TreeHierarchyCase = () => (
    <PatternTable>
        <thead>
            <tr><SortHead>Name</SortHead><SortHead>Type</SortHead><SortHead align={numeric}>Sessions</SortHead></tr>
        </thead>
        <tbody>
            <TreeRow level={0} open name="Lincoln Middle" count={3} type="School" sessions={54} />
            <TreeRow level={1} open name="Grade 7 · Math" count={2} type="Class" sessions={27} />
            <TreeRow level={2} name="Ava Thompson" type="Student" sessions={12} />
            <TreeRow level={2} name="Sofia Ramirez" type="Student" sessions={15} />
            <TreeRow level={1} open={false} name="Grade 8 · Math" count={3} type="Class" sessions={19} />
            <TreeRow level={1} open={false} name="Grade 6 · Reading" count={4} type="Class" sessions={8} />
        </tbody>
    </PatternTable>
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
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--element-inline-md)' }}>
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
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--element-inline-md)' }}>
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
