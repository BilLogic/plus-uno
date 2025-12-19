import React from 'react';
import ComboChart from './ComboChart';

export default {
    title: 'Components/DataViz/ComboChart',
    component: ComboChart,
    tags: ['autodocs']
};

export const Default = () => (
    <ComboChart
        primaryAxisLabel="Sales"
        secondaryAxisLabel="Profit Margin (%)"
        categories={['Jan', 'Feb', 'Mar', 'Apr', 'May']}
        barData={[
            { name: 'Sales', data: [100, 200, 150, 300, 250] }
        ]}
        lineData={[
            { name: 'Margin', data: [10, 15, 12, 18, 14], yAxis: 1 }
        ]}
    />
);
