import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import { HUES } from '@/dataviz/palette';
import TreemapChart from './TreemapChart';

export default {
    title: 'Data visualizations/Part-to-whole/Treemap chart',
    component: TreemapChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        data: { control: 'object', description: 'Array of { name, value, color? } objects' },
        height: { control: 'number', description: 'Chart height in pixels' },
        colorByPoint: { control: 'boolean', description: 'Unique categorical color per tile; false shades along one hue ramp' },
        hue: { control: { type: 'select', options: HUES }, description: 'Sequential ramp hue when colorByPoint is false' },
        sort: { control: 'boolean', description: 'Sort tiles from most to least by default' },
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

const subjectHoursData = {
    data: [
        { name: 'Reading', value: 860 },
        { name: 'Math', value: 1240 },
        { name: 'Science', value: 520 },
        { name: 'Writing', value: 310 },
        { name: 'Other', value: 140 },
    ],
};

const rampData = {
    colorByPoint: false,
    hue: 'blue',
    height: 300,
    data: [
        { name: 'Lincoln Middle', value: 450 },
        { name: 'Roosevelt K-8', value: 300 },
        { name: 'North High', value: 210 },
        { name: 'South High', value: 150 },
        { name: 'Oakwood', value: 90 },
        { name: 'Riverside', value: 60 },
        { name: 'Eastside', value: 40 },
    ],
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Categorical breakdown</Heading>
                <p style={captionStyle}>
                    Tiles sort from largest to smallest and take the categorical palette in order.
                </p>
                <TreemapChart {...subjectHoursData} />
            </section>

            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Sequential ramp</Heading>
                <p style={captionStyle}>
                    Past six tiles, {'colorByPoint={false}'} shades one hue ramp with the darkest tone on the largest tile.
                </p>
                <TreemapChart {...rampData} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelectorAll('.highcharts-container').length).toBe(2);
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
        colorByPoint: true,
        hue: 'blue',
        sort: true,
        data: [
            { name: 'Lincoln Middle', value: 100 },
            { name: 'Roosevelt K-8', value: 80 },
            { name: 'North High', value: 60 },
            { name: 'Oakwood Elementary', value: 40 },
            { name: 'South High', value: 20 },
        ],
    },
};
