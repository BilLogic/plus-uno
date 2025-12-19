import React from 'react';
import ScatterChart from './ScatterChart';

export default {
    title: 'Components/DataViz/ScatterChart',
    component: ScatterChart,
    tags: ['autodocs']
};

export const Default = () => (
    <ScatterChart
        xAxisLabel="Study Time (min)"
        yAxisLabel="Test Score"
        data={[
            { name: 'Class A', data: [[30, 60], [45, 75], [60, 85], [90, 95], [20, 55]] },
            { name: 'Class B', data: [[35, 65], [50, 70], [70, 80], [10, 40], [100, 90]] }
        ]}
    />
);
