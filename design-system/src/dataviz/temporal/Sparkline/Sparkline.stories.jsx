import React from 'react';
import { expect, waitFor } from 'storybook/test';
import { Heading } from '@/components';
import Sparkline, { SPARKLINE_TONES } from './Sparkline';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import { typeStyle } from '@/storybook-docs/lib/type-style.js';

export default {
    title: 'Data visualizations/Temporal/Sparkline',
    component: Sparkline,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        data: { control: 'object', description: 'Values, oldest first' },
        categories: { control: 'object', description: 'A label per value, shown in the tooltip' },
        label: { control: 'text', description: 'What the line shows' },
        tone: { control: 'select', options: Object.keys(SPARKLINE_TONES), description: 'Brand, or a status' },
        width: { control: 'number', description: 'Width in pixels' },
        height: { control: 'number', description: 'Height in pixels' },
        showLastPoint: { control: 'boolean', description: 'Mark the latest value' },
        valueSuffix: { control: 'text', description: 'Text after each value in the tooltip' },
    },
};

const sessions = ['Sep 1–5', 'Sep 8–12', 'Sep 15–19', 'Sep 22–26', 'Sep 29–Oct 3', 'Oct 6–10', 'Oct 13–17'];

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

const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--stack-lg)',
};

const valueStyle = {
    ...typeStyle('metric-sm'),
    fontVariantNumeric: 'tabular-nums',
    color: 'var(--ds-text)',
};

const captionStyle = {
    color: 'var(--ds-text-subtle)',
    ...typeStyle('body-sm'),
};

export const Overview = {
    render: () => (
        <div style={stackStyle}>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Beside a stat</Heading>
                <div style={rowStyle}>
                    <span style={valueStyle}>82%</span>
                    <Sparkline
                        label="Average score, last 7 weeks"
                        data={[64, 70, 68, 74, 77, 79, 82]}
                        categories={sessions}
                        valueSuffix="%"
                    />
                    <span style={captionStyle}>Average score, up 18 points</span>
                </div>
            </section>
            <section style={sectionStyle}>
                <Heading as="h3" size="sm">Status tones</Heading>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
                    {[
                        ['success', 'Attendance, on track', [80, 84, 83, 88, 90, 91, 93]],
                        ['warning', 'Missed sessions, at risk', [2, 3, 2, 4, 5, 5, 6]],
                        ['danger', 'Unanswered requests, off track', [1, 2, 4, 5, 7, 9, 12]],
                    ].map(([tone, label, data]) => (
                        <div key={tone} style={rowStyle}>
                            <Sparkline tone={tone} label={label} data={data} categories={sessions} />
                            <span style={captionStyle}>{label}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => {
            expect(canvasElement.querySelectorAll('.highcharts-container').length).toBe(4);
        });
    },
};

export const Interactive = {
    args: {
        label: 'Average score',
        data: [64, 70, 68, 74, 77, 79, 82],
        categories: sessions,
        tone: 'brand',
        width: 120,
        height: 32,
        showLastPoint: true,
        valueSuffix: '%',
    },
};

/** In every color mode, the line is its tone's chart token, and the latest value is marked. */
export const ColorModes = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
            <Sparkline label="Brand" data={[1, 3, 2, 4]} />
            <Sparkline label="Danger" tone="danger" data={[1, 3, 2, 4]} />
        </div>
    ),
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        await waitFor(() => expect(canvasElement.querySelectorAll('.highcharts-graph').length).toBe(2));
        const [brand, danger] = canvasElement.querySelectorAll('.highcharts-container');
        // Every point keeps a marker for focus and hover; at rest only the latest one has a size.
        const drawn = [...brand.querySelectorAll('.highcharts-point')].filter((p) => p.getBBox().width > 0);
        await expect(drawn.length, 'one marker, on the latest value').toBe(1);
        await expect(brand.querySelector('.highcharts-xaxis-labels'), 'no axis labels').toBeNull();
        await inEveryColorMode(async (mode) => {
            await expect(getComputedStyle(brand.querySelector('.highcharts-graph')).stroke, `${mode}: brand line`)
                .toBe(tokenColor(canvasElement, '--chart-brand'));
            await expect(getComputedStyle(danger.querySelector('.highcharts-graph')).stroke, `${mode}: danger line`)
                .toBe(tokenColor(canvasElement, '--chart-danger'));
        });
    },
};
