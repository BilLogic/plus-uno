import React from 'react';
import StackedBarChart from './StackedBarChart';

export default {
    title: 'Data Visualizations/StackedBarChart',
    component: StackedBarChart,
    tags: ['autodocs'],
    argTypes: {
        height: { control: 'number' }
    }
};

// Using container-tier color tokens with matching on-container text colors
export const Default = {
    args: {
        height: 300,
        dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        data: [
            {
                segments: [
                    { value: '10', color: 'var(--color-success-container, #ceeaaf)', height: '20', textColor: 'var(--color-on-success-container, #0a2000)' },
                    { value: '40', color: 'var(--color-warning-container, #fcdf8e)', height: '80', textColor: 'var(--color-on-warning-container, #211b00)' }
                ]
            },
            {
                segments: [
                    { value: '20', color: 'var(--color-success-container, #ceeaaf)', height: '40', textColor: 'var(--color-on-success-container, #0a2000)' },
                    { value: '30', color: 'var(--color-warning-container, #fcdf8e)', height: '60', textColor: 'var(--color-on-warning-container, #211b00)' }
                ]
            },
            {
                segments: [
                    { value: '15', color: 'var(--color-success-container, #ceeaaf)', height: '30', textColor: 'var(--color-on-success-container, #0a2000)' },
                    { value: '35', color: 'var(--color-warning-container, #fcdf8e)', height: '70', textColor: 'var(--color-on-warning-container, #211b00)' }
                ]
            },
            {
                segments: [
                    { value: '25', color: 'var(--color-success-container, #ceeaaf)', height: '50', textColor: 'var(--color-on-success-container, #0a2000)' },
                    { value: '25', color: 'var(--color-warning-container, #fcdf8e)', height: '50', textColor: 'var(--color-on-warning-container, #211b00)' }
                ]
            },
            {
                segments: [
                    { value: '5', color: 'var(--color-success-container, #ceeaaf)', height: '10', textColor: 'var(--color-on-success-container, #0a2000)' },
                    { value: '45', color: 'var(--color-warning-container, #fcdf8e)', height: '90', textColor: 'var(--color-on-warning-container, #211b00)' }
                ]
            }
        ]
    }
};
