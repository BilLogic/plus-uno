import React from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme from '@/dataviz/chartTheme';
import { BRAND } from '@/dataviz/palette';

/**
 * AreaRangeChart Component
 * Shows a range of values over time with a filled area.
 * Great for confidence intervals, min/max ranges, and bands.
 */
const AreaRangeChart = ({
    data = [],
    xAxisLabel = '',
    yAxisLabel = 'Value',
    height = 400
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'arearange',
            height: height
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            title: { text: xAxisLabel }
        },
        yAxis: {
            ...chartTheme.yAxis,
            title: { text: yAxisLabel, style: chartTheme.yAxis.labels.style }
        },
        tooltip: {
            ...chartTheme.tooltip,
            crosshairs: true,
            shared: true,
            valueSuffix: ''
        },
        legend: { enabled: false },
        series: [{
            name: 'Range',
            data: data,
            color: BRAND,
            fillOpacity: 0.3,
            lineWidth: 0,
            marker: {
                enabled: false
            }
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
        </div>
    );
};

AreaRangeChart.propTypes = {
    /** Array of [x, low, high] arrays */
    data: PropTypes.arrayOf(PropTypes.array),
    /** X-axis label */
    xAxisLabel: PropTypes.string,
    /** Y-axis label */
    yAxisLabel: PropTypes.string,
    /** Chart height */
    height: PropTypes.number
};

export default AreaRangeChart;
