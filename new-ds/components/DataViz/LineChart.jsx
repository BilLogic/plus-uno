import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from './chartTheme';

/**
 * LineChart Component
 * Visualizes trends over time or categories.
 */
const LineChart = ({
    data,
    xAxisLabel,
    yAxisLabel,
    height = 300
}) => {
    // data: Array of series objects: [{ name: 'Series 1', data: [1, 2, 3] }, ...]

    // Automatically apply theme colors if series don't have them
    const seriesWithTheme = data.map((s, i) => ({
        ...s,
        color: s.color || chartTheme.colors[i % chartTheme.colors.length]
    }));

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'line',
            height: height
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            title: {
                ...chartTheme.xAxis.title,
                text: xAxisLabel
            },
            categories: data[0]?.categories // Optional: if categories are passed in first series or separate prop
        },
        yAxis: {
            ...chartTheme.yAxis,
            title: {
                ...chartTheme.yAxis.title,
                text: yAxisLabel
            }
        },
        plotOptions: {
            line: {
                marker: {
                    enabled: true,
                    symbol: 'circle'
                }
            }
        },
        legend: { enabled: true },
        series: seriesWithTheme
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

LineChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        data: PropTypes.array.isRequired,
        color: PropTypes.string,
        categories: PropTypes.array // Optional categories for X axis
    })).isRequired,
    xAxisLabel: PropTypes.string,
    yAxisLabel: PropTypes.string,
    height: PropTypes.number
};

export default LineChart;
