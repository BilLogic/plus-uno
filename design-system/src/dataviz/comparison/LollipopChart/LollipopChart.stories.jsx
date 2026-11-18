import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import LollipopChart from './LollipopChart';

export default {
    title: 'Data visualizations/Comparison/Lollipop chart',
    component: LollipopChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        data: { control: 'object', description: 'Array of numerical values' },
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

const rankingData = {
    categories: ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace'],
    data: [95, 88, 82, 78, 72, 65, 58],
    yAxisLabel: 'Score',
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Student rankings</Heading>
                <p style={captionStyle}>
                    Lighter alternative to horizontal bars when comparing a ranked list.
                </p>
                <LollipopChart {...rankingData} />
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
        categories: ['Lincoln Middle', 'Roosevelt K-8', 'North High', 'Oakwood Elementary', 'South High'],
        data: [54, 42, 76, 34, 63],
        yAxisLabel: 'Sessions per week',
        height: 400,
        horizontal: true,
        sort: true,
    },
};
