import React, { useState } from 'react';
import Dropdown from '../../../../../../packages/plus-ds/src/components/Dropdown';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Days Filter',
    component: Dropdown,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
};

// Days options for the filter dropdown
const daysItems = [
    { text: 'All days', selected: true },
    { text: 'Mondays' },
    { text: 'Tuesdays' },
    { text: 'Wednesdays' },
    { text: 'Thursdays' },
    { text: 'Fridays' },
];

/**
 * Reusable Days Filter Component
 * For use in pages and other compositions
 */
export const DaysFilter = ({ value = 'All days', onChange }) => {
    const items = [
        { text: 'All days', selected: value === 'All days', onClick: () => onChange?.('All days') },
        { text: 'Mondays', selected: value === 'Mondays', onClick: () => onChange?.('Mondays') },
        { text: 'Tuesdays', selected: value === 'Tuesdays', onClick: () => onChange?.('Tuesdays') },
        { text: 'Wednesdays', selected: value === 'Wednesdays', onClick: () => onChange?.('Wednesdays') },
        { text: 'Thursdays', selected: value === 'Thursdays', onClick: () => onChange?.('Thursdays') },
        { text: 'Fridays', selected: value === 'Fridays', onClick: () => onChange?.('Fridays') },
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
 * Shows all visual states of the Days Filter dropdown
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
            <h6 className="h6 mb-3">Closed State (All Days)</h6>
            <p className="body3-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                The filter dropdown in its default closed state showing "All days".
            </p>
            <Dropdown
                buttonText="All days"
                items={daysItems}
                size="small"
                fill="outline"
                style="secondary"
            />
        </section>

        <section>
            <h6 className="h6 mb-3">Open State</h6>
            <p className="body3-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                The filter dropdown in its open state showing the days options.
            </p>
            <Dropdown
                buttonText="All days"
                items={daysItems}
                size="small"
                fill="outline"
                style="secondary"
                isOpen={true}
            />
        </section>

        <section style={{ marginTop: 'var(--size-section-gap-xl)' }}>
            <h6 className="h6 mb-3">Specific Day Selected</h6>
            <p className="body3-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                The filter dropdown with "Mondays" selected.
            </p>
            <Dropdown
                buttonText="Mondays"
                items={[
                    { text: 'All days' },
                    { text: 'Mondays', selected: true },
                    { text: 'Tuesdays' },
                    { text: 'Wednesdays' },
                    { text: 'Thursdays' },
                    { text: 'Fridays' },
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
 * Allows user to interact with the days filter
 */
export const Interactive = () => {
    const [selectedDay, setSelectedDay] = useState('All days');

    const handleSelect = (dayName) => {
        setSelectedDay(dayName);
    };

    const interactiveItems = [
        { text: 'All days', selected: selectedDay === 'All days', onClick: () => handleSelect('All days') },
        { text: 'Mondays', selected: selectedDay === 'Mondays', onClick: () => handleSelect('Mondays') },
        { text: 'Tuesdays', selected: selectedDay === 'Tuesdays', onClick: () => handleSelect('Tuesdays') },
        { text: 'Wednesdays', selected: selectedDay === 'Wednesdays', onClick: () => handleSelect('Wednesdays') },
        { text: 'Thursdays', selected: selectedDay === 'Thursdays', onClick: () => handleSelect('Thursdays') },
        { text: 'Fridays', selected: selectedDay === 'Fridays', onClick: () => handleSelect('Fridays') },
    ];

    return (
        <div>
            <h6 className="h6 mb-3">Interactive Demo</h6>
            <p className="body2-txt mb-4">
                Use the dropdown to filter sessions by day of the week.
            </p>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-ele-gap-md)'
                }}
            >
                <Dropdown
                    buttonText={selectedDay}
                    items={interactiveItems}
                    size="small"
                    fill="outline"
                    style="secondary"
                />
                <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Currently filtering by: <strong style={{ color: 'var(--color-on-surface)' }}>
                        {selectedDay}
                    </strong>
                </p>
            </div>
        </div>
    );
};
