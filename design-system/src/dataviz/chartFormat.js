/**
 * Format helpers for Highcharts tooltips and data labels.
 *
 * Highcharts defaults to `<b>` and `font-weight: bold` (700) inside format
 * strings, and its SVG renderer copies a `<span>`'s `class` attribute onto the
 * `<tspan>` it creates even when `useHTML` is off. Wrapping emphasized values
 * in `<span class="plus-chart-value">…</span>` lets `chartTheme.css` style both
 * HTML tooltips and SVG data labels at semibold (600) with tabular figures
 * (`tabular-nums`), while keeping tooltip text in `--ds-text` and confining
 * series colors to the leading swatch (`●`).
 */

/** CSS class styled as semibold (600) with tabular figures in `chartTheme.css`. */
export const CHART_VALUE_CLASS = 'plus-chart-value';

/**
 * Wraps a Highcharts template expression (or literal value) in the semibold,
 * tabular value span. Works in both SVG `<text>` (`useHTML: false`) and HTML
 * (`useHTML: true`) labels and tooltips.
 *
 * @param {string | number} [expr='{point.y}']
 * @returns {string}
 */
export const valueSpan = (expr = '{point.y}') =>
    `<span class="${CHART_VALUE_CLASS}">${expr}</span>`;

/**
 * A colored dot swatch (`●`) for a tooltip row. Only the swatch wears the
 * series or point color; the text beside it stays in `--ds-text`.
 *
 * @param {string} [colorExpr='{point.color}']
 * @returns {string}
 */
export const seriesSwatch = (colorExpr = '{point.color}') =>
    `<span style="color:${colorExpr}">●</span>`;

/**
 * Default Highcharts `tooltip.headerFormat` with the category or key set in
 * the semibold tabular value span.
 *
 * @param {string} [keyExpr='{point.key}']
 * @returns {string}
 */
export const tooltipHeaderFormat = (keyExpr = '{point.key}') =>
    `${valueSpan(keyExpr)}<br/>`;

/**
 * Highcharts `tooltip.pointFormat` with an optional series-colored swatch,
 * `--ds-text` label, and semibold tabular value span.
 *
 * @param {object} [options]
 * @param {string} [options.label='{series.name}']
 * @param {string} [options.value='{point.y}']
 * @param {boolean} [options.swatch=true]
 * @param {string} [options.colorExpr='{point.color}']
 * @returns {string}
 */
export const tooltipPointFormat = ({
    label = '{series.name}',
    value = '{point.y}',
    swatch = true,
    colorExpr = '{point.color}',
} = {}) => {
    const prefix = swatch ? `${seriesSwatch(colorExpr)} ` : '';
    return `${prefix}${label}: ${valueSpan(value)}<br/>`;
};

/**
 * Highcharts `dataLabels.format` with the numeric expression wrapped in the
 * semibold tabular value span and an optional leading label.
 *
 * @param {string} [value='{point.y}']
 * @param {string} [label]
 * @returns {string}
 */
export const dataLabelFormat = (value = '{point.y}', label) =>
    label ? `${label}: ${valueSpan(value)}` : valueSpan(value);
