import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import ArcDiagram from './ArcDiagram';

export default {
    title: 'Data visualizations/Flow & relationships/Arc diagram',
    component: ArcDiagram,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        data: { control: 'object', description: 'Array of [from, to, weight] connection rows' },
        height: { control: 'number', description: 'Chart height in pixels' },
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

const subjectLinks = [
    ['Algebra', 'Geometry', 14],
    ['Algebra', 'Physics', 18],
    ['Geometry', 'Physics', 9],
    ['Physics', 'Chemistry', 12],
    ['Chemistry', 'Biology', 15],
    ['Algebra', 'Statistics', 11],
    ['Statistics', 'Biology', 7],
];

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Subject connections</Heading>
                <p style={captionStyle}>
                    Weighted co-enrollment links across ordered subjects, with arc thickness encoding shared student count.
                </p>
                <ArcDiagram data={subjectLinks} height={400} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelectorAll('.highcharts-container .highcharts-series').length).toBeGreaterThanOrEqual(1);
        });
        for (const node of canvasElement.querySelectorAll('.highcharts-container text, .highcharts-container tspan')) {
            if (!node.textContent?.trim()) continue;
            const style = getComputedStyle(node);
            expect(style.fontFamily).toContain('Google Sans Flex');
            expect(['500', '600']).toContain(style.fontWeight);
        }
    },
};

export const Interactive = {
    args: {
        data: [
            ['Fractions', 'Ratios', 8],
            ['Fractions', 'Decimals', 12],
            ['Ratios', 'Decimals', 6],
            ['Decimals', 'Percentages', 15],
        ],
        height: 400,
    },
};
