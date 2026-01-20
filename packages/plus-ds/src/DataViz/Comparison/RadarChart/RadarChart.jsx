import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * RadarChart Component
 * A polar chart (spider web chart) using Highcharts.
 * Useful for comparing multivariate data.
 */
const RadarChart = ({
    categories,
    series,
    height = 400,
    filled = false,
    yAxisMax
}) => {
    // Merge theme colors into series if not provided
    const seriesWithTheme = series.map((s, i) => ({
        ...s,
        color: s.color || chartTheme.colors[i % chartTheme.colors.length],
        pointPlacement: 'on'
    }));

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            polar: true,
            type: filled ? 'area' : 'line',
            height: height
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            categories: categories,
            tickmarkPlacement: 'on',
            lineWidth: 0
        },
        yAxis: {
            ...chartTheme.yAxis,
            gridLineInterpolation: 'polygon',
            lineWidth: 0,
            min: 0,
            max: yAxisMax,
            labels: {
                ...chartTheme.yAxis.labels,
                enabled: true // Show y-axis labels
            }
        },
        tooltip: {
            ...chartTheme.tooltip,
            shared: true,
            pointFormat: '<span style="color:{series.color}">{series.name}: <b>{point.y:,.0f}</b><br/>'
        },
        legend: {
            ...chartTheme.legend,
            align: 'right',
            verticalAlign: 'top',
            layout: 'vertical'
        },
        series: seriesWithTheme
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

RadarChart.propTypes = {
    categories: PropTypes.arrayOf(PropTypes.string).isRequired,
    series: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        data: PropTypes.arrayOf(PropTypes.number).isRequired,
        color: PropTypes.string
    })).isRequired,
    height: PropTypes.number,
    filled: PropTypes.bool,
    yAxisMax: PropTypes.number
};

export default RadarChart;
