import React, { useState } from 'react';
import { Select } from '@/components';
import { playPicksOne } from './filterPlay';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Call-Off Type Filter',
    component: Select,
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
    },
};

const filterOptions = [
    { value: 'this_week', label: 'This week' },
    { value: 'this_month', label: 'This month' },
    { value: 'all_time', label: 'All time' },
    { value: 'custom', label: 'Custom' },
];

/**
 * Call-off type filter, with its label above it. The options exclude each
 * other, so it picks one and applies at once.
 */
const FilterWrapper = ({ label = 'Call-Off Type', value, defaultValue = 'this_week', onChange, open }) => (
    <div style={{ width: '240px' }}>
        <Select
            label={label}
            options={filterOptions}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            open={open}
        />
    </div>
);

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 'var(--size-section-gap-lg)', alignItems: 'flex-start' }}>
        <section>
            <h6 className="h6 mb-3">Default state (closed)</h6>
            <FilterWrapper />
        </section>
        <section>
            <h6 className="h6 mb-3">Open state</h6>
            <div style={{ height: '240px' }}>
                <FilterWrapper open />
            </div>
        </section>
        <section>
            <h6 className="h6 mb-3">Picked state (closed)</h6>
            <FilterWrapper defaultValue="all_time" />
        </section>
    </div>
);

export const Interactive = () => {
    const [type, setType] = useState('this_week');
    return (
        <div>
            <h6 className="h6 mb-3">Interactive demo</h6>
            <p className="body2-txt mb-4">Pick a filter type.</p>
            <FilterWrapper value={type} onChange={setType} />
            <p className="body3-txt mt-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                Currently filtering by: <strong data-testid="applied" style={{ color: 'var(--color-on-surface)' }}>
                    {type}
                </strong>
            </p>
        </div>
    );
};

Interactive.play = playPicksOne({ name: 'Call-Off Type', pick: 'This month', after: /^this_month$/ });
