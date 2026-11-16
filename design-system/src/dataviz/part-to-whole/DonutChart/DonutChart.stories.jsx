import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import { BRAND, CATEGORICAL, CHROME } from '@/dataviz/palette';
import DonutChart from './DonutChart';

export default {
    title: 'Data visualizations/Part-to-whole/Donut chart',
    component: DonutChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        size: { control: { type: 'number', min: 100, max: 500, step: 10 }, description: 'Diameter in pixels' },
        value: { control: 'text', description: 'Center value text' },
        label: { control: 'text', description: 'Center label below value' },
        centerTextSize: { control: { type: 'select', options: ['lg', 'md', 'sm'] }, description: 'Metric scale step for the center figure' },
        sort: { control: 'boolean', description: 'Sort categorical segments from most to least by default' },
        segments: { control: 'object', description: 'Array of { value, color, label }' },
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
    gap: 'var(--section-stack-md)',
};

const captionStyle = {
    margin: 0,
    color: 'var(--ds-text-subtle)',
};

const completionData = {
    value: '75%',
    label: 'Completed',
    segments: [
        { value: 75, color: BRAND, label: 'Done' },
        { value: 25, color: CHROME.track, label: 'Remaining' },
    ],
};

const distributionData = {
    value: '100',
    label: 'Sessions by subject',
    centerTextSize: 'md',
    segments: [
        { value: 30, label: 'Reading' },
        { value: 20, label: 'Science' },
        { value: 10, label: 'Writing' },
        { value: 40, label: 'Math' },
    ],
};

const smallData = {
    size: 150,
    value: '1/4',
    label: 'Step',
    centerTextSize: 'sm',
    segments: [
        { value: 25, color: BRAND, label: 'Current' },
        { value: 75, color: CHROME.track, label: 'Remaining' },
    ],
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="small">Completion progress</Heading>
                <p style={captionStyle}>
                    Two-segment ring filling a single measure against the neutral track.
                </p>
                <DonutChart {...completionData} />
            </section>

            <section style={sectionStyle}>
                <Heading as="h3" size="small">Multi-segment distribution</Heading>
                <p style={captionStyle}>
                    Categorical segments sort from most to least and take the categorical palette in order.
                </p>
                <DonutChart {...distributionData} />
            </section>

            <section style={sectionStyle}>
                <Heading as="h3" size="small">Compact size</Heading>
                <p style={captionStyle}>
                    Smaller diameter paired with the small Metric step for dense cards.
                </p>
                <DonutChart {...smallData} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelectorAll('.highcharts-container').length).toBe(3);
        });
        const metrics = canvasElement.querySelectorAll('.metric-lg, .metric-md, .metric-sm');
        expect(metrics.length).toBe(3);
        for (const metric of metrics) {
            const style = getComputedStyle(metric);
            expect(style.fontFamily).toContain('Noto Sans');
            expect(style.fontVariantNumeric).toBe('tabular-nums');
        }
    },
};

export const Interactive = {
    args: {
        size: 250,
        value: '50%',
        label: 'Label',
        centerTextSize: 'lg',
        sort: true,
        segments: [
            { value: 50, color: CATEGORICAL[0], label: 'Segment A' },
            { value: 30, color: CATEGORICAL[1], label: 'Segment B' },
            { value: 20, color: CATEGORICAL[2], label: 'Segment C' },
        ],
    },
};
