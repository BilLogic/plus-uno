import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * ColumnRangeChart Component
 * Shows ranges between min and max values for each category.
 * Great for temperature ranges, schedules, and duration visualization.
 */
const ColumnRangeChart = ({
    data = [],
    categories = [],
    yAxisLabel = 'Value',
    height = 400,
    horizontal = false
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'columnrange',
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
            valueSuffix: ''
        },
        plotOptions: {
            columnrange: {
                dataLabels: {
                    enabled: true,
                    format: '{y}'
                }
            }
        },
        legend: { enabled: false },
        series: [{
            name: 'Range',
            data: data.map(item => [item.low, item.high]),
            color: chartTheme.colors[0]
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

ColumnRangeChart.propTypes = {
    /** Array of objects with { low, high } values */
    data: PropTypes.arrayOf(PropTypes.shape({
        low: PropTypes.number.isRequired,
        high: PropTypes.number.isRequired
    })),
    /** Category labels */
    categories: PropTypes.arrayOf(PropTypes.string),
    /** Y-axis label */
    yAxisLabel: PropTypes.string,
    /** Chart height */
    height: PropTypes.number,
    /** Horizontal orientation */
    horizontal: PropTypes.bool
};

export default ColumnRangeChart;
