import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * HistogramChart Component
 * Displays frequency distribution of numerical data.
 */
const HistogramChart = ({
    data = [],
    xAxisLabel = 'Value',
    yAxisLabel = 'Frequency',
    height = 400,
    binWidth
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            height: height
        },
        title: { text: null },
        xAxis: [{
            ...chartTheme.xAxis,
            title: { text: xAxisLabel, style: chartTheme.xAxis.labels.style },
            alignTicks: false
        }, {
            ...chartTheme.xAxis,
            title: { text: yAxisLabel, style: chartTheme.xAxis.labels.style },
            alignTicks: false,
            opposite: true
        }],
        yAxis: [{
            ...chartTheme.yAxis,
            title: { text: 'Count', style: chartTheme.yAxis.labels.style }
        }, {
            ...chartTheme.yAxis,
            title: { text: 'Probability', style: chartTheme.yAxis.labels.style },
            opposite: true
        }],
        plotOptions: {
            histogram: {
                color: chartTheme.colors[0],
                borderColor: chartTheme.colors[0],
                binWidth: binWidth
            }
        },
        series: [{
            name: 'Histogram',
            type: 'histogram',
            xAxis: 1,
            yAxis: 0,
            baseSeries: 's1',
            zIndex: -1
        }, {
            name: 'Data',
            type: 'scatter',
            data: data,
            id: 's1',
            visible: false
        }],
        tooltip: {
            ...chartTheme.tooltip
        }
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

HistogramChart.propTypes = {
    /** Array of numerical values */
    data: PropTypes.arrayOf(PropTypes.number),
    /** Label for X axis */
    xAxisLabel: PropTypes.string,
    /** Label for Y axis */
    yAxisLabel: PropTypes.string,
    /** Chart height in pixels */
    height: PropTypes.number,
    /** Optional bin width */
    binWidth: PropTypes.number
};

export default HistogramChart;
