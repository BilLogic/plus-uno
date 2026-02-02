import React, { useState } from 'react';
import Dropdown from '../../../../../../packages/plus-ds/src/components/Dropdown/Dropdown';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Call-Off Type Filter',
    component: Dropdown,
    tags: ['!autodocs'],
    parameters: {
        layout: 'padded',
    },
};

const filterOptions = [
    { text: 'This week', value: 'this_week' },
    { text: 'This month', value: 'this_month' },
    { text: 'All time', value: 'all_time' },
    { text: 'Custom', value: 'custom' },
];

const FilterWrapper = ({ label = "Call-Off Type", initialSelection = "This week", interactive = true, isOpen }) => {
    const [selected, setSelected] = useState(initialSelection);

    // Map options to Dropdown items format
    const dropdownItems = filterOptions.map(opt => ({
        text: opt.text,
        selected: selected === opt.text,
        onClick: interactive ? () => setSelected(opt.text) : undefined
    }));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-xs, 4px)', width: '240px' }}>
            {label && (
                <label className="body2-txt" style={{ color: 'var(--color-neutral-text-medium)' }}>
                    {label}
                </label>
            )}
            <Dropdown
                buttonText={selected}
                items={dropdownItems}
                style="secondary"
                fill="outline"
                size="default"
                isOpen={isOpen}
            />
        </div>
    );
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 'var(--size-section-gap-lg, 32px)', alignItems: 'flex-start' }}>
        <section>
            <h6 className="h6 mb-3">Default State (Closed)</h6>
            <FilterWrapper initialSelection="This week" interactive={false} />
        </section>

        <section>
            <h6 className="h6 mb-3">Open State</h6>
            {/* Force open state using the new isOpen prop */}
            <div style={{ height: '240px' }}> {/* Reserve space for dropdown menu */}
                <FilterWrapper initialSelection="This week" interactive={false} isOpen={true} />
            </div>
        </section>

        <section>
            <h6 className="h6 mb-3">Selected State (Closed)</h6>
            <FilterWrapper initialSelection="All time" interactive={false} />
        </section>
    </div>
);

export const Interactive = () => (
    <div>
        <h6 className="h6 mb-3">Interactive Demo</h6>
        <p className="body2-txt mb-4">Click to select a filter type.</p>
        <FilterWrapper />
    </div>
);
