import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import BubbleChart from './BubbleChart';

export default {
    title: 'Data visualizations/Correlation/Bubble chart',
    component: BubbleChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        height: { control: 'number' },
        xAxisLabel: { control: 'text' },
        yAxisLabel: { control: 'text' },
        zAxisLabel: { control: 'text' },
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

const studentPerformanceData = [
    {
        name: 'Class A',
        data: [
            [12, 75, 8],
            [18, 82, 12],
            [24, 88, 15],
            [8, 68, 5],
            [30, 92, 20],
        ],
    },
    {
        name: 'Class B',
        data: [
            [10, 70, 6],
            [15, 78, 10],
            [22, 85, 14],
            [28, 90, 18],
            [6, 62, 4],
        ],
    },
];

const singleCohortData = [
    {
        name: 'Tutoring cohort',
        data: [
            [6, 64, 5],
            [12, 74, 9],
            [18, 81, 14],
            [25, 89, 18],
            [32, 94, 22],
        ],
    },
];

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Study hours vs. test score vs. sessions</Heading>
                <p style={captionStyle}>
                    Compares study time, score and session count across two classes with categorical series colors and ladder-sized bubbles.
                </p>
                <BubbleChart
                    xAxisLabel="Study hours"
                    yAxisLabel="Test score (%)"
                    zAxisLabel="Sessions completed"
                    data={studentPerformanceData}
                    height={380}
                />
            </section>

            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Single cohort progression</Heading>
                <p style={captionStyle}>
                    A single series uses the brand chart color without implying separate categories.
                </p>
                <BubbleChart
                    xAxisLabel="Study hours"
                    yAxisLabel="Test score (%)"
                    zAxisLabel="Sessions completed"
                    data={singleCohortData}
                    height={340}
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
        xAxisLabel: 'Minutes tutored',
        yAxisLabel: 'Competency score',
        zAxisLabel: 'Sessions per week',
        height: 400,
        data: [
            { name: 'Lincoln Middle', data: [[25, 72, 10], [35, 81, 16], [45, 89, 22]] },
            { name: 'Roosevelt K-8', data: [[20, 68, 8], [32, 77, 14], [42, 86, 18]] },
        ],
    },
};
