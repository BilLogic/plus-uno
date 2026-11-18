import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import AreaChart from './AreaChart';

export default {
    title: 'Data visualizations/Temporal/Area chart',
    component: AreaChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        xAxisLabel: { control: 'text', description: 'Label for the X axis' },
        yAxisLabel: { control: 'text', description: 'Label for the Y axis' },
        categories: { control: 'object', description: 'X-axis period labels' },
        data: { control: 'object', description: 'Array of series { name, data, color, categories }' },
        stacking: { control: 'select', options: [null, 'normal', 'percent'], description: 'Stack areas into a total or percentage' },
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

const quarters = ['Fall 2024', 'Spring 2025', 'Fall 2025', 'Spring 2026'];
const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const standardData = {
    categories: quarters,
    xAxisLabel: 'Term',
    yAxisLabel: 'Sessions',
    data: [
        { name: 'Math', data: [500, 700, 800, 1000] },
        { name: 'Reading', data: [300, 400, 500, 600] },
    ],
};

const stackedData = {
    categories: quarters,
    xAxisLabel: 'Term',
    yAxisLabel: 'Sessions',
    stacking: 'normal',
    data: [
        { name: 'Math', data: [500, 700, 800, 1000] },
        { name: 'Reading', data: [300, 400, 500, 600] },
    ],
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Standard area</Heading>
                <p style={captionStyle}>
                    Shows magnitude of values over time.
                </p>
                <AreaChart {...standardData} />
            </section>

            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Stacked area</Heading>
                <p style={captionStyle}>
                    Shows how parts contribute to a total over time.
                </p>
                <AreaChart {...stackedData} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelectorAll('.highcharts-container').length).toBe(2);
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
        xAxisLabel: 'Month',
        yAxisLabel: 'Sessions',
        categories: months,
        stacking: null,
        height: 300,
        sort: false,
        data: [
            { name: 'Lincoln Middle', data: [100, 150, 120, 180, 200] },
            { name: 'Roosevelt K-8', data: [80, 100, 90, 120, 140] },
        ],
    },
};
