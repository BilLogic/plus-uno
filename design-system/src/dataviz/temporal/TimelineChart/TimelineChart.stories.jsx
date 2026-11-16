import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import TimelineChart from './TimelineChart';

export default {
    title: 'Data visualizations/Temporal/Timeline chart',
    component: TimelineChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        data: { control: 'object', description: 'Array of events { name, label, description, color }' },
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

const studentJourneyData = {
    data: [
        { name: 'Application', label: 'Application submitted', description: 'Student applied for tutoring' },
        { name: 'Assessment', label: 'Initial assessment', description: 'Baseline skills evaluated' },
        { name: 'Enrollment', label: 'Course enrolled', description: 'Started learning path' },
        { name: 'Midterm', label: 'Midterm review', description: 'Progress checkpoint' },
        { name: 'Completion', label: 'Course completed', description: 'Certification earned' },
    ],
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="small">Student learning journey</Heading>
                <p style={captionStyle}>
                    Milestones in chronological order from application through completion.
                </p>
                <TimelineChart {...studentJourneyData} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelector('.highcharts-container')).not.toBeNull();
            expect(canvasElement.querySelectorAll('.plus-chart-value').length).toBeGreaterThan(0);
        });
        for (const valueNode of canvasElement.querySelectorAll('.plus-chart-value')) {
            const style = getComputedStyle(valueNode);
            expect(style.fontFamily).toContain('Noto Sans');
            expect(style.fontWeight).toBe('600');
        }
    },
};

export const Interactive = {
    args: {
        data: [
            { name: 'Step 1', label: 'Start', description: 'Beginning' },
            { name: 'Step 2', label: 'Middle', description: 'In progress' },
            { name: 'Step 3', label: 'End', description: 'Complete' },
        ],
        height: 400,
    },
};
