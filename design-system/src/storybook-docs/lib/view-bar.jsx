import React, { useState } from 'react';

import { Button, ButtonGroup, Checkbox, CountTag, DynamicTable, IconButton, Tabs as TabsComponent } from '@/components';

/**
 * The Section's view bar and the rows it acts on, shared by the Section
 * template's stories and every pattern page that shows a bar (Filtering
 * first; Search, Navigation and Common actions copy it). Each part is the real
 * PLUS component; only the arrangement lives here.
 *
 *   ViewBar         views at the start, then BarEnd
 *   BarEnd          format switch, Search, filters, More, the labeled Primary
 *   ViewPills       pill views: a fixed set, one pill even with one view
 *   FormatSwitch    equal-width segments
 *   StudentsTable   a Dynamic table of tutoring rows (STUDENTS)
 *   FilterSide      the filter side: "Reset filters" at its top, a count per category
 *   useLayerMount   an element an open menu mounts in, so a picture keeps it
 */

/**
 * A callback ref and the element it holds, `null` until the first render.
 * Hand the element to a menu's `container` so its open layer mounts inside
 * the picture: it scales and clips with it, and the page around never gains a
 * floating box.
 *
 * @returns {[(node: Element | null) => void, Element | null]}
 */
export const useLayerMount = () => {
    const [mount, setMount] = useState(null);
    return [setMount, mount];
};

export const STUDENTS = [
    ['Ava Thompson', 'Grade 7', 'Oct 24', 'Active', true, 'Priya Nair'],
    ['Marcus Lee', 'Grade 8', 'Oct 23', 'Active', true, 'Devon Brooks'],
    ['Sofia Ramirez', 'Grade 7', 'Oct 23', 'Active', false, 'Priya Nair'],
    ['Jordan Patel', 'Grade 6', 'Oct 21', 'Paused', false, 'Samir Shah'],
    ['Emily Chen', 'Grade 8', 'Oct 20', 'Active', false, 'Devon Brooks'],
    ['Noah Williams', 'Grade 6', 'Oct 18', 'Paused', true, 'Samir Shah'],
];
export const STUDENT_HEAD = { cells: [{ key: 'name', content: 'Name' }, { key: 'grade', content: 'Grade' }, { key: 'last', content: 'Last session' }] };
const SORTABLE_STUDENT_HEAD = {
    cells: STUDENT_HEAD.cells.map((cell) => ({ ...cell, isSortable: true })),
};
export const filterStudentList = ({ count = STUDENTS.length, view, checked } = {}) => {
    let list = STUDENTS.slice(0, count);
    if (view === 'Needs follow-up') {
        list = list.filter(([, , , , followUp]) => followUp);
    } else if (view === 'Paused') {
        list = list.filter(([, , , status]) => status === 'Paused');
    }
    if ( Array.isArray(checked) ) {
        const grades = checked.filter((v) => v.startsWith('Grade '));
        const statuses = checked.filter((v) => v === 'Active' || v === 'Paused');
        list = list.filter(([, grade, , status]) => (
            (grades.length === 0 || grades.includes(grade))
            && (statuses.length === 0 || statuses.includes(status))
        ));
    }
    return list;
};
export const studentRows = (count, options) => filterStudentList({ count, ...options }).map(([name, grade, last]) => ({
    key: name,
    cells: [{ key: name, content: name }, { key: grade, content: grade }, { key: last, content: last }],
}));
export const StudentsTable = ({ count = 4, sortable = false, view, checked, rows, columns, label = 'Students', ...props }) => {
    const head = columns
        ? { cells: columns.map((content) => ({ key: content.toLowerCase(), content, ...(sortable ? { isSortable: true } : {}) })) }
        : (sortable ? SORTABLE_STUDENT_HEAD : STUDENT_HEAD);
    const tableRows = rows
        ? rows.map((rowValues) => ({
            key: rowValues[0],
            cells: rowValues.slice(0, head.cells.length).map((content) => ({ key: content, content })),
        }))
        : studentRows(count, { view, checked });
    return (
        <DynamicTable head={head} rows={tableRows} label={label} isFixedSize {...props} />
    );
};

export const row = { display: 'flex', alignItems: 'center', gap: 'var(--inline-md)', minWidth: 0 };

/** Pill views: a fixed set the product defines, one pill even with one view. */
export const ViewPills = ({ views, activeView, onViewChange }) => {
    const [uncontrolled, setUncontrolled] = useState(views[0]);
    const active = activeView ?? uncontrolled;
    const handleSelect = (next) => {
        if (activeView === undefined) setUncontrolled(next);
        onViewChange?.(next);
    };
    return (
        <TabsComponent appearance="pill" activeKey={active} onSelect={handleSelect} aria-label="Views">
            {views.map((view) => <TabsComponent.Tab key={view} eventKey={view}>{view}</TabsComponent.Tab>)}
        </TabsComponent>
    );
};

/** The format switch: equal-width segments, first on the right. */
export const FormatSwitch = ({ iconsOnly = true, format: controlledFormat, onFormatChange }) => {
    const [uncontrolled, setUncontrolled] = useState('table');
    const format = controlledFormat ?? uncontrolled;
    const handleSelect = (next) => {
        if (controlledFormat === undefined) setUncontrolled(next);
        onFormatChange?.(next);
    };
    return (
        <ButtonGroup label="Format">
            {[['table', 'table-list', 'Table'], ['cards', 'grip', 'Cards']].map(([key, icon, label]) => (
                iconsOnly
                    ? <IconButton key={key} icon={icon} label={label} isSelected={format === key} onClick={() => handleSelect(key)} />
                    : <Button key={key} text={label} iconBefore={icon} isSelected={format === key} onClick={() => handleSelect(key)} />
            ))}
        </ButtonGroup>
    );
};

/**
 * The view bar's end, in order: format switch, Search, filters, More, the
 * labeled Primary. `narrow` keeps only the Primary's icon, below 768.
 */
export const BarEnd = ({ format = false, onFormatChange, search = true, searchLabel = 'Search students', filters = null, more = true, primary = 'Add students', primaryIcon = 'user-plus', narrow = false }) => {
    const formatValue = typeof format === 'string' ? format : undefined;
    const searchControl = React.isValidElement(search)
        ? search
        : (search ? <IconButton icon="magnifying-glass" label={searchLabel} appearance="subtle" onClick={() => {}} /> : null);
    return (
        <div style={{ ...row, marginInlineStart: 'auto' }}>
            {format && <FormatSwitch format={formatValue} onFormatChange={onFormatChange} />}
            {searchControl}
            {filters}
            {more && <IconButton icon="ellipsis" label="More" appearance="subtle" onClick={() => {}} />}
            {primary && (narrow
                ? <IconButton icon={primaryIcon} label={primary} appearance="primary" onClick={() => {}} />
                : <Button text={primary} iconBefore={primaryIcon} appearance="primary" onClick={() => {}} />)}
        </div>
    );
};

/** The view bar: views at the start, everything that acts on the rows at the end. */
export const ViewBar = ({ views = ['All students'], start, activeView, onViewChange, ...end }) => (
    <div className="plus-section-view-bar" style={{ ...row, inlineSize: '100%' }}>
        {start ?? <ViewPills views={views} activeView={activeView} onViewChange={onViewChange} />}
        <BarEnd {...end} />
    </div>
);

export const FILTERS = [
    ['Grade', ['Grade 6', 'Grade 7', 'Grade 8']],
    ['Status', ['Active', 'Paused']],
];

/** The filter side: "Reset filters" at its top, a count beside each category. */
export const FilterSide = ({ checked, onToggle, onReset, filters = FILTERS }) => (
    <div className="plus-section-filter-side" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
        <div>
            <Button text="Reset filters" appearance="subtle" spacing="compact" onClick={onReset} />
        </div>
        {filters.map(([category, values]) => {
            const on = values.filter((v) => checked.includes(v)).length;
            return (
                <fieldset key={category} style={{ margin: 0, padding: 0, border: 0, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                    <legend style={{ ...row, padding: 0, marginBlockEnd: 'var(--stack-md)', font: 'var(--heading-xxs)', color: 'var(--ds-text)' }}>
                        {category}
                        <CountTag value={on} label={`${on} applied`} />
                    </legend>
                    {values.map((v) => <Checkbox key={v} label={v} isChecked={checked.includes(v)} onChange={() => onToggle(v)} />)}
                </fieldset>
            );
        })}
    </div>
);
