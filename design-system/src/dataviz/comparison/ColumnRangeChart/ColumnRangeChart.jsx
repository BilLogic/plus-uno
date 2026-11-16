import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme, { CHART_BAR_RADIUS } from '@/dataviz/chartTheme';
import { BRAND, sortCategories } from '@/dataviz/palette';

/**
 * ColumnRangeChart Component
 * Shows ranges between min and max values for each category.
 * Great for temperature ranges, schedules, and duration visualization.
 */
const ColumnRangeChart = ({
    data = [],
    categories = [],
    yAxisLabel = 'Value',
    height = 400,
    horizontal = false,
    sort = true,
}) => {
    const { categories: orderedCategories, series: [{ data: orderedData }] } = useMemo(
        () =>
            sort
                // Range columns encode span length, so rank categories from widest span to narrowest.
                ? sortCategories({ categories, series: [{ data }], value: (d) => d.high - d.low })
                : { categories, series: [{ data }] },
        [categories, data, sort],
    );

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'columnrange',
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
            valueSuffix: ''
        },
        plotOptions: {
            columnrange: {
                borderWidth: 0,
                borderRadius: CHART_BAR_RADIUS,
                dataLabels: {
                    enabled: true,
                    format: '{y}'
                }
            }
        },
        legend: { enabled: false },
        series: [{
            name: 'Range',
            data: orderedData.map(item => [item.low, item.high]),
            color: BRAND
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
        </div>
    );
};

ColumnRangeChart.propTypes = {
    /** Array of objects with { low, high } values */
    data: PropTypes.arrayOf(PropTypes.shape({
        low: PropTypes.number.isRequired,
        high: PropTypes.number.isRequired
    })),
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

export default ColumnRangeChart;
