import React from 'react';
import BarChart from './BarChart';

export default {
    title: 'Components/DataViz/BarChart',
    component: BarChart,
    tags: ['autodocs']
};

export const Vertical = () => (
    <BarChart
        yAxisLabel="Enrolled Students"
        categories={['Math', 'Science', 'History', 'Art']}
        series={[
            { name: '2023', data: [50, 40, 35, 60] },
            { name: '2024', data: [65, 55, 45, 70] }
        ]}
    />
);

export const Horizontal = () => (
    <BarChart
        horizontal
        yAxisLabel="Completion Rate (%)"
        categories={['Module 1', 'Module 2', 'Module 3']}
        series={[
            { name: 'Avg', data: [85, 90, 75] }
        ]}
    />
);
