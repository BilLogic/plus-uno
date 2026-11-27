import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import NetworkGraph from './NetworkGraph';

export default {
    title: 'Data visualizations/Flow & relationships/Network graph',
    component: NetworkGraph,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        data: { control: 'object', description: 'Array of [from, to] node-name pairs' },
        nodes: { control: 'object', description: 'Optional array of { id, color } node overrides' },
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

const conceptMapData = [
    ['Mathematics', 'Algebra'],
    ['Mathematics', 'Geometry'],
    ['Mathematics', 'Calculus'],
    ['Algebra', 'Equations'],
    ['Algebra', 'Functions'],
    ['Geometry', 'Shapes'],
    ['Geometry', 'Trigonometry'],
    ['Calculus', 'Derivatives'],
    ['Calculus', 'Integrals'],
    ['Functions', 'Calculus'],
    ['Trigonometry', 'Calculus'],
];

const peerNetworkData = [
    ['Priya S.', 'Marcus T.'],
    ['Priya S.', 'Dana K.'],
    ['Marcus T.', 'Dana K.'],
    ['Dana K.', 'Jordan R.'],
    ['Jordan R.', 'Elena M.'],
    ['Jordan R.', 'Sam L.'],
    ['Elena M.', 'Sam L.'],
];

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Math concept map</Heading>
                <p style={captionStyle}>
                    Unweighted prerequisite and topic links rendered in the single-series brand color.
                </p>
                <NetworkGraph data={conceptMapData} height={500} />
            </section>

            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Peer study network</Heading>
                <p style={captionStyle}>
                    Co-tutoring pairs across a smaller cohort at a compact height.
                </p>
                <NetworkGraph data={peerNetworkData} height={400} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelectorAll('.highcharts-container .highcharts-series').length).toBe(2);
        });
        for (const node of canvasElement.querySelectorAll('.highcharts-container text, .highcharts-container tspan')) {
            if (!node.textContent?.trim()) continue;
            const style = getComputedStyle(node);
            expect(style.fontFamily).toContain('Google Sans Flex');
            expect(style.fontWeight).toBe('500');
        }
    },
};

export const Interactive = {
    args: {
        height: 500,
        data: [
            ['Fractions', 'Ratios'],
            ['Fractions', 'Decimals'],
            ['Ratios', 'Percentages'],
            ['Decimals', 'Percentages'],
            ['Percentages', 'Proportions'],
        ],
        nodes: [],
    },
};
