import React from 'react';
import MetricsCard from './MetricsCard';

export default {
    title: 'Specs/Home/Cards/MetricsCard',
    component: MetricsCard,
    tags: ['autodocs'],
};

export const Overview = () => (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <MetricsCard page={1} />
        <MetricsCard page={2} />
        <MetricsCard page={3} />
    </div>
);

