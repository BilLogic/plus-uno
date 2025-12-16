import React from 'react';
import StackedBarChart from './StackedBarChart';

export default {
    title: 'Components/DataViz/StackedBarChart',
    component: StackedBarChart,
    tags: ['autodocs'],
    argTypes: {
        height: { control: 'number' }
    }
};

export const Default = {
    args: {
        height: 300,
        dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        data: [
            {
                segments: [
                    { value: '10', color: '#4CAF50', height: '20', textColor: '#fff' },
                    { value: '40', color: '#FFC107', height: '80', textColor: '#000' }
                ]
            },
            {
                segments: [
                    { value: '20', color: '#4CAF50', height: '40', textColor: '#fff' },
                    { value: '30', color: '#FFC107', height: '60', textColor: '#000' }
                ]
            },
            {
                segments: [
                    { value: '15', color: '#4CAF50', height: '30', textColor: '#fff' },
                    { value: '35', color: '#FFC107', height: '70', textColor: '#000' }
                ]
            },
            {
                segments: [
                    { value: '25', color: '#4CAF50', height: '50', textColor: '#fff' },
                    { value: '25', color: '#FFC107', height: '50', textColor: '#000' }
                ]
            },
            {
                segments: [
                    { value: '5', color: '#4CAF50', height: '10', textColor: '#fff' },
                    { value: '45', color: '#FFC107', height: '90', textColor: '#000' }
                ]
            }
        ]
    }
};
