import React from 'react';
import ComboChart from './ComboChart';

export default {
    title: 'Data Visualizations/Temporal/ComboChart',
    component: ComboChart,
    tags: ['autodocs'],
    argTypes: {
        primaryAxisLabel: { control: 'text' },
        secondaryAxisLabel: { control: 'text' },
        categories: { control: 'object' },
        barData: { control: 'object' },
        lineData: { control: 'object' },
        height: { control: 'number' }
    }
};

const salesData = {
    primaryAxisLabel: 'Sales',
    secondaryAxisLabel: 'Profit Margin (%)',
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    barData: [{ name: 'Sales', data: [100, 200, 150, 300, 250] }],
    lineData: [{ name: 'Margin', data: [10, 15, 12, 18, 14], yAxis: 1 }]
};

/**
 * Overview: Displays all chart variants and examples
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <section>
            <h3 style={{ marginBottom: '16px' }}>Sales vs Profit Margin</h3>
            <p style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Combines column (volume) with line (rate) using dual Y-axes.
            </p>
            <ComboChart {...salesData} />
        </section>
    </div>
);

/**
 * Interactive: Playground with property controls
 */
export const Interactive = {
    args: {
        primaryAxisLabel: 'Primary Metric',
        secondaryAxisLabel: 'Secondary Metric',
        categories: ['Period 1', 'Period 2', 'Period 3', 'Period 4'],
        barData: [{ name: 'Volume', data: [50, 80, 60, 100] }],
        lineData: [{ name: 'Rate', data: [5, 8, 6, 10], yAxis: 1 }],
        height: 400
    }
};
