import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import { toneByRank } from '@/dataviz/palette';
import FunnelChart from './FunnelChart';

export default {
    title: 'Data visualizations/Flow & relationships/Funnel chart',
    component: FunnelChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        data: { control: 'object', description: 'Array of stage objects { name, y, color? }' },
        height: { control: 'number', description: 'Chart height in pixels' },
        sort: { control: 'boolean', description: 'Keep stage order by default (false); pass true to sort stages from most to least' },
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

const onboardingData = [
    { name: 'Applied', y: 640 },
    { name: 'Completed screening', y: 480 },
    { name: 'Finished training', y: 390 },
    { name: 'Matched with students', y: 320 },
    { name: 'Led first session', y: 290 },
];

const enrollmentData = toneByRank(
    [
        { name: 'Referred by school', y: 1200 },
        { name: 'Guardian consent received', y: 940 },
        { name: 'Baseline check completed', y: 780 },
        { name: 'Attended first session', y: 660 },
        { name: 'Active at week four', y: 540 },
    ],
    'blue',
);

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="small">Tutor onboarding stages</Heading>
                <p style={captionStyle}>
                    Stages keep their sequential process order by default ({'sort={false}'}), with counts formatted in tabular figures.
                </p>
                <FunnelChart data={onboardingData} height={400} />
            </section>

            <section style={sectionStyle}>
                <Heading as="h3" size="small">Student enrollment toned by volume</Heading>
                <p style={captionStyle}>
                    Pair sequential stage order with toneByRank so the largest stage carries the darkest sequential step.
                </p>
                <FunnelChart data={enrollmentData} height={400} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelectorAll('.highcharts-container .highcharts-series').length).toBe(2);
            expect(canvasElement.querySelectorAll('.plus-chart-value').length).toBeGreaterThanOrEqual(5);
        });
        // Fills settle after the entrance and any state transition, so read
        // them inside waitFor rather than once.
        const fillsOf = (container) =>
            new Set(
                [...container.querySelectorAll('.highcharts-series .highcharts-point')].map(
                    (pt) => getComputedStyle(pt).fill,
                ),
            );
        await waitFor(() => {
            const containers = canvasElement.querySelectorAll('.highcharts-container');
            const detail = [...containers[0].querySelectorAll('.highcharts-series .highcharts-point')].map(
                (pt) => `${pt.getAttribute('class')} fill=${getComputedStyle(pt).fill} attr=${pt.getAttribute('fill')}`,
            );
            expect(fillsOf(containers[0]).size, detail.join(' | ')).toBe(1);
            expect(fillsOf(containers[1]).size).toBeGreaterThan(1);
        });

        for (const node of canvasElement.querySelectorAll('.highcharts-container text, .highcharts-container tspan, .plus-chart-value')) {
            if (!node.textContent?.trim()) continue;
            const style = getComputedStyle(node);
            expect(style.fontFamily).toContain('Noto Sans');
            expect(['500', '600']).toContain(style.fontWeight);
        }
        for (const valueNode of canvasElement.querySelectorAll('.plus-chart-value')) {
            const style = getComputedStyle(valueNode);
            expect(style.fontWeight).toBe('600');
            expect(style.fontVariantNumeric).toBe('tabular-nums');
        }
    },
};

export const Interactive = {
    args: {
        height: 400,
        sort: false,
        data: [
            { name: 'Applied', y: 1000 },
            { name: 'Screened', y: 700 },
            { name: 'Trained', y: 400 },
            { name: 'Matched', y: 200 },
            { name: 'Active', y: 100 },
        ],
    },
};
