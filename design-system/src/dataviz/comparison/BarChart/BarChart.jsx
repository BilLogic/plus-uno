import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Highcharts from '@/dataviz/highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme, { CHART_ANIMATION_DURATION_MS, CHART_BAR_RADIUS } from '@/dataviz/chartTheme';
import { seriesColor } from '@/dataviz/palette';

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
    animate = false,
    animationDelay = 0,
    animationDuration = CHART_ANIMATION_DURATION_MS
}) => {
    const seriesWithTheme = useMemo(() => series.map((s, i, all) => ({
        ...s,
        color: s.color || seriesColor(i, all.length)
    })), [series]);

    // Highcharts keeps categories on `xAxis` for both types; `bar` only turns the chart on its side.
    // The label switches name the axis as drawn: `hideXAxisLabels` is the one along the bottom.
    const { xAxis: xAxisConfig, yAxis: yAxisConfig } = useMemo(() => buildBarAxes({
        horizontal, categories, yAxisLabel, yAxisMax, xAxisMax, yAxisTickPositions, hideXAxisLabels, hideYAxisLabels
    }), [horizontal, categories, yAxisLabel, yAxisMax, xAxisMax, yAxisTickPositions, hideXAxisLabels, hideYAxisLabels]);

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
            series: {
                animation: animate ? { duration: animationDuration, defer: animationDelay } : false
            },
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
        animate,
        animationDuration,
        animationDelay,
        columnPointPadding,
        fillOpacity,
        showLegend,
        seriesWithTheme
    ]);

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
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
    animate: PropTypes.bool,
    animationDelay: PropTypes.number,
    animationDuration: PropTypes.number
};

export default BarChart;
