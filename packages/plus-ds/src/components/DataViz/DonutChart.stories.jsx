import React from 'react';
import DonutChart from './DonutChart';

export default {
    title: 'Data Visualizations/DonutChart',
    component: DonutChart,
    tags: ['autodocs'],
    argTypes: {
        size: { control: { type: 'number', min: 100, max: 500, step: 10 } },
        value: { control: 'text' },
        label: { control: 'text' },
        centerTextSize: { control: { type: 'select', options: ['h1', 'h2', 'h3'] } }
    }
};

// Using design system color tokens instead of hardcoded hex values
export const Default = {
    args: {
        value: '75%',
        label: 'Completed',
        segments: [
            { value: 75, color: 'var(--color-success, #3e691a)', label: 'Done' },
            { value: 25, color: 'var(--color-surface-container-high, #dde3e5)', label: 'Remaining' }
        ]
    }
};

export const WithSegments = {
    args: {
        value: 'Total',
        label: 'Distribution',
        centerTextSize: 'h2',
        segments: [
            { value: 30, color: 'var(--color-success, #3e691a)', label: 'Type A' },
            { value: 20, color: 'var(--color-primary, #0472a8)', label: 'Type B' },
            { value: 10, color: 'var(--color-warning, #9f8205)', label: 'Type C' },
            { value: 40, color: 'var(--color-danger, #ba1a1a)', label: 'Type D' }
        ]
    }
};

export const Small = {
    args: {
        size: 150,
        value: '1/4',
        label: 'Step',
        centerTextSize: 'h3',
        segments: [
            { value: 25, color: 'var(--color-primary, #0472a8)', label: 'Current' },
            { value: 75, color: 'var(--color-surface-container-high, #dde3e5)', label: 'Future' }
        ]
    }
};
