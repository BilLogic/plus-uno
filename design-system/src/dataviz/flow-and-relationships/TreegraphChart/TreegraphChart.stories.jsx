import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import TreegraphChart from './TreegraphChart';

export default {
    title: 'Data visualizations/Flow & relationships/Treegraph chart',
    component: TreegraphChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        data: { control: 'object', description: 'Flat array of { id, parent?, name } nodes' },
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

const curriculumTree = [
    { id: 'math', name: 'Middle school math' },
    { id: 'ratios', parent: 'math', name: 'Ratios & proportions' },
    { id: 'expressions', parent: 'math', name: 'Expressions & equations' },
    { id: 'unit-rates', parent: 'ratios', name: 'Unit rates' },
    { id: 'percent', parent: 'ratios', name: 'Percent problems' },
    { id: 'linear', parent: 'expressions', name: 'Linear equations' },
    { id: 'inequalities', parent: 'expressions', name: 'Inequalities' },
];

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="small">Curriculum topic hierarchy</Heading>
                <p style={captionStyle}>
                    Subject, unit and lesson breakdown with node boxes rounded on the nested visual role radius.
                </p>
                <TreegraphChart data={curriculumTree} height={500} />
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
            expect(style.fontFamily).toContain('Noto Sans');
            expect(['500', '600']).toContain(style.fontWeight);
        }
    },
};

export const Interactive = {
    args: {
        data: [
            { id: 'math', name: 'Math' },
            { id: 'fractions', parent: 'math', name: 'Fractions' },
            { id: 'ratios', parent: 'math', name: 'Ratios' },
            { id: 'equivalent', parent: 'fractions', name: 'Equivalent fractions' },
        ],
        height: 500,
    },
};
