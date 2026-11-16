import React from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme, { CHART_MARKER_RADIUS } from '@/dataviz/chartTheme';
import { seriesSwatch, tooltipHeaderFormat, valueSpan } from '@/dataviz/chartFormat';
import { seriesColor } from '@/dataviz/palette';

/**
 * ScatterChart Component
 * Visualizes correlation between two variables.
 */
const ScatterChart = ({
    data,
    xAxisLabel,
    yAxisLabel,
    height = 300
}) => {
    // data: keys of { name, data: [[x,y], [x,y]...] }

    const seriesWithTheme = data.map((s, i, all) => ({
        ...s,
        type: 'scatter',
        color: s.color || seriesColor(i, all.length)
    }));

    const tooltipFormat = {
        ...chartTheme.tooltip,
        headerFormat: tooltipHeaderFormat('{series.name}'),
        pointFormat: `${seriesSwatch()} ${valueSpan('{point.x}')}, ${valueSpan('{point.y}')}`
    };

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'scatter',
            height: height
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            title: {
                ...chartTheme.xAxis.title,
                text: xAxisLabel
            },
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true
        },
        yAxis: {
            ...chartTheme.yAxis,
            title: {
                ...chartTheme.yAxis.title,
                text: yAxisLabel
            }
        },
        tooltip: tooltipFormat,
        plotOptions: {
            scatter: {
                marker: {
                    radius: CHART_MARKER_RADIUS
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

ScatterChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        data: PropTypes.arrayOf(PropTypes.array).isRequired, // [[x,y], ...]
        color: PropTypes.string
    })).isRequired,
    xAxisLabel: PropTypes.string,
    yAxisLabel: PropTypes.string,
    height: PropTypes.number
};

export default ScatterChart;
