import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import { CATEGORICAL } from '@/dataviz/palette';
import ParliamentChart from './ParliamentChart';

export default {
    title: 'Data visualizations/Part-to-whole/Parliament chart',
    component: ParliamentChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        data: { control: 'object', description: 'Array of { name, value, color }' },
        height: { control: 'number', description: 'Chart height in pixels' },
        sort: { control: 'boolean', description: 'Sort groups from most to least (keeps input seat order by default)' },
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

const parliamentData = {
    data: [
        { name: 'Grade 6', value: 18 },
        { name: 'Grade 7', value: 24 },
        { name: 'Grade 8', value: 35 },
        { name: 'Grade 9', value: 12 },
        { name: 'Grade 10', value: 6 },
    ],
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="small">Cohort seats by grade</Heading>
                <p style={captionStyle}>
                    Each dot represents one student seat, grouped by grade in input order.
                </p>
                <ParliamentChart {...parliamentData} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelectorAll('.highcharts-container').length).toBe(1);
        });
        for (const label of canvasElement.querySelectorAll('.highcharts-legend-item text')) {
            if (!label.textContent?.trim()) continue;
            const style = getComputedStyle(label);
            expect(style.fontFamily).toContain('Noto Sans');
            expect(style.fontVariantNumeric).toBe('tabular-nums');
        }
    },
};

export const Interactive = {
    args: {
        sort: false,
        data: [
            { name: 'Group B', value: 15, color: CATEGORICAL[0] },
            { name: 'Group A', value: 10, color: CATEGORICAL[1] },
            { name: 'Group C', value: 5, color: CATEGORICAL[2] },
        ],
        height: 400,
    },
};
