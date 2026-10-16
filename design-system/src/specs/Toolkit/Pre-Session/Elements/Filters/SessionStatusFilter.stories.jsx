import React, { useState } from 'react';
import { Select } from '@/components';
import { FilterSelect } from './FilterSelect';
import { playCommitsOnClose } from './filterPlay';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Session Status Filter',
    component: Select,
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
    },
};

const defaultStatuses = [
    { value: 'in-progress', label: 'In progress', count: 20 },
    { value: 'starting-soon', label: 'Starting soon', count: 20 },
    { value: 'scheduled', label: 'Scheduled', count: 20 },
    { value: 'canceled', label: 'Canceled', count: 20 },
    { value: 'completed', label: 'Completed', count: 20 },
];

/**
 * Session status filter: pick any number of statuses, each row with its
 * session count. No pick means every status, so the empty field reads
 * "All status". The table refilters once, when the list closes.
 */
export const SessionStatusFilter = ({
    value,
    defaultValue = [],
    onChange,
    open,
    statuses = defaultStatuses,
    showCounts = true,
}) => (
    <FilterSelect
        aria-label="Session status"
        mode="multi"
        placeholder="All status"
        options={statuses.map(({ count, ...status }) => ({
            ...status,
            trailing: showCounts && count !== undefined
                ? <span className="filter-select-count">{count}</span>
                : undefined,
        }))}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        open={open}
    />
);

/** Every state: all statuses, open with counts, and statuses picked. */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg)' }}>
        <section>
            <h6 className="h6 mb-3">Default state (closed)</h6>
            <SessionStatusFilter />
        </section>
        <section style={{ paddingBottom: 'var(--size-section-gap-lg)' }}>
            <h6 className="h6 mb-3">Open state (with counts)</h6>
            <SessionStatusFilter open />
        </section>
        <section style={{ marginTop: 'var(--size-section-gap-lg)' }}>
            <h6 className="h6 mb-3">In progress picked</h6>
            <SessionStatusFilter defaultValue={['in-progress']} />
        </section>
        <section>
            <h6 className="h6 mb-3">Completed and canceled picked</h6>
            <SessionStatusFilter defaultValue={['completed', 'canceled']} />
        </section>
    </div>
);

/** Pick statuses; the filter applies when the list closes. */
export const Interactive = () => {
    const [statuses, setStatuses] = useState([]);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)' }}>
            <SessionStatusFilter value={statuses} onChange={setStatuses} />
            <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                Currently filtering by: <strong data-testid="applied" style={{ color: 'var(--color-on-surface)' }}>
                    {statuses.length ? statuses.join(', ') : 'all status'}
                </strong>
            </p>
        </div>
    );
};

Interactive.play = playCommitsOnClose({
    name: 'Session status',
    picks: [/^In progress/, /^Scheduled/],
    before: 'all status',
    after: 'in-progress, scheduled',
});
