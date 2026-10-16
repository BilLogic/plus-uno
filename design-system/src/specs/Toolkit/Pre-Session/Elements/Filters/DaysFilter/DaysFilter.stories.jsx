import React, { useState } from 'react';
import { Select } from '@/components';
import { FilterSelect } from '../FilterSelect';
import { playCommitsOnClose } from '../filterPlay';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Days Filter',
    component: Select,
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
    },
};

const dayOptions = [
    { value: 'mon', label: 'Mondays' },
    { value: 'tue', label: 'Tuesdays' },
    { value: 'wed', label: 'Wednesdays' },
    { value: 'thu', label: 'Thursdays' },
    { value: 'fri', label: 'Fridays' },
];

/**
 * Days filter: pick any number of weekdays. No pick means every day, so the
 * empty field reads "All days". The table refilters once, when the list closes.
 */
export const DaysFilter = ({ value, defaultValue = [], onChange, open }) => (
    <FilterSelect
        aria-label="Days"
        mode="multi"
        placeholder="All days"
        options={dayOptions}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        open={open}
    />
);

/** Every state: all days, open, and some days picked. */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg)' }}>
        <section>
            <h6 className="h6 mb-3">Closed state (all days)</h6>
            <DaysFilter />
        </section>
        <section style={{ paddingBottom: 'var(--size-section-gap-lg)' }}>
            <h6 className="h6 mb-3">Open state</h6>
            <DaysFilter open />
        </section>
        <section style={{ marginTop: 'var(--size-section-gap-lg)' }}>
            <h6 className="h6 mb-3">Some days picked</h6>
            <DaysFilter defaultValue={['mon', 'wed']} />
        </section>
    </div>
);

/** Pick days; the filter applies when the list closes. */
export const Interactive = () => {
    const [days, setDays] = useState([]);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)' }}>
            <DaysFilter value={days} onChange={setDays} />
            <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                Currently filtering by: <strong data-testid="applied" style={{ color: 'var(--color-on-surface)' }}>
                    {days.length ? days.join(', ') : 'all days'}
                </strong>
            </p>
        </div>
    );
};

Interactive.play = playCommitsOnClose({
    name: 'Days',
    picks: ['Mondays', 'Fridays'],
    before: 'all days',
    after: 'mon, fri',
});
