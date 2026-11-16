import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import { BRAND, sequentialRamp } from '@/dataviz/palette';
import SmartBarChart from './SmartBarChart';

/** A step of the blue ramp, 0 (lightest) to 3 (strongest). */
const grade = (step) => `var(${sequentialRamp('blue')[step]})`;

export default {
    title: 'Data visualizations/Comparison/Smart bar chart',
    component: SmartBarChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        height: { control: 'number' },
        data: { control: 'object' },
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

const defaultData = {
    height: 200,
    sort: false,
    data: [
        // Grades are ordinal: one hue, the strongest tone on the biggest share.
        { letter: 'A', height: '100', color: grade(3) },
        { letter: 'B', height: '75', color: grade(2) },
        { letter: 'C', height: '50', color: grade(1) },
        { letter: 'D', height: '25', color: grade(0) },
        { letter: 'E', height: '0', color: grade(0) },
    ],
};

const weekdayData = {
    height: 300,
    sort: false,
    data: [
        // One series: every day takes the brand chart color.
        { letter: 'M', height: '40', color: BRAND },
        { letter: 'T', height: '80', color: BRAND },
        { letter: 'W', height: '60', color: BRAND },
        { letter: 'T', height: '90', color: BRAND },
        { letter: 'F', height: '20', color: BRAND },
    ],
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="small">Grade distribution</Heading>
                <p style={captionStyle}>
                    Shows score distribution against a 100% track with the darkest tone on the largest share.
                </p>
                <SmartBarChart {...defaultData} />
            </section>

            <section style={sectionStyle}>
                <Heading as="h3" size="small">Weekly activity</Heading>
                <p style={captionStyle}>
                    Visualizes activity levels across weekdays in the single-series brand color.
                </p>
                <SmartBarChart {...weekdayData} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelectorAll('.highcharts-container').length).toBe(2);
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
        height: 250,
        sort: true,
        data: [
            { letter: '1', height: '60', color: BRAND },
            { letter: '2', height: '80', color: BRAND },
            { letter: '3', height: '45', color: BRAND },
            { letter: '4', height: '90', color: BRAND },
        ],
    },
};
