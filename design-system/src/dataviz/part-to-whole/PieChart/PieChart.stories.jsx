import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import PieChart from './PieChart';

export default {
    title: 'Data visualizations/Part-to-whole/Pie chart',
    component: PieChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        data: { control: 'object', description: 'Array of { name, y, color? }' },
        height: { control: 'number', description: 'Chart height in pixels' },
        showLegend: { control: 'boolean', description: 'Show legend' },
        sort: { control: 'boolean', description: 'Sort slices from most to least by default' },
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
    gap: 'var(--stack-xl)',
};

const captionStyle = {
    margin: 0,
    color: 'var(--ds-text-subtle)',
};

const subjectShareData = {
    data: [
        { name: 'Reading', y: 28 },
        { name: 'Math', y: 45 },
        { name: 'Science', y: 15 },
        { name: 'Writing', y: 8 },
        { name: 'Other', y: 4 },
    ],
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Sessions by subject</Heading>
                <p style={captionStyle}>
                    Slices sort from largest to smallest and label each share with tabular figures.
                </p>
                <PieChart {...subjectShareData} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelectorAll('.highcharts-container').length).toBe(1);
        });
        for (const label of canvasElement.querySelectorAll('.highcharts-data-label text')) {
            if (!label.textContent?.trim()) continue;
            const style = getComputedStyle(label);
            expect(style.fontFamily).toContain('Noto Sans');
            expect(style.fontVariantNumeric).toBe('tabular-nums');
        }
    },
};

export const Interactive = {
    args: {
        height: 400,
        showLegend: true,
        sort: true,
        data: [
            { name: 'Lincoln Middle', y: 40 },
            { name: 'Roosevelt K-8', y: 30 },
            { name: 'North High', y: 20 },
            { name: 'Oakwood Elementary', y: 10 },
        ],
    },
};
