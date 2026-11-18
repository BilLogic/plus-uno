import React from 'react';
import { expect, waitFor } from 'storybook/test';
import Highcharts from '@/dataviz/highchartsModules';
import {
    BarChart,
    DonutChart,
    GaugeChart,
    HeatmapChart,
    LineChart,
    PieChart,
    Sparkline,
    StackedBarChart,
    WaterfallChart,
    chartPalette,
} from '@/components';
import { ChartMotionArea } from '@/dataviz/chartMotion';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';

const { BRAND, CATEGORICAL, CHROME, HUES, NEUTRAL, SMART, STATUS, divergingRamp, sequentialRamp } = chartPalette;

/**
 * One of each chart family the theme dresses, so a check can hold every one of
 * them to the tokens in every color mode, and axe can read them in dark.
 */
const heading = { color: 'var(--ds-text)', fontSize: 'var(--type-size-125)' };
const heat = [[0, 0, 4], [0, 1, 18], [1, 0, 30], [1, 1, 52], [2, 0, 61], [2, 1, 90]];

/** Every chart's playground story, with the args its docs page shows. */
const PLAYGROUNDS = Object.entries(import.meta.glob('./*/*/*.stories.jsx', { eager: true }))
    .map(([path, mod]) => ({ name: path.split('/').at(-2), mod }))
    .sort((a, b) => a.name.localeCompare(b.name));

const Playground = ({ mod }) => {
    const story = mod.Interactive;
    const args = { ...mod.default.args, ...story.args };
    const Component = mod.default.component;
    return story.render ? story.render(args) : <Component {...args} />;
};

const Gallery = () => (
    <ChartMotionArea>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--stack-xl) var(--inline-xl)', color: 'var(--ds-text)' }}>
            <section data-chart="bar">
                <h3 style={heading}>Bar, two series</h3>
                <BarChart height={220} categories={['Grade 6', 'Grade 7', 'Grade 8']} series={[{ name: 'This term', data: [45, 72, 58] }, { name: 'Last term', data: [32, 55, 48] }]} />
            </section>
            <section data-chart="line">
                <h3 style={heading}>Line, one series</h3>
                <LineChart height={220} data={[{ name: 'Average score', data: [60, 66, 71, 74], categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'] }]} />
            </section>
            <section data-chart="stacked">
                <h3 style={heading}>Stacked bar</h3>
                <StackedBarChart height={220} dates={['Mon', 'Tue']} data={[
                    { segments: [{ value: '10', height: '20' }, { value: '40', height: '80' }] },
                    { segments: [{ value: '30', height: '60' }, { value: '20', height: '40' }] },
                ]} />
            </section>
            <section data-chart="pie">
                <h3 style={heading}>Pie</h3>
                <PieChart height={220} data={[{ name: 'Lincoln Middle', y: 40 }, { name: 'Roosevelt K-8', y: 30 }, { name: 'North High', y: 20 }, { name: 'Other', y: 10 }]} />
            </section>
            <section data-chart="donut">
                <h3 style={heading}>Donut</h3>
                <DonutChart size={180} value="75%" label="Completed" segments={[{ value: 75, color: BRAND, label: 'Done' }, { value: 25, color: CHROME.track, label: 'Remaining' }]} />
            </section>
            <section data-chart="gauge">
                <h3 style={heading}>Gauge</h3>
                <GaugeChart height={220} value={82} label="Attendance" />
            </section>
            <section data-chart="waterfall">
                <h3 style={heading}>Waterfall</h3>
                <WaterfallChart height={220} categories={['Start', 'Gained', 'Lost', 'End']} data={[{ y: 100, color: BRAND }, 40, -25, { isSum: true, color: BRAND }]} />
            </section>
            <section data-chart="heatmap">
                <h3 style={heading}>Heatmap</h3>
                <HeatmapChart height={220} xCategories={['Mon', 'Tue', 'Wed']} yCategories={['AM', 'PM']} data={heat} showLegend={false} />
            </section>
            <section data-chart="diverging">
                <h3 style={heading}>Heatmap, diverging</h3>
                <HeatmapChart height={220} xCategories={['Mon', 'Tue', 'Wed']} yCategories={['AM', 'PM']} data={heat} diverging={['orange', 'blue']} showLegend={false} />
            </section>
            <section data-chart="sparkline">
                <h3 style={heading}>Sparkline</h3>
                <Sparkline label="Average score" data={[60, 66, 71, 74]} />
            </section>
            {PLAYGROUNDS.map(({ name, mod }) => (
                <section key={name} data-chart={name}>
                    <h3 style={heading}>{name}</h3>
                    <Playground mod={mod} />
                </section>
            ))}
        </div>
    </ChartMotionArea>
);

export default {
    title: 'Data visualizations/Chart colors',
    tags: ['!dev', '!autodocs'],
    parameters: { docs: { disable: true } },
};

/** Every mark color a chart may draw, by token name. */
const markTokens = () => {
    const name = (value) => value.match(/^var\((--[\w-]+)\)$/)[1];
    return [
        ...CATEGORICAL, BRAND, NEUTRAL, ...Object.values(STATUS), ...Object.values(SMART),
        CHROME.track, CHROME.separator, CHROME.grid, CHROME.link,
        ...['bold', 'bolder', 'boldest'].map((e) => `var(--chart-gray-${e})`),
    ].map(name).concat(HUES.flatMap((h) => sequentialRamp(h)));
};
/** Charts whose fills a color axis interpolates between ramp stops; their ends are checked instead. */
const INTERPOLATED = new Set(['heatmap', 'diverging', 'HeatmapChart']);
const INK_TOKENS = ['--ds-text', '--ds-text-subtle', '--ds-text-subtlest', '--ds-text-inverse', '--ds-text-disabled'];

/**
 * A color as rgb channels. Highcharts mixes the stops of a solid gauge with
 * `color-mix()`, which computes to `color(srgb …)` rather than `rgb()`.
 */
const channels = (color) => {
    const srgb = color.match(/^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)/);
    if (srgb) return srgb.slice(1, 4).map((c) => Math.round(Number(c) * 255));
    return (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
};
const key = (color) => channels(color).join(',');

const isPainted = (value) => value && value !== 'none' && !/rgba\(0, 0, 0, 0\)/.test(value);

/** The fills and strokes a chart's marks compute to, and where each came from. */
const markPaints = (container) => [...container.querySelectorAll('.highcharts-series .highcharts-point, .highcharts-series .highcharts-graph')]
    // A group only passes its inherited paint on; the shapes inside it are what draw.
    .filter((el) => el instanceof SVGGeometryElement)
    .flatMap((el) => {
        const style = getComputedStyle(el);
        const paints = [];
        if (isPainted(style.fill)) paints.push(['fill', style.fill]);
        if (isPainted(style.stroke) && parseFloat(style.strokeWidth) > 0) paints.push(['stroke', style.stroke]);
        return paints;
    });

const rendered = async (canvasElement) => {
    await waitFor(() => {
        for (const section of canvasElement.querySelectorAll('[data-chart]')) {
            expect(section.querySelector('.highcharts-series, svg path'), section.dataset.chart).not.toBeNull();
        }
    });
};

/**
 * In every color mode, each chart draws only chart tokens: series, separators and tracks are
 * `--chart-*` or the chrome tokens, axis labels are text tokens and grid lines are the border.
 * A heatmap's ends are its ramp's ends.
 */
export const EveryChartInEveryMode = {
    render: () => <Gallery />,
    play: async ({ canvasElement }) => {
        await rendered(canvasElement);
        // Every stray paint, in every mode, so one run names them all.
        const strays = [];
        await inEveryColorMode(async (mode) => {
            const allowed = new Set(markTokens().map((t) => key(tokenColor(canvasElement, t))));
            const inks = new Set(INK_TOKENS.map((t) => tokenColor(canvasElement, t)));
            const border = tokenColor(canvasElement, '--ds-border');
            for (const section of canvasElement.querySelectorAll('[data-chart]')) {
                const chart = section.dataset.chart;
                const container = section.querySelector('.highcharts-container');
                if (!container) continue; // the donut draws its own SVG
                if (!INTERPOLATED.has(chart)) {
                    for (const [what, paint] of markPaints(container)) {
                        if (!allowed.has(key(paint))) strays.push(`${mode}: ${chart} mark ${what} ${paint}`);
                    }
                }
                for (const label of container.querySelectorAll('.highcharts-axis-labels text, .highcharts-legend-item text')) {
                    if (!inks.has(getComputedStyle(label).fill)) strays.push(`${mode}: ${chart} label ${getComputedStyle(label).fill}`);
                }
                // A color axis's ticks are separators on its gradient, not grid lines.
                for (const line of container.querySelectorAll('.highcharts-grid:not(.highcharts-coloraxis-grid) .highcharts-grid-line')) {
                    if (getComputedStyle(line).stroke !== border) strays.push(`${mode}: ${chart} grid line ${getComputedStyle(line).stroke}`);
                }
            }
            // A heatmap resolves its ramp when the mode changes, so its cells settle a render later.
            // The ramp's colors are read first: a probe inside waitFor is a DOM change, which re-runs it.
            const fills = (chart) => [...canvasElement.querySelectorAll(`[data-chart="${chart}"] .highcharts-heatmap-series .highcharts-point`)]
                .map((c) => getComputedStyle(c).fill);
            for (const [chart, ramp] of [['heatmap', sequentialRamp('blue')], ['diverging', divergingRamp('orange', 'blue')]]) {
                const [rampLow, rampHigh] = [ramp[0], ramp.at(-1)].map((t) => tokenColor(canvasElement, t));
                await waitFor(() => {
                    const cells = fills(chart);
                    expect(cells[0], `${mode}: ${chart} lowest cell is the ramp's start`).toBe(rampLow);
                    expect(cells.at(-1), `${mode}: ${chart} highest cell is the ramp's end`).toBe(rampHigh);
                });
            }
        });
        await expect([...new Set(strays)], 'paints that are not chart, text or border tokens').toEqual([]);

        // Type & numbers: every chart text node renders in Noto Sans
        // (never a system-font fallback), weights are 500 or 600 only,
        // and number slots compute tabular-nums.
        const typeStrays = [];
        for (const section of canvasElement.querySelectorAll('[data-chart]')) {
            const chart = section.dataset.chart;
            const container = section.querySelector('.highcharts-container');
            if (!container) continue;

            const textNodes = container.querySelectorAll(
                'text, tspan, .highcharts-data-label span, .highcharts-data-labels span, .plus-chart-value',
            );
            for (const node of textNodes) {
                if (!node.textContent?.trim()) continue;
                const style = getComputedStyle(node);
                if (
                    !style.fontFamily.includes('Noto Sans') ||
                    style.fontFamily.includes('-apple-system') ||
                    style.fontFamily.includes('BlinkMacSystemFont')
                ) {
                    typeStrays.push(`${chart} family: ${style.fontFamily}`);
                }
                if (style.fontWeight === '700' || style.fontWeight === '300' || !['500', '600'].includes(style.fontWeight)) {
                    typeStrays.push(`${chart} weight: ${style.fontWeight} (${node.textContent.trim()})`);
                }
            }

            const numberNodes = container.querySelectorAll(
                '.highcharts-axis-labels text, .highcharts-data-label text, .highcharts-data-labels text, .highcharts-data-labels span, .highcharts-legend-item text, .plus-chart-value',
            );
            for (const node of numberNodes) {
                if (!node.textContent?.trim()) continue;
                const style = getComputedStyle(node);
                if (style.fontVariantNumeric !== 'tabular-nums') {
                    typeStrays.push(`${chart} tabular: ${style.fontVariantNumeric}`);
                }
            }
        }
        await expect([...new Set(typeStrays)], 'chart text family, weight or tabular-nums strays').toEqual([]);

        // States: selecting a point uses --ds-background-selected + --ds-border-selected, never --chart-brand.
        const pieContainer = canvasElement.querySelector('[data-chart="pie"] .highcharts-container');
        const pieChart = Highcharts.charts.find((c) => c && c.container === pieContainer);
        expect(pieChart, 'pie chart instance').toBeDefined();
        const slice = pieChart.series[0].points[0];
        slice.select(true, false);
        try {
            const sliceStyle = getComputedStyle(slice.graphic.element);
            const selectedFill = tokenColor(canvasElement, '--ds-background-selected');
            const selectedBorder = tokenColor(canvasElement, '--ds-border-selected');
            const brandFill = tokenColor(canvasElement, '--chart-brand');
            expect(sliceStyle.fill).toBe(selectedFill);
            expect(sliceStyle.fill).not.toBe(brandFill);
            expect(sliceStyle.stroke).toBe(selectedBorder);
        } finally {
            slice.select(false, false);
        }
    },
};

/** The same charts in dark, so the accessibility check reads them on the dark surface. */
export const Dark = {
    render: () => <Gallery />,
    globals: { plusColorMode: 'dark' },
    play: async ({ canvasElement }) => {
        await rendered(canvasElement);
        await expect(document.documentElement.getAttribute('data-color-mode')).toBe('dark');
    },
};
