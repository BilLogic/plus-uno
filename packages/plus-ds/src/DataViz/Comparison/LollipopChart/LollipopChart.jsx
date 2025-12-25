import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * LollipopChart Component
 * Like a bar chart but with dots and stems.
 * Cleaner look when comparing many categories.
 */
const LollipopChart = ({
    data = [],
    categories = [],
    yAxisLabel = 'Value',
    height = 400,
    horizontal = true
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'lollipop',
            height: height,
            inverted: horizontal
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
            ...chartTheme.tooltip,
            pointFormat: '<b>{point.y}</b>'
        },
        series: [{
            name: 'Values',
            data: data,
            color: chartTheme.colors[0]
        }],
        legend: { enabled: false }
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

LollipopChart.propTypes = {
    /** Array of numerical values */
    data: PropTypes.arrayOf(PropTypes.number),
    /** Category labels */
    categories: PropTypes.arrayOf(PropTypes.string),
    /** Y-axis label */
    yAxisLabel: PropTypes.string,
    /** Chart height */
    height: PropTypes.number,
    /** Horizontal orientation */
    horizontal: PropTypes.bool
};

export default LollipopChart;
