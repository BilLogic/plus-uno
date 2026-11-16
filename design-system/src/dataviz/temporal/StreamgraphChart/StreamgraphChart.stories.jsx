import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import StreamgraphChart from './StreamgraphChart';

export default {
    title: 'Data visualizations/Temporal/Streamgraph chart',
    component: StreamgraphChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        categories: { control: 'object', description: 'X-axis period labels' },
        series: { control: 'object', description: 'Array of series { name, data, color }' },
        height: { control: 'number', description: 'Chart height in pixels' },
        sort: { control: 'boolean', description: 'Sort categories from most to least; false by default on temporal axes' },
    },
};

const stackStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--section-stack-lg)',
};

const sectionStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--card-stack-md)',
};

const captionStyle = {
    margin: 0,
    color: 'var(--ds-text-subtle)',
};

const usageData = {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    series: [
        { name: 'Math', data: [100, 120, 150, 180, 200, 220] },
        { name: 'Science', data: [80, 95, 110, 130, 145, 160] },
        { name: 'English', data: [60, 70, 85, 100, 115, 125] },
        { name: 'History', data: [40, 50, 60, 75, 85, 95] },
    ],
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="small">Subject enrollment trends</Heading>
                <p style={captionStyle}>
                    Shows how enrollment across subjects shifts from month to month.
                </p>
                <StreamgraphChart {...usageData} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelector('.highcharts-container')).not.toBeNull();
        });
        for (const label of canvasElement.querySelectorAll('.highcharts-axis-labels text')) {
            if (!label.textContent?.trim()) continue;
            const style = getComputedStyle(label);
            expect(style.fontFamily).toContain('Noto Sans');
            expect(style.fontVariantNumeric).toBe('tabular-nums');
        }
    },
};

export const Interactive = {
    args: {
        categories: ['Q1', 'Q2', 'Q3', 'Q4'],
        series: [
            { name: 'Series A', data: [10, 20, 30, 25] },
            { name: 'Series B', data: [15, 25, 20, 30] },
        ],
        height: 400,
        sort: false,
    },
};
