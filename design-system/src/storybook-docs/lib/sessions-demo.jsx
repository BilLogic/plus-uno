import React from 'react';
import { DynamicTable, Tabs } from '@/components';

/**
 * Page tabs and a sessions table: the two parts the page, section and pattern
 * demos share. Docs helpers, so no consumer copies them.
 */

const DEFAULT_TAB_LABELS = ['Overview', 'Sessions', 'Notes'];

/** Page tabs: they switch the whole page. */
export const PageTabs = ({ active = 'overview', onSelect, labels = DEFAULT_TAB_LABELS, 'aria-label': ariaLabel = 'Student pages' }) => (
    <Tabs
        {...(onSelect ? { activeKey: active, onSelect } : { defaultActiveKey: active })}
        aria-label={ariaLabel}
    >
        {labels.map((entry) => {
            const [key, label] = Array.isArray(entry) ? entry : [entry.toLowerCase(), entry];
            return <Tabs.Tab key={key} eventKey={key}>{label}</Tabs.Tab>;
        })}
    </Tabs>
);

const SESSION_HEAD = { cells: ['Time', 'Tutor', 'Subject'].map((content) => ({ key: content, content, isSortable: true })) };
export const UPCOMING_SESSIONS = [
    ['Thu 4:00 PM', 'Ms. Ortiz', 'Algebra'],
    ['Thu 5:30 PM', 'Mr. Patel', 'Geometry'],
    ['Fri 3:30 PM', 'Ms. Ortiz', 'Fractions'],
    ['Sat 10:00 AM', 'Ms. Kim', 'Linear equations'],
];
export const PAST_SESSIONS = [
    ['Tue 4:00 PM', 'Ms. Ortiz', 'Two-step equations'],
    ['Mon 3:30 PM', 'Mr. Patel', 'Angles and proofs'],
    ['Fri 4:00 PM', 'Ms. Kim', 'Ratios and rates'],
];

/** A Dynamic table of sessions, filtered by status (`upcoming` or `past`) or explicit `rows`. */
export const SessionsTable = ({ status = 'upcoming', rows: rowsProp }) => {
    const rows = rowsProp ?? (status === 'past' ? PAST_SESSIONS : UPCOMING_SESSIONS);
    return (
        <DynamicTable
            head={SESSION_HEAD}
            rows={rows.map((cells) => ({ key: cells.join(), cells: cells.map((content) => ({ key: content, content })) }))}
            label="Sessions"
            isFixedSize
        />
    );
};
