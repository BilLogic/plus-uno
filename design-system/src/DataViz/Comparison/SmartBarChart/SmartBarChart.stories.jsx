import React from 'react';
import SmartBarChart from './SmartBarChart';

export default {
    title: 'Data Visualizations/Comparison/SmartBarChart',
    component: SmartBarChart,
    tags: ['autodocs'],
    argTypes: {
        height: { control: 'number' },
        data: { control: 'object' }
    }
};

const defaultData = {
    height: 200,
    data: [
        { letter: 'A', height: '100', color: 'var(--color-success-container, #ceeaaf)' },
        { letter: 'B', height: '75', color: 'var(--color-primary-container, #c3e8ff)' },
        { letter: 'C', height: '50', color: 'var(--color-warning-container, #fcdf8e)' },
        { letter: 'D', height: '25', color: 'var(--color-danger-container, #ffdad6)' },
        { letter: 'E', height: '0', color: 'var(--color-neutral-container, #dde3ea)' }
    ]
};

const weekdayData = {
    height: 300,
    data: [
        { letter: 'M', height: '40', color: 'var(--color-tertiary-container, #e8deff)' },
        { letter: 'T', height: '80', color: 'var(--color-secondary-container, #cfe4ff)' },
        { letter: 'W', height: '60', color: 'var(--color-info-container, #dde3ea)' },
        { letter: 'T', height: '90', color: 'var(--color-primary-container, #c3e8ff)' },
        { letter: 'F', height: '20', color: 'var(--color-success-container, #ceeaaf)' }
    ]
};

/**
 * Overview: Displays all chart variants and examples
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Grade Distribution</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Shows score distribution using filled bars against background context.
            </p>
            <SmartBarChart {...defaultData} />
        </section>

        <section>
            <h3 style={{ marginBottom: '16px' }}>Weekly Activity</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Visualizes activity levels across weekdays.
            </p>
            <SmartBarChart {...weekdayData} />
        </section>
    </div>
);

/**
 * Interactive: Playground with property controls
 */
export const Interactive = {
    args: {
        height: 250,
        data: [
            { letter: '1', height: '60', color: 'var(--color-primary-container)' },
            { letter: '2', height: '80', color: 'var(--color-primary-container)' },
            { letter: '3', height: '45', color: 'var(--color-primary-container)' },
            { letter: '4', height: '90', color: 'var(--color-primary-container)' }
        ]
    }
};
