import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import { toneByRank } from '@/dataviz/palette';
import VariwidthChart from './VariwidthChart';

export default {
    title: 'Data visualizations/Distribution/Variwidth chart',
    component: VariwidthChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        height: { control: 'number' },
        xAxisLabel: { control: 'text' },
        yAxisLabel: { control: 'text' },
        data: { control: 'object' },
        sort: { control: 'boolean', description: 'Sort categories from most to least by value; pass false for ordinal or temporal axes' },
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

const subjectsData = [
    { name: 'Math', y: 85, z: 120 },
    { name: 'English', y: 82, z: 95 },
    { name: 'Science', y: 78, z: 80 },
    { name: 'History', y: 88, z: 45 },
    { name: 'Art', y: 92, z: 30 },
];

const gradeBands = toneByRank(
    [
        { name: 'Grade 6', y: 76, z: 80 },
        { name: 'Grade 7', y: 84, z: 110 },
        { name: 'Grade 8', y: 91, z: 95 },
        { name: 'Grade 9', y: 79, z: 65 },
    ],
    'blue',
    (d) => d.y,
);

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="small">Subject score vs. student count</Heading>
                <p style={captionStyle}>
                    Column height encodes average score and column width encodes enrollment, sorted from highest score to lowest in the brand color.
                </p>
                <VariwidthChart
                    data={subjectsData}
                    xAxisLabel="Subject (width = student count)"
                    yAxisLabel="Average score (%)"
                    height={360}
                />
            </section>

            <section style={sectionStyle}>
                <Heading as="h3" size="small">Ordinal grade cohorts</Heading>
                <p style={captionStyle}>
                    Grades keep their natural order with {'sort={false}'} while toneByRank puts the darkest step on the highest average.
                </p>
                <VariwidthChart
                    data={gradeBands}
                    xAxisLabel="Grade (width = enrolled students)"
                    yAxisLabel="Average score (%)"
                    height={320}
                    sort={false}
                />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelectorAll('.highcharts-container').length).toBe(2);
        });
        for (const label of canvasElement.querySelectorAll('.highcharts-data-labels text, .highcharts-data-labels tspan')) {
            if (!label.textContent?.trim()) continue;
            const style = getComputedStyle(label);
            expect(style.fontFamily).toContain('Noto Sans');
            expect(style.fontVariantNumeric).toBe('tabular-nums');
        }
    },
};

export const Interactive = {
    args: {
        data: [
            { name: 'Grade 6', y: 84, z: 32 },
            { name: 'Grade 7', y: 88, z: 45 },
            { name: 'Grade 8', y: 91, z: 28 },
        ],
        height: 400,
        sort: true,
    },
};
