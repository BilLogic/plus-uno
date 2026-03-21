import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * BulletChart Component
 * Shows actual vs target values with qualitative ranges.
 * Great for KPI dashboards.
 */
const BulletChart = ({
    data = [],
    categories = [],
    height = 200
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'bullet',
            height: height,
            inverted: true
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            categories: categories
        },
        yAxis: {
            ...chartTheme.yAxis,
            gridLineWidth: 0,
            plotBands: [{
                from: 0,
                to: 60,
                color: 'var(--color-danger-container)'
            }, {
                from: 60,
                to: 80,
                color: 'var(--color-warning-container)'
            }, {
                from: 80,
                to: 100,
                color: 'var(--color-success-container)'
            }],
            max: 100
        },
        tooltip: {
            ...chartTheme.tooltip,
            pointFormat: '<b>{point.y}</b> (target: {point.target})'
        },
        plotOptions: {
            bullet: {
                pointPadding: 0.25,
                borderWidth: 0,
                color: chartTheme.colors[0],
                targetOptions: {
                    width: '140%',
                    color: 'var(--color-on-surface)'
                }
            }
        },
        series: [{
            data: data
        }],
        legend: { enabled: false }
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

BulletChart.propTypes = {
    /** Array of { y: actual, target: target } objects */
    data: PropTypes.arrayOf(PropTypes.shape({
        y: PropTypes.number,
        target: PropTypes.number
    })),
    /** Category labels */
    categories: PropTypes.arrayOf(PropTypes.string),
    /** Chart height */
    height: PropTypes.number
};

export default BulletChart;
