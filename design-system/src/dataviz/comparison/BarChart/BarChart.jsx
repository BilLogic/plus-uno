import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme, { CHART_BAR_RADIUS } from '@/dataviz/chartTheme';
import { seriesColor, sortCategories } from '@/dataviz/palette';

/**
 * The two Highcharts axes for a bar or column chart. Categories always sit on `xAxis` and values on
 * `yAxis`, whichever way the bars point; `horizontal` only decides which switches and limits apply.
 */
export const buildBarAxes = ({
    horizontal, categories, yAxisLabel, yAxisMax, xAxisMax, yAxisTickPositions, hideXAxisLabels, hideYAxisLabels
}) => {
    const valueMax = horizontal ? xAxisMax : yAxisMax;
    const hideCategoryLabels = horizontal ? hideYAxisLabels : hideXAxisLabels;
    const hideValueLabels = horizontal ? hideXAxisLabels : hideYAxisLabels;
    return {
        xAxis: {
            ...chartTheme.xAxis,
            categories,
            labels: { ...chartTheme.xAxis.labels, enabled: !hideCategoryLabels }
        },
        yAxis: {
            ...chartTheme.yAxis,
            ...(horizontal && { min: 0 }),
            title: { ...chartTheme.yAxis.title, text: horizontal ? undefined : yAxisLabel },
            ...(valueMax !== undefined && { max: valueMax }),
            ...(yAxisTickPositions && { tickPositions: yAxisTickPositions }),
            labels: { ...chartTheme.yAxis.labels, enabled: !hideValueLabels }
        }
    };
};

/**
 * BarChart Component
 * Basic Column or Bar chart for categorical comparison.
 * Supports compact/spark mode (showLegend, yAxisMax, xAxisMax, hideXAxisLabels).
 */
const BarChart = ({
    categories,
    series,
    horizontal = false,
    sort = true,
    yAxisLabel,
    height = 300,
    showLegend = true,
    yAxisMax,
    xAxisMax,
    hideXAxisLabels = false,
    hideYAxisLabels = false,
    chartSpacing,
    yAxisTickPositions,
    columnPointPadding = 0.2,
    fillOpacity,
}) => {
    const { categories: orderedCategories, series: orderedSeries } = useMemo(
        () => (sort ? sortCategories({ categories, series, value: (d) => d }) : { categories, series }),
        [categories, series, sort],
    );

    const seriesWithTheme = useMemo(() => orderedSeries.map((s, i, all) => ({
        ...s,
        color: s.color || seriesColor(i, all.length)
    })), [orderedSeries]);

    // Highcharts keeps categories on `xAxis` for both types; `bar` only turns the chart on its side.
    // The label switches name the axis as drawn: `hideXAxisLabels` is the one along the bottom.
    const { xAxis: xAxisConfig, yAxis: yAxisConfig } = useMemo(() => buildBarAxes({
        horizontal,
        categories: orderedCategories,
        yAxisLabel,
        yAxisMax,
        xAxisMax,
        yAxisTickPositions,
        hideXAxisLabels,
        hideYAxisLabels,
    }), [horizontal, orderedCategories, yAxisLabel, yAxisMax, xAxisMax, yAxisTickPositions, hideXAxisLabels, hideYAxisLabels]);

    const options = useMemo(() => ({
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: horizontal ? 'bar' : 'column',
            height: height,
            ...(chartSpacing !== undefined && { spacing: chartSpacing })
        },
        title: { text: null },
        xAxis: xAxisConfig,
        yAxis: yAxisConfig,
        plotOptions: {
            column: {
                pointPadding: columnPointPadding,
                borderWidth: 0,
                borderRadius: CHART_BAR_RADIUS,
                ...(fillOpacity !== undefined && { fillOpacity })
            },
            bar: {
                pointPadding: 0.1,
                borderWidth: 0,
                borderRadius: CHART_BAR_RADIUS,
                ...(fillOpacity !== undefined && { fillOpacity })
            }
        },
        legend: { enabled: showLegend },
        tooltip: {
            ...chartTheme.tooltip,
            shared: true
        },
        series: seriesWithTheme
    }), [
        horizontal,
        height,
        chartSpacing,
        xAxisConfig,
        yAxisConfig,
        columnPointPadding,
        fillOpacity,
        showLegend,
        seriesWithTheme
    ]);

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
        </div>
    );
};

BarChart.propTypes = {
    categories: PropTypes.arrayOf(PropTypes.string).isRequired,
    series: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        data: PropTypes.array.isRequired
    })).isRequired,
    horizontal: PropTypes.bool,
    /** Sort categories from most to least by default; pass false for ordinal or temporal axes. */
    sort: PropTypes.bool,
    yAxisLabel: PropTypes.string,
    height: PropTypes.number,
    showLegend: PropTypes.bool,
    yAxisMax: PropTypes.number,
    xAxisMax: PropTypes.number,
    hideXAxisLabels: PropTypes.bool,
    hideYAxisLabels: PropTypes.bool,
    chartSpacing: PropTypes.arrayOf(PropTypes.number),
    yAxisTickPositions: PropTypes.arrayOf(PropTypes.number),
    columnPointPadding: PropTypes.number,
    fillOpacity: PropTypes.number,
};

export default BarChart;
