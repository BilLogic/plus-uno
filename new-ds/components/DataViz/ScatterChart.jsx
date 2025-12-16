import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from './chartTheme';

/**
 * ScatterChart Component
 * Visualizes correlation between two variables.
 */
const ScatterChart = ({
    data,
    xAxisLabel,
    yAxisLabel,
    height = 300
}) => {
    // data: keys of { name, data: [[x,y], [x,y]...] }

    const seriesWithTheme = data.map((s, i) => ({
        ...s,
        type: 'scatter',
        color: s.color || chartTheme.colors[i % chartTheme.colors.length]
    }));

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'scatter',
            height: height
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            title: {
                ...chartTheme.xAxis.title,
                text: xAxisLabel
            },
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true
        },
        yAxis: {
            ...chartTheme.yAxis,
            title: {
                ...chartTheme.yAxis.title,
                text: yAxisLabel
            }
        },
        plotOptions: {
            scatter: {
                marker: {
                    radius: 5,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: 'rgb(100,100,100)'
                        }
                    }
                },
                states: {
                    hover: {
                        marker: {
                            enabled: false
                        }
                    }
                },
                tooltip: {
                    headerFormat: '<b>{series.name}</b><br>',
                    pointFormat: '{point.x}, {point.y}'
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

ScatterChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        data: PropTypes.arrayOf(PropTypes.array).isRequired, // [[x,y], ...]
        color: PropTypes.string
    })).isRequired,
    xAxisLabel: PropTypes.string,
    yAxisLabel: PropTypes.string,
    height: PropTypes.number
};

export default ScatterChart;
