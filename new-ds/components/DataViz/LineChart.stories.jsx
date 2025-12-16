import React from 'react';
import LineChart from './LineChart';

export default {
    title: 'Components/DataViz/LineChart',
    component: LineChart,
    tags: ['autodocs']
};

export const Default = () => (
    <LineChart
        xAxisLabel="Month"
        yAxisLabel="Active Users"
        data={[
            { name: '2023', data: [100, 120, 140, 130, 150, 170] },
            { name: '2024', data: [130, 150, 160, 180, 200, 220] }
        ]}
    />
);
