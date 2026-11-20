import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import BarChart from './BarChart';

export default {
    title: 'Data visualizations/Comparison/Bar chart',
    component: BarChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        horizontal: { control: 'boolean', description: 'Display bars horizontally instead of vertically' },
        sort: { control: 'boolean', description: 'Sort categories from most to least by default; pass false for ordinal or temporal axes' },
        yAxisLabel: { control: 'text', description: 'Label for the value axis' },
        categories: { control: 'object', description: 'Array of category labels' },
        series: { control: 'object', description: 'Array of data series { name, data }' },
        height: { control: 'number', description: 'Chart height in pixels' },
    },
};

const stackStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--stack-2xl)',
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

const verticalData = {
    yAxisLabel: 'Enrolled students',
    categories: ['Math', 'Science', 'History', 'Art'],
    series: [
        { name: '2023', data: [50, 40, 35, 60] },
        { name: '2024', data: [65, 55, 45, 70] },
    ],
};

const horizontalData = {
    horizontal: true,
    yAxisLabel: 'Completion rate (%)',
    categories: ['Module 1', 'Module 2', 'Module 3'],
    series: [{ name: 'Avg', data: [85, 90, 75] }],
};

const groupedData = {
    sort: false,
    yAxisLabel: 'Sessions',
    categories: ['Q1', 'Q2', 'Q3', 'Q4'],
    series: [
        { name: 'Cohort A', data: [100, 150, 120, 180] },
        { name: 'Cohort B', data: [80, 110, 100, 140] },
        { name: 'Cohort C', data: [50, 80, 70, 90] },
    ],
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Vertical (column chart)</Heading>
                <p style={captionStyle}>
                    Default orientation for short category labels, sorted from most to least.
                </p>
                <BarChart {...verticalData} />
            </section>

            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Horizontal (bar chart)</Heading>
                <p style={captionStyle}>
                    Use when category labels are long or when showing a ranked list.
                </p>
                <BarChart {...horizontalData} />
            </section>

            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Grouped over time (sort opted out)</Heading>
                <p style={captionStyle}>
                    Pass {'sort={false}'} on temporal axes such as quarters to preserve chronological order.
                </p>
                <BarChart {...groupedData} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelectorAll('.highcharts-container').length).toBe(3);
        });
        for (const label of canvasElement.querySelectorAll('.highcharts-axis-labels text')) {
            if (!label.textContent?.trim()) continue;
            const style = getComputedStyle(label);
            expect(style.fontFamily).toContain('Google Sans Flex');
            expect(style.fontVariantNumeric).toBe('tabular-nums');
        }
    },
};

export const Interactive = {
    args: {
        horizontal: false,
        sort: true,
        yAxisLabel: 'Sessions per week',
        categories: ['Lincoln Middle', 'Roosevelt K-8', 'North High', 'Oakwood Elementary'],
        series: [
            { name: 'Fall term', data: [45, 72, 58, 91] },
            { name: 'Spring term', data: [52, 79, 64, 96] },
        ],
        height: 300,
    },
};
