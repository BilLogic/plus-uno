import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import DependencyWheel from './DependencyWheel';

export default {
    title: 'Data visualizations/Flow & relationships/Dependency wheel',
    component: DependencyWheel,
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

const skillConnections = [
    ['Reading', 'Comprehension', 5],
    ['Reading', 'Vocabulary', 4],
    ['Writing', 'Grammar', 4],
    ['Writing', 'Vocabulary', 3],
    ['Math', 'Problem solving', 5],
    ['Math', 'Logic', 4],
    ['Comprehension', 'Critical thinking', 3],
    ['Problem solving', 'Critical thinking', 4],
    ['Logic', 'Critical thinking', 3],
];

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Skill interconnections</Heading>
                <p style={captionStyle}>
                    How reading, writing and math skills reinforce each other across tutoring sessions.
                </p>
                <DependencyWheel data={skillConnections} height={500} />
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
        height: 500,
        data: [
            ['Social-emotional', 'Relationship', 18],
            ['Social-emotional', 'Advocacy', 9],
            ['Mastering content', 'Technology tools', 12],
            ['Mastering content', 'Relationship', 7],
            ['Advocacy', 'Relationship', 11],
        ],
    },
};
