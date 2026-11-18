import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import { CATEGORICAL } from '@/dataviz/palette';
import StackedBarChart from './StackedBarChart';

export default {
    title: 'Data visualizations/Comparison/Stacked bar chart',
    component: StackedBarChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        height: { control: 'number', description: 'Chart height in pixels' },
        dates: { control: 'object', description: 'Category labels' },
        data: { control: 'object', description: 'Array of { segments: [...] }' },
        sort: { control: 'boolean', description: 'Sort columns from most to least by total height; false by default because dates is a temporal axis' },
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

const weeklyData = {
    height: 300,
    dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    data: [
        {
            segments: [
                { value: '10', color: CATEGORICAL[0], height: '20' },
                { value: '40', color: CATEGORICAL[1], height: '80' },
            ],
        },
        {
            segments: [
                { value: '20', color: CATEGORICAL[0], height: '40' },
                { value: '30', color: CATEGORICAL[1], height: '60' },
            ],
        },
        {
            segments: [
                { value: '15', color: CATEGORICAL[0], height: '30' },
                { value: '35', color: CATEGORICAL[1], height: '70' },
            ],
        },
        {
            segments: [
                { value: '25', color: CATEGORICAL[0], height: '50' },
                { value: '25', color: CATEGORICAL[1], height: '50' },
            ],
        },
        {
            segments: [
                { value: '5', color: CATEGORICAL[0], height: '10' },
                { value: '45', color: CATEGORICAL[1], height: '90' },
            ],
        },
    ],
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Weekly breakdown</Heading>
                <p style={captionStyle}>
                    Shows part-to-whole relationships across weekdays with contrasting segment labels.
                </p>
                <StackedBarChart {...weeklyData} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelector('.highcharts-container')).not.toBeNull();
        });
        for (const node of canvasElement.querySelectorAll('.highcharts-axis-labels text, .plus-chart-value')) {
            if (!node.textContent?.trim()) continue;
            const style = getComputedStyle(node);
            expect(style.fontFamily).toContain('Noto Sans');
            expect(style.fontVariantNumeric).toBe('tabular-nums');
            expect(['500', '600']).toContain(style.fontWeight);
        }
    },
};

export const Interactive = {
    args: {
        height: 300,
        sort: false,
        dates: ['Jan', 'Feb', 'Mar'],
        data: [
            {
                segments: [
                    { value: '30', color: CATEGORICAL[0], height: '60' },
                    { value: '20', color: CATEGORICAL[1], height: '40' },
                ],
            },
            {
                segments: [
                    { value: '25', color: CATEGORICAL[0], height: '50' },
                    { value: '25', color: CATEGORICAL[1], height: '50' },
                ],
            },
            {
                segments: [
                    { value: '40', color: CATEGORICAL[0], height: '80' },
                    { value: '10', color: CATEGORICAL[1], height: '20' },
                ],
            },
        ],
    },
};
