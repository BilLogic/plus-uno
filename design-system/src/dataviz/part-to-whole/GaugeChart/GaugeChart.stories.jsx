import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import { STATUS } from '@/dataviz/palette';
import GaugeChart from './GaugeChart';

export default {
    title: 'Data visualizations/Part-to-whole/Gauge chart',
    component: GaugeChart,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        value: { control: { type: 'number', min: 0, max: 100 }, description: 'Current value' },
        min: { control: 'number', description: 'Minimum scale value' },
        max: { control: 'number', description: 'Maximum scale value' },
        label: { control: 'text', description: 'Label below value' },
        height: { control: 'number', description: 'Chart height in pixels' },
        color: { control: 'text', description: 'Gauge fill token; defaults to --chart-brand' },
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
    gap: 'var(--stack-xl)',
};

const rowStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(var(--field-width-md), 1fr))',
    gap: 'var(--stack-2xl) var(--inline-2xl)',
};

const captionStyle = {
    margin: 0,
    color: 'var(--ds-text-subtle)',
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Single measure and status gauges</Heading>
                <p style={captionStyle}>
                    A single measure uses the brand chart token by default; status tokens pair with a status label.
                </p>
                <div style={rowStyle}>
                    <GaugeChart value={75} label="Completion" />
                    <GaugeChart value={92} label="Accuracy (on track)" color={STATUS.success} />
                    <GaugeChart value={45} label="Engagement (needs attention)" color={STATUS.warning} />
                </div>
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelectorAll('.highcharts-container').length).toBe(3);
        });
        for (const container of canvasElement.querySelectorAll('.highcharts-container')) {
            const containerRect = container.getBoundingClientRect();
            const ticks = [...container.querySelectorAll('.highcharts-yaxis-labels text')];
            expect(ticks.map((t) => t.textContent?.trim())).toEqual(['0', '100']);
            for (const gridLine of container.querySelectorAll('.highcharts-grid-line')) {
                expect(gridLine.getAttribute('stroke-width')).toBe('0');
            }

            const readout = container.querySelector('.highcharts-data-label div');
            const readoutRect = readout.getBoundingClientRect();
            for (const tick of ticks) {
                const tickRect = tick.getBoundingClientRect();
                expect(tickRect.left).toBeGreaterThanOrEqual(containerRect.left);
                expect(tickRect.right).toBeLessThanOrEqual(containerRect.right);
                const overlapsReadout =
                    tickRect.left < readoutRect.right &&
                    tickRect.right > readoutRect.left &&
                    tickRect.top < readoutRect.bottom &&
                    tickRect.bottom > readoutRect.top;
                expect(overlapsReadout).toBe(false);
            }
        }
        for (const valueNode of canvasElement.querySelectorAll('.metric-md')) {
            const style = getComputedStyle(valueNode);
            expect(style.fontFamily).toContain('Noto Sans');
            expect(style.fontWeight).toBe('600');
            expect(style.fontVariantNumeric).toBe('tabular-nums');
        }
    },
};

export const Interactive = {
    args: {
        value: 65,
        min: 0,
        max: 100,
        label: 'Progress',
        height: 300,
    },
};
