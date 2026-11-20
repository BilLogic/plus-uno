import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import BoxPlotChart from './BoxPlotChart';

export default {
    title: 'Data visualizations/Distribution/Box plot chart',
    component: BoxPlotChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        height: { control: 'number' },
        yAxisLabel: { control: 'text' },
        categories: { control: 'object' },
        data: { control: 'object' },
        sort: { control: 'boolean', description: 'Sort categories from most to least by median; pass false for ordinal or temporal axes' },
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

const scoresCategories = ['Class A', 'Class B', 'Class C', 'Class D'];
const scoresData = [
    [55, 68, 78, 88, 96],
    [60, 72, 82, 90, 98],
    [48, 62, 74, 85, 94],
    [65, 75, 85, 92, 99],
];

const durationCategories = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
const durationData = [
    [25, 35, 45, 55, 65],
    [30, 40, 48, 58, 70],
    [28, 38, 46, 54, 62],
    [32, 42, 50, 60, 72],
];

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Student score distribution by class</Heading>
                <p style={captionStyle}>
                    Shows minimum, lower quartile, median, upper quartile and maximum scores, sorted from highest median to lowest.
                </p>
                <BoxPlotChart
                    categories={scoresCategories}
                    data={scoresData}
                    yAxisLabel="Test score (%)"
                    height={350}
                />
            </section>

            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Session duration by week</Heading>
                <p style={captionStyle}>
                    Temporal weeks keep chronological order with {'sort={false}'}.
                </p>
                <BoxPlotChart
                    categories={durationCategories}
                    data={durationData}
                    yAxisLabel="Duration (minutes)"
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
        categories: ['Grade 6', 'Grade 7', 'Grade 8'],
        data: [
            [54, 68, 76, 85, 94],
            [58, 71, 79, 87, 96],
            [62, 74, 82, 89, 97],
        ],
        yAxisLabel: 'Competency score',
        height: 400,
        sort: true,
    },
};
