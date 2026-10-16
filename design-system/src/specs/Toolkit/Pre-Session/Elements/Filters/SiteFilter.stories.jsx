import React, { useState } from 'react';
import { Select } from '@/components';
import { FilterSelect } from './FilterSelect';
import { playCommitsOnClose } from './filterPlay';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Site Filter',
    component: Select,
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
    },
};

const defaultSchools = [
    { value: 'school_1', label: 'School #1' },
    { value: 'school_2', label: 'School #2' },
    { value: 'school_3', label: 'School #3' },
    { value: 'school_4', label: 'School #4' },
];

/**
 * Site filter: pick any number of schools. No pick means every school, so the
 * empty field reads "All schools". The table refilters once, when the list closes.
 */
export const SiteFilter = ({ value, defaultValue = [], onChange, open, schools = defaultSchools }) => (
    <FilterSelect
        aria-label="Schools"
        mode="multi"
        placeholder="All schools"
        options={schools}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        open={open}
    />
);

/** Every state: all schools, open, and one school picked. */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg)' }}>
        <section>
            <h6 className="h6 mb-3">Default state (closed)</h6>
            <SiteFilter />
        </section>
        <section style={{ paddingBottom: 'var(--size-section-gap-lg)' }}>
            <h6 className="h6 mb-3">Open state</h6>
            <SiteFilter open />
        </section>
        <section style={{ marginTop: 'var(--size-section-gap-lg)' }}>
            <h6 className="h6 mb-3">School picked</h6>
            <SiteFilter defaultValue={['school_2']} />
        </section>
    </div>
);

/** Pick schools; the filter applies when the list closes. */
export const Interactive = () => {
    const [schools, setSchools] = useState([]);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)' }}>
            <SiteFilter value={schools} onChange={setSchools} />
            <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                Currently filtering by: <strong data-testid="applied" style={{ color: 'var(--color-on-surface)' }}>
                    {schools.length ? schools.join(', ') : 'all schools'}
                </strong>
            </p>
        </div>
    );
};

Interactive.play = playCommitsOnClose({
    name: 'Schools',
    picks: ['School #1', 'School #3'],
    before: 'all schools',
    after: 'school_1, school_3',
});
