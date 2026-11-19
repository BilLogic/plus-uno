import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import VennDiagram from './VennDiagram';

export default {
    title: 'Data visualizations/Correlation/Venn diagram',
    component: VennDiagram,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        height: { control: 'number' },
        data: { control: 'object' },
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

const skillsData = [
    { sets: ['Math'], value: 5, name: 'Math' },
    { sets: ['Science'], value: 4, name: 'Science' },
    { sets: ['English'], value: 6, name: 'English' },
    { sets: ['Math', 'Science'], value: 3, name: 'Math & Science' },
    { sets: ['Math', 'English'], value: 2, name: 'Math & English' },
    { sets: ['Science', 'English'], value: 2, name: 'Science & English' },
    { sets: ['Math', 'Science', 'English'], value: 1, name: 'All three' },
];

const twoGroupData = [
    { sets: ['Tutoring'], value: 24, name: 'Tutoring' },
    { sets: ['Study hall'], value: 18, name: 'Study hall' },
    { sets: ['Tutoring', 'Study hall'], value: 9, name: 'Both programs' },
];

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Subject tutoring certifications</Heading>
                <p style={captionStyle}>
                    Three overlapping certification sets across tutoring subjects.
                </p>
                <VennDiagram data={skillsData} height={380} />
            </section>

            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Program participation overlap</Heading>
                <p style={captionStyle}>
                    Students enrolled in tutoring, study hall or both programs.
                </p>
                <VennDiagram data={twoGroupData} height={320} />
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
            expect(style.fontFamily).toContain('Noto Sans');
            expect(['500', '600']).toContain(style.fontWeight);
        }
    },
};

export const Interactive = {
    args: {
        data: [
            { sets: ['Math'], value: 120, name: 'Math tutoring' },
            { sets: ['Reading'], value: 96, name: 'Reading tutoring' },
            { sets: ['Math', 'Reading'], value: 42, name: 'Math and reading' },
        ],
        height: 400,
    },
};
