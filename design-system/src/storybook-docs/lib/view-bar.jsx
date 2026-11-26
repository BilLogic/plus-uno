import React, { useState } from 'react';

import { Button, Checkbox, CountTag, DynamicTable, SegmentedControl, Tabs as TabsComponent } from '@/components';
import { typeStyle } from './type-style.js';

/**
 * The parts a Section example hands to its header slots and the rows it acts
 * on, shared by the Section template's stories and every pattern page. Each
 * part is the real PLUS component; only the arrangement lives here.
 *
 *   ViewPills       pill views: a fixed set, one pill even with one view
 *   FormatSwitch    the Table / Cards segmented control
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

/**
 * Pill views: a fixed set the product defines, one pill even with one view.
 * A pattern picture is a desktop screen drawn on a small stage, so its views
 * keep the wide strip (`overflow="collapse"`) rather than take the narrow menu
 * the stage's width would give them; pass `overflow="auto"` to show that.
 */
export const ViewPills = ({ views, activeView, onViewChange, overflow = 'collapse' }) => {
    const [uncontrolled, setUncontrolled] = useState(views[0]);
    const active = activeView ?? uncontrolled;
    const handleSelect = (next) => {
        if (activeView === undefined) setUncontrolled(next);
        onViewChange?.(next);
    };
    return (
        <TabsComponent appearance="pill" overflow={overflow} activeKey={active} onSelect={handleSelect} aria-label="Views">
            {views.map((view) => <TabsComponent.Tab key={view} eventKey={view}>{view}</TabsComponent.Tab>)}
        </TabsComponent>
    );
};

/** The format switch: a segmented control, Table then Cards. */
export const FormatSwitch = ({ iconsOnly = true, format: controlledFormat, onFormatChange }) => (
    <SegmentedControl
        label="Format"
        value={controlledFormat}
        defaultValue="table"
        onChange={onFormatChange}
        options={[
            { value: 'table', label: 'Table', icon: 'table-list', isIconOnly: iconsOnly },
            { value: 'cards', label: 'Cards', icon: 'grip', isIconOnly: iconsOnly },
        ]}
    />
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
                    <legend style={{ ...row, padding: 0, marginBlockEnd: 'var(--stack-md)', ...typeStyle('heading-xxs'), color: 'var(--ds-text)' }}>
                        {category}
                        <CountTag value={on} label={`${on} applied`} />
                    </legend>
                    {values.map((v) => <Checkbox key={v} label={v} isChecked={checked.includes(v)} onChange={() => onToggle(v)} />)}
                </fieldset>
            );
        })}
    </div>
);
