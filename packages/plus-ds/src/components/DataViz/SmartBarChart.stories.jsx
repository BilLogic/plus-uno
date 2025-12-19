import React from 'react';
import SmartBarChart from './SmartBarChart';

export default {
    title: 'Components/DataViz/SmartBarChart',
    component: SmartBarChart,
    tags: ['autodocs'],
    argTypes: {
        height: { control: 'number' }
    }
};

export const Default = {
    args: {
        height: 200,
        data: [
            { letter: 'A', height: '100', color: '#4CAF50' }, // Green
            { letter: 'B', height: '75', color: '#2196F3' },  // Blue
            { letter: 'C', height: '50', color: '#FFC107' },  // Amber
            { letter: 'D', height: '25', color: '#F44336' },  // Red
            { letter: 'E', height: '0', color: '#9E9E9E' }    // Grey
        ]
    }
};

export const Interactive = {
    args: {
        height: 300,
        data: [
            { letter: 'M', height: '40', color: '#673AB7' },
            { letter: 'T', height: '80', color: '#3F51B5' },
            { letter: 'W', height: '60', color: '#00BCD4' },
            { letter: 'T', height: '90', color: '#009688' },
            { letter: 'F', height: '20', color: '#8BC34A' }
        ]
    }
};
