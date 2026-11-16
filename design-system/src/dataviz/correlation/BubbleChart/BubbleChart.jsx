import React from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme, { CHART_BUBBLE_MAX_SIZE, CHART_BUBBLE_MIN_SIZE, CHART_GRID_WIDTH_NUMBER, CHART_OVERLAP_OPACITY } from '@/dataviz/chartTheme';
import { tooltipHeaderFormat, valueSpan } from '@/dataviz/chartFormat';
import { seriesColor } from '@/dataviz/palette';

/**
 * BubbleChart Component
 * A scatter chart where point size represents a third variable.
 * Useful for showing relationships between three variables.
 */
const BubbleChart = ({
    xAxisLabel = 'X Axis',
    yAxisLabel = 'Y Axis',
    zAxisLabel = 'Size',
    data = [],
    height = 400
}) => {
    // Merge theme colors into series if not provided
    const seriesWithTheme = data.map((s, i, all) => ({
        ...s,
        color: s.color || seriesColor(i, all.length)
    }));

    const tooltipFormat = {
        ...chartTheme.tooltip,
        headerFormat: tooltipHeaderFormat('{series.name}'),
        pointFormat: [
            `${xAxisLabel}: ${valueSpan('{point.x}')}`,
            `${yAxisLabel}: ${valueSpan('{point.y}')}`,
            `${zAxisLabel}: ${valueSpan('{point.z}')}`,
        ].join('<br/>')
    };

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'bubble',
            height: height,
            zoomType: 'xy'
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            title: { ...chartTheme.xAxis.title, text: xAxisLabel },
            gridLineWidth: CHART_GRID_WIDTH_NUMBER
        },
        yAxis: {
            ...chartTheme.yAxis,
            title: { ...chartTheme.yAxis.title, text: yAxisLabel }
        },
        tooltip: tooltipFormat,
        plotOptions: {
            bubble: {
                minSize: CHART_BUBBLE_MIN_SIZE,
                maxSize: CHART_BUBBLE_MAX_SIZE,
                marker: {
                    // `--ds-opacity-chart-overlap`: overlapping bubbles stay visible through each other.
                    fillOpacity: CHART_OVERLAP_OPACITY
                },
                tooltip: tooltipFormat
            }
        },
        legend: {
            ...chartTheme.legend,
            enabled: true
        },
        series: seriesWithTheme
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
        </div>
    );
};

BubbleChart.propTypes = {
    /** Label for X axis */
    xAxisLabel: PropTypes.string,
    /** Label for Y axis */
    yAxisLabel: PropTypes.string,
    /** Label for bubble size (Z axis) */
    zAxisLabel: PropTypes.string,
    /** Array of series objects { name, data: [[x, y, z], ...] } */
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        data: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
        color: PropTypes.string
    })),
    /** Chart height in pixels */
    height: PropTypes.number
};

export default BubbleChart;
