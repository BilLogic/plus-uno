import React, { useState } from 'react';
import Dropdown from '../../../../../../packages/plus-ds/src/components/Dropdown';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Capacity Filter',
    component: Dropdown,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
};

// Capacity options for the filter dropdown
const capacityItems = [
    { text: 'Not filled', selected: true },
    { text: 'Filled' },
    { text: 'Both' },
];

/**
 * Reusable Capacity Filter Component
 * For use in pages and other compositions
 */
export const CapacityFilter = ({ value = 'Not filled', onChange }) => {
    const items = [
        { text: 'Not filled', selected: value === 'Not filled', onClick: () => onChange?.('Not filled') },
        { text: 'Filled', selected: value === 'Filled', onClick: () => onChange?.('Filled') },
        { text: 'Both', selected: value === 'Both', onClick: () => onChange?.('Both') },
    ];
    return (
        <Dropdown
            buttonText={value}
            items={items}
            size="small"
            fill="outline"
            style="secondary"
        />
    );
};

/**
 * Overview - All States
 * Shows all visual states of the Capacity Filter dropdown
 * 
 * Uses design system Dropdown component with:
 * - size="small" for compact filter button
 * - fill="outline" for outlined button style
 * - style="secondary" for secondary color
 */
export const Overview = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)'
        }}
    >
        <section>
            <h6 className="h6 mb-3">Closed State (Not Filled)</h6>
            <p className="body3-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                The filter dropdown in its default closed state showing "Not filled".
            </p>
            <Dropdown
                buttonText="Not filled"
                items={capacityItems}
                size="small"
                fill="outline"
                style="secondary"
            />
        </section>

        <section>
            <h6 className="h6 mb-3">Open State</h6>
            <p className="body3-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                The filter dropdown in its open state showing the capacity options.
            </p>
            <Dropdown
                buttonText="Not filled"
                items={capacityItems}
                size="small"
                fill="outline"
                style="secondary"
                isOpen={true}
            />
        </section>

        <section style={{ marginTop: 'var(--size-section-gap-xl)' }}>
            <h6 className="h6 mb-3">Filled Selected</h6>
            <p className="body3-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                The filter dropdown with "Filled" selected.
            </p>
            <Dropdown
                buttonText="Filled"
                items={[
                    { text: 'Not filled' },
                    { text: 'Filled', selected: true },
                    { text: 'Both' },
                ]}
                size="small"
                fill="outline"
                style="secondary"
            />
        </section>

        <section>
            <h6 className="h6 mb-3">Both Selected</h6>
            <p className="body3-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                The filter dropdown with "Both" selected.
            </p>
            <Dropdown
                buttonText="Both"
                items={[
                    { text: 'Not filled' },
                    { text: 'Filled' },
                    { text: 'Both', selected: true },
                ]}
                size="small"
                fill="outline"
                style="secondary"
            />
        </section>
    </div>
);

/**
 * Interactive Demo
 * Allows user to interact with the capacity filter
 */
export const Interactive = () => {
    const [selectedCapacity, setSelectedCapacity] = useState('Not filled');

    const handleSelect = (capacityName) => {
        setSelectedCapacity(capacityName);
    };

    const interactiveItems = [
        { text: 'Not filled', selected: selectedCapacity === 'Not filled', onClick: () => handleSelect('Not filled') },
        { text: 'Filled', selected: selectedCapacity === 'Filled', onClick: () => handleSelect('Filled') },
        { text: 'Both', selected: selectedCapacity === 'Both', onClick: () => handleSelect('Both') },
    ];

    return (
        <div>
            <h6 className="h6 mb-3">Interactive Demo</h6>
            <p className="body2-txt mb-4">
                Use the dropdown to filter sessions by capacity status.
            </p>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-ele-gap-md)'
                }}
            >
                <Dropdown
                    buttonText={selectedCapacity}
                    items={interactiveItems}
                    size="small"
                    fill="outline"
                    style="secondary"
                />
                <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Currently filtering by: <strong style={{ color: 'var(--color-on-surface)' }}>
                        {selectedCapacity}
                    </strong>
                </p>
            </div>
        </div>
    );
};
