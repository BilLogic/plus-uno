import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import XRangeChart from './XRangeChart';

export default {
    title: 'Data visualizations/Temporal/X-range chart',
    component: XRangeChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        categories: { control: 'object', description: 'Row labels top to bottom' },
        data: { control: 'object', description: 'Array of spans { start, end, y, name, color }' },
        height: { control: 'number', description: 'Chart height in pixels' },
        sort: { control: 'boolean', description: 'Sort rows from most to least total duration; false by default' },
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

const monday = Date.UTC(2026, 8, 7);
const day = 24 * 36e5;
const hour = 36e5;
const minute = 60e3;

const scheduleData = {
    categories: ['Tutor A', 'Tutor B', 'Tutor C'],
    data: [
        { start: monday, end: monday + day, y: 0, name: 'Lincoln Middle session' },
        { start: monday + day * 2, end: monday + day * 3, y: 0, name: 'Roosevelt K-8 session' },
        { start: monday, end: monday + day * 2, y: 1, name: 'North High session' },
        { start: monday + day, end: monday + day * 4, y: 2, name: 'South High session' },
    ],
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Tutor schedule</Heading>
                <p style={captionStyle}>
                    Time spans across tutors over the week, each session plotted on its tutor's row.
                </p>
                <XRangeChart {...scheduleData} />
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
        categories: ['Maya Lin', 'Devon Brooks'],
        data: [
            {
                start: monday + 15 * hour + 30 * minute,
                end: monday + 16 * hour + 30 * minute,
                y: 0,
                name: 'Algebra I at Lincoln Middle',
            },
            {
                start: monday + day + 16 * hour,
                end: monday + day + 16 * hour + 45 * minute,
                y: 1,
                name: 'Fractions at Roosevelt K-8',
            },
            {
                start: monday + day * 2 + 15 * hour + 45 * minute,
                end: monday + day * 2 + 16 * hour + 30 * minute,
                y: 0,
                name: 'Linear equations at Lincoln Middle',
            },
        ],
        height: 400,
        sort: false,
    },
};
