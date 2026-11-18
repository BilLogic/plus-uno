import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import WordCloud from './WordCloud';

export default {
    title: 'Data visualizations/Flow & relationships/Word cloud',
    component: WordCloud,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        data: { control: 'object', description: 'Array of { name, weight } word-frequency objects' },
        height: { control: 'number', description: 'Chart height in pixels' },
        sort: { control: 'boolean', description: 'Sort words from most to least by weight by default; pass false to keep input order' },
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

const feedbackData = [
    { name: 'Patient', weight: 18 },
    { name: 'Helpful', weight: 28 },
    { name: 'Encouraging', weight: 22 },
    { name: 'Clear', weight: 24 },
    { name: 'Prepared', weight: 16 },
    { name: 'Supportive', weight: 20 },
    { name: 'Engaging', weight: 15 },
    { name: 'Friendly', weight: 14 },
    { name: 'Step-by-step', weight: 19 },
    { name: 'Kind', weight: 12 },
    { name: 'Focused', weight: 11 },
    { name: 'Confident', weight: 13 },
];

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Student session feedback</Heading>
                <p style={captionStyle}>
                    Common themes in post-session student notes, ordered from highest to lowest frequency by default.
                </p>
                <WordCloud data={feedbackData} height={400} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelectorAll('.highcharts-container .highcharts-point').length).toBeGreaterThanOrEqual(5);
        });
        const fills = new Set(
            [...canvasElement.querySelectorAll('.highcharts-container .highcharts-point')].map(
                (pt) => getComputedStyle(pt).fill,
            ),
        );
        expect(fills.size).toBe(1);

        for (const node of canvasElement.querySelectorAll('.highcharts-container text, .highcharts-container tspan')) {
            if (!node.textContent?.trim()) continue;
            const style = getComputedStyle(node);
            expect(style.fontFamily).toContain('Noto Sans');
            expect(['500', '600']).toContain(style.fontWeight);
        }
    },
};

export const Interactive = {
    args: {
        height: 400,
        sort: true,
        data: [
            { name: 'Helpful', weight: 24 },
            { name: 'Clear', weight: 18 },
            { name: 'Patient', weight: 15 },
            { name: 'Encouraging', weight: 12 },
            { name: 'Prepared', weight: 9 },
        ],
    },
};
