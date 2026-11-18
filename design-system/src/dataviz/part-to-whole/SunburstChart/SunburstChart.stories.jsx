import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import SunburstChart from './SunburstChart';

export default {
    title: 'Data visualizations/Part-to-whole/Sunburst chart',
    component: SunburstChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        data: { control: 'object', description: 'Hierarchical data { id, parent, name, value }' },
        height: { control: 'number', description: 'Chart height in pixels' },
        sort: { control: 'boolean', description: 'Sort sibling branches and leaves from most to least by default' },
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
    gap: 'var(--section-stack-md)',
};

const captionStyle = {
    margin: 0,
    color: 'var(--ds-text-subtle)',
};

const sessionData = {
    data: [
        { id: '0', parent: '', name: 'Sessions' },
        { id: '1', parent: '0', name: 'CMU' },
        { id: '2', parent: '0', name: 'Pitt' },
        { id: '3', parent: '0', name: 'Duquesne' },
        { id: '1.1', parent: '1', name: 'Lincoln Middle', value: 10 },
        { id: '1.2', parent: '1', name: 'Roosevelt K-8', value: 8 },
        { id: '1.3', parent: '1', name: 'Riverside Academy', value: 6 },
        { id: '2.1', parent: '2', name: 'North High', value: 9 },
        { id: '2.2', parent: '2', name: 'South High', value: 7 },
        { id: '2.3', parent: '2', name: 'Oakwood', value: 8 },
        { id: '3.1', parent: '3', name: 'Jefferson Elementary', value: 5 },
        { id: '3.2', parent: '3', name: 'Washington Middle', value: 7 },
        { id: '3.3', parent: '3', name: 'Eastside', value: 6 },
    ],
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="small">Session structure</Heading>
                <p style={captionStyle}>
                    Click an inner ring to drill into a university partner and its school sites.
                </p>
                <SunburstChart {...sessionData} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelectorAll('.highcharts-container').length).toBe(1);
        });
        for (const label of canvasElement.querySelectorAll('.highcharts-data-label text')) {
            if (!label.textContent?.trim()) continue;
            const style = getComputedStyle(label);
            expect(style.fontFamily).toContain('Noto Sans');
            expect(style.fontVariantNumeric).toBe('tabular-nums');
        }
    },
};

export const Interactive = {
    args: {
        height: 400,
        sort: true,
        data: [
            { id: 'root', parent: '', name: 'Lincoln Middle' },
            { id: 'math', parent: 'root', name: 'Math' },
            { id: 'reading', parent: 'root', name: 'Reading' },
            { id: 'g6-math', parent: 'math', name: 'Grade 6', value: 10 },
            { id: 'g7-math', parent: 'math', name: 'Grade 7', value: 15 },
            { id: 'g6-read', parent: 'reading', name: 'Grade 6', value: 20 },
            { id: 'g7-read', parent: 'reading', name: 'Grade 7', value: 10 },
        ],
    },
};
