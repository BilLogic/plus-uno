import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import OrganizationChart from './OrganizationChart';

export default {
    title: 'Data visualizations/Flow & relationships/Organization chart',
    component: OrganizationChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        data: { control: 'object', description: 'Array of [manager, report] pairs' },
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

const programStructure = [
    ['Program Director', 'Math Lead'],
    ['Program Director', 'Literacy Lead'],
    ['Program Director', 'Operations Lead'],
    ['Math Lead', 'Lincoln Middle Cohort'],
    ['Math Lead', 'Roosevelt K-8 Cohort'],
    ['Literacy Lead', 'Reading Intervention'],
    ['Operations Lead', 'Tutor Onboarding'],
    ['Operations Lead', 'School Partnerships'],
];

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Program supervision structure</Heading>
                <p style={captionStyle}>
                    Reporting lines from program leadership to school and subject cohorts, colored by tree depth.
                </p>
                <OrganizationChart data={programStructure} height={500} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelectorAll('.highcharts-container .highcharts-series').length).toBeGreaterThanOrEqual(1);
        });
        for (const node of canvasElement.querySelectorAll('.highcharts-container text, .highcharts-container tspan, .highcharts-data-labels span')) {
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
            ['Program Director', 'Lead Tutor, Math'],
            ['Program Director', 'Lead Tutor, Reading'],
            ['Lead Tutor, Math', 'Priya S.'],
            ['Lead Tutor, Math', 'Marcus T.'],
        ],
        height: 500,
    },
};
