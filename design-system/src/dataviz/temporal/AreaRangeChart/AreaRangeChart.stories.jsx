import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import AreaRangeChart from './AreaRangeChart';

export default {
    title: 'Data visualizations/Temporal/Area range chart',
    component: AreaRangeChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        data: { control: 'object', description: 'Array of [x, low, high] triples' },
        xAxisLabel: { control: 'text', description: 'Label for the X axis' },
        yAxisLabel: { control: 'text', description: 'Label for the Y axis' },
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

const scoreRangeData = {
    data: [
        [1, 54, 78], [2, 56, 80], [3, 58, 83], [4, 60, 84],
        [5, 62, 86], [6, 63, 88], [7, 65, 89], [8, 66, 90],
        [9, 68, 91], [10, 69, 92], [11, 70, 93], [12, 72, 94],
    ],
    xAxisLabel: 'Week of term',
    yAxisLabel: 'Session score (%)',
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Weekly score range</Heading>
                <p style={captionStyle}>
                    Filled band from the lowest to highest session score each week.
                </p>
                <AreaRangeChart {...scoreRangeData} />
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
        data: [
            [0, 25, 45], [1, 28, 48], [2, 30, 50], [3, 32, 55], [4, 30, 52],
        ],
        xAxisLabel: 'Week',
        yAxisLabel: 'Minutes tutored',
        height: 400,
    },
};
