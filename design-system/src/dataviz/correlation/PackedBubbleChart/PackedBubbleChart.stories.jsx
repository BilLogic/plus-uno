import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import PackedBubbleChart from './PackedBubbleChart';

export default {
    title: 'Data visualizations/Correlation/Packed bubble chart',
    component: PackedBubbleChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        height: { control: 'number' },
        splitSeries: { control: 'boolean' },
        data: { control: 'object' },
        sort: { control: 'boolean', description: 'Sort groups by total value and bubbles by value; pass false to keep input order' },
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

const schoolsData = [
    {
        name: 'CMU',
        data: [
            { name: 'Lincoln Middle', value: 250 },
            { name: 'Washington High', value: 180 },
            { name: 'Jefferson Elem', value: 120 },
        ],
    },
    {
        name: 'Pitt',
        data: [
            { name: 'Roosevelt High', value: 200 },
            { name: 'Adams Middle', value: 150 },
            { name: 'Monroe Elem', value: 90 },
        ],
    },
    {
        name: 'Ohio State',
        data: [
            { name: 'Kennedy High', value: 300 },
            { name: 'Madison Middle', value: 220 },
        ],
    },
];

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Students by university and school (split clusters)</Heading>
                <p style={captionStyle}>
                    Groups and bubbles sort from largest total to smallest so the biggest partner cluster leads.
                </p>
                <PackedBubbleChart data={schoolsData} height={450} splitSeries={true} />
            </section>

            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Combined view</Heading>
                <p style={captionStyle}>
                    Packs every school into one shared cluster while keeping university colors.
                </p>
                <PackedBubbleChart data={schoolsData} height={400} splitSeries={false} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelectorAll('.highcharts-container').length).toBe(2);
        });
        for (const label of canvasElement.querySelectorAll('.highcharts-data-labels text, .highcharts-data-labels tspan')) {
            if (!label.textContent?.trim()) continue;
            const style = getComputedStyle(label);
            expect(style.fontFamily).toContain('Google Sans Flex');
            expect(['500', '600']).toContain(style.fontWeight);
        }
    },
};

export const Interactive = {
    args: {
        data: [
            {
                name: 'Lincoln Middle',
                data: [
                    { name: 'Grade 6', value: 100 },
                    { name: 'Grade 7', value: 84 },
                ],
            },
            {
                name: 'Roosevelt K-8',
                data: [
                    { name: 'Grade 7', value: 120 },
                    { name: 'Grade 8', value: 64 },
                ],
            },
        ],
        height: 500,
        splitSeries: true,
        sort: true,
    },
};
