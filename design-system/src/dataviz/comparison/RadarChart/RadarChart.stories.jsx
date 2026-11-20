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

const sessionMinutesData = {
    categories: ['Algebra', 'Geometry', 'Fractions', 'Reading', 'Writing', 'Study skills'],
    series: [
        { name: 'Planned minutes', data: [45, 30, 50, 40, 35, 25] },
        { name: 'Completed minutes', data: [42, 35, 45, 38, 30, 28] },
    ],
    height: 400,
};

const competencyData = {
    categories: ['Social-emotional', 'Mastering content', 'Advocacy', 'Relationships', 'Technology tools'],
    yAxisMax: 5,
    series: [
        { name: 'Maya K.', data: [4, 5, 3, 5, 4] },
        { name: 'Cohort average', data: [3.5, 4, 3.5, 4, 3] },
    ],
    filled: true,
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Line radar (default)</Heading>
                <p style={captionStyle}>
                    Spoke connections for comparing planned vs. completed tutoring minutes across subjects.
                </p>
                <RadarChart {...sessionMinutesData} />
            </section>

            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Filled area radar</Heading>
                <p style={captionStyle}>
                    Fills the primary series to emphasize overall coverage across SMART competencies.
                </p>
                <RadarChart {...competencyData} />
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
        categories: ['Problem solving', 'Concept clarity', 'Session engagement', 'Attendance rate', 'Homework completion'],
        series: [
            { name: 'Lincoln Middle', data: [80, 68, 90, 76, 85] },
            { name: 'District average', data: [65, 78, 62, 84, 70] },
        ],
        filled: false,
        sort: false,
        height: 400,
        yAxisMax: 100,
    },
};
