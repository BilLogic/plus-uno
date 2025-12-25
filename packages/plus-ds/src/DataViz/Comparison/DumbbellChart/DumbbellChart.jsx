import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * DumbbellChart Component
 * Shows the change or gap between two values for each category.
 * Great for before/after comparisons, ranges, and gaps.
 */
const DumbbellChart = ({
    data = [],
    categories = [],
    lowLabel = 'Low',
    highLabel = 'High',
    yAxisLabel = 'Value',
    height = 400,
    horizontal = true
}) => {
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'dumbbell',
            height: height,
            inverted: horizontal
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            categories: categories,
            type: 'category'
        },
        yAxis: {
            ...chartTheme.yAxis,
            title: { text: yAxisLabel, style: chartTheme.yAxis.labels.style }
        },
        tooltip: {
            ...chartTheme.tooltip,
            shared: true
        },
        legend: {
            enabled: true,
            align: 'right',
            verticalAlign: 'top'
        },
        series: [{
            name: `${lowLabel} → ${highLabel}`,
            data: data.map((item, index) => ({
                low: item.low,
                high: item.high,
                name: categories[index] || `Item ${index + 1}`
            })),
            color: chartTheme.colors[0],
            lowColor: chartTheme.colors[1],
            connectorWidth: 2
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

DumbbellChart.propTypes = {
    /** Array of objects with { low, high } values */
    data: PropTypes.arrayOf(PropTypes.shape({
        low: PropTypes.number.isRequired,
        high: PropTypes.number.isRequired
    })),
    /** Category labels */
    categories: PropTypes.arrayOf(PropTypes.string),
    /** Label for low value */
    lowLabel: PropTypes.string,
    /** Label for high value */
    highLabel: PropTypes.string,
    /** Y-axis label */
    yAxisLabel: PropTypes.string,
    /** Chart height */
    height: PropTypes.number,
    /** Horizontal orientation */
    horizontal: PropTypes.bool
};

export default DumbbellChart;
