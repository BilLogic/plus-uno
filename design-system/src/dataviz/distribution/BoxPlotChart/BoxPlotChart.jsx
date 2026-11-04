import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '@/dataviz/highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme, { CHART_LINE_WIDTH_NUMBER, CHART_GRID_WIDTH_NUMBER } from '@/dataviz/chartTheme';

/**
 * BoxPlotChart Component
 * Shows statistical distribution with min, max, median, and quartiles.
 * Great for comparing distributions across categories.
 */
const BoxPlotChart = ({
    data = [],
    categories = [],
    yAxisLabel = 'Value',
    height = 400
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'boxplot',
            height: height
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            categories: categories
        },
        yAxis: {
            ...chartTheme.yAxis,
            title: { text: yAxisLabel, style: chartTheme.yAxis.labels.style }
        },
        tooltip: {
            ...chartTheme.tooltip
        },
        plotOptions: {
            boxplot: {
                fillColor: chartTheme.colors[0],
                lineWidth: CHART_LINE_WIDTH_NUMBER,
                medianColor: 'var(--ds-border-inverse)',
                // The median line reads as the one line in the box this chart asks a reader to find first — a step bolder than the box outline, off the same stroke token rather than a bare `3`.
                medianWidth: CHART_LINE_WIDTH_NUMBER * 1.5,
                stemColor: chartTheme.colors[0],
                stemWidth: CHART_GRID_WIDTH_NUMBER,
                whiskerColor: chartTheme.colors[0],
                whiskerLength: '50%',
                whiskerWidth: CHART_LINE_WIDTH_NUMBER
            }
        },
        series: [{
            name: 'Distribution',
            data: data,
            color: chartTheme.colors[0]
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

BoxPlotChart.propTypes = {
    /** Array of [low, q1, median, q3, high] for each category */
    data: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
    /** Category labels */
    categories: PropTypes.arrayOf(PropTypes.string),
    /** Y-axis label */
    yAxisLabel: PropTypes.string,
    /** Chart height */
    height: PropTypes.number
};

export default BoxPlotChart;
