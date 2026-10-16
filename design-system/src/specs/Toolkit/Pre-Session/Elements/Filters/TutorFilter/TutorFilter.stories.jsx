import React, { useState } from 'react';
import { Select } from '@/components';
import { FilterSelect } from '../FilterSelect';
import { playCommitsOnClose } from '../filterPlay';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Tutor Filter',
    component: Select,
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
    },
};

const tutorOptions = [
    { value: 'elijah-booker', label: 'Elijah Booker' },
    { value: 'willow-klein', label: 'Willow Klein' },
    { value: 'elias-thorne', label: 'Elias Thorne' },
    { value: 'brynn-barajas', label: 'Brynn Barajas' },
];

/**
 * Tutor filter: pick any number of tutors. No pick means every tutor, so the
 * empty field reads "All tutors". The table refilters once, when the list closes.
 */
export const TutorFilter = ({ value, defaultValue = [], onChange, open, options = tutorOptions }) => (
    <FilterSelect
        aria-label="Tutors"
        mode="multi"
        placeholder="All tutors"
        options={options}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        open={open}
    />
);

/** Every state: all tutors, open, and one tutor picked. */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg)' }}>
        <section>
            <h6 className="h6 mb-3">Closed state (all tutors)</h6>
            <TutorFilter />
        </section>
        <section style={{ paddingBottom: 'var(--size-section-gap-lg)' }}>
            <h6 className="h6 mb-3">Open state</h6>
            <TutorFilter open />
        </section>
        <section style={{ marginTop: 'var(--size-section-gap-lg)' }}>
            <h6 className="h6 mb-3">Specific tutor picked</h6>
            <TutorFilter defaultValue={['elijah-booker']} />
        </section>
    </div>
);

/** Pick tutors; the filter applies when the list closes. */
export const Interactive = () => {
    const [tutors, setTutors] = useState([]);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)' }}>
            <TutorFilter value={tutors} onChange={setTutors} />
            <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                Currently filtering by: <strong data-testid="applied" style={{ color: 'var(--color-on-surface)' }}>
                    {tutors.length ? tutors.join(', ') : 'all tutors'}
                </strong>
            </p>
        </div>
    );
};

Interactive.play = playCommitsOnClose({
    name: 'Tutors',
    picks: ['Willow Klein', 'Brynn Barajas'],
    before: 'all tutors',
    after: 'willow-klein, brynn-barajas',
});
