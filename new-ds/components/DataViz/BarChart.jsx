import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from './chartTheme';

/**
 * BarChart Component
 * Basic Column or Bar chart for categorical comparison.
 */
const BarChart = ({
    categories,
    series,
    horizontal = false,
    yAxisLabel,
    height = 300
}) => {
    const seriesWithTheme = series.map((s, i) => ({
        ...s,
        color: s.color || chartTheme.colors[i % chartTheme.colors.length]
    }));

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: horizontal ? 'bar' : 'column',
            height: height
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            categories: categories
        },
        yAxis: {
            ...chartTheme.yAxis,
            title: {
                ...chartTheme.yAxis.title,
                text: yAxisLabel
            }
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0
            },
            bar: {
                pointPadding: 0.1,
                borderWidth: 0
            }
        },
        legend: { enabled: true },
        tooltip: {
            ...chartTheme.tooltip,
            shared: true
        },
        series: seriesWithTheme
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

BarChart.propTypes = {
    categories: PropTypes.arrayOf(PropTypes.string).isRequired,
    series: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        data: PropTypes.array.isRequired
    })).isRequired,
    horizontal: PropTypes.bool,
    yAxisLabel: PropTypes.string,
    height: PropTypes.number
};

export default BarChart;
