import React from 'react';
import MetricsCard from './MetricsCard';

export default {
    title: 'Specs/Home/Cards/MetricsCard',
    component: MetricsCard,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div className="plus-storybook-constrained" style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
                <Story />
            </div>
        ),
    ],
};

export const Overview = () => (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <MetricsCard page={1} />
        <MetricsCard page={2} />
        <MetricsCard page={3} />
    </div>
);

export const Alternative = () => (
    <div style={{ width: '266.667px' }}>
        <MetricsCard page={4} />
    </div>
);

