import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { composite, contrast, parseColor, readTokens, resolveToken } from '@/lib/tokens.mjs';
import { CHROME } from './palette';
import chartTheme from './chartTheme';

/**
 * Chart text must read in both color modes. The theme names semantic text
 * tokens; this resolves each to its real value in the light and dark blocks of
 * the generated stylesheet and holds it to WCAG AA (4.5:1) on the surfaces a
 * chart sits on, and walks the chart sources for ink that bypasses the tokens.
 */
const tokens = resolve(__dirname, '../tokens/color');
const palette = readTokens(readFileSync(join(tokens, '_palette.scss'), 'utf8'));
const semantic = readFileSync(join(tokens, '_semantic.scss'), 'utf8');

const block = (opener) => {
    const start = semantic.indexOf(opener);
    const end = semantic.indexOf(`${String.fromCharCode(10)}}`, start);
    return readTokens(semantic.slice(start, end));
};
const MODES = { light: block(':root,'), dark: block('[data-color-mode="dark"] {') };

const named = (value) => value.match(/^var\((--[\w-]+)\)$/)[1];
const resolved = (mode, token) => {
    const values = new Map([...palette, ...MODES[mode]]);
    return parseColor(resolveToken(token, values));
};

/** Chart text sits on the page, a card (both `--ds-surface`) or the tooltip's overlay. */
const GROUNDS = ['--ds-surface', '--ds-surface-overlay'];
const TEXT = ['text', 'textSubtle', 'textSubtlest'];

describe('chart text contrast', () => {
    for (const mode of Object.keys(MODES)) {
        for (const ground of GROUNDS) {
            for (const key of TEXT) {
                it(`${key} reads at 4.5:1 on ${ground} in ${mode}`, () => {
                    const bg = resolved(mode, ground);
                    const fg = composite(resolved(mode, named(CHROME[key])), bg);
                    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
                });
            }
        }
    }

    it('draws grid and axis lines with the border token', () => {
        expect(named(CHROME.grid)).toBe('--ds-border');
        expect(named(CHROME.axis)).toBe('--ds-border');
        for (const axis of [chartTheme.xAxis, chartTheme.yAxis]) {
            expect([axis.gridLineColor, axis.lineColor, axis.tickColor]).toEqual([CHROME.grid, CHROME.axis, CHROME.axis]);
        }
    });

    it('sets every theme text color from a semantic text token', () => {
        const inks = [
            chartTheme.chart.style.color, chartTheme.title.style.color, chartTheme.subtitle.style.color,
            chartTheme.caption.style.color, chartTheme.xAxis.labels.style.color, chartTheme.yAxis.labels.style.color,
            chartTheme.xAxis.title.style.color, chartTheme.yAxis.title.style.color,
            chartTheme.legend.itemStyle.color, chartTheme.legend.itemHoverStyle.color,
            chartTheme.plotOptions.series.dataLabels.style.color, chartTheme.tooltip.style.color,
            chartTheme.noData.style.color,
        ];
        for (const ink of inks) expect(ink).toMatch(/^var\(--ds-text(-subtle|-subtlest)?\)$/);
    });
});

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.css']);

const collect = (dir) =>
    readdirSync(dir).flatMap((entry) => {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) return collect(path);
        if (entry.endsWith('.stories.jsx') || entry.endsWith('.test.js')) return [];
        return SOURCE_EXTENSIONS.has(extname(entry)) ? [path] : [];
    });

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

describe('chart sources', () => {
    it('never inks text with a fixed color or the Highcharts auto-contrast outline', () => {
        const bad = /color:\s*['"](black|white|#[0-9a-f]{3,8})['"]|textOutline:\s*['"][^'"]*contrast/i;
        const offenders = collect(__dirname).filter((p) => bad.test(readFileSync(p, 'utf8')));
        expect(offenders).toEqual([]);
    });

    it('self-tests that every banned shape trips the hard-ban guard and clean code passes', () => {
        // 1. Eased curves and easing names
        expect(auditChartSource('sample/Chart.jsx', "animation: { easing: 'easeOutQuad' }")).toEqual([
            expect.stringContaining('[eased-curve]'),
        ]);
        expect(auditChartSource('sample/Chart.css', 'transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);')).toEqual(
            expect.arrayContaining([expect.stringContaining('[eased-curve]')]),
        );

        // 2. Animation millisecond literals and removed animation props
        expect(auditChartSource('sample/Chart.jsx', 'animation: { duration: 300, defer: 20 }')).toEqual([
            expect.stringContaining('[animation-ms-or-removed-prop]'),
        ]);
        expect(
            auditChartSource('sample/Chart.jsx', 'const Chart = ({ animate = true, animationDuration, enableAnimation }) => null;'),
        ).toEqual([expect.stringContaining('[animation-ms-or-removed-prop]')]);

        // 3. <b>, bold, numeric font weights, and weights other than 500 and 600
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

        // 4. Series-color text
        expect(
            auditChartSource('sample/Chart.jsx', 'pointFormat: `<span style="color:{series.color}">{series.name}</span>`'),
        ).toEqual([expect.stringContaining('[series-color-text]')]);
        expect(auditChartSource('sample/Chart.jsx', "style: { color: 'var(--chart-brand)' }")).toEqual([
            expect.stringContaining('[series-color-text]'),
        ]);

        // 5. Pixel offsets and un-allowlisted literal mark opacity
        expect(auditChartSource('sample/Chart.jsx', 'dataLabels: { y: -6, pointWidth: 24, radius: 4 }')).toEqual([
            expect.stringContaining('[pixel-offset]'),
        ]);
        expect(auditChartSource('sample/Chart.jsx', 'fillOpacity: 0.7')).toEqual([
            expect.stringContaining('[pixel-offset]'),
        ]);
        expect(auditChartSource('correlation/BubbleChart/BubbleChart.jsx', 'fillOpacity: 0.7')).toEqual([]);

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

        // Clean chart code passes
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

    it('enforces the hard ban on eased curves, ms literals, removed animation props, banned font weights, series-color text, pixel offsets, control radii and missing tabular figures across design-system/src/dataviz', () => {
        const offenders = collect(__dirname).flatMap((file) => {
            const rel = file.slice(__dirname.length + 1).replace(/\\/g, '/');
            return auditChartSource(rel, readFileSync(file, 'utf8'));
        });
        expect(offenders).toEqual([]);
    });
});
