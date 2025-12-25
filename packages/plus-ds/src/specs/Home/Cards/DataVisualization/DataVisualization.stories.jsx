import React from 'react';
import DataVisualization from './DataVisualization';

export default {
    title: 'Specs/Home/Cards/DataVisualization',
    component: DataVisualization,
    tags: ['autodocs'],
};

export const Default = {
    args: {
        skillsOverviewData: {
            categories: [
                'Teaching Math',
                'Communicating Clearly',
                'Motivating Students',
                'Staying Positive',
                'Managing Time',
                'Fostering Participation',
                'Building Rapport'
            ],
            yourPerformance: [60, 55, 80, 90, 70, 85, 75],
            averagePerformance: [70, 70, 65, 75, 60, 70, 60]
        }
    },
};


