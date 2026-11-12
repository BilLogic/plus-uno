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
    ['Ava Thompson', 'Grade 7', 'Oct 24'],
    ['Marcus Lee', 'Grade 8', 'Oct 23'],
    ['Sofia Ramirez', 'Grade 7', 'Oct 23'],
    ['Jordan Patel', 'Grade 6', 'Oct 21'],
    ['Emily Chen', 'Grade 8', 'Oct 20'],
    ['Noah Williams', 'Grade 6', 'Oct 18'],
];
export const STUDENT_HEAD = { cells: [{ key: 'name', content: 'Name' }, { key: 'grade', content: 'Grade' }, { key: 'last', content: 'Last session' }] };
export const studentRows = (count) => STUDENTS.slice(0, count).map(([name, grade, last]) => ({
    key: name,
    cells: [{ key: name, content: name }, { key: grade, content: grade }, { key: last, content: last }],
}));
export const StudentsTable = ({ count = 4, ...props }) => <DynamicTable head={STUDENT_HEAD} rows={studentRows(count)} label="Students" isFixedSize {...props} />;

export const row = { display: 'flex', alignItems: 'center', gap: 'var(--inline-md)', minWidth: 0 };

/** Pill views: a fixed set the product defines, one pill even with one view. */
export const ViewPills = ({ views }) => {
    const [active, setActive] = useState(views[0]);
    return (
        <TabsComponent appearance="pill" activeKey={active} onSelect={setActive} aria-label="Views">
            {views.map((view) => <TabsComponent.Tab key={view} eventKey={view}>{view}</TabsComponent.Tab>)}
        </TabsComponent>
    );
};

/** The format switch: equal-width segments, first on the right. */
export const FormatSwitch = ({ iconsOnly = true }) => {
    const [format, setFormat] = useState('table');
    return (
        <ButtonGroup label="Format">
            {[['table', 'table-list', 'Table'], ['calendar', 'calendar', 'Calendar']].map(([key, icon, label]) => (
                iconsOnly
                    ? <IconButton key={key} icon={icon} label={label} isSelected={format === key} onClick={() => setFormat(key)} />
                    : <Button key={key} text={label} iconBefore={icon} isSelected={format === key} onClick={() => setFormat(key)} />
            ))}
        </ButtonGroup>
    );
};

/**
 * The view bar's end, in order: format switch, Search, filters, More, the
 * labeled Primary. `narrow` keeps only the Primary's icon, below 768.
 */
export const BarEnd = ({ format = false, search = true, filters = null, more = true, primary = 'Add students', narrow = false }) => (
    <div style={{ ...row, marginInlineStart: 'auto' }}>
        {format && <FormatSwitch />}
        {search && <IconButton icon="magnifying-glass" label="Search students" appearance="subtle" onClick={() => {}} />}
        {filters}
        {more && <IconButton icon="ellipsis" label="More" appearance="subtle" onClick={() => {}} />}
        {primary && (narrow
            ? <IconButton icon="user-plus" label={primary} appearance="primary" onClick={() => {}} />
            : <Button text={primary} iconBefore="user-plus" appearance="primary" onClick={() => {}} />)}
    </div>
);

/** The view bar: views at the start, everything that acts on the rows at the end. */
export const ViewBar = ({ views = ['All students'], start, ...end }) => (
    <div className="plus-section-view-bar" style={{ ...row, inlineSize: '100%' }}>
        {start ?? <ViewPills views={views} />}
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
                    <legend style={{ ...row, padding: 0, marginBlockEnd: 'var(--stack-md)', font: 'var(--heading-xxsmall)', color: 'var(--ds-text)' }}>
                        {category}
                        <CountTag value={on} label={`${on} applied`} spacing="compact" />
                    </legend>
                    {values.map((v) => <Checkbox key={v} label={v} isChecked={checked.includes(v)} onChange={() => onToggle(v)} />)}
                </fieldset>
            );
        })}
    </div>
);
