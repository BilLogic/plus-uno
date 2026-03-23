import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * ComboChart Component
 * Combines column/bar data with line data.
 */
const ComboChart = ({
    barData,
    lineData,
    categories,
    primaryAxisLabel,
    secondaryAxisLabel,
    height = 300
}) => {
    // Determine colors: Bars usually primary/secondary, Lines can be tertiary/warning
    const barSeries = barData.map((s, i) => ({
        ...s,
        type: 'column',
        color: s.color || chartTheme.colors[i % chartTheme.colors.length]
    }));

    const lineSeries = lineData.map((s, i) => ({
        ...s,
        type: 'line',
        color: s.color || chartTheme.colors[(i + barData.length) % chartTheme.colors.length],
        marker: {
            lineWidth: 2,
            lineColor: Highcharts.getOptions().colors[3], // default
            fillColor: 'white'
        }
    }));

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
        yAxis: [
            { // Primary yAxis
                ...chartTheme.yAxis,
                title: {
                    ...chartTheme.yAxis.title,
                    text: primaryAxisLabel
                }
            },
            { // Secondary yAxis
                ...chartTheme.yAxis,
                title: {
                    ...chartTheme.yAxis.title,
                    text: secondaryAxisLabel,
                    style: { color: Highcharts.getOptions().colors[0] } // optional: match line color
                },
                opposite: true
            }
        ],
        tooltip: {
            ...chartTheme.tooltip,
            shared: true
        },
        legend: { enabled: true },
        series: [...barSeries, ...lineSeries]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

ComboChart.propTypes = {
    barData: PropTypes.array.isRequired,
    lineData: PropTypes.array.isRequired,
    categories: PropTypes.array.isRequired,
    primaryAxisLabel: PropTypes.string,
    secondaryAxisLabel: PropTypes.string,
    height: PropTypes.number
};

export default ComboChart;
