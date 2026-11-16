import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import RadarChart from './RadarChart';

export default {
    title: 'Data visualizations/Comparison/Radar chart',
    component: RadarChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        filled: { control: 'boolean', description: 'Fill the area under the line' },
        sort: { control: 'boolean', description: 'Sort spokes from most to least by the first series; false by default so profile axes stay in input order' },
        height: { control: 'number', description: 'Chart height in pixels' },
        yAxisMax: { control: 'number', description: 'Maximum value for y-axis' },
        categories: { control: 'object', description: 'Array of axis labels' },
        series: { control: 'object', description: 'Array of data series' },
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

const budgetData = {
    categories: ['Sales', 'Marketing', 'Development', 'Customer support', 'IT', 'Admin'],
    series: [
        { name: 'Allocated budget', data: [43000, 19000, 60000, 35000, 17000, 10000] },
        { name: 'Actual spending', data: [50000, 39000, 42000, 31000, 26000, 14000] },
    ],
    height: 400,
};

const skillsData = {
    categories: ['Communication', 'Teamwork', 'Problem solving', 'Technical skills', 'Creativity'],
    yAxisMax: 5,
    series: [
        { name: 'Tutor A', data: [4, 5, 3, 5, 4] },
        { name: 'Cohort average', data: [3.5, 4, 3.5, 4, 3] },
    ],
    filled: true,
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="small">Line radar (default)</Heading>
                <p style={captionStyle}>
                    Spoke connections for comparing two profiles across shared measures.
                </p>
                <RadarChart {...budgetData} />
            </section>

            <section style={sectionStyle}>
                <Heading as="h3" size="small">Filled area radar</Heading>
                <p style={captionStyle}>
                    Fills the primary series to emphasize overall coverage across competencies.
                </p>
                <RadarChart {...skillsData} />
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
        categories: ['Metric A', 'Metric B', 'Metric C', 'Metric D', 'Metric E'],
        series: [
            { name: 'Dataset 1', data: [80, 60, 90, 70, 85] },
            { name: 'Dataset 2', data: [60, 80, 50, 90, 70] },
        ],
        filled: false,
        sort: false,
        height: 400,
        yAxisMax: 100,
    },
};
