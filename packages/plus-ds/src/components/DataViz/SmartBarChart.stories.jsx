import React from 'react';
import SmartBarChart from './SmartBarChart';

export default {
    title: 'Data Visualizations/SmartBarChart',
    component: SmartBarChart,
    tags: ['autodocs'],
    argTypes: {
        height: { control: 'number' }
    }
};

// Using design system container-tier color tokens
export const Default = {
    args: {
        height: 200,
        data: [
            { letter: 'A', height: '100', color: 'var(--color-success-container, #ceeaaf)' },
            { letter: 'B', height: '75', color: 'var(--color-primary-container, #c3e8ff)' },
            { letter: 'C', height: '50', color: 'var(--color-warning-container, #fcdf8e)' },
            { letter: 'D', height: '25', color: 'var(--color-danger-container, #ffdad6)' },
            { letter: 'E', height: '0', color: 'var(--color-neutral-container, #dde3ea)' }
        ]
    }
};

export const Interactive = {
    args: {
        height: 300,
        data: [
            { letter: 'M', height: '40', color: 'var(--color-tertiary-container, #e8deff)' },
            { letter: 'T', height: '80', color: 'var(--color-secondary-container, #cfe4ff)' },
            { letter: 'W', height: '60', color: 'var(--color-info-container, #dde3ea)' },
            { letter: 'T', height: '90', color: 'var(--color-primary-container, #c3e8ff)' },
            { letter: 'F', height: '20', color: 'var(--color-success-container, #ceeaaf)' }
        ]
    }
};
