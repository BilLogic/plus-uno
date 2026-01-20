import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * XRangeChart Component
 * Shows ranges on an X-axis, often used for Gantt-like charts.
 * Great for scheduling, duration tracking, and resource allocation.
 */
const XRangeChart = ({
    data = [],
    categories = [],
    height = 400
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'xrange',
            height: height
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            type: 'datetime'
        },
        yAxis: {
            ...chartTheme.yAxis,
            title: { text: '' },
            categories: categories,
            reversed: true
        },
        tooltip: {
            ...chartTheme.tooltip
        },
        series: [{
            name: 'Tasks',
            data: data.map(item => ({
                x: item.start,
                x2: item.end,
                y: item.y,
                name: item.name,
                color: item.color || chartTheme.colors[item.y % chartTheme.colors.length]
            })),
            dataLabels: {
                enabled: true
            }
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

XRangeChart.propTypes = {
    /** Array of tasks {start, end, y, name, color} */
    data: PropTypes.arrayOf(PropTypes.shape({
        start: PropTypes.number.isRequired,
        end: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
        name: PropTypes.string,
        color: PropTypes.string
    })),
    /** Y-axis categories */
    categories: PropTypes.arrayOf(PropTypes.string),
    /** Chart height */
    height: PropTypes.number
};

export default XRangeChart;
