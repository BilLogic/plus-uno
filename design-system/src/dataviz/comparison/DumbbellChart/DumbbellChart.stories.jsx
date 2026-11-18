import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import DumbbellChart from './DumbbellChart';

export default {
    title: 'Data visualizations/Comparison/Dumbbell chart',
    component: DumbbellChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        data: { control: 'object', description: 'Array of { low, high } objects' },
        categories: { control: 'object', description: 'Category labels' },
        lowLabel: { control: 'text', description: 'Label for low value' },
        highLabel: { control: 'text', description: 'Label for high value' },
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

const scoreChangeData = {
    categories: ['Alice', 'Bob', 'Carol', 'David', 'Eve'],
    data: [
        { low: 65, high: 92 },
        { low: 58, high: 78 },
        { low: 72, high: 85 },
        { low: 45, high: 82 },
        { low: 80, high: 88 },
    ],
    lowLabel: 'Pre-test',
    highLabel: 'Post-test',
    yAxisLabel: 'Score',
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="small">Student score changes</Heading>
                <p style={captionStyle}>
                    Compare pre-test and post-test scores to see improvement across students.
                </p>
                <DumbbellChart {...scoreChangeData} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelector('.highcharts-container')).not.toBeNull();
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
        categories: ['Algebra I', 'Fractions', 'Reading fluency', 'Essay structure'],
        data: [
            { low: 52, high: 78 },
            { low: 60, high: 86 },
            { low: 48, high: 74 },
            { low: 64, high: 90 },
        ],
        lowLabel: 'Baseline',
        highLabel: 'End of term',
        yAxisLabel: 'Competency score',
        height: 400,
        horizontal: true,
        sort: true,
    },
};
