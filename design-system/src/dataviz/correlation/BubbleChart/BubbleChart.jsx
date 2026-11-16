import React from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme, { CHART_GRID_WIDTH_NUMBER, tokenNumber } from '@/dataviz/chartTheme';
import { tooltipHeaderFormat, valueSpan } from '@/dataviz/chartFormat';
import { seriesColor } from '@/dataviz/palette';

const BUBBLE_MIN_SIZE = tokenNumber('--pad-x-md', 12);
const BUBBLE_MAX_SIZE = tokenNumber('--control-lg', 40);

/**
 * BubbleChart Component
 * 3D scatter visualization where bubble size represents a third dimension.
 */
const BubbleChart = ({
    xAxisLabel = 'X Axis',
    yAxisLabel = 'Y Axis',
    zAxisLabel = 'Size',
    data = [],
    height = 400,
}) => {
    const tooltipFormat = {
        ...chartTheme.tooltip,
        headerFormat: tooltipHeaderFormat('{series.name}'),
        pointFormat: [
            `${xAxisLabel}: ${valueSpan('{point.x}')}`,
            `${yAxisLabel}: ${valueSpan('{point.y}')}`,
            `${zAxisLabel}: ${valueSpan('{point.z}')}`,
        ].join('<br/>'),
    };

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'bubble',
            height,
            zoomType: 'xy',
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            title: { ...chartTheme.xAxis.title, text: xAxisLabel },
            gridLineWidth: CHART_GRID_WIDTH_NUMBER,
        },
        yAxis: {
            ...chartTheme.yAxis,
            title: { ...chartTheme.yAxis.title, text: yAxisLabel },
        },
        tooltip: tooltipFormat,
        plotOptions: {
            bubble: {
                minSize: BUBBLE_MIN_SIZE,
                maxSize: BUBBLE_MAX_SIZE,
                marker: {
                    fillOpacity: 0.7,
                },
                tooltip: tooltipFormat,
            },
        },
        legend: {
            ...chartTheme.legend,
            enabled: true,
        },
        series: data.map((s, i, all) => ({
            ...s,
            color: s.color || seriesColor(i, all.length),
        })),
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
    /** Array of series { name, data: [[x, y, z], ...], color } */
    data: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            data: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
            color: PropTypes.string,
        }),
    ),
    /** Chart height in pixels */
    height: PropTypes.number,
};

export default BubbleChart;
