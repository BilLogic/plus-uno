import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme, { CHART_BAR_RADIUS } from '@/dataviz/chartTheme';
import { CATEGORICAL, sortCategories } from '@/dataviz/palette';

/**
 * ParetoChart Component
 * Shows columns with a cumulative line (80-20 analysis).
 * Great for identifying the most significant factors.
 */
const ParetoChart = ({
    data = [],
    categories = [],
    yAxisLabel = 'Value',
    height = 400,
    sort = true,
}) => {
    const { categories: orderedCategories, data: orderedData } = useMemo(
        () => sortCategories({ categories, data, sort }),
        [categories, data, sort],
    );

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            height: height
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            categories: orderedCategories
        },
        yAxis: [{
            ...chartTheme.yAxis,
            title: { ...chartTheme.yAxis.title, text: yAxisLabel }
        }, {
            ...chartTheme.yAxis,
            title: { ...chartTheme.yAxis.title, text: 'Cumulative %' },
            opposite: true,
            max: 100,
            labels: { ...chartTheme.yAxis.labels, format: '{value}%' }
        }],
        plotOptions: {
            column: {
                borderWidth: 0,
                borderRadius: CHART_BAR_RADIUS,
            }
        },
        tooltip: {
            ...chartTheme.tooltip,
            shared: true
        },
        series: [{
            type: 'pareto',
            name: 'Cumulative',
            yAxis: 1,
            zIndex: 10,
            baseSeries: 1,
            color: CATEGORICAL[1]
        }, {
            type: 'column',
            name: 'Values',
            data: orderedData,
            color: CATEGORICAL[0]
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
        </div>
    );
};

ParetoChart.propTypes = {
    /** Array of numerical values */
    data: PropTypes.arrayOf(PropTypes.number),
    /** Category labels */
    categories: PropTypes.arrayOf(PropTypes.string),
    /** Y-axis label */
    yAxisLabel: PropTypes.string,
    /** Chart height */
    height: PropTypes.number,
    /** Sort categories from most to least by default; pass false for ordinal or temporal axes. */
    sort: PropTypes.bool,
};

export default ParetoChart;
