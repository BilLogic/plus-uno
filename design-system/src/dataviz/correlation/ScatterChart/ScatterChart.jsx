import React from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme, { tokenNumber } from '@/dataviz/chartTheme';
import { seriesSwatch, tooltipHeaderFormat, valueSpan } from '@/dataviz/chartFormat';
import { seriesColor } from '@/dataviz/palette';

const SCATTER_MARKER_RADIUS = tokenNumber('--pad-x-xs', 4);

/**
 * ScatterChart Component
 * Displays data points on X-Y axes to show correlation or distribution.
 */
const ScatterChart = ({
    data = [],
    xAxisLabel = '',
    yAxisLabel = '',
    height = 300,
}) => {
    const seriesWithTheme = data.map((s, i, all) => ({
        ...s,
        color: s.color || seriesColor(i, all.length),
    }));

    const tooltipFormat = {
        ...chartTheme.tooltip,
        headerFormat: tooltipHeaderFormat('{series.name}'),
        pointFormat: `${seriesSwatch()} ${valueSpan('{point.x}')}, ${valueSpan('{point.y}')}`,
    };

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'scatter',
            height,
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            title: { ...chartTheme.xAxis.title, text: xAxisLabel },
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true,
        },
        yAxis: {
            ...chartTheme.yAxis,
            title: { ...chartTheme.yAxis.title, text: yAxisLabel },
        },
        legend: {
            ...chartTheme.legend,
            enabled: true,
        },
        tooltip: tooltipFormat,
        plotOptions: {
            scatter: {
                marker: {
                    radius: SCATTER_MARKER_RADIUS,
                },
                tooltip: tooltipFormat,
            },
        },
        series: seriesWithTheme,
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
        </div>
    );
};

ScatterChart.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            data: PropTypes.arrayOf(PropTypes.array).isRequired,
            color: PropTypes.string,
        }),
    ).isRequired,
    xAxisLabel: PropTypes.string,
    yAxisLabel: PropTypes.string,
    height: PropTypes.number,
};

export default ScatterChart;
