import React, { useState } from 'react';
import { Select } from '@/components';
import { FilterSelect } from '../FilterSelect';
import { playPicksOne } from '../filterPlay';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Capacity Filter',
    component: Select,
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
    },
};

const capacityOptions = [
    { value: 'not-filled', label: 'Not filled' },
    { value: 'filled', label: 'Filled' },
    { value: 'both', label: 'Both' },
];

/**
 * Capacity filter: one of three answers that exclude each other, so it picks
 * one and applies at once.
 */
export const CapacityFilter = ({ value, defaultValue = 'not-filled', onChange, open }) => (
    <FilterSelect
        aria-label="Capacity"
        options={capacityOptions}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        open={open}
    />
);

/** Every state: closed, open, and each answer picked. */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg)' }}>
        <section>
            <h6 className="h6 mb-3">Closed state (not filled)</h6>
            <CapacityFilter />
        </section>
        <section style={{ paddingBottom: 'var(--size-section-gap-lg)' }}>
            <h6 className="h6 mb-3">Open state</h6>
            <CapacityFilter open />
        </section>
        <section style={{ marginTop: 'var(--size-section-gap-lg)' }}>
            <h6 className="h6 mb-3">Filled picked</h6>
            <CapacityFilter defaultValue="filled" />
        </section>
        <section>
            <h6 className="h6 mb-3">Both picked</h6>
            <CapacityFilter defaultValue="both" />
        </section>
    </div>
);

/** Pick a capacity; the filter applies at once. */
export const Interactive = () => {
    const [capacity, setCapacity] = useState('not-filled');
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)' }}>
            <CapacityFilter value={capacity} onChange={setCapacity} />
            <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                Currently filtering by: <strong data-testid="applied" style={{ color: 'var(--color-on-surface)' }}>
                    {capacity}
                </strong>
            </p>
        </div>
    );
};

Interactive.play = playPicksOne({ name: 'Capacity', pick: 'Filled', after: /^filled$/ });
