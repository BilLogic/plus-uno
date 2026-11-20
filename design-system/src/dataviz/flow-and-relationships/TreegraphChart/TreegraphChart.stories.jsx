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
                <Heading as="h3" size="sm">Curriculum topic hierarchy</Heading>
                <p style={captionStyle}>
                    Subject, unit and lesson breakdown with node boxes rounded on the card-nesting role radius.
                </p>
                <TreegraphChart data={curriculumTree} height={500} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const getNodeBoxes = () =>
            [...canvasElement.querySelectorAll('.highcharts-container path.highcharts-point')].filter(
                (el) => (el.getAttribute('d') ?? '').includes('Z') && el.getBBox().width > 40,
            );
        await waitFor(() => {
            expect(getNodeBoxes().length).toBe(curriculumTree.length);
        });
        for (const nodeBox of getNodeBoxes()) {
            expect(Math.round(nodeBox.getBBox().height)).toBe(32);
            expect(nodeBox.getAttribute('d') ?? '').toMatch(/A\s*8[\s,]+8/);
        }

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
            { id: 'math', name: 'Math' },
            { id: 'fractions', parent: 'math', name: 'Fractions' },
            { id: 'ratios', parent: 'math', name: 'Ratios' },
            { id: 'equivalent', parent: 'fractions', name: 'Equivalent fractions' },
        ],
        height: 500,
    },
};
