import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import LineChart from './LineChart';

export default {
    title: 'Data visualizations/Temporal/Line chart',
    component: LineChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        xAxisLabel: { control: 'text', description: 'Label for the X axis' },
        yAxisLabel: { control: 'text', description: 'Label for the Y axis' },
        categories: { control: 'object', description: 'Array of X-axis period labels' },
        data: { control: 'object', description: 'Array of series { name, data, color, categories }' },
        height: { control: 'number', description: 'Chart height in pixels' },
        yDomain: { control: 'object', description: 'Optional [min, max] domain for the Y axis' },
        yTicks: { control: 'object', description: 'Optional explicit tick values for the Y axis' },
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

const usersData = {
    xAxisLabel: 'Month',
    yAxisLabel: 'Active students',
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    data: [
        { name: '2025', data: [100, 120, 140, 130, 150, 170] },
        { name: '2026', data: [130, 150, 160, 180, 200, 220] },
    ],
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Monthly active students</Heading>
                <p style={captionStyle}>
                    Tracks participation over time with a year-over-year comparison.
                </p>
                <LineChart {...usersData} />
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
        xAxisLabel: 'Week',
        yAxisLabel: 'Sessions per week',
        categories: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6'],
        height: 300,
        sort: false,
        data: [
            { name: 'Lincoln Middle', data: [18, 25, 22, 40, 35, 50] },
            { name: 'Roosevelt K-8', data: [20, 18, 30, 28, 45, 42] },
        ],
    },
};
