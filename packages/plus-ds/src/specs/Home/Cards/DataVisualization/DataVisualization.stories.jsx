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

export const HighPerformance = {
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
            yourPerformance: [90, 85, 95, 95, 88, 90, 92],
            averagePerformance: [70, 70, 65, 75, 60, 70, 60]
        }
    },
};

export const LowPerformance = {
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
            yourPerformance: [40, 45, 50, 55, 45, 50, 48],
            averagePerformance: [70, 70, 65, 75, 60, 70, 60]
        }
    },
};

export const MixedPerformance = {
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
            yourPerformance: [85, 50, 90, 75, 60, 95, 45],
            averagePerformance: [70, 70, 65, 75, 60, 70, 60]
        }
    },
};

