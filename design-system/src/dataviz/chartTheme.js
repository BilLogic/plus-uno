/**
 * The Highcharts theme every chart spreads.
 *
 * Data marks wear chart tokens and chrome wears text and border tokens
 * (palette.js says which token does which job): series take
 * `--chart-categorical-*` in order, tick labels `--ds-text-subtle`, titles,
 * legends and tooltips `--ds-text`, grid lines and axes `--ds-border`. No value
 * carries a fallback: the tokens resolve in every color mode, so a chart
 * follows light, dark and increased contrast with no code of its own. The
 * Highcharts defaults this theme does not set are pointed at the same tokens in
 * `chartTheme.css`.
 *
 * Every other foundation (spacing, radius, elevation, stroke, type, states,
 * motion) takes the same component tokens as the rest of the design system.
 * The chart container is a Card, so `chart.spacing` reads `--card-pad`
 * (the density this component already rendered at: 16px, component tokens
 * defined in `chartTheme.css`). The tooltip is a floating layer, so it takes
 * the Popup template's surface, overlay shadow and radius — via `useHTML`,
 * since Highcharts' native SVG tooltip can only draw its own filter-based
 * shadow, not a design-system shadow token; the CSS lives beside the other
 * chart-only tokens in `chartTheme.css`.
 */
import Highcharts from 'highcharts/esm/highcharts';
import { tooltipHeaderFormat, tooltipPointFormat } from '@/dataviz/chartFormat';
import { chartEntrance, chartStateTransition } from '@/dataviz/chartMotion';
import { CATEGORICAL, CHROME } from '@/dataviz/palette';
import '@/dataviz/chartTheme.css';

export const BODY = 'var(--type-family-body)';
export const MEDIUM = 'var(--type-weight-medium)';
export const SEMIBOLD = 'var(--type-weight-semibold)';
export const TABULAR = 'tabular-nums';

/**
 * Highcharts' numeric chart options (spacing, stroke width, radius) do SVG
 * layout math and cannot take a CSS `var()` string the way `style.fontSize`
 * can. This resolves a token to its current pixel value once, in the
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

/** Chart container padding: the Card template's pad, the density this chart already rendered at. */
const CHART_SPACING = tokenNumber('--card-pad', 16);

/** The tighter inset a chart opts into deliberately (e.g. a heatmap that wants more room for cells), still off the ladder rather than a literal. */
export const CHART_SPACING_COMPACT = tokenNumber('--pad-y-md', 6);

/** The near-zero inset a micro-chart (e.g. Sparkline) renders at — tight, but still a named step, not a bare `4`. */
export const CHART_SPACING_MICRO = tokenNumber('--pad-x-xs', 4);

/** Series entrance (`spatial.default`) and state transition (`appearance.fast`) spring animations. */
const CHART_ENTRANCE_ANIMATION = chartEntrance();
const CHART_STATE_ANIMATION = chartStateTransition();

/**
 * Stroke widths: SVG presentation attributes (how Highcharts draws lines and
 * grids) don't resolve `var()` the way a CSS property does, so these also
 * resolve to numbers. Declared once in `chartTheme.css` alongside
 * `--chart-bar-radius` — only charts use them, so there is no shared primitive
 * to alias.
 */
const CHART_GRID_WIDTH = tokenNumber('--chart-grid-width', 1);
const CHART_LINE_WIDTH = tokenNumber('--chart-line-width', 2);

/** `--ds-opacity-chart-inactive` (0.3) — inactive series fade when another series is hovered or focused. */
export const CHART_INACTIVE_OPACITY = tokenNumber('--ds-opacity-chart-inactive', 0.3);

/**
 * Chart fill opacities, from the chart opacity tokens (the state tokens
 * `--ds-opacity-disabled` and `--ds-opacity-loading` are for controls, not data):
 * `--ds-opacity-chart-fill` (0.3) for an area under its line — range bands and
 * radar shapes — and `--ds-opacity-chart-overlap` (0.7) for marks that overlap
 * each other, such as bubbles, so the ones beneath stay visible.
 */
export const CHART_FILL_OPACITY = tokenNumber('--ds-opacity-chart-fill', 0.3);
export const CHART_OVERLAP_OPACITY = tokenNumber('--ds-opacity-chart-overlap', 0.7);
export const CHART_RANGE_FILL_OPACITY = CHART_FILL_OPACITY;
export const CHART_RADAR_FILL_OPACITY = CHART_FILL_OPACITY;

/** Bars and columns round only the value end (`where: 'end'`) — rounding both ends or a bigger radius distorts length reading. Pies, donuts and areas take none, so this lives on `column`/`bar` only, not the shared theme root. */
const CHART_BAR_RADIUS_NUMBER = tokenNumber('--chart-bar-radius', 2);
const barRadius = { borderRadius: { radius: CHART_BAR_RADIUS_NUMBER, where: 'end' } };

/** A node or card-like mark inside a chart (e.g. a Treegraph box): the card-nesting role radius (`--radius-lg`, 8px), never a control radius. */
export const CHART_NODE_RADIUS = tokenNumber('--radius-lg', 8);

/** Height of a labeled node box inside a chart (e.g. a Treegraph box), read off the size ladder (`--size-200`, 32px). */
export const CHART_NODE_HEIGHT = tokenNumber('--size-200', 32);

/** A gauge or progress track's small rounded ends: `--radius-md` (4px), the Small details step Radius.mdx gives to a Table loading bar. */
export const CHART_TRACK_RADIUS = tokenNumber('--radius-md', 4);
/** A point marker's radius (3px, 6px diameter): a quarter of `--size-075` (12px), the smallest `--size-*` step on the scale. */
export const CHART_MARKER_RADIUS = tokenNumber('--size-075', 12) / 4;
/** Minimum bubble diameter (12px): `--size-075`, the smallest step on the `--size-*` scale (close to 10px). */
export const CHART_BUBBLE_MIN_SIZE = tokenNumber('--size-075', 12);
/** Maximum bubble diameter (48px): `--size-300`, the closest `--size-*` step to 60px (`--size-*` jumps from 48px to 80px). */
export const CHART_BUBBLE_MAX_SIZE = tokenNumber('--size-300', 48);

const axis = (gridLineWidth, gridLineDashStyle) => ({
    gridLineColor: CHROME.grid,
    ...(gridLineDashStyle && { gridLineDashStyle }),
    gridLineWidth,
    lineColor: CHROME.axis,
    tickColor: CHROME.axis,
    labels: {
        style: {
            color: CHROME.textSubtle,
            font: 'var(--body-sm)',
            lineHeight: 'normal', // the role's size only; the SVG keeps its own line height
            fontFamily: BODY,
            fontWeight: MEDIUM,
            fontVariantNumeric: TABULAR,
        },
    },
    title: {
        style: {
            color: CHROME.text,
            font: 'var(--body-sm)',
            lineHeight: 'normal', // the role's size only; the SVG keeps its own line height
            fontFamily: BODY,
            fontWeight: SEMIBOLD,
        },
    },
});

const dataLabelsStyle = {
    color: CHROME.text,
    font: 'var(--body-sm)',
    lineHeight: 'normal', // the role's size only; the SVG keeps its own line height
    fontSize: 'inherit', // Highcharts scales an HTML label by `em` unless it is handed a fontSize; this one is the role's
    fontFamily: BODY,
    fontWeight: MEDIUM,
    fontVariantNumeric: TABULAR,
    textOutline: 'none',
};

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
            beforeChartFormat:
                '<div>{chartTitle}</div>' +
                '<div>{typeDescription}</div>' +
                '<div>{chartSubtitle}</div>' +
                '<div>{chartLongdesc}</div>' +
                '<div>{playAsSoundButton}</div>' +
                '<div>{viewTableButton}</div>' +
                '<div>{xAxisDescription}</div>' +
                '<div>{yAxisDescription}</div>' +
                '<div>{annotationsTitle}{annotationsList}</div>',
        },
    },
    // Series colors, in assignment order. Past six series, fold the rest into "Other".
    colors: CATEGORICAL,
    chart: {
        backgroundColor: 'transparent',
        spacing: [CHART_SPACING, CHART_SPACING, CHART_SPACING, CHART_SPACING],
        animation: CHART_ENTRANCE_ANIMATION,
        style: {
            fontFamily: BODY,
            fontWeight: MEDIUM,
            color: CHROME.text,
        },
    },
    title: {
        style: {
            color: CHROME.text,
            font: 'var(--heading-lg)',
            lineHeight: 'normal', // the role's size only; the SVG keeps its own line height
            fontFamily: BODY,
            fontWeight: SEMIBOLD,
        },
    },
    subtitle: {
        style: {
            color: CHROME.textSubtle,
            font: 'var(--body-default)',
            lineHeight: 'normal', // the role's size only; the SVG keeps its own line height
            fontFamily: BODY,
            fontWeight: MEDIUM,
        },
    },
    caption: {
        style: {
            color: CHROME.textSubtle,
            font: 'var(--body-sm)',
            lineHeight: 'normal', // the role's size only; the SVG keeps its own line height
            fontFamily: BODY,
            fontWeight: MEDIUM,
        },
    },
    xAxis: axis(0),
    yAxis: axis(CHART_GRID_WIDTH, 'Dash'),
    plotOptions: {
        series: {
            animation: CHART_ENTRANCE_ANIMATION,
            dataLabels: {
                style: dataLabelsStyle,
            },
            states: {
                hover: {
                    enabled: true,
                    brightness: 0,
                    halo: null,
                    animation: CHART_STATE_ANIMATION,
                },
                inactive: {
                    enabled: true,
                    opacity: CHART_INACTIVE_OPACITY,
                    animation: CHART_STATE_ANIMATION,
                },
                select: {
                    enabled: true,
                    color: 'var(--ds-background-selected)',
                    borderColor: 'var(--ds-border-selected)',
                    borderWidth: CHART_GRID_WIDTH,
                    animation: CHART_STATE_ANIMATION,
                },
            },
            marker: {
                states: {
                    hover: {
                        enabled: true,
                        lineWidthPlus: 0,
                    },
                    select: {
                        enabled: true,
                        fillColor: 'var(--ds-background-selected)',
                        lineColor: 'var(--ds-border-selected)',
                        lineWidth: CHART_GRID_WIDTH,
                    },
                },
            },
        },
        column: barRadius,
        bar: barRadius,
        // Highcharts' `packedbubble` module stamps an inline 2-second eased CSS
        // opacity transition on `dataLabels.style`, bypassing the chart entrance
        // spring and reduced-motion container fade.
        packedbubble: {
            dataLabels: {
                style: {
                    ...dataLabelsStyle,
                    transition: 'none',
                },
            },
        },
        wordcloud: {
            style: {
                fontFamily: BODY,
                fontWeight: SEMIBOLD,
            },
        },
        treegraph: {
            collapseButton: {
                style: {
                    fontFamily: BODY,
                    fontWeight: SEMIBOLD,
                },
            },
        },
    },
    legend: {
        itemStyle: {
            color: CHROME.text,
            font: 'var(--body-sm)',
            lineHeight: 'normal', // the role's size only; the SVG keeps its own line height
            fontFamily: BODY,
            fontWeight: MEDIUM,
            fontVariantNumeric: TABULAR,
        },
        itemHoverStyle: {
            color: CHROME.text,
        },
        itemHiddenStyle: {
            color: CHROME.textDisabled,
        },
    },
    tooltip: {
        // The Popup template's surface, styled in `chartTheme.css` via
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
        // The Popup padding plus Highcharts' own inset, inside the box, so the
        // container div is exactly as wide as the tooltip Highcharts positions and
        // the text sits where it did with the padding on the div.
        padding: tokenNumber('--popup-pad', 0) + (Highcharts.defaultOptions.tooltip?.padding ?? 0),
        headerFormat: tooltipHeaderFormat(),
        pointFormat: tooltipPointFormat(),
        style: {
            color: CHROME.text,
            font: 'var(--body-default)',
            lineHeight: 'normal', // the role's size only; the SVG keeps its own line height
            fontFamily: BODY,
            fontWeight: MEDIUM,
            fontVariantNumeric: TABULAR,
        },
    },
    noData: {
        style: {
            color: CHROME.textSubtle,
            font: 'var(--body-default)',
            lineHeight: 'normal', // the role's size only; the SVG keeps its own line height
            fontFamily: BODY,
            fontWeight: MEDIUM,
        },
    },
    credits: {
        enabled: false,
    },
};

/** A series line or a box-plot whisker: the chart-only stroke width. */
export const CHART_LINE_WIDTH_NUMBER = CHART_LINE_WIDTH;

/** A gridline, axis line or chart-only separator (e.g. the gap between stacked segments). */
export const CHART_GRID_WIDTH_NUMBER = CHART_GRID_WIDTH;

/** The series-entrance duration charts should default `animationDuration`-style props to, instead of a literal ms value. */
export const CHART_ANIMATION_DURATION_MS = CHART_ENTRANCE_ANIMATION.duration;

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
