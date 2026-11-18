import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import ParetoChart from './ParetoChart';

export default {
    title: 'Data visualizations/Comparison/Pareto chart',
    component: ParetoChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        data: { control: 'object', description: 'Array of numerical values' },
        categories: { control: 'object', description: 'Category labels' },
        yAxisLabel: { control: 'text', description: 'Y-axis label' },
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

const issuesData = {
    categories: ['Login issues', 'Payment', 'Video', 'Schedule', 'Content', 'Other'],
    data: [45, 28, 15, 8, 5, 3],
    yAxisLabel: 'Tickets',
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Support ticket analysis</Heading>
                <p style={captionStyle}>
                    Columns sorted from largest to smallest with a cumulative share line.
                </p>
                <ParetoChart {...issuesData} />
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
        categories: ['Fractions', 'Linear equations', 'Reading fluency', 'Geometry', 'Essay structure'],
        data: [50, 30, 12, 5, 3],
        yAxisLabel: 'Tutoring sessions',
        height: 400,
    },
};
