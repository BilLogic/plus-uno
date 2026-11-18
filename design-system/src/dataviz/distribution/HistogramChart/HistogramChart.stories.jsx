import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import HistogramChart from './HistogramChart';

export default {
    title: 'Data visualizations/Distribution/Histogram chart',
    component: HistogramChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        height: { control: 'number' },
        xAxisLabel: { control: 'text' },
        yAxisLabel: { control: 'text' },
        binWidth: { control: 'number' },
        data: { control: 'object' },
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

const testScores = [
    65, 72, 78, 82, 85, 88, 90, 92, 75, 80,
    68, 74, 79, 83, 86, 89, 91, 95, 77, 81,
    70, 76, 80, 84, 87, 90, 93, 98, 73, 82,
    62, 71, 77, 81, 85, 88, 91, 94, 69, 79,
    58, 67, 75, 80, 84, 87, 89, 92, 71, 78,
];

const sessionDurations = [
    25, 30, 35, 40, 45, 45, 50, 55, 60, 45,
    30, 35, 40, 45, 50, 50, 55, 60, 65, 48,
    28, 32, 38, 42, 45, 48, 52, 58, 62, 44,
    35, 40, 42, 45, 47, 50, 53, 55, 45, 46,
];

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="small">Test score distribution</Heading>
                <p style={captionStyle}>
                    Bins stay in ascending range order so the shape of 50 student scores reads left to right.
                </p>
                <HistogramChart
                    data={testScores}
                    xAxisLabel="Score"
                    yAxisLabel="Test score (%)"
                    height={350}
                    binWidth={10}
                />
            </section>

            <section style={sectionStyle}>
                <Heading as="h3" size="small">Session duration distribution</Heading>
                <p style={captionStyle}>
                    Frequency of tutoring session lengths in 10-minute bins.
                </p>
                <HistogramChart
                    data={sessionDurations}
                    xAxisLabel="Minutes"
                    yAxisLabel="Session duration (min)"
                    height={300}
                    binWidth={10}
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
            expect(style.fontFamily).toContain('Noto Sans');
            expect(style.fontVariantNumeric).toBe('tabular-nums');
        }
    },
};

export const Interactive = {
    args: {
        data: [22, 26, 28, 30, 32, 34, 35, 36, 38, 40, 42, 44, 45, 45, 48, 50, 52, 55, 58, 60, 62, 65, 68, 70, 74, 78],
        xAxisLabel: 'Minutes tutored',
        yAxisLabel: 'Sessions',
        height: 400,
    },
};
