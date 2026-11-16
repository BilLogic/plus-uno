import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
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
import { BRAND, CATEGORICAL, CHROME, hoveredColor } from '@/dataviz/palette';
import PlusChart from '@/dataviz/PlusChart';

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
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.css']);

/** @returns {string[]} every chart source file, skipping stories (demo-only, not a chart's own styling) and generated node_modules. */
const collectSourceFiles = (dir) => readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return collectSourceFiles(path);
    if (entry.endsWith('.stories.jsx') || entry.endsWith('.test.js')) return [];
    return SOURCE_EXTENSIONS.has(extname(entry)) ? [path] : [];
});

const files = collectSourceFiles(ROOT).map((path) => ({
    path,
    rel: path.slice(ROOT.length + 1).replace(/\\/g, '/'),
    text: readFileSync(path, 'utf8'),
}));

const stripComments = (source) =>
    source.replace(
        /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,
        (match, str) => (str ? str : match.replace(/[^\n]/g, ' ')),
    );

/**
 * Explicit allow-list of `relPath -> Set<trimmedLine>` for known token gaps
 * waiting on a product/design decision from Bill.
 */
const ALLOWED_SOURCE_LINES = new Map([
    [
        // BubbleChart keeps `fillOpacity: 0.7` so overlapping bubbles remain
        // legible: no data-mark opacity token exists yet (only
        // `--ds-opacity-disabled` at 0.4 and `--ds-opacity-loading` at 0.2).
        'correlation/BubbleChart/BubbleChart.jsx',
        new Set(['fillOpacity: 0.7']),
    ],
]);

const STATES_ALLOWED_FILES = new Set([
    'chartTheme.js',
    'PlusChart.jsx',
    'temporal/Sparkline/Sparkline.jsx',
]);

const HARD_BAN_LINE_RULES = [
    {
        id: 'eased-curve',
        pattern:
            /cubic-bezier\s*\(|\b(?:ease(?:-(?:in-out|in|out)|InOut|In|Out)?(?:Quad|Cubic|Quart|Quint|Sine|Expo|Circ|Back|Bounce|Elastic)?|swing)\b|\beasing\s*:\s*['"](?:linear|ease[^'"]*|swing)['"]|\btransition\s*:[^;\n'"]*\blinear\b/,
    },
    {
        id: 'animation-ms-or-removed-prop',
        pattern:
            /\b(?:animate|animationDelay|animationDuration|enableAnimation)\b|\b(?:transition|animation)\s*:[^;\n}]*\b[1-9]\d*(?:\.\d+)?(?:ms|s)\b|\b(?:duration|defer)\s*:\s*['"]?[1-9]\d*(?:\.\d+)?(?:ms|s)?['"]?/,
    },
    {
        id: 'banned-font-weight',
        pattern:
            /<b\b|<strong\b|\b(?:font-weight|fontWeight)\s*:\s*['"]?(?:bold|bolder|lighter|normal|[1-9]00)\b['"]?|--type-weight-(?!medium\b|semibold\b)[a-z0-9-]+/i,
    },
    {
        id: 'series-color-text',
        pattern:
            /style\s*=\s*["'][^"']*color\s*:\s*\{(?:series|point)\.color\}[^"']*["']\s*>\s*(?!●)|style\s*=\s*["'][^"']*color\s*:\s*\$\{(?!\s*(?:ink\b|inkFor\b))[^}]*(?:series|point|this)\.color\s*\}[^"']*["']\s*>\s*(?!●)|style\s*:\s*\{[^{}]*\bcolor\s*:\s*(?:['"]var\(--chart-[\w-]+\)['"]|\b(?:series|point)\.color\b)/,
    },
    {
        id: 'pixel-offset',
        pattern:
            /\b(?:pointWidth|offset|x|y|radius|distance|minSize|maxSize)\s*:\s*-?[1-9]\d*(?:\.\d+)?\b|\b(?:borderRadius|borderWidth|lineWidth|gridLineWidth|stemWidth|medianWidth|whiskerWidth|tickWidth|fontSize)\s*:\s*['"]?[1-9]\d*(?:\.\d+)?(?:px)?['"]?(?!%)|\bfont-size\s*:\s*\d+px\b|\bfillOpacity\s*:\s*0?\.\d+\b/,
    },
    {
        id: 'control-radius-on-non-control',
        pattern: /--radius-control-(?:sm|md|lg)\b|--(?:button|field|input|select|control)-radius\b/,
    },
];

function checkMissingTabularFigures(relPath, stripped) {
    const hits = [];
    const lines = stripped.split(/\r?\n/);
    lines.forEach((line, idx) => {
        if (
            /\b(?:fontVariantNumeric|font-variant-numeric)\s*:\s*['"]?(?!tabular-nums\b|TABULAR\b)[a-z-]+/i.test(line) ||
            /--type-family-code\b|\bmonospace\b/.test(line)
        ) {
            hits.push(`${relPath}:${idx + 1} [missing-tabular-figures] ${line.trim()}`);
        }
    });
    const slotPattern =
        /\b(?:labels\s*:\s*\{[^{}]*style|dataLabels\s*:\s*\{[^{}]*style|itemStyle|tooltip\s*:\s*\{[^{}]*style)\s*:\s*\{([^{}]*)\}/g;
    for (const match of stripped.matchAll(slotPattern)) {
        const body = match[1];
        const setsType = /\b(?:fontFamily|fontSize|fontWeight)\s*:/.test(body);
        const hasTabular =
            /\bfontVariantNumeric\s*:\s*(?:TABULAR\b|['"]tabular-nums['"])/.test(body) ||
            /\.\.\.(?:chartTheme|baseSeriesPlot|dataLabelsStyle)\b/.test(body);
        if (setsType && !hasTabular) {
            const lineNum = stripped.slice(0, match.index).split(/\r?\n/).length;
            hits.push(`${relPath}:${lineNum} [missing-tabular-figures] number slot style missing tabular-nums`);
        }
    }
    return hits;
}

function auditChartSource(relPath, rawText) {
    const stripped = stripComments(rawText);
    const allowedLines = ALLOWED_SOURCE_LINES.get(relPath);
    const findings = [];
    stripped.split(/\r?\n/).forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed || (allowedLines && allowedLines.has(trimmed))) return;
        for (const rule of HARD_BAN_LINE_RULES) {
            if (rule.pattern.test(line)) {
                findings.push(`${relPath}:${idx + 1} [${rule.id}] ${trimmed}`);
            }
        }
        if (!STATES_ALLOWED_FILES.has(relPath) && /\bstates\s*:/.test(line)) {
            findings.push(`${relPath}:${idx + 1} [pixel-offset] ${trimmed}`);
        }
    });
    findings.push(...checkMissingTabularFigures(relPath, stripped));
    return findings;
}

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

    it('clears Highcharts hardcoded 2000ms CSS data-label transition on packedbubble as a chartTheme type default with no per-type special case in PlusChart', () => {
        expect(chartTheme.plotOptions.packedbubble.dataLabels.style.transition).toBe('none');
        const plusChartSource = readFileSync(join(ROOT, 'PlusChart.jsx'), 'utf8');
        expect(plusChartSource).not.toContain('packedbubble');

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

    it('self-tests that every banned shape trips the hard-ban guard and clean code passes', () => {
        expect(auditChartSource('sample/Chart.jsx', "animation: { easing: 'easeOutQuad' }")).toEqual([
            expect.stringContaining('[eased-curve]'),
        ]);
        expect(auditChartSource('sample/Chart.css', 'transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);')).toEqual(
            expect.arrayContaining([expect.stringContaining('[eased-curve]')]),
        );
        expect(auditChartSource('sample/Chart.jsx', 'animation: { duration: 300, defer: 20 }')).toEqual([
            expect.stringContaining('[animation-ms-or-removed-prop]'),
        ]);
        expect(
            auditChartSource('sample/Chart.jsx', 'const Chart = ({ animate = true, animationDuration, enableAnimation }) => null;'),
        ).toEqual([expect.stringContaining('[animation-ms-or-removed-prop]')]);
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
        expect(auditChartSource('sample/Chart.jsx', "style: { fontWeight: 'var(--type-weight-regular)' }")).toEqual([
            expect.stringContaining('[banned-font-weight]'),
        ]);
        expect(
            auditChartSource('sample/Chart.jsx', 'pointFormat: `<span style="color:{series.color}">{series.name}</span>`'),
        ).toEqual([expect.stringContaining('[series-color-text]')]);
        expect(auditChartSource('sample/Chart.jsx', "style: { color: 'var(--chart-brand)' }")).toEqual([
            expect.stringContaining('[series-color-text]'),
        ]);
        expect(auditChartSource('sample/Chart.jsx', 'dataLabels: { y: -6, pointWidth: 24, radius: 4 }')).toEqual([
            expect.stringContaining('[pixel-offset]'),
        ]);
        expect(auditChartSource('sample/Chart.jsx', 'fillOpacity: 0.7')).toEqual([
            expect.stringContaining('[pixel-offset]'),
        ]);
        expect(auditChartSource('correlation/BubbleChart/BubbleChart.jsx', 'fillOpacity: 0.7')).toEqual([]);
        expect(auditChartSource('sample/Chart.jsx', "borderRadius: 'var(--radius-control-sm)'")).toEqual([
            expect.stringContaining('[control-radius-on-non-control]'),
        ]);
        expect(
            auditChartSource(
                'sample/Chart.jsx',
                "yAxis: { labels: { style: { fontFamily: 'var(--type-family-body)', fontSize: 'var(--type-size-075)' } } }",
            ),
        ).toEqual([expect.stringContaining('[missing-tabular-figures]')]);
        expect(
            auditChartSource('sample/Chart.jsx', "style: { fontVariantNumeric: 'normal', fontFamily: 'monospace' }"),
        ).toEqual([expect.stringContaining('[missing-tabular-figures]')]);

        const cleanSample = `
            // Comments mentioning <b>, easeOutQuad, 200ms or animate are ignored.
            const options = {
                ...chartTheme,
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
        expect(inactive?.opacity).toBe(0.4);
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
