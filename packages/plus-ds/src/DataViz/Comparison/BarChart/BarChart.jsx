import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

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
    animationDuration = 900
}) => {
    const seriesWithTheme = useMemo(() => series.map((s, i) => ({
        ...s,
        color: s.color || chartTheme.colors[i % chartTheme.colors.length]
    })), [series]);

    // Column: xAxis = categories, yAxis = values. Bar (horizontal): xAxis = values, yAxis = categories.
    const xAxisConfig = useMemo(() => horizontal
        ? {
            ...chartTheme.xAxis,
            min: 0,
            ...(xAxisMax !== undefined && { max: xAxisMax }),
            categories: undefined,
            labels: { ...chartTheme.xAxis.labels, enabled: !hideXAxisLabels }
        }
        : {
            ...chartTheme.xAxis,
            categories: categories,
            labels: { ...chartTheme.xAxis.labels, enabled: !hideXAxisLabels }
        }, [horizontal, xAxisMax, hideXAxisLabels, categories]);

    const yAxisConfig = useMemo(() => horizontal
        ? {
            ...chartTheme.yAxis,
            categories: categories,
            reversed: false,
            labels: { ...chartTheme.yAxis.labels, enabled: !hideYAxisLabels }
        }
        : {
            ...chartTheme.yAxis,
            title: { ...chartTheme.yAxis.title, text: yAxisLabel },
            ...(yAxisMax !== undefined && { max: yAxisMax }),
            ...(yAxisTickPositions && { tickPositions: yAxisTickPositions }),
            labels: { ...chartTheme.yAxis.labels, enabled: !hideYAxisLabels }
        }, [horizontal, categories, hideYAxisLabels, yAxisLabel, yAxisMax, yAxisTickPositions]);

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
                ...(fillOpacity !== undefined && { fillOpacity })
            },
            bar: {
                pointPadding: 0.1,
                borderWidth: 0,
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
