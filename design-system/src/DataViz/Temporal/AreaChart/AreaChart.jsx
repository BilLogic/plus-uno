import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * AreaChart Component
 * Visualizes volume or magnitude trends.
 */
const AreaChart = ({
    data,
    stacking = null, // 'normal', 'percent', or null
    xAxisLabel,
    yAxisLabel,
    height = 300
}) => {
    const seriesWithTheme = data.map((s, i) => ({
        ...s,
        color: s.color || chartTheme.colors[i % chartTheme.colors.length]
    }));

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'area',
            height: height
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            categories: data[0]?.categories,
            title: { text: xAxisLabel }
        },
        yAxis: {
            ...chartTheme.yAxis,
            title: { text: yAxisLabel }
        },
        plotOptions: {
            area: {
                stacking: stacking,
                marker: {
                    enabled: false,
                    symbol: 'circle',
                    radius: 2,
                    states: {
                        hover: { enabled: true }
                    }
                }
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

AreaChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        data: PropTypes.array.isRequired,
        categories: PropTypes.array
    })).isRequired,
    stacking: PropTypes.oneOf(['normal', 'percent', null]),
    xAxisLabel: PropTypes.string,
    yAxisLabel: PropTypes.string,
    height: PropTypes.number
};

export default AreaChart;
