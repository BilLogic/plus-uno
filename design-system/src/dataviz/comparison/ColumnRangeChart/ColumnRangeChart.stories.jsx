import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import ColumnRangeChart from './ColumnRangeChart';

export default {
    title: 'Data visualizations/Comparison/Column range chart',
    component: ColumnRangeChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        data: { control: 'object', description: 'Array of { low, high } objects' },
        categories: { control: 'object', description: 'Category labels' },
        yAxisLabel: { control: 'text', description: 'Y-axis label' },
        height: { control: 'number', description: 'Chart height in pixels' },
        horizontal: { control: 'boolean', description: 'Horizontal orientation' },
        sort: { control: 'boolean', description: 'Sort categories from most to least by default; pass false for ordinal or temporal axes' },
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

const scheduleData = {
    sort: false,
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    data: [
        { low: 9, high: 17 },
        { low: 10, high: 18 },
        { low: 9, high: 16 },
        { low: 11, high: 19 },
        { low: 9, high: 15 },
    ],
    yAxisLabel: 'Hour',
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="small">Weekly schedule availability</Heading>
                <p style={captionStyle}>
                    Availability windows from start hour to end hour across the week.
                </p>
                <ColumnRangeChart {...scheduleData} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelector('.highcharts-container')).not.toBeNull();
        });
        for (const label of canvasElement.querySelectorAll('.highcharts-axis-labels text, .highcharts-data-label text')) {
            if (!label.textContent?.trim()) continue;
            const style = getComputedStyle(label);
            expect(style.fontFamily).toContain('Noto Sans');
            expect(style.fontVariantNumeric).toBe('tabular-nums');
        }
    },
};

export const Interactive = {
    args: {
        categories: ['Lincoln Middle', 'Roosevelt K-8', 'North High', 'South High'],
        data: [
            { low: 20, high: 45 },
            { low: 25, high: 50 },
            { low: 15, high: 35 },
            { low: 30, high: 55 },
        ],
        yAxisLabel: 'Minutes tutored',
        height: 400,
        horizontal: false,
        sort: true,
    },
};
