import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import SankeyDiagram from './SankeyDiagram';

export default {
    title: 'Data visualizations/Flow & relationships/Sankey diagram',
    component: SankeyDiagram,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        data: { control: 'object', description: 'Array of [from, to, weight] flow rows' },
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

const referralFlowData = [
    ['School referral', 'First session', 140],
    ['Teacher nomination', 'First session', 85],
    ['Family request', 'First session', 55],
    ['First session', 'Algebra support', 130],
    ['First session', 'Reading fluency', 95],
    ['First session', 'Homework lab', 55],
];

const sessionProgressionData = [
    ['Check-in', 'Warm-up problem', 240],
    ['Check-in', 'Concept review', 160],
    ['Warm-up problem', 'Guided practice', 210],
    ['Warm-up problem', 'Independent exit ticket', 30],
    ['Concept review', 'Guided practice', 160],
    ['Guided practice', 'Independent exit ticket', 340],
    ['Guided practice', 'Follow-up assigned', 30],
];

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Referral to subject placement</Heading>
                <p style={captionStyle}>
                    How incoming student referrals consolidate at first session and split into subject tracks.
                </p>
                <SankeyDiagram data={referralFlowData} height={400} />
            </section>

            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Tutoring session progression</Heading>
                <p style={captionStyle}>
                    Branching activity flow across a tutoring block, with link width proportional to session count.
                </p>
                <SankeyDiagram data={sessionProgressionData} height={400} />
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
            expect(['500', '600']).toContain(style.fontWeight);
        }
    },
};

export const Interactive = {
    args: {
        height: 400,
        data: [
            ['CMU tutors', 'Lincoln Middle', 50],
            ['CMU tutors', 'Roosevelt K-8', 30],
            ['Pitt tutors', 'Lincoln Middle', 40],
            ['Pitt tutors', 'North High', 25],
            ['Lincoln Middle', 'Math sessions', 90],
            ['Roosevelt K-8', 'Reading sessions', 30],
            ['North High', 'Math sessions', 25],
        ],
    },
};
