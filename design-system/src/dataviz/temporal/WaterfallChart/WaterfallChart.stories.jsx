import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import { BRAND } from '@/dataviz/palette';
import WaterfallChart from './WaterfallChart';

export default {
    title: 'Data visualizations/Temporal/Waterfall chart',
    component: WaterfallChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        data: { control: 'object', description: 'Array of values or { y, isSum, isIntermediateSum, color } objects' },
        categories: { control: 'object', description: 'Step labels' },
        yAxisLabel: { control: 'text', description: 'Y-axis label' },
        height: { control: 'number', description: 'Chart height in pixels' },
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

const enrollmentData = {
    categories: ['Start of term', 'New sign-ups', 'Transfers in', 'Withdrawals', 'Graduated', 'Current'],
    data: [
        { y: 420, color: BRAND },
        85,
        24,
        -30,
        -18,
        { isSum: true, color: BRAND },
    ],
    yAxisLabel: 'Enrolled students',
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="small">Term enrollment changes</Heading>
                <p style={captionStyle}>
                    Shows how starting enrollment reaches the current total through sequential additions and withdrawals.
                </p>
                <WaterfallChart {...enrollmentData} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelector('.highcharts-container')).not.toBeNull();
        });
        for (const label of canvasElement.querySelectorAll('.highcharts-axis-labels text, .highcharts-data-label text')) {
            if (!label.textContent?.trim()) continue;
            const style = getComputedStyle(label);
            expect(style.fontFamily).toContain('Noto Sans');
            expect(style.fontVariantNumeric).toBe('tabular-nums');
        }
    },
};

export const Interactive = {
    args: {
        categories: ['Start of term', 'New enrollments', 'Transfers in', 'Completed', 'Current active'],
        data: [{ y: 100, color: BRAND }, 50, 30, -40, { isSum: true, color: BRAND }],
        yAxisLabel: 'Enrolled students',
        height: 400,
    },
};
