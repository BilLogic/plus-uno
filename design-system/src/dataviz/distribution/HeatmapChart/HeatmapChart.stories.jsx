import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import { HUES } from '@/dataviz/palette';
import HeatmapChart from './HeatmapChart';

export default {
    title: 'Data visualizations/Distribution/Heatmap chart',
    component: HeatmapChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        height: { control: 'number' },
        hue: { control: 'select', options: HUES },
        diverging: { control: 'object' },
        xCategories: { control: 'object' },
        yCategories: { control: 'object' },
        data: { control: 'object' },
        min: { control: 'number' },
        max: { control: 'number' },
        showLegend: { control: 'boolean' },
        showDataLabels: { control: 'boolean' },
        compactSpacing: { control: 'boolean' },
        hideLegendNavigation: { control: 'boolean' },
        pointPadding: { control: 'number' },
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

const activityData = {
    xCategories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    yCategories: ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm'],
    data: [
        [0, 0, 12], [0, 1, 25], [0, 2, 42], [0, 3, 18], [0, 4, 35], [0, 5, 48], [0, 6, 30],
        [1, 0, 18], [1, 1, 32], [1, 2, 55], [1, 3, 22], [1, 4, 45], [1, 5, 52], [1, 6, 38],
        [2, 0, 15], [2, 1, 28], [2, 2, 48], [2, 3, 20], [2, 4, 40], [2, 5, 58], [2, 6, 35],
        [3, 0, 22], [3, 1, 38], [3, 2, 62], [3, 3, 25], [3, 4, 50], [3, 5, 65], [3, 6, 42],
        [4, 0, 10], [4, 1, 20], [4, 2, 35], [4, 3, 15], [4, 4, 30], [4, 5, 40], [4, 6, 25],
    ],
};

const masteryData = {
    xCategories: ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4'],
    yCategories: ['Grade 6', 'Grade 7', 'Grade 8'],
    data: [
        [0, 0, 92], [1, 0, 85], [2, 0, 78], [3, 0, 88],
        [0, 1, 75], [1, 1, 82], [2, 1, 90], [3, 1, 86],
        [0, 2, 68], [1, 2, 74], [2, 2, 80], [3, 2, 92],
    ],
};

const scoreChangeData = {
    xCategories: ['Q1', 'Q2', 'Q3', 'Q4'],
    yCategories: ['Algebra', 'Geometry', 'Reading'],
    data: [
        [0, 0, -8], [1, 0, -2], [2, 0, 4], [3, 0, 9],
        [0, 1, -5], [1, 1, 0], [2, 1, 3], [3, 1, 6],
        [0, 2, 2], [1, 2, 5], [2, 2, -3], [3, 2, -9],
    ],
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="small">Session activity by hour</Heading>
                <p style={captionStyle}>
                    Sequential blue ramp across five weekdays; the strongest step marks the busiest hour and cell labels use tabular figures.
                </p>
                <HeatmapChart {...activityData} height={350} />
            </section>

            <section style={sectionStyle}>
                <Heading as="h3" size="small">Topic mastery matrix</Heading>
                <p style={captionStyle}>
                    Sequential green ramp for mastery percentage across four units.
                </p>
                <HeatmapChart {...masteryData} hue="green" height={250} />
            </section>

            <section style={sectionStyle}>
                <Heading as="h3" size="small">Diverging ramp around zero</Heading>
                <p style={captionStyle}>
                    Two hues through neutral gray for values below and above a zero midpoint.
                </p>
                <HeatmapChart {...scoreChangeData} diverging={['orange', 'blue']} min={-10} max={10} height={250} />
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelectorAll('.highcharts-container').length).toBe(3);
        });
        for (const container of canvasElement.querySelectorAll('.highcharts-container')) {
            const containerRect = container.getBoundingClientRect();
            const plot = container.querySelector('.highcharts-plot-background');
            const legend = container.querySelector('.highcharts-legend');
            const symbol = container.querySelector('.highcharts-legend-item rect, .highcharts-legend-item path');
            expect(plot).not.toBeNull();
            expect(legend).not.toBeNull();
            expect(symbol).not.toBeNull();
            expect(container.querySelector('.highcharts-legend-navigation')).toBeNull();
            expect(legend.querySelector('[clip-path^="url("]')).toBeNull();
            const plotRect = plot.getBoundingClientRect();
            const legendRect = legend.getBoundingClientRect();
            const symbolRect = symbol.getBoundingClientRect();
            expect(legendRect.top).toBeGreaterThanOrEqual(containerRect.top);
            expect(legendRect.bottom).toBeLessThanOrEqual(containerRect.bottom);
            expect(legendRect.left).toBeGreaterThanOrEqual(containerRect.left);
            expect(legendRect.right).toBeLessThanOrEqual(containerRect.right);
            expect(symbolRect.height).toBeLessThanOrEqual(plotRect.height + 1);
            expect(symbolRect.top).toBeGreaterThanOrEqual(plotRect.top - 2);
            expect(symbolRect.bottom).toBeLessThanOrEqual(plotRect.bottom + 2);
            for (const tickLabel of container.querySelectorAll('.highcharts-coloraxis-labels text')) {
                const labelRect = tickLabel.getBoundingClientRect();
                expect(labelRect.top).toBeGreaterThanOrEqual(containerRect.top);
                expect(labelRect.bottom).toBeLessThanOrEqual(containerRect.bottom);
            }
            const plotMidY = (plotRect.top + plotRect.bottom) / 2;
            const legendMidY = (legendRect.top + legendRect.bottom) / 2;
            expect(Math.abs(legendMidY - plotMidY)).toBeLessThan(24);
        }
        const cellLabels = canvasElement.querySelectorAll('.highcharts-data-labels text, .highcharts-data-labels tspan');
        expect(cellLabels.length).toBeGreaterThan(0);
        for (const label of cellLabels) {
            if (!label.textContent?.trim()) continue;
            const style = getComputedStyle(label);
            expect(style.fontFamily).toContain('Noto Sans');
            expect(style.fontVariantNumeric).toBe('tabular-nums');
        }
    },
};

export const Interactive = {
    args: {
        xCategories: ['A', 'B', 'C', 'D'],
        yCategories: ['Row 1', 'Row 2', 'Row 3'],
        height: 300,
        hue: 'blue',
        data: [
            [0, 0, 10], [0, 1, 20], [0, 2, 30],
            [1, 0, 40], [1, 1, 50], [1, 2, 60],
            [2, 0, 70], [2, 1, 80], [2, 2, 90],
            [3, 0, 25], [3, 1, 45], [3, 2, 65],
        ],
    },
};
