import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * ParetoChart Component
 * Shows columns with a cumulative line (80-20 analysis).
 * Great for identifying the most significant factors.
 */
const ParetoChart = ({
    data = [],
    categories = [],
    yAxisLabel = 'Value',
    height = 400
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            height: height
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            categories: categories
        },
        yAxis: [{
            ...chartTheme.yAxis,
            title: { text: yAxisLabel, style: chartTheme.yAxis.labels.style }
        }, {
            ...chartTheme.yAxis,
            title: { text: 'Cumulative %', style: chartTheme.yAxis.labels.style },
            opposite: true,
            max: 100,
            labels: { format: '{value}%' }
        }],
        tooltip: {
            ...chartTheme.tooltip,
            shared: true
        },
        series: [{
            type: 'pareto',
            name: 'Cumulative',
            yAxis: 1,
            zIndex: 10,
            baseSeries: 1,
            color: chartTheme.colors[1]
        }, {
            type: 'column',
            name: 'Values',
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

ParetoChart.propTypes = {
    /** Array of numerical values */
    data: PropTypes.arrayOf(PropTypes.number),
    /** Category labels */
    categories: PropTypes.arrayOf(PropTypes.string),
    /** Y-axis label */
    yAxisLabel: PropTypes.string,
    /** Chart height */
    height: PropTypes.number
};

export default ParetoChart;
