import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import ScatterChart from './ScatterChart';

export default {
    title: 'Data visualizations/Correlation/Scatter chart',
    component: ScatterChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        height: { control: 'number' },
        xAxisLabel: { control: 'text' },
        yAxisLabel: { control: 'text' },
        data: { control: 'object' },
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

const studyCorrelation = [
    {
        name: 'Grade 7',
        data: [
            [30, 62], [45, 68], [60, 75], [75, 78], [90, 82],
            [40, 65], [55, 72], [70, 76], [85, 84], [100, 88],
        ],
    },
    {
        name: 'Grade 8',
        data: [
            [35, 65], [50, 72], [65, 79], [80, 85], [95, 90],
            [45, 70], [60, 77], [75, 83], [90, 88], [110, 94],
        ],
    },
];

const singleSeriesAttendance = [
    {
        name: 'All students',
        data: [
            [68, 60], [74, 66], [80, 72], [84, 78], [88, 82],
            [90, 85], [92, 88], [95, 91], [97, 94], [100, 96],
        ],
    },
];

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Practice time vs. assessment score</Heading>
                <p style={captionStyle}>
                    Two grade cohorts plotted on ladder-sized markers with shared hover and inactive states.
                </p>
                <ScatterChart
                    data={studyCorrelation}
                    xAxisLabel="Weekly practice (minutes)"
                    yAxisLabel="Assessment score (%)"
                    height={360}
                />
            </section>

            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Attendance rate vs. final grade</Heading>
                <p style={captionStyle}>
                    A single series uses the brand chart color across all observations.
                </p>
                <ScatterChart
                    data={singleSeriesAttendance}
                    xAxisLabel="Attendance (%)"
                    yAxisLabel="Final grade (%)"
                    height={320}
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
        xAxisLabel: 'Minutes tutored',
        yAxisLabel: 'Competency score',
        height: 400,
        data: [
            { name: 'Lincoln Middle', data: [[15, 64], [25, 73], [35, 82], [45, 91]] },
            { name: 'Roosevelt K-8', data: [[18, 69], [28, 76], [38, 80], [42, 87]] },
        ],
    },
};
