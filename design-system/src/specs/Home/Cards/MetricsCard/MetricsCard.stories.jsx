import React from 'react';
import MetricsCard from './MetricsCard';

export default {
    title: 'Specs/Home/Cards/Metrics Card Sessions',
    component: MetricsCard,
    tags: ['!dev', '!autodocs'],
    decorators: [
        (Story) => (
            <div className="plus-storybook-constrained" style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
                <Story />
            </div>
        ),
    ],
};

/**
 * Metrics Card / Sessions — pages 1–3 (Figma 563:192464).
 */
export const Overview = () => (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <MetricsCard page={1} />
        <MetricsCard page={2} />
        <MetricsCard page={3} />
    </div>
);

/**
 * Metrics Card / Lessons (Figma 563:192596).
 */
export const Lessons = () => (
    <div style={{ width: '266.667px' }}>
        <MetricsCard page={4} />
    </div>
);

