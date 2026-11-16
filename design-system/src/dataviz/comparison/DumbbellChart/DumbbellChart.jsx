import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme, { CHART_LINE_WIDTH_NUMBER } from '@/dataviz/chartTheme';
import { CATEGORICAL, sortCategories } from '@/dataviz/palette';

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
    horizontal = true,
    sort = true,
}) => {
    const { categories: orderedCategories, series: [{ data: orderedData }] } = useMemo(
        () =>
            sort
                // Dumbbells encode the change between two endpoints, so rank categories by gap size.
                ? sortCategories({ categories, series: [{ data }], value: (d) => Math.abs(d.high - d.low) })
                : { categories, series: [{ data }] },
        [categories, data, sort],
    );

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
            categories: orderedCategories,
            type: 'category'
        },
        yAxis: {
            ...chartTheme.yAxis,
            title: { ...chartTheme.yAxis.title, text: yAxisLabel }
        },
        tooltip: {
            ...chartTheme.tooltip,
            shared: true
        },
        legend: {
            ...chartTheme.legend,
            enabled: true,
            align: 'right',
            verticalAlign: 'top'
        },
        series: [{
            name: `${lowLabel} → ${highLabel}`,
            data: orderedData.map((item, index) => ({
                low: item.low,
                high: item.high,
                name: orderedCategories[index] || `Item ${index + 1}`
            })),
            color: CATEGORICAL[0],
            lowColor: CATEGORICAL[1],
            connectorWidth: CHART_LINE_WIDTH_NUMBER
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
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
    horizontal: PropTypes.bool,
    /** Sort categories from most to least by default; pass false for ordinal or temporal axes. */
    sort: PropTypes.bool,
};

export default DumbbellChart;
