import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * VariwidthChart Component
 * Column chart where column width is variable (Variwide).
 * Great for visualizing a second dimension like importance or weight.
 */
const VariwidthChart = ({
    data = [],
    xAxisLabel = 'Category',
    yAxisLabel = 'Value',
    height = 400
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'variwide',
            height: height
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            type: 'category',
            title: { text: xAxisLabel }
        },
        yAxis: {
            ...chartTheme.yAxis,
            title: { text: yAxisLabel, style: chartTheme.yAxis.labels.style }
        },
        tooltip: {
            ...chartTheme.tooltip,
            pointFormat: 'Value: <b>{point.y}</b><br>Weight: <b>{point.z}</b>'
        },
        legend: { enabled: false },
        series: [{
            name: 'Data',
            data: data.map(item => ({
                name: item.name,
                y: item.y,
                z: item.z,
                color: item.color
            })),
            dataLabels: {
                enabled: true,
                format: '{point.y:.0f}'
            },
            colorByPoint: true,
            colors: chartTheme.colors
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

VariwidthChart.propTypes = {
    /** Array of points {name, y, z} where z is width */
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        y: PropTypes.number.isRequired, // height
        z: PropTypes.number.isRequired, // width
        color: PropTypes.string
    })),
    /** X-axis label */
    xAxisLabel: PropTypes.string,
    /** Y-axis label */
    yAxisLabel: PropTypes.string,
    /** Chart height */
    height: PropTypes.number
};

export default VariwidthChart;
