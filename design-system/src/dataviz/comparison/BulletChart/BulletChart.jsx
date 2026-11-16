import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme, { CHART_BAR_RADIUS } from '@/dataviz/chartTheme';
import { valueSpan } from '@/dataviz/chartFormat';
import { BRAND, sortCategories } from '@/dataviz/palette';

/**
 * BulletChart Component
 * Shows actual vs target values with qualitative ranges.
 * Great for KPI dashboards.
 */
const BulletChart = ({
    data = [],
    categories = [],
    height = 200,
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
            type: 'bullet',
            height: height,
            inverted: true
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            categories: orderedCategories
        },
        yAxis: {
            ...chartTheme.yAxis,
            gridLineWidth: 0,
            plotBands: [{
                from: 0,
                to: 60,
                color: 'var(--ds-background-danger)'
            }, {
                from: 60,
                to: 80,
                color: 'var(--ds-background-warning)'
            }, {
                from: 80,
                to: 100,
                color: 'var(--ds-background-success)'
            }],
            max: 100
        },
        tooltip: {
            ...chartTheme.tooltip,
            pointFormat: `${valueSpan('{point.y}')} (target: ${valueSpan('{point.target}')})`
        },
        plotOptions: {
            bullet: {
                pointPadding: 0.25,
                borderWidth: 0,
                borderRadius: CHART_BAR_RADIUS,
                color: BRAND,
                targetOptions: {
                    width: '140%',
                    // The target is a reference mark: the strongest gray, which reads on every band.
                    color: 'var(--chart-gray-boldest)'
                }
            }
        },
        series: [{
            data: orderedData
        }],
        legend: { enabled: false }
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
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
    height: PropTypes.number,
    /** Sort categories from most to least by default; pass false for ordinal or temporal axes. */
    sort: PropTypes.bool,
};

export default BulletChart;
