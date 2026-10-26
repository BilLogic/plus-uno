import React from 'react';
import { expect, waitFor } from 'storybook/test';
import Sparkline, { SPARKLINE_TONES } from './Sparkline';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';

export default {
    title: 'Data visualizations/Temporal/Sparkline',
    component: Sparkline,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: `## Sparkline

A sparkline is a word-sized line chart: the shape of a trend, beside the number it belongs to.

### When to Use

| Use Case | Recommendation |
|----------|----------------|
| A trend beside a KPI or stat | ✅ Ideal |
| Many small trends in a table row | ✅ Good |
| Reading exact values | ❌ Use Line Chart |
| Comparing several series | ❌ Use Line Chart |

### How to Use

**Best Practices:**
✅ Put the current value beside it, in text
✅ Keep the brand color unless the trend means a status
✅ Name it with \`label\` for screen readers

**Avoid:**
❌ More than one line
❌ Axes, grids or legends
`
            }
        }
    },
    argTypes: {
        data: { control: 'object', description: 'Values, oldest first' },
        categories: { control: 'object', description: 'A label per value, shown in the tooltip' },
        label: { control: 'text', description: 'What the line shows' },
        tone: { control: 'select', options: Object.keys(SPARKLINE_TONES), description: 'Brand, or a status' },
        width: { control: 'number', description: 'Width in pixels' },
        height: { control: 'number', description: 'Height in pixels' },
        showLastPoint: { control: 'boolean', description: 'Mark the latest value' },
        valueSuffix: { control: 'text', description: 'Text after each value in the tooltip' }
    }
};

const sessions = ['Sep 1–5', 'Sep 8–12', 'Sep 15–19', 'Sep 22–26', 'Sep 29–Oct 3', 'Oct 6–10', 'Oct 13–17'];

const row = { display: 'flex', alignItems: 'center', gap: 'var(--size-element-gap-lg)' };
const value = { fontFamily: 'var(--font-family-header)', fontSize: 'var(--font-size-h4)', fontWeight: 'var(--font-weight-headline)', color: 'var(--ds-text)' };
const caption = { color: 'var(--ds-text-subtle)', fontSize: 'var(--font-size-body3)' };

/**
 * Overview: a sparkline beside its number, and one per status
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
        <section>
            <h3 style={{ marginBottom: 'var(--size-element-gap-lg)', color: 'var(--ds-text)' }}>Beside a stat</h3>
            <div style={row}>
                <span style={value}>82%</span>
                <Sparkline label="Average score, last 7 weeks" data={[64, 70, 68, 74, 77, 79, 82]} categories={sessions} valueSuffix="%" />
                <span style={caption}>Average score, up 18 points</span>
            </div>
        </section>
        <section>
            <h3 style={{ marginBottom: 'var(--size-element-gap-lg)', color: 'var(--ds-text)' }}>Status tones</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-lg)' }}>
                {[
                    ['success', 'Attendance, on track', [80, 84, 83, 88, 90, 91, 93]],
                    ['warning', 'Missed sessions, at risk', [2, 3, 2, 4, 5, 5, 6]],
                    ['danger', 'Unanswered requests, off track', [1, 2, 4, 5, 7, 9, 12]],
                ].map(([tone, label, data]) => (
                    <div key={tone} style={row}>
                        <Sparkline tone={tone} label={label} data={data} categories={sessions} />
                        <span style={caption}>{label}</span>
                    </div>
                ))}
            </div>
        </section>
    </div>
);

/**
 * Interactive: Playground with property controls
 */
export const Interactive = {
    args: {
        label: 'Average score',
        data: [64, 70, 68, 74, 77, 79, 82],
        categories: sessions,
        tone: 'brand',
        width: 120,
        height: 32,
        showLastPoint: true,
        valueSuffix: '%'
    }
};

/** In every color mode, the line is its tone's chart token, and the latest value is marked. */
export const ColorModes = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-lg)' }}>
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
                .toBe(tokenColor(canvasElement, '--ds-chart-brand'));
            await expect(getComputedStyle(danger.querySelector('.highcharts-graph')).stroke, `${mode}: danger line`)
                .toBe(tokenColor(canvasElement, '--ds-chart-danger'));
        });
    },
};
