/**
 * Live compositions for the table docs pages: the do and don't pairs of the
 * Static, Dynamic and Tree table rules, and the "Which table?" cases. Each is
 * built from the table pattern and current components, so a page can show a
 * rule before the table components exist in code.
 */
import React from 'react';
import PatternTable from '@/patterns/PatternTable';
import PatternSection from '@/patterns/PatternSection';
import PatternCard from '@/patterns/PatternCard';
import { Button, Checkbox, Pagination, Status } from '@/components';
import { SpecTable } from './docs-spec-table.jsx';

const students = [
    { name: 'Ava Thompson', school: 'Lincoln Middle', sessions: 12 },
    { name: 'Marcus Lee', school: 'Lincoln Middle', sessions: 9 },
    { name: 'Sofia Ramirez', school: 'Roosevelt K-8', sessions: 15 },
];

const end = { textAlign: 'right' };
const title = { font: 'var(--heading-xsmall)' };
const stripe = { backgroundColor: 'var(--ds-background-neutral-subtle)' };
const frame = { width: '100%', minWidth: 0 };
const unit = { fontVariantNumeric: 'tabular-nums' };

/** A column's sort control: a button that fills the head cell. */
const SortHead = ({ label, sort, align }) => (
    <th scope="col" style={align}>
        <button
            type="button"
            style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', gap: '4px', alignItems: 'center' }}
        >
            {label}
            <i
                className={`fa-solid ${sort === 'asc' ? 'fa-arrow-up' : sort === 'desc' ? 'fa-arrow-down' : 'fa-sort'}`}
                aria-hidden="true"
                style={{ fontSize: '12px', color: sort ? 'var(--ds-icon)' : 'var(--ds-icon-subtle)' }}
            />
        </button>
    </th>
);

const Toggle = ({ open, label }) => (
    <button
        type="button"
        aria-label={label}
        style={{ all: 'unset', cursor: 'pointer', width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
        <i className={`fa-solid ${open ? 'fa-chevron-down' : 'fa-chevron-right'}`} aria-hidden="true" style={{ fontSize: '12px' }} />
    </button>
);

const Range = ({ range = '1–25 of 340', page = 1 }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <span style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>{range}</span>
        <Pagination currentPage={page} totalPages={14} size="small" onPageChange={() => {}} />
    </div>
);

/** The message row of an empty table: the icon, the title, the description and the first action. */
export const Message = ({ icon = 'fa-folder', heading = 'No sessions yet', body = 'Sessions you schedule show up here.', action = 'Schedule a session' }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '16px' }}>
        <i className={`fa-regular ${icon}`} aria-hidden="true" style={{ fontSize: 'var(--icon-lg)', color: 'var(--ds-icon-subtle)' }} />
        <span style={{ font: 'var(--heading-xsmall)', color: 'var(--ds-text)' }}>{heading}</span>
        <span style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>{body}</span>
        {action && <Button text={action} style="primary" fill="text" size="small" onClick={() => {}} />}
    </div>
);

/** A read-only table of students: the base of most pairs. */
export const StudentTable = ({ numbers = 'end', titleColumn = 'first', boldAll = false, striped = false, rowCount = 3, summary = false, children, footer }) => (
    <div style={frame}>
        <PatternTable pagination={footer}>
            <thead>
                <tr>
                    <th scope="col">Student</th>
                    <th scope="col">School</th>
                    <th scope="col" style={numbers === 'end' ? end : undefined}>Sessions</th>
                </tr>
            </thead>
            <tbody>
                {students.slice(0, rowCount).map((row, i) => (
                    <tr key={row.name} style={striped && i % 2 === 1 ? stripe : undefined}>
                        <td style={titleColumn === 'first' || boldAll ? title : undefined}>{row.name}</td>
                        <td style={boldAll ? title : undefined}>{row.school}</td>
                        <td style={{ ...(numbers === 'end' ? end : undefined), ...(boldAll ? title : undefined), ...unit }}>{row.sessions}</td>
                    </tr>
                ))}
                {summary && (
                    <tr>
                        <td style={{ color: 'var(--ds-text-subtle)' }}>Total</td>
                        <td />
                        <td style={{ ...end, ...unit, color: 'var(--ds-text-subtle)' }}>36</td>
                    </tr>
                )}
                {children}
            </tbody>
        </PatternTable>
    </div>
);

/** A table people work with: sortable heads, a select column, row actions and a pager. */
export const RosterTable = ({ sortedColumn = 'Student', sortAll = false, selectedRows = [], emptyState = false, refreshing = false, skeleton = false, pager = true, range = true, select = true }) => {
    const sortOf = (label) => (sortAll ? 'desc' : sortedColumn === label ? 'asc' : undefined);
    const rows = [
        ['Ava Thompson', 'Priya Nair', 'Oct 24', 12],
        ['Marcus Lee', 'Daniel Kim', 'Oct 23', 9],
        ['Sofia Ramirez', 'Priya Nair', 'Oct 23', 15],
    ];
    const selectedCount = selectedRows.length;
    return (
        <div style={{ ...frame, opacity: refreshing ? 0.6 : 1, position: 'relative' }}>
            <PatternTable
                empty={emptyState}
                emptyState={emptyState ? <Message /> : undefined}
                pagination={pager ? (range ? <Range /> : <Pagination currentPage={1} totalPages={14} size="small" onPageChange={() => {}} />) : undefined}
            >
                <thead>
                    <tr>
                        {select && (
                            <th scope="col" style={{ width: '32px' }}>
                                <Checkbox
                                    aria-label="Select all rows"
                                    checked={selectedCount === rows.length}
                                    indeterminate={selectedCount > 0 && selectedCount < rows.length}
                                    readOnly
                                />
                            </th>
                        )}
                        <SortHead label="Student" sort={sortOf('Student')} />
                        <SortHead label="Tutor" sort={sortOf('Tutor')} />
                        <SortHead label="Last session" sort={sortOf('Last session')} />
                        <SortHead label="Sessions" sort={sortOf('Sessions')} align={end} />
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={row[0]} aria-selected={selectedRows.includes(i)}>
                            {select && <td><Checkbox aria-label={`Select ${row[0]}`} checked={selectedRows.includes(i)} readOnly /></td>}
                            {skeleton
                                ? [0, 1, 2, 3].map((c) => (
                                    <td key={c}><span aria-hidden="true" style={{ display: 'block', height: '12px', width: c === 3 ? '24px' : '80%', borderRadius: '4px', backgroundColor: 'var(--ds-background-neutral)' }} /></td>
                                ))
                                : (
                                    <>
                                        <td style={title}>{row[0]}</td>
                                        <td>{row[1]}</td>
                                        <td>{row[2]}</td>
                                        <td style={{ ...end, ...unit }}>{row[3]}</td>
                                    </>
                                )}
                        </tr>
                    ))}
                </tbody>
            </PatternTable>
            {refreshing && (
                <i className="fa-solid fa-spinner" aria-hidden="true" style={{ position: 'absolute', top: '50%', left: '50%', fontSize: 'var(--icon-lg)', color: 'var(--ds-icon-subtle)' }} />
            )}
        </div>
    );
};

/** The bulk bar in the Section header, over the roster. */
const bulkBar = (
    <PatternSection.Toolbar
        state="selected"
        selection="3 selected"
        bulkActions={(
            <>
                <Button text="Message" style="secondary" fill="outline" size="small" onClick={() => {}} />
                <Button text="Export" style="secondary" fill="outline" size="small" onClick={() => {}} />
            </>
        )}
        onClear={() => {}}
        clearLabel="Clear selection"
    />
);

const TreeRow = ({ level = 0, state = 'leaf', name, count, cells }) => (
    <tr>
        <td style={{ paddingLeft: `calc(var(--table-pad-x-cell) + ${level} * var(--table-indent))` }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {state === 'leaf'
                    ? <span aria-hidden="true" style={{ display: 'inline-block', width: '24px' }} />
                    : state === 'loading'
                        ? <i className="fa-solid fa-spinner" aria-hidden="true" style={{ width: '24px', textAlign: 'center', fontSize: '12px' }} />
                        : <Toggle open={state === 'expanded'} label={`${state === 'expanded' ? 'Collapse' : 'Expand'} ${name} row`} />}
                <span style={title}>{name}</span>
                {count != null && <span style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>{count}</span>}
            </span>
        </td>
        {cells.map((cell, i) => (
            <td key={i} style={i === cells.length - 1 ? { ...end, ...unit } : undefined}>{cell}</td>
        ))}
    </tr>
);

/** A course, its units and their lessons: rows nested to three levels. */
export const CourseTree = ({ loadingUnit = false, leafToggle = false, flatRows = false }) => (
    <div style={frame}>
        <PatternTable>
            <thead>
                <tr>
                    <th scope="col">Course</th>
                    <th scope="col">Tutor</th>
                    <th scope="col" style={end}>Sessions</th>
                </tr>
            </thead>
            <tbody>
                <TreeRow level={0} state="expanded" name="Algebra I" count={2} cells={['Priya Nair', 24]} />
                <TreeRow level={1} state="expanded" name="Unit 3 · Equations" count={2} cells={['Priya Nair', 8]} />
                <TreeRow level={2} state={leafToggle ? 'collapsed' : 'leaf'} name="Lesson 3.1 · One-step equations" cells={['Priya Nair', 4]} />
                <TreeRow level={2} state={leafToggle ? 'collapsed' : 'leaf'} name="Lesson 3.2 · Two-step equations" cells={['Priya Nair', 4]} />
                {flatRows && (
                    <tr>
                        <td style={title}>Geometry</td>
                        <td>Daniel Kim</td>
                        <td style={{ ...end, ...unit }}>18</td>
                    </tr>
                )}
                <TreeRow level={1} state={loadingUnit ? 'loading' : 'collapsed'} name="Unit 4 · Inequalities" count={3} cells={['Daniel Kim', 6]} />
                {loadingUnit && (
                    <tr>
                        <td colSpan={3} style={{ paddingLeft: 'calc(var(--table-pad-x-cell) + 2 * var(--table-indent))', color: 'var(--ds-text-subtle)' }}>
                            Loading lessons…
                        </td>
                    </tr>
                )}
            </tbody>
        </PatternTable>
    </div>
);

/* ---------- Pairs ---------- */

const quiet = { display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' };

/** The six rules of the Static table, in Figma's order. */
export const staticPairs = [
    {
        doExample: <RosterTable pager range />,
        doCaption: 'Build a roster people sort as a Dynamic table. Sorting brings its paging, selection and loading states with it.',
        dontExample: <RosterTable select={false} pager={false} />,
        dontCaption: 'Do not show a sortable roster as a Static table. Once one column sorts, people expect the rest of a Dynamic table, and a Static table has none of it.',
    },
    {
        doExample: (
            <div style={quiet}>
                <PatternSection title="Students" actions={<Button text="Export" style="secondary" fill="outline" size="small" onClick={() => {}} />}>
                    <StudentTable />
                </PatternSection>
            </div>
        ),
        doCaption: 'Put the title and any action that leaves the rows as they are, such as Export, in the Section header above the table. The table spans the section with no card around it. Search and filters make it a Dynamic table.',
        dontExample: (
            <PatternCard title="Students">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center', paddingBottom: '8px', font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>
                    <span><i className="fa-solid fa-magnifying-glass" aria-hidden="true" /> Search students</span>
                    <span>3 students</span>
                </div>
                <StudentTable />
            </PatternCard>
        ),
        dontCaption: 'Do not wrap the table in a card or put a toolbar inside it. A toolbar in the table scrolls away and breaks the column grid.',
    },
    {
        doExample: <StudentTable numbers="end" />,
        doCaption: 'Right-align numbers and their header, so digits line up and are easy to compare.',
        dontExample: <StudentTable numbers="start" />,
        dontCaption: 'Do not start-align numbers. Ragged digits make 9 and 15 hard to compare at a glance.',
    },
    {
        doExample: (
            <div style={frame}>
                <PatternTable>
                    <thead><tr><th scope="col">Session note</th></tr></thead>
                    <tbody>
                        <tr><td><span style={{ display: 'block', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title="Reviewed two-step equations and assigned practice set 4">Reviewed two-step equations and assigned practice set 4</span></td></tr>
                        <tr><td>Allergy: peanuts and tree nuts. Carries an EpiPen in her backpack.</td></tr>
                    </tbody>
                </PatternTable>
            </div>
        ),
        doCaption: 'Truncate long, skimmable text and show the full value in a tooltip on hover and focus. Wrap text people must read in full, such as a safety note.',
        dontExample: (
            <div style={frame}>
                <PatternTable>
                    <thead><tr><th scope="col">Session note</th></tr></thead>
                    <tbody>
                        <tr><td><span style={{ display: 'block', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Allergy: peanuts and tree nuts. Carries an EpiPen in her backpack.</span></td></tr>
                    </tbody>
                </PatternTable>
            </div>
        ),
        dontCaption: 'Do not truncate text people need in full. People who cannot hover never see the end, and here the end is the part that matters.',
    },
    {
        doExample: <StudentTable />,
        doCaption: 'Separate rows with hairline rules on a flat surface. Hover and selection then read clearly.',
        dontExample: <StudentTable striped />,
        dontCaption: 'Do not stripe alternate rows. Stripes compete with the hover and selected fills and read as meaning.',
    },
    {
        doExample: <StudentTable titleColumn="first" />,
        doCaption: 'Emphasize the one column that names the record, usually the first. The rest stay in the body style.',
        dontExample: <StudentTable boldAll />,
        dontCaption: 'Do not emphasize several columns. When everything is bold, nothing leads the eye.',
    },
];

/** The seven rules of the Dynamic table, in Figma's order. */
export const dynamicPairs = [
    {
        doExample: <StudentTable />,
        doCaption: 'Show records people only read and compare as a Static table, with no checkboxes, sort arrows or pager.',
        dontExample: <RosterTable />,
        dontCaption: 'Do not add checkboxes, sorting or a pager to a table nobody acts on. Each control promises an action the page does not offer.',
    },
    {
        doExample: <RosterTable emptyState pager={false} />,
        doCaption: 'Keep the header and put the message row under it, so people still see what the table holds and can sort or filter.',
        dontExample: <div style={{ width: '100%' }}><Message /></div>,
        dontCaption: 'Do not replace the whole table with a message. The columns disappear, and so does the way back.',
    },
    {
        doExample: <RosterTable refreshing />,
        doCaption: 'After a sort, page change or filter, dim the current rows under a spinner until the new ones arrive.',
        dontExample: <RosterTable skeleton />,
        dontCaption: 'Do not drop back to skeleton rows on every change. The layout jumps, and people lose their place.',
    },
    {
        doExample: (
            <div style={quiet}>
                {bulkBar}
                <RosterTable selectedRows={[0, 1, 2]} />
            </div>
        ),
        doCaption: 'When rows are selected, the Section header toolbar switches to the bulk bar with the count and the actions.',
        dontExample: (
            <div style={quiet}>
                <RosterTable selectedRows={[0, 1]} />
                {bulkBar}
            </div>
        ),
        dontCaption: 'Do not put the bulk bar inside the table or between rows. It hides records and scrolls away from the selection.',
    },
    {
        doExample: <RosterTable range />,
        doCaption: 'Show "1–25 of 340" beside the pager, so people know where they are and how many records there are.',
        dontExample: <RosterTable range={false} />,
        dontCaption: 'Do not show page numbers alone. People cannot tell how many records there are or how far they are into them.',
    },
    {
        doExample: <RosterTable sortedColumn="Student" />,
        doCaption: 'Show the sort arrow on one column. Sorting another column moves the arrow there.',
        dontExample: <RosterTable sortAll />,
        dontCaption: 'Do not show more than one sorted column. Several arrows do not say which order wins. Multi-sort belongs in the Section header sort control.',
    },
    {
        doExample: <RosterTable selectedRows={[1]} />,
        doCaption: 'Show selected rows with a checked box as well as the selected fill across the whole row, with no edge bar, and the header checkbox in its indeterminate state.',
        dontExample: (
            <div style={frame}>
                <PatternTable>
                    <thead><tr><th scope="col">Student</th><th scope="col">School</th><th scope="col" style={end}>Sessions</th></tr></thead>
                    <tbody>
                        {students.map((row, i) => (
                            <tr key={row.name} aria-selected={i === 1}>
                                <td style={title}>{row.name}</td><td>{row.school}</td><td style={{ ...end, ...unit }}>{row.sessions}</td>
                            </tr>
                        ))}
                    </tbody>
                </PatternTable>
            </div>
        ),
        dontCaption: 'Do not mark selection with the fill alone. Color by itself fails people who cannot see it, and the row can be mistaken for hover or highlighted.',
    },
];

/** The four rules of the Tree table, in Figma's order. */
export const treePairs = [
    {
        doExample: <CourseTree />,
        doCaption: 'When rows have children, such as a course with its units and lessons, use a Tree table, even when people also sort or select.',
        dontExample: (
            <div style={frame}>
                <PatternTable>
                    <thead><tr><th scope="col">Student</th><th scope="col">Tutor</th><th scope="col" style={end}>Sessions</th></tr></thead>
                    <tbody>
                        <tr><td><span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Toggle open label="Collapse Ava Thompson row" /><span style={title}>Ava Thompson</span></span></td><td>Priya Nair</td><td style={{ ...end, ...unit }}>12</td></tr>
                        <tr><td colSpan={3} style={{ paddingLeft: '40px', color: 'var(--ds-text-subtle)' }}>Worked through two-step equations. Ava solved 8 of 10 on her own and asked to review negative numbers next time.</td></tr>
                    </tbody>
                </PatternTable>
            </div>
        ),
        dontCaption: 'Do not fake children with expandable rows in a Dynamic table. Expanded content is a detail panel for one record, not a list of child records.',
    },
    {
        doExample: <CourseTree />,
        doCaption: 'Only parents get a chevron. Leaf rows keep its space, so names at the same level line up.',
        dontExample: <CourseTree leafToggle />,
        dontCaption: 'Do not put a chevron on a row with no children. People open it and find nothing.',
    },
    {
        doExample: <CourseTree loadingUnit />,
        doCaption: 'When a parent opens, show its toggle as loading and a loading row under it. The rest of the tree stays put.',
        dontExample: (
            <div style={{ ...frame, opacity: 0.6 }}>
                <CourseTree />
            </div>
        ),
        dontCaption: 'Do not reload the whole tree when one parent opens. People lose the rows they were looking at.',
    },
    {
        doExample: <CourseTree />,
        doCaption: 'Keep every row in a tree table a tree row, at its level.',
        dontExample: <CourseTree flatRows />,
        dontCaption: 'Do not drop flat table rows into a tree. They have no level, so people cannot tell what they belong to.',
    },
];

/** The three cases of "Which table?", in Figma's order: the right table, beside the mistake. */
export const whichTablePairs = [
    {
        doExample: <StudentTable summary />,
        doCaption: 'Show a read-only summary, in a report or a modal, as a Static table. The total goes in the summary row.',
        dontExample: <RosterTable pager />,
        dontCaption: 'Do not build the summary as a Dynamic table. Checkboxes, sort arrows and a pager promise actions the summary does not have.',
    },
    {
        doExample: (
            <div style={quiet}>
                {bulkBar}
                <RosterTable selectedRows={[0, 1, 2]} />
            </div>
        ),
        doCaption: 'Build a roster people act on as a Dynamic table: sortable heads, checkboxes, a pager, and bulk actions in the Section header.',
        dontExample: <StudentTable />,
        dontCaption: 'Do not show a roster people act on as a Static table. With no sort, selection or paging, 340 students become one long scroll.',
    },
    {
        doExample: <CourseTree />,
        doCaption: 'Nest classes under their school and students under their class in a Tree table. Each level indents and keeps the columns.',
        dontExample: (
            <div style={frame}>
                <PatternTable>
                    <thead><tr><th scope="col">School</th><th scope="col" style={end}>Students</th></tr></thead>
                    <tbody>
                        <tr><td><span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Toggle open label="Collapse Lincoln Middle row" /><span style={title}>Lincoln Middle</span></span></td><td style={{ ...end, ...unit }}>48</td></tr>
                        <tr><td colSpan={2} style={{ paddingLeft: '40px', color: 'var(--ds-text-subtle)' }}>Grade 7 · Math: Ava Thompson, Sofia Ramirez. Grade 8 · Math: Marcus Lee, Jordan Patel.</td></tr>
                    </tbody>
                </PatternTable>
            </div>
        ),
        dontCaption: 'Do not fake a hierarchy with expandable rows. Expanded content is detail about one row, so the classes and students in it lose their columns and cannot be sorted or selected.',
    },
];

/** The cell presets, one table of small examples. */
export const CellPresets = () => (
    <div style={frame}>
        <PatternTable>
            <thead>
                <tr>
                    <th scope="col">Preset</th>
                    <th scope="col">Example</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>Number</td><td style={{ ...unit }}>1,240</td></tr>
                <tr><td>Date</td><td>Oct 24, 4:30 PM</td></tr>
                <tr><td>Status</td><td><Status style="success">Active</Status></td></tr>
                <tr><td>Link</td><td><a href="#session-notes" onClick={(e) => e.preventDefault()}>Session notes</a></td></tr>
                <tr><td>Empty</td><td style={{ color: 'var(--ds-text-subtle)' }}>–</td></tr>
            </tbody>
        </PatternTable>
    </div>
);

/** The status line at the top of a planned table page: what is planned and what to use today. */
export const PlannedNote = ({ planned, today }) => (
    <div
        role="note"
        style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
            padding: '12px 16px',
            borderRadius: 'var(--card-radius-sm, 12px)',
            backgroundColor: 'var(--ds-background-information-subtler)',
            color: 'var(--ds-text)',
            font: 'var(--body-default)',
            marginBottom: '24px',
        }}
    >
        <i className="fa-solid fa-circle-info" aria-hidden="true" style={{ color: 'var(--ds-icon-information)', marginTop: '3px' }} />
        <span>
            <code style={{ color: 'inherit', backgroundColor: 'transparent', padding: 0 }}>{planned}</code> is planned and has no code yet. {today}
        </span>
    </div>
);

/** The choosing rule, in the question order Figma gives, with the three types. */
export const WhichTableRule = () => (
    <>
        <p>
            Does any row nest under another? Use a Tree table. Can people act on the table? Use a Dynamic table. Otherwise use a Static table.
            Nesting wins over everything else, even in a table people act on.
        </p>
        <SpecTable
            head={['Type', 'What it is', 'How to tell']}
            rows={[
                ['Static table', 'A fixed display grid: rows and columns you read, with nothing to do to the table itself.', 'Nothing about the data changes on its own: no sorting, filtering, selection, pagination, row expansion, row actions or inline edits. A link inside a cell is fine. Rows rest, or are highlighted for emphasis.'],
                ['Dynamic table', 'Any table people interact with.', 'Any of these apply: sort, filter, select (including bulk actions), paginate, expand rows, row actions, a frozen column, or loading and empty states. Hover, pressed, focus and selected rows live here and in Tree tables.'],
                ['Tree table', 'Rows nest under parent rows.', 'A row has children. Nesting wins over everything else, even in an interactive table.'],
            ]}
        />
    </>
);

/* ---------- Variants and states ---------- */

const rowStack = { display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' };

const label = (text) => (
    <span style={{ display: 'block', marginBottom: '8px', font: 'var(--heading-xxsmall)', color: 'var(--ds-text-subtle)' }}>{text}</span>
);

/** Plain sits flush in its section; framed adds a 1px outline and the table radius. */
export const Frames = () => (
    <div style={rowStack}>
        <div>
            {label('frame = plain')}
            <StudentTable />
        </div>
        <div>
            {label('frame = framed')}
            <div style={{ border: '1px solid var(--ds-border)', borderRadius: 'var(--table-radius)', overflow: 'hidden' }}>
                <StudentTable />
            </div>
        </div>
    </div>
);

/** The three row heights, 32, 40 and 48 at the minimum. */
export const RowSizes = () => (
    <div style={rowStack}>
        {[['sm', 32], ['md', 40], ['lg', 48]].map(([size, height]) => (
            <div key={size}>
                {label(`size = ${size} · ${height}`)}
                <div style={frame}>
                    <PatternTable>
                        <tbody>
                            <tr>
                                <td style={{ height: `${height}px`, ...title }}>Ava Thompson</td>
                                <td style={{ height: `${height}px` }}>Grade 7</td>
                                <td style={{ height: `${height}px` }}>Lincoln Middle</td>
                                <td style={{ height: `${height}px`, ...end, ...unit }}>12</td>
                            </tr>
                        </tbody>
                    </PatternTable>
                </div>
            </div>
        ))}
    </div>
);

/** A row at rest, and a row highlighted to mark it as new or changed. */
export const StaticRowStates = () => (
    <div style={frame}>
        <PatternTable>
            <thead><tr><th scope="col">Student</th><th scope="col">School</th><th scope="col" style={end}>Sessions</th></tr></thead>
            <tbody>
                <tr>
                    <td style={title}>Ava Thompson</td><td>Lincoln Middle</td><td style={{ ...end, ...unit }}>12</td>
                </tr>
                <tr style={{ backgroundColor: 'var(--ds-background-warning)' }}>
                    <td style={title}>Marcus Lee</td><td>Lincoln Middle</td><td style={{ ...end, ...unit }}>9</td>
                </tr>
            </tbody>
        </PatternTable>
    </div>
);

/** A cell in error, tinted with a 12px error icon, and a cell that is still loading. */
export const CellStates = () => (
    <div style={frame}>
        <PatternTable>
            <thead><tr><th scope="col">Student</th><th scope="col">Last session</th><th scope="col">Sessions</th></tr></thead>
            <tbody>
                <tr>
                    <td style={title}>Ava Thompson</td>
                    <td style={{ backgroundColor: 'var(--ds-background-danger-subtler)' }}>
                        <i className="fa-solid fa-circle-exclamation" aria-hidden="true" style={{ fontSize: '12px', color: 'var(--ds-icon-danger)', marginRight: '4px' }} />
                        Oct 32
                    </td>
                    <td>12</td>
                </tr>
                <tr>
                    <td style={title}>Marcus Lee</td>
                    <td>Oct 23</td>
                    <td><span aria-hidden="true" style={{ display: 'block', height: '12px', width: '24px', borderRadius: '4px', backgroundColor: 'var(--ds-background-neutral)' }} /></td>
                </tr>
            </tbody>
        </PatternTable>
    </div>
);

const messageTypes = [
    { name: 'empty', icon: 'fa-folder', heading: 'No sessions yet', body: 'Sessions you schedule show up here.', action: 'Schedule a session' },
    { name: 'no results', icon: 'fa-magnifying-glass', heading: 'No students match these filters', body: 'Try a different search, or clear the filters.', action: 'Clear filters' },
    { name: 'error', icon: 'fa-circle-exclamation', heading: 'Sessions didn’t load', body: 'Check your connection, then try again.', action: 'Try again' },
    { name: 'loading', icon: 'fa-spinner', heading: 'Loading sessions…', body: null, action: null },
];

/** The message rows: the header stays, and one row says why rows are missing. */
export const MessageRows = () => (
    <div style={rowStack}>
        {messageTypes.map((m) => (
            <div key={m.name}>
                {label(`type = ${m.name}`)}
                <div style={frame}>
                    <PatternTable empty emptyState={<Message icon={m.icon} heading={m.heading} body={m.body} action={m.action} />}>
                        <thead><tr><th scope="col">Student</th><th scope="col">Tutor</th><th scope="col" style={end}>Sessions</th></tr></thead>
                    </PatternTable>
                </div>
            </div>
        ))}
        <div>
            {label('type = load more')}
            <div style={{ ...frame, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '8px' }}>
                <span style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>Showing 25 of 340</span>
                <Button text="Load 25 more" style="primary" fill="text" size="small" onClick={() => {}} />
            </div>
        </div>
    </div>
);

/** The footer: the range and the pager, full or compact. */
export const FooterTypes = () => (
    <div style={rowStack}>
        <div>
            {label('type = full · page = middle')}
            <Range range="151–175 of 340" page={8} />
        </div>
        <div>
            {label('type = compact · page = middle')}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>151–175 of 340</span>
                <span style={{ display: 'inline-flex', gap: '8px' }}>
                    <Button text="Previous" style="secondary" fill="outline" size="small" onClick={() => {}} />
                    <Button text="Next" style="secondary" fill="outline" size="small" onClick={() => {}} />
                </span>
            </div>
        </div>
    </div>
);

/** A Dynamic table in each of its states: default, loading, refreshing, empty, no results and error. */
export const DynamicStates = () => (
    <div style={rowStack}>
        <div>{label('state = default')}<RosterTable /></div>
        <div>{label('state = loading')}<RosterTable skeleton /></div>
        <div>{label('state = refreshing')}<RosterTable refreshing /></div>
        <div>{label('state = empty')}<RosterTable emptyState pager={false} /></div>
        <div>
            {label('state = error')}
            <div style={frame}>
                <PatternTable empty emptyState={<Message icon="fa-circle-exclamation" heading="Sessions didn’t load" body="Check your connection, then try again." action="Try again" />}>
                    <thead><tr><th scope="col">Student</th><th scope="col">Tutor</th><th scope="col">Last session</th><th scope="col" style={end}>Sessions</th></tr></thead>
                </PatternTable>
            </div>
        </div>
    </div>
);

/** The tree table's empty state: a message row under the header. */
export const TreeEmpty = () => (
    <div style={frame}>
        <PatternTable empty emptyState={<Message heading="No courses yet" body="Courses you add for this school show up here, with their units and lessons." action={null} />}>
            <thead><tr><th scope="col">Course</th><th scope="col">Tutor</th><th scope="col" style={end}>Sessions</th></tr></thead>
        </PatternTable>
    </div>
);

/** The toggle in each of its four forms. */
export const Toggles = () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
        {[['collapsed', false], ['expanded', true]].map(([name, open]) => (
            <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Toggle open={open} label={`${name} toggle`} />
                <span style={{ font: 'var(--body-small)' }}>{name}</span>
            </span>
        ))}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span aria-hidden="true" style={{ display: 'inline-block', width: '24px', height: '24px' }} />
            <span style={{ font: 'var(--body-small)' }}>leaf</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-spinner" aria-hidden="true" style={{ width: '24px', textAlign: 'center', fontSize: '12px' }} />
            <span style={{ font: 'var(--body-small)' }}>loading</span>
        </span>
    </div>
);

/** A Dynamic table with its selection, bulk bar and pager. */
export const DynamicAnatomy = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
        {bulkBar}
        <RosterTable selectedRows={[0, 1]} />
    </div>
);
