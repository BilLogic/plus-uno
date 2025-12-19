import React from 'react';
import DonutChart from './DonutChart';

export default {
    title: 'Components/DataViz/DonutChart',
    component: DonutChart,
    tags: ['autodocs'],
    argTypes: {
        size: { control: { type: 'number', min: 100, max: 500, step: 10 } },
        value: { control: 'text' },
        label: { control: 'text' },
        centerTextSize: { control: { type: 'select', options: ['h1', 'h2', 'h3'] } }
    }
};

export const Default = {
    args: {
        value: '75%',
        label: 'Completed',
        segments: [
            { value: 75, color: '#4CAF50', label: 'Done' }, // green
            { value: 25, color: '#E0E0E0', label: 'Remaining' } // gray
        ]
    }
};

export const WithSegments = {
    args: {
        value: 'Total',
        label: 'Distribution',
        centerTextSize: 'h2',
        segments: [
            { value: 30, color: '#4CAF50', label: 'Type A' },
            { value: 20, color: '#2196F3', label: 'Type B' },
            { value: 10, color: '#FFC107', label: 'Type C' },
            { value: 40, color: '#F44336', label: 'Type D' }
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
            { value: 25, color: '#2196F3', label: 'Current' },
            { value: 75, color: '#E0E0E0', label: 'Future' }
        ]
    }
};
