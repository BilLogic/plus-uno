import React, { useState } from 'react';
import { Select } from '@/components';
import { FilterSelect } from './FilterSelect';
import { playPicksOne } from './filterPlay';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Completion Filter',
    component: Select,
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
    },
};

const completionOptions = [
    { value: 'incomplete', label: 'Incomplete' },
    { value: 'completed', label: 'Completed' },
    { value: 'both', label: 'Both' },
];

/**
 * Completion filter: one of three answers that exclude each other, so it
 * picks one and applies at once.
 */
export const CompletionFilter = ({
    value,
    defaultValue = 'incomplete',
    onChange,
    open,
    options = completionOptions,
}) => (
    <FilterSelect
        aria-label="Completion"
        options={options}
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
            <h6 className="h6 mb-3">Default state (closed)</h6>
            <CompletionFilter />
        </section>
        <section style={{ paddingBottom: 'var(--size-section-gap-lg)' }}>
            <h6 className="h6 mb-3">Open state</h6>
            <CompletionFilter open />
        </section>
        <section style={{ marginTop: 'var(--size-section-gap-lg)' }}>
            <h6 className="h6 mb-3">Different picks</h6>
            <div style={{ display: 'flex', gap: 'var(--size-element-gap-lg)' }}>
                <CompletionFilter defaultValue="incomplete" />
                <CompletionFilter defaultValue="completed" />
                <CompletionFilter defaultValue="both" />
            </div>
        </section>
    </div>
);

/** Pick a completion status; the filter applies at once. */
export const Interactive = () => {
    const [completion, setCompletion] = useState('incomplete');
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)' }}>
            <CompletionFilter value={completion} onChange={setCompletion} />
            <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                Currently filtering by: <strong data-testid="applied" style={{ color: 'var(--color-on-surface)' }}>
                    {completion}
                </strong>
            </p>
        </div>
    );
};

Interactive.play = playPicksOne({ name: 'Completion', pick: 'Completed', after: /^completed$/ });
