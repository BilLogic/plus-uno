import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import chartTheme, * as chartThemeModule from '@/dataviz/chartTheme';
import {
    BODY,
    CHART_BUBBLE_MAX_SIZE,
    CHART_BUBBLE_MIN_SIZE,
    CHART_MARKER_RADIUS,
    CHART_NODE_HEIGHT,
    CHART_NODE_RADIUS,
    CHART_RADAR_FILL_OPACITY,
    CHART_RANGE_FILL_OPACITY,
    MEDIUM,
    SEMIBOLD,
    TABULAR,
} from '@/dataviz/chartTheme';
import {
    CHART_VALUE_CLASS,
    dataLabelFormat,
    seriesSwatch,
    tooltipHeaderFormat,
    tooltipPointFormat,
    valueSpan,
} from '@/dataviz/chartFormat';
import {
    GUARD_RELATIVE_PATH,
    auditChartSource,
    collectChartSourceFiles,
} from '@/dataviz/lib/chartSourceGuard';
import { BRAND, CATEGORICAL, CHROME, hoveredColor } from '@/dataviz/palette';
import PlusChart from '@/dataviz/PlusChart';
import RadarChart from '@/dataviz/comparison/RadarChart/RadarChart';
import AreaRangeChart from '@/dataviz/temporal/AreaRangeChart/AreaRangeChart';

const capturedPlusChartOptions = [];

vi.mock('highcharts-react-official', () => ({
    default: React.forwardRef((props, ref) => {
        capturedPlusChartOptions.push(props.options);
        React.useImperativeHandle(ref, () => ({ container: { current: null }, chart: null }));
        return React.createElement('div', { 'data-testid': 'mock-hc' });
    }),
}));

/**
 * Every other foundation (spacing, radius, elevation, stroke, type, motion)
 * a chart draws with must come off the ladder, the same as the color work in
 * `palette.test.js`. This walks every chart source file
 * and fails on the literal shapes `design-system/guidelines/foundations/
 * data-visualization.md` rules out, so a new chart can't reintroduce them.
 */

const ROOT = __dirname;
const files = collectChartSourceFiles(ROOT);

/** A `var(--token, <literal>)` fallback: the exact pattern the data-viz foundations rule bans — a chart should trust the ladder, not carry a guess beside it. */
const FALLBACK_PATTERN = /var\(--[\w-]+,\s*['"]?-?[\d.]+(px|rem|%|ms|s)?['"]?\)/g;

/** A bare pixel literal on the properties the foundations rule names: radius, stroke width, font size, padding/spacing. Matches a plain non-zero number — zero needs no token, it draws no line at all. */
const LITERAL_PROPERTY_PATTERN = /\b(borderRadius|borderWidth|lineWidth|gridLineWidth|stemWidth|medianWidth|whiskerWidth|tickWidth|fontSize)\s*:\s*(['"]?[1-9])/g;

describe('data-viz foundations', () => {
    it('carries no old-ladder token names (--element-*, --size-element-*, --layout-*, --plus-*)', () => {
        const offenders = files.filter(({ text }) => /--element-|--size-element-|--layout-|--plus-/.test(text));
        expect(offenders.map((f) => f.path)).toEqual([]);
    });

    it('never pairs a token with a literal fallback value', () => {
        const offenders = files.flatMap(({ path, text }) =>
            [...text.matchAll(FALLBACK_PATTERN)].map((m) => `${path}: ${m[0]}`));
        expect(offenders).toEqual([]);
    });

    it('never hardcodes a radius, stroke width or font size where a token exists', () => {
        const offenders = files.flatMap(({ path, text }) =>
            [...text.matchAll(LITERAL_PROPERTY_PATTERN)]
                // `borderRadius: '50%'` is a genuine pill shape, not a design-token radius.
                .filter((m) => m[2] !== "'5" && m[2] !== '"5')
                .map((m) => `${path}: ${m[0]}`));
        expect(offenders).toEqual([]);
    });

    it('exports shared mark radius and size roles from chartTheme and keeps tokenNumber internal', async () => {
        expect(CHART_MARKER_RADIUS).toBe(3);
        expect(CHART_BUBBLE_MIN_SIZE).toBe(12);
        expect(CHART_BUBBLE_MAX_SIZE).toBe(48);
        expect(CHART_NODE_RADIUS).toBe(8);
        expect(CHART_NODE_HEIGHT).toBe(32);
        expect('tokenNumber' in chartThemeModule).toBe(false);

        document.documentElement.style.setProperty('--size-075', '16px');
        document.documentElement.style.setProperty('--size-300', '52px');
        document.documentElement.style.setProperty('--pad-x-md', '99px');
        document.documentElement.style.setProperty('--control-lg', '99px');
        try {
            vi.resetModules();
            const fresh = await import('@/dataviz/chartTheme');
            expect(fresh.CHART_MARKER_RADIUS).toBe(4);
            expect(fresh.CHART_BUBBLE_MIN_SIZE).toBe(16);
            expect(fresh.CHART_BUBBLE_MAX_SIZE).toBe(52);
        } finally {
            document.documentElement.style.removeProperty('--size-075');
            document.documentElement.style.removeProperty('--size-300');
            document.documentElement.style.removeProperty('--pad-x-md');
            document.documentElement.style.removeProperty('--control-lg');
        }
    });

    it('fills RadarChart and AreaRangeChart at --ds-opacity-chart-fill', () => {
        expect(CHART_RANGE_FILL_OPACITY).toBe(0.3);
        expect(CHART_RADAR_FILL_OPACITY).toBe(0.3);

        capturedPlusChartOptions.length = 0;
        render(
            React.createElement(RadarChart, {
                categories: ['Math', 'Reading', 'Writing'],
                series: [{ name: 'Cohort A', data: [72, 85, 79] }],
            }),
        );
        const radarOptions = capturedPlusChartOptions.at(-1);
        expect(radarOptions.plotOptions.area.fillOpacity).toBe(CHART_RADAR_FILL_OPACITY);

        capturedPlusChartOptions.length = 0;
        render(
            React.createElement(AreaRangeChart, {
                data: [[1, 50, 80], [2, 55, 84]],
            }),
        );
        const areaRangeOptions = capturedPlusChartOptions.at(-1);
        expect(areaRangeOptions.series[0].fillOpacity).toBe(CHART_RANGE_FILL_OPACITY);
    });

    it('clears Highcharts hardcoded 2000ms CSS data-label transition on packedbubble by spreading the shared series data-label style in chartTheme', () => {
        expect(chartTheme.plotOptions.packedbubble.dataLabels.style).toEqual({
            ...chartTheme.plotOptions.series.dataLabels.style,
            transition: 'none',
        });
        const plusChartSource = readFileSync(join(ROOT, 'PlusChart.jsx'), 'utf8');
        expect(plusChartSource).not.toContain('packedbubble');
        const storiesSource = readFileSync(join(ROOT, 'Foundations.stories.jsx'), 'utf8');
        expect(storiesSource).toContain("border: 'var(--border-width-default) solid var(--ds-border)'");

        capturedPlusChartOptions.length = 0;
        render(
            React.createElement(PlusChart, {
                options: {
                    ...chartTheme,
                    chart: { ...chartTheme.chart, type: 'packedbubble' },
                    plotOptions: {
                        packedbubble: {
                            dataLabels: {
                                ...chartTheme.plotOptions.packedbubble.dataLabels,
                                enabled: true,
                            },
                        },
                    },
                    series: [{ name: 'Group', data: [{ name: 'Item', value: 100 }] }],
                },
            }),
        );
        const merged = capturedPlusChartOptions.at(-1);
        expect(merged.plotOptions.packedbubble.dataLabels.style.transition).toBe('none');
    });

    it('skips lib/chartSourceGuard.js in collectChartSourceFiles and self-tests every banned shape and realistic clean code', () => {
        expect(files.some((f) => f.rel === GUARD_RELATIVE_PATH)).toBe(false);

        // 1. Eased curves: code shapes trip (`easing:` string, `cubic-bezier(`, CSS transition/animation ease-in/out, camelCase easeIn/easeOut)
        expect(auditChartSource('sample/Chart.jsx', "animation: { easing: 'swing' }")).toEqual([
            expect.stringContaining('[eased-curve]'),
        ]);
        expect(auditChartSource('sample/Chart.jsx', 'const curve = easeOutQuad;')).toEqual([
            expect.stringContaining('[eased-curve]'),
        ]);
        expect(auditChartSource('sample/Chart.css', 'transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);')).toEqual(
            expect.arrayContaining([expect.stringContaining('[eased-curve]')]),
        );
        expect(auditChartSource('sample/Chart.css', 'transition: opacity var(--dur) ease-in-out;')).toEqual([
            expect.stringContaining('[eased-curve]'),
        ]);

        // 2. Animation millisecond literals (`duration`, `defer`) and removed animation props (`animate:` key, `animate=` prop)
        expect(auditChartSource('sample/Chart.jsx', 'animation: { duration: 300 }')).toEqual([
            expect.stringContaining('[animation-ms-or-removed-prop]'),
        ]);
        expect(auditChartSource('sample/Chart.jsx', 'animation: { defer: 20 }')).toEqual([
            expect.stringContaining('[animation-ms-or-removed-prop]'),
        ]);
        expect(auditChartSource('sample/Chart.jsx', 'const opts = { animate: true };')).toEqual([
            expect.stringContaining('[animation-ms-or-removed-prop]'),
        ]);
        expect(auditChartSource('sample/Chart.jsx', 'const view = <BarChart animate={false} />;')).toEqual([
            expect.stringContaining('[animation-ms-or-removed-prop]'),
        ]);
        expect(
            auditChartSource('sample/Chart.jsx', 'const Chart = ({ animationDuration, enableAnimation }) => null;'),
        ).toEqual([expect.stringContaining('[animation-ms-or-removed-prop]')]);

        // 3. <b>, bold, numeric font weights (including 500 and 600 literals — tokens beat literals), and non-medium/semibold weight tokens
        expect(auditChartSource('sample/Chart.jsx', "pointFormat: '<b>{point.y}</b>'")).toEqual([
            expect.stringContaining('[banned-font-weight]'),
        ]);
        expect(auditChartSource('sample/Chart.jsx', "style: { fontWeight: 'bold' }")).toEqual([
            expect.stringContaining('[banned-font-weight]'),
        ]);
        expect(auditChartSource('sample/Chart.jsx', 'style: { fontWeight: 700 }')).toEqual([
            expect.stringContaining('[banned-font-weight]'),
        ]);
        expect(auditChartSource('sample/Chart.jsx', 'style: { fontWeight: 600 }')).toEqual([
            expect.stringContaining('[banned-font-weight]'),
        ]);
        expect(auditChartSource('sample/Chart.jsx', 'style: { fontWeight: 500 }')).toEqual([
            expect.stringContaining('[banned-font-weight]'),
        ]);
        expect(auditChartSource('sample/Chart.jsx', "style: { fontWeight: 'var(--type-weight-regular)' }")).toEqual([
            expect.stringContaining('[banned-font-weight]'),
        ]);

        // 4. Series-color text
        expect(
            auditChartSource('sample/Chart.jsx', 'pointFormat: `<span style="color:{series.color}">{series.name}</span>`'),
        ).toEqual([expect.stringContaining('[series-color-text]')]);
        expect(auditChartSource('sample/Chart.jsx', "style: { color: 'var(--chart-brand)' }")).toEqual([
            expect.stringContaining('[series-color-text]'),
        ]);

        // 5. Pixel offsets (including x/y inside dataLabels/labels/title), per-chart states:, and un-allowlisted literal mark opacity
        expect(auditChartSource('sample/Chart.jsx', 'dataLabels: { y: -6 }')).toEqual([
            expect.stringContaining('[pixel-offset]'),
        ]);
        expect(auditChartSource('sample/Chart.jsx', 'labels: { x: 4 }')).toEqual([
            expect.stringContaining('[pixel-offset]'),
        ]);
        expect(auditChartSource('sample/Chart.jsx', 'title: { text: null, y: 12 }')).toEqual([
            expect.stringContaining('[pixel-offset]'),
        ]);
        expect(auditChartSource('sample/Chart.jsx', 'series: [{ pointWidth: 24, marker: { radius: 4 } }]')).toEqual([
            expect.stringContaining('[pixel-offset]'),
        ]);
        expect(
            auditChartSource('sample/Chart.jsx', 'plotOptions: { series: { states: { hover: { enabled: false } } } }'),
        ).toEqual([expect.stringContaining('[pixel-offset]')]);
        expect(auditChartSource('sample/Chart.jsx', 'fillOpacity: 0.7')).toEqual([
            expect.stringContaining('[pixel-offset]'),
        ]);
        expect(auditChartSource('sample/Chart.jsx', 'export const CUSTOM_FILL_OPACITY = 0.5;')).toEqual([
            expect.stringContaining('[pixel-offset]'),
        ]);
        // No allow-list: a literal fill opacity is flagged even where the old ones lived.
        expect(auditChartSource('correlation/BubbleChart/BubbleChart.jsx', 'fillOpacity: 0.7')).toEqual([
            expect.stringContaining('[pixel-offset]'),
        ]);
        expect(auditChartSource('correlation/BubbleChart/BubbleChart.jsx', 'fillOpacity: CHART_OVERLAP_OPACITY')).toEqual([]);

        // 6. Control radii on non-controls
        expect(auditChartSource('sample/Chart.jsx', "borderRadius: 'var(--radius-control-sm)'")).toEqual([
            expect.stringContaining('[control-radius-on-non-control]'),
        ]);

        // 7. Missing tabular figures on number slots
        expect(
            auditChartSource(
                'sample/Chart.jsx',
                "yAxis: { labels: { style: { fontFamily: 'var(--type-family-body)', fontSize: 'var(--type-size-075)' } } }",
            ),
        ).toEqual([expect.stringContaining('[missing-tabular-figures]')]);
        expect(
            auditChartSource('sample/Chart.jsx', "style: { fontVariantNumeric: 'normal', fontFamily: 'monospace' }"),
        ).toEqual([expect.stringContaining('[missing-tabular-figures]')]);

        // Realistic clean chart code passes without false positives
        const cleanSample = `
            // Comments mentioning <b>, easeOutQuad, 200ms or animate are ignored.
            const animate = false;
            const meta = {
                tone: 'boldest',
                label: 'at ease',
                subtitle: 'Mood swing',
                note: 'animate',
            };
            const data = [{ x: 3, y: 5 }, { x: 'Mon', y: 3 }];
            const options = {
                ...chartTheme,
                series: [{ data }],
                yAxis: {
                    ...chartTheme.yAxis,
                    labels: {
                        style: {
                            ...chartTheme.yAxis.labels.style,
                            fontWeight: 'var(--type-weight-medium)',
                            fontVariantNumeric: 'tabular-nums',
                        },
                    },
                },
                tooltip: {
                    ...chartTheme.tooltip,
                    pointFormat: '<span style="color:{point.color}">●</span> <span class="plus-chart-value">{point.y}</span>',
                },
            };
        `;
        expect(auditChartSource('sample/CleanChart.jsx', cleanSample)).toEqual([]);
    });

    it('enforces the hard ban across every chart source file in design-system/src/dataviz', () => {
        const offenders = files.flatMap(({ rel, text }) => auditChartSource(rel, text));
        expect(offenders).toEqual([]);
    });

    it('every chart that sets a Highcharts tooltip spreads the shared theme tooltip', () => {
        const offenders = files.filter(({ path, text }) =>
            path.endsWith('.jsx') && !path.endsWith('chartTheme.js') &&
            /\btooltip:\s*{/.test(text) && !text.includes('chartTheme.tooltip'));
        expect(offenders.map((f) => f.path)).toEqual([]);
    });

    it('the shared chart theme, wrapper and motion module carry no eased curve name or animation millisecond literal', () => {
        for (const name of ['chartTheme.js', 'chartMotion.js', 'PlusChart.jsx']) {
            const text = readFileSync(join(ROOT, name), 'utf8');
            expect(text, `${name} eased curve`).not.toMatch(/\b(easeOut|easeIn|easeInOut|easeOutQuad|easeOutCubic|easeOutQuart|swing)\b|cubic-bezier\s*\(/);
            expect(text, `${name} ms literal`).not.toMatch(/\bduration\s*:\s*\d+/);
        }
    });

    it('no chart sets an animation millisecond literal; timing comes from the motion model', () => {
        const offenders = files.flatMap(({ path, text }) =>
            [...text.matchAll(/\bduration\s*:\s*\d+/g)].map((m) => `${path}: ${m[0]}`));
        expect(offenders).toEqual([]);
    });

    it('every Highcharts chart component renders through PlusChart rather than HighchartsReact directly', () => {
        const offenders = files.filter(({ path, text }) =>
            path.endsWith('.jsx') &&
            !path.endsWith('PlusChart.jsx') &&
            !path.endsWith('.stories.jsx') &&
            text.includes('HighchartsReact'),
        );
        expect(offenders.map((f) => f.path)).toEqual([]);
    });

    it('sets the Noto Sans body family token on chart.style and explicitly on every theme text slot', () => {
        expect(BODY).toBe('var(--type-family-body)');
        expect(MEDIUM).toBe('var(--type-weight-medium)');
        expect(SEMIBOLD).toBe('var(--type-weight-semibold)');
        expect(TABULAR).toBe('tabular-nums');

        const slots = {
            chart: chartTheme.chart?.style,
            title: chartTheme.title?.style,
            subtitle: chartTheme.subtitle?.style,
            caption: chartTheme.caption?.style,
            xAxisLabels: chartTheme.xAxis?.labels?.style,
            xAxisTitle: chartTheme.xAxis?.title?.style,
            yAxisLabels: chartTheme.yAxis?.labels?.style,
            yAxisTitle: chartTheme.yAxis?.title?.style,
            legendItem: chartTheme.legend?.itemStyle,
            dataLabels: chartTheme.plotOptions?.series?.dataLabels?.style,
            tooltip: chartTheme.tooltip?.style,
            noData: chartTheme.noData?.style,
        };
        for (const [slot, style] of Object.entries(slots)) {
            expect(style?.fontFamily, `${slot}.fontFamily`).toBe(BODY);
        }
    });

    it('uses only weights 500 (medium) and 600 (semibold) across theme text slots and kills Highcharts default data-label outline and bold', () => {
        const titleSlots = [
            chartTheme.title?.style,
            chartTheme.xAxis?.title?.style,
            chartTheme.yAxis?.title?.style,
        ];
        for (const style of titleSlots) {
            expect(style?.fontWeight).toBe(SEMIBOLD);
        }

        const labelSlots = [
            chartTheme.chart?.style,
            chartTheme.subtitle?.style,
            chartTheme.caption?.style,
            chartTheme.xAxis?.labels?.style,
            chartTheme.yAxis?.labels?.style,
            chartTheme.legend?.itemStyle,
            chartTheme.plotOptions?.series?.dataLabels?.style,
            chartTheme.tooltip?.style,
            chartTheme.noData?.style,
        ];
        for (const style of labelSlots) {
            expect(style?.fontWeight).toBe(MEDIUM);
        }

        expect(chartTheme.plotOptions?.series?.dataLabels?.style?.textOutline).toBe('none');
    });

    it('sets tabular-nums on every number slot in the theme and in chartTheme.css without a monospace font or leaky sibling selector', () => {
        const numberSlots = {
            xAxisLabels: chartTheme.xAxis?.labels?.style,
            yAxisLabels: chartTheme.yAxis?.labels?.style,
            dataLabels: chartTheme.plotOptions?.series?.dataLabels?.style,
            tooltip: chartTheme.tooltip?.style,
            legendItem: chartTheme.legend?.itemStyle,
        };
        for (const [slot, style] of Object.entries(numberSlots)) {
            expect(style?.fontVariantNumeric, `${slot}.fontVariantNumeric`).toBe(TABULAR);
            expect(style?.fontFamily, `${slot}.fontFamily`).not.toContain('code');
            expect(style?.fontFamily, `${slot}.fontFamily`).not.toContain('mono');
        }

        const css = readFileSync(join(ROOT, 'chartTheme.css'), 'utf8');
        expect(css).toContain('font-variant-numeric: tabular-nums');
        expect(css).toContain(`.${CHART_VALUE_CLASS}`);
        expect(css).not.toContain(':has(> .highcharts-container) ~ div');
    });

    it('formats values with a semibold tabular value span in chartFormat and keeps dataLabels.format unset in chartTheme so custom formatters survive', () => {
        expect(valueSpan('{point.y}')).toBe('<span class="plus-chart-value">{point.y}</span>');
        expect(valueSpan('{point.percentage:.1f}%')).toBe('<span class="plus-chart-value">{point.percentage:.1f}%</span>');

        expect(seriesSwatch()).toBe('<span style="color:{point.color}">●</span>');
        expect(tooltipHeaderFormat()).toBe('<span class="plus-chart-value">{point.key}</span><br/>');
        expect(tooltipPointFormat()).toBe(
            '<span style="color:{point.color}">●</span> {series.name}: <span class="plus-chart-value">{point.y}</span><br/>',
        );
        expect(dataLabelFormat()).toBe('<span class="plus-chart-value">{point.y}</span>');
        expect(dataLabelFormat('{point.percentage:.1f}%', '{point.name}')).toBe(
            '{point.name}: <span class="plus-chart-value">{point.percentage:.1f}%</span>',
        );

        expect(chartTheme.tooltip.pointFormat).toBe(tooltipPointFormat());
        expect(chartTheme.tooltip.headerFormat).toBe(tooltipHeaderFormat());
        expect(chartTheme.plotOptions.series.dataLabels.format).toBeUndefined();
        expect(chartTheme.tooltip.pointFormat).not.toContain('<b>');
        expect(chartTheme.tooltip.pointFormat).not.toMatch(/style="color:\{series\.color\}">[^●]/);

        // A chart with its own dataLabels.formatter (e.g. Heatmap cell label) keeps its own text
        // without being overridden by a theme-level `dataLabels.format`.
        capturedPlusChartOptions.length = 0;
        const heatmapFormatter = function heatmapCellFormatter() {
            return `<span style="color: var(--ds-text)">${this.point.value}</span>`;
        };
        render(
            React.createElement(PlusChart, {
                options: {
                    ...chartTheme,
                    chart: { ...chartTheme.chart, type: 'heatmap' },
                    series: [
                        {
                            name: 'Heatmap',
                            data: [[0, 0, 42]],
                            dataLabels: {
                                enabled: true,
                                formatter: heatmapFormatter,
                            },
                        },
                    ],
                },
            }),
        );
        const merged = capturedPlusChartOptions.at(-1);
        expect(merged.plotOptions.series.dataLabels.format).toBeUndefined();
        expect(merged.series[0].dataLabels.format).toBeUndefined();
        expect(merged.series[0].dataLabels.formatter).toBe(heatmapFormatter);
        expect(merged.series[0].dataLabels.formatter.call({ point: { value: 42 } })).toContain('42');
    });

    it('declares hover, inactive and select states cleanly and resolves -hovered tokens per series or point (including palette index)', () => {
        expect(hoveredColor(BRAND)).toBe('var(--chart-brand-hovered)');
        expect(hoveredColor(CATEGORICAL[0])).toBe('var(--chart-categorical-1-hovered)');
        expect(hoveredColor('var(--ds-background-brand-bold)')).toBe('var(--ds-background-brand-bold-hovered)');
        expect(hoveredColor('var(--ds-background-danger-bold)')).toBe('var(--ds-background-danger-bold-hovered)');
        expect(hoveredColor('var(--ds-background-neutral-subtle)')).toBe('var(--ds-background-neutral-subtle-hovered)');
        expect(hoveredColor('var(--ds-background-selected)')).toBe('var(--ds-background-selected-hovered)');
        expect(hoveredColor(CHROME.track)).toBeNull();
        expect(hoveredColor('var(--ds-background-neutral)')).toBeNull();
        expect(hoveredColor('var(--ds-background-accent-blue-subtler)')).toBeNull();
        expect(hoveredColor('var(--chart-grid-width)')).toBeNull();
        expect(hoveredColor('#123456')).toBeNull();

        const { hover, inactive, select } = chartTheme.plotOptions?.series?.states ?? {};
        expect(hover?.enabled).toBe(true);
        expect(hover?.color).toBeUndefined();
        expect(hover?.brightness).toBe(0);
        expect(hover?.animation?.duration).toBeGreaterThan(0);

        expect(inactive?.enabled).toBe(true);
        expect(inactive?.opacity).toBe(0.3);
        expect(inactive?.animation?.duration).toBeGreaterThan(0);

        expect(select?.enabled).toBe(true);
        expect(select?.color).toBe('var(--ds-background-selected)');
        expect(select?.borderColor).toBe('var(--ds-border-selected)');
        expect(select?.borderWidth).toBe(1);
        expect(select?.animation?.duration).toBeGreaterThan(0);

        // PlusChart resolves -hovered per series (including default palette index colors[i]) and per point.
        capturedPlusChartOptions.length = 0;
        render(
            React.createElement(PlusChart, {
                options: {
                    ...chartTheme,
                    series: [
                        { name: 'Default palette 0', data: [10, 20] },
                        { name: 'Default palette 1', data: [15, 25] },
                        {
                            name: 'Slices',
                            color: CHROME.track,
                            data: [
                                { name: 'Slice A', y: 40, color: CATEGORICAL[2] },
                                { name: 'Slice B', y: 60, color: CHROME.track },
                            ],
                        },
                    ],
                },
            }),
        );
        const merged = capturedPlusChartOptions.at(-1);
        expect(merged.series[0].states.hover.color).toBe('var(--chart-categorical-1-hovered)');
        expect(merged.series[1].states.hover.color).toBe('var(--chart-categorical-2-hovered)');
        expect(merged.series[2].states?.hover?.color).toBeUndefined();
        expect(merged.series[2].data[0].states.hover.color).toBe('var(--chart-categorical-3-hovered)');
        expect(merged.series[2].data[1].states).toBeUndefined();

        // A series colored by value takes no series hover color: it would paint
        // every heatmap cell one hue.
        render(
            React.createElement(PlusChart, {
                options: {
                    chart: { type: 'heatmap' },
                    colorAxis: { min: 0 },
                    series: [{ data: [[0, 0, 1], [0, 1, 2]] }],
                },
            }),
        );
        expect(capturedPlusChartOptions.at(-1).series[0].states?.hover?.color).toBeUndefined();

        const css = readFileSync(join(ROOT, 'chartTheme.css'), 'utf8');
        const highlightLines = css
            .split(/\r?\n/)
            .filter((line) => line.includes('--highcharts-highlight-color'));
        expect(highlightLines.length).toBeGreaterThan(0);
        for (const line of highlightLines) {
            expect(line).not.toContain('--chart-brand');
        }
    });
});
