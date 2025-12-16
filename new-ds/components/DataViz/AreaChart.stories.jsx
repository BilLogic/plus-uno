import React from 'react';
import AreaChart from './AreaChart';

export default {
    title: 'Components/DataViz/AreaChart',
    component: AreaChart,
    tags: ['autodocs']
};

export const Default = () => (
    <AreaChart
        xAxisLabel="Quarter"
        yAxisLabel="Revenue"
        data={[
            { name: 'Product A', data: [500, 700, 800, 1000] },
            { name: 'Product B', data: [300, 400, 500, 600] }
        ]}
    />
);

export const Stacked = () => (
    <AreaChart
        xAxisLabel="Quarter"
        yAxisLabel="Revenue"
        stacking="normal"
        data={[
            { name: 'Product A', data: [500, 700, 800, 1000] },
            { name: 'Product B', data: [300, 400, 500, 600] }
        ]}
    />
);
