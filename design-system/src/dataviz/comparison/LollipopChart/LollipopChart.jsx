import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme from '@/dataviz/chartTheme';
import { valueSpan } from '@/dataviz/chartFormat';
import { BRAND, sortCategories } from '@/dataviz/palette';

/**
 * LollipopChart Component
 * Like a bar chart but with dots and stems.
 * Cleaner look when comparing many categories.
 */
const LollipopChart = ({
    data = [],
    categories = [],
    yAxisLabel = 'Value',
    height = 400,
    horizontal = true,
    sort = true,
}) => {
    const { categories: orderedCategories, series: [{ data: orderedData }] } = useMemo(
        () => (sort ? sortCategories({ categories, series: [{ data }] }) : { categories, series: [{ data }] }),
        [categories, data, sort],
    );

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'lollipop',
            height: height,
            inverted: horizontal
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            categories: orderedCategories
        },
        yAxis: {
            ...chartTheme.yAxis,
            title: { ...chartTheme.yAxis.title, text: yAxisLabel }
        },
        tooltip: {
            ...chartTheme.tooltip,
            pointFormat: valueSpan('{point.y}')
        },
        series: [{
            name: 'Values',
            data: orderedData,
            color: BRAND
        }],
        legend: { enabled: false }
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
        </div>
    );
};

LollipopChart.propTypes = {
    /** Array of numerical values */
    data: PropTypes.arrayOf(PropTypes.number),
    /** Category labels */
    categories: PropTypes.arrayOf(PropTypes.string),
    /** Y-axis label */
    yAxisLabel: PropTypes.string,
    /** Chart height */
    height: PropTypes.number,
    /** Horizontal orientation */
    horizontal: PropTypes.bool,
    /** Sort categories from most to least by default; pass false for ordinal or temporal axes. */
    sort: PropTypes.bool,
};

export default LollipopChart;
