/**
 * The Highcharts theme every chart spreads.
 *
 * Data marks wear chart tokens and chrome wears text and border tokens, as
 * Atlassian's data-visualization guidance splits them (palette.js says which
 * token does which job): series take `--ds-chart-categorical-*` in order,
 * tick labels `--ds-text-subtle`, titles, legends and tooltips `--ds-text`,
 * grid lines and axes `--ds-border`. No value carries a fallback: the tokens
 * resolve in every color mode, so a chart follows light, dark and increased
 * contrast with no code of its own. The Highcharts defaults this theme does not
 * set are pointed at the same tokens in `chartTheme.css`.
 *
 * Every other foundation (spacing, radius, elevation, stroke, type, motion)
 * takes the same component tokens as the rest of the design system — Atlassian's
 * chart guidance is color-only, so there is no chart-specific precedent to
 * follow for the rest. The chart container is a Card, so `chart.spacing` reads
 * `--card-pad-compact` (the density this component already rendered at: 16px,
 * component tokens defined in `chartTheme.css`). The tooltip is a floating
 * layer, so it takes the Popup pattern's surface, overlay shadow and radius —
 * via `useHTML`, since Highcharts' native SVG tooltip can only draw its own
 * filter-based shadow, not a design-system shadow token; the CSS lives beside
 * the other chart-only tokens in `chartTheme.css`.
 */
import { CATEGORICAL, CHROME } from '@/dataviz/palette';
import '@/dataviz/chartTheme.css';

const BODY = 'var(--font-family-body)';

/**
 * Highcharts' numeric chart options (spacing, animation duration) do SVG
 * layout math and cannot take a CSS `var()` string the way `style.fontSize`
 * can. This resolves a token to its current pixel/ms value once, in the
 * browser, so a ladder change still reaches the chart without a code edit;
 * `fallback` only fires where no stylesheet is loaded (SSR, unit tests).
 *
 * @param {string} varName
 * @param {number} fallback
 * @returns {number}
 */
const tokenNumber = (varName, fallback) => {
    if (typeof document === 'undefined') return fallback;
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? fallback : parsed;
};

/** Chart container padding: the Card pattern's compact density, the one this chart already rendered at. */
const CHART_SPACING = tokenNumber('--card-pad-compact', 16);

/** The tighter inset a chart opts into deliberately (e.g. a heatmap that wants more room for cells), still off the ladder rather than a literal. */
export const CHART_SPACING_COMPACT = tokenNumber('--pad-y-md', 6);

/** The near-zero inset a micro-chart (e.g. Sparkline) renders at — tight, but still a named step, not a bare `4`. */
export const CHART_SPACING_MICRO = tokenNumber('--pad-x-xs', 4);

/** Series-entrance and hover-transition duration: the standard motion token, already 0 under `prefers-reduced-motion`. */
const CHART_ANIMATION_DURATION = tokenNumber('--motion-duration-medium', 200);

/**
 * Stroke widths: SVG presentation attributes (how Highcharts draws lines and
 * grids) don't resolve `var()` the way a CSS property does, so these also
 * resolve to numbers. Declared once in `chartTheme.css` alongside
 * `--chart-bar-radius` — only charts use them, so there is no shared primitive
 * to alias.
 */
const CHART_GRID_WIDTH = tokenNumber('--chart-grid-width', 1);
const CHART_LINE_WIDTH = tokenNumber('--chart-line-width', 2);

/** Bars and columns round only the value end (`where: 'end'`) — rounding both ends or a bigger radius distorts length reading. Pies, donuts and areas take none, so this lives on `column`/`bar` only, not the shared theme root. */
const CHART_BAR_RADIUS_NUMBER = tokenNumber('--chart-bar-radius', 2);
const barRadius = { borderRadius: { radius: CHART_BAR_RADIUS_NUMBER, where: 'end' } };

/** A node or card-like mark that isn't a bar (e.g. a Treegraph box): the radius primitive at the same step as a 40px control, the closest existing match. */
export const CHART_NODE_RADIUS = tokenNumber('--radius-0625', 10);

const axis = (gridLineWidth, gridLineDashStyle) => ({
    gridLineColor: CHROME.grid,
    ...(gridLineDashStyle && { gridLineDashStyle }),
    gridLineWidth,
    lineColor: CHROME.axis,
    tickColor: CHROME.axis,
    labels: {
        style: {
            color: CHROME.textSubtle,
            fontFamily: BODY,
            fontSize: 'var(--font-size-body3)',
            fontWeight: 'var(--font-weight-semibold-1)'
        }
    },
    title: {
        style: {
            color: CHROME.text,
            fontFamily: BODY
        }
    }
});

const chartTheme = {
    // Highcharts Accessibility — on, deliberately.
    //
    // With `enabled: false` Highcharts skips its accessibility module and falls
    // back to stamping the root <svg> `role="img"` with an aria-label read off
    // the chart title. Every chart here sets `title: { text: null }`, so that
    // label was the empty string: an image role with no accessible name, which
    // is the axe failure all 40 dataviz stories carried. Enabling the module
    // replaces it with a screen-reader section naming the chart type and axes,
    // per-series and per-point labels, and keyboard navigation of the data.
    //
    // The two sub-options exist because Highcharts' defaults assume a chart
    // owns its page, and these charts are widgets inside one:
    //
    // - `landmarkVerbosity: 'disabled'` keeps the chart a labeled
    //   `role="group"` instead of a `role="region"` landmark. Untitled charts
    //   all generate the same label, so 'all' both fails axe `landmark-unique`
    //   and puts six identical entries in a six-chart dashboard's landmark menu.
    // - `beforeChartFormat` drops the heading Highcharts opens the screen-reader
    //   section with. It guesses the level from the surrounding DOM, and inside
    //   a card headed by an h3 the guess came out <h6> — a skipped level, and an
    //   axe `heading-order` failure. The label survives as a <div>; the group's
    //   aria-label already names the chart. The rest is Highcharts' own default.
    accessibility: {
        enabled: true,
        landmarkVerbosity: 'disabled',
        screenReaderSection: {
            beforeChartFormat: '<div>{chartTitle}</div>' +
                '<div>{typeDescription}</div>' +
                '<div>{chartSubtitle}</div>' +
                '<div>{chartLongdesc}</div>' +
                '<div>{playAsSoundButton}</div>' +
                '<div>{viewTableButton}</div>' +
                '<div>{xAxisDescription}</div>' +
                '<div>{yAxisDescription}</div>' +
                '<div>{annotationsTitle}{annotationsList}</div>'
        }
    },
    // Series colors, in assignment order. Past six series, fold the rest into "Other".
    colors: CATEGORICAL,
    chart: {
        backgroundColor: 'transparent',
        spacing: [CHART_SPACING, CHART_SPACING, CHART_SPACING, CHART_SPACING],
        animation: { duration: CHART_ANIMATION_DURATION },
        style: {
            fontFamily: BODY,
            color: CHROME.text
        }
    },
    title: {
        style: {
            color: CHROME.text,
            fontFamily: 'var(--font-family-headline)',
            fontWeight: 'var(--font-weight-headline)',
            fontSize: 'var(--font-size-h4)'
        }
    },
    subtitle: {
        style: {
            color: CHROME.textSubtle,
            fontFamily: BODY,
            fontSize: 'var(--font-size-body2)'
        }
    },
    xAxis: axis(0),
    yAxis: axis(CHART_GRID_WIDTH, 'Dash'),
    plotOptions: {
        column: barRadius,
        bar: barRadius
    },
    legend: {
        itemStyle: {
            color: CHROME.text,
            fontFamily: BODY,
            fontWeight: 'var(--font-weight-semibold-1)'
        },
        itemHoverStyle: {
            color: CHROME.text
        },
        itemHiddenStyle: {
            color: CHROME.textDisabled
        }
    },
    tooltip: {
        // The Popup pattern's surface, styled in `chartTheme.css` via
        // `.highcharts-tooltip`. `useHTML` alone still draws the tooltip's
        // box as an SVG `<path>` (only the text runs through a foreignObject),
        // so a CSS `background`/`border-radius`/`box-shadow` on that class
        // never paints — SVG ignores all three. `outside: true` is what moves
        // the whole tooltip into `.highcharts-tooltip-container`, a real
        // floating `<div>`, which is what makes a design-system shadow token
        // reachable at all; Highcharts' native SVG tooltip can only draw its
        // own filter-based `shadow` option, which can't take
        // `--ds-shadow-overlay`.
        useHTML: true,
        outside: true,
        backgroundColor: 'transparent',
        borderWidth: 0,
        shadow: false,
        style: {
            color: CHROME.text,
            fontFamily: BODY,
            fontSize: 'var(--font-size-body2)'
        }
    },
    credits: {
        enabled: false
    }
};

/** A series line or a box-plot whisker: the chart-only stroke width. */
export const CHART_LINE_WIDTH_NUMBER = CHART_LINE_WIDTH;

/** A gridline, axis line or chart-only separator (e.g. the gap between stacked segments). */
export const CHART_GRID_WIDTH_NUMBER = CHART_GRID_WIDTH;

/** The series-entrance duration charts should default `animationDuration`-style props to, instead of a literal ms value. */
export const CHART_ANIMATION_DURATION_MS = CHART_ANIMATION_DURATION;

/**
 * Set as a chart's own `plotOptions.column.borderRadius` /
 * `plotOptions.bar.borderRadius` — charts build that object themselves
 * (pointPadding, borderWidth, fillOpacity vary per chart), so the shared
 * `chartTheme.plotOptions` above never reaches them. `{ where: 'end' }`
 * rounds only the value-end corners, and Highcharts respects stacking: a
 * stacked column only rounds the outer end of the stack, not every segment.
 */
export const CHART_BAR_RADIUS = barRadius.borderRadius;

export default chartTheme;
