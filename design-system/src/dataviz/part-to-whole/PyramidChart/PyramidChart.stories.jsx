import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import PyramidChart from './PyramidChart';

export default {
    title: 'Data visualizations/Part-to-whole/Pyramid chart',
    component: PyramidChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        data: { control: 'object', description: 'Array of { name, value, color? }' },
        height: { control: 'number', description: 'Chart height in pixels' },
        sort: { control: 'boolean', description: 'Sort bands from most to least by default' },
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

const enrollmentData = {
    data: [
        { name: 'Referred', value: 1200 },
        { name: 'Enrolled', value: 840 },
        { name: 'Attending weekly', value: 510 },
        { name: 'Met their goal', value: 230 },
    ],
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="small">Student enrollment tiers</Heading>
                <p style={captionStyle}>
                    Bands stack from the largest base to the narrowest tier at the top.
                </p>
                <PyramidChart {...enrollmentData} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelectorAll('.highcharts-container').length).toBe(1);
        });
        for (const label of canvasElement.querySelectorAll('.highcharts-data-label text')) {
            if (!label.textContent?.trim()) continue;
            const style = getComputedStyle(label);
            expect(style.fontFamily).toContain('Noto Sans');
            expect(style.fontVariantNumeric).toBe('tabular-nums');
        }
    },
};

export const Interactive = {
    args: {
        sort: true,
        data: [
            { name: 'Stage 1', value: 1000 },
            { name: 'Stage 2', value: 600 },
            { name: 'Stage 3', value: 300 },
            { name: 'Stage 4', value: 100 },
        ],
        height: 400,
    },
};
