import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme, { CHART_LINE_WIDTH_NUMBER, CHART_GRID_WIDTH_NUMBER } from '@/dataviz/chartTheme';
import { valueSpan } from '@/dataviz/chartFormat';
import { BRAND, CHROME, sortCategories } from '@/dataviz/palette';

/**
 * BoxPlotChart Component
 * Shows statistical distribution with min, max, median, and quartiles.
 * Great for comparing distributions across categories.
 */
const BoxPlotChart = ({
    data = [],
    categories = [],
    yAxisLabel = 'Value',
    height = 400,
    sort = true
}) => {
    const {
        categories: orderedCategories,
        series: [{ data: orderedData }],
    } = useMemo(
        () =>
            sort
                ? sortCategories({
                      categories,
                      series: [{ data }],
                      value: (d) => (Array.isArray(d) ? d[2] : d?.median ?? 0),
                  })
                : { categories, series: [{ data }] },
        [categories, data, sort],
    );

    const tooltipFormat = {
        ...chartTheme.tooltip,
        pointFormat: [
            `Maximum: ${valueSpan('{point.high}')}`,
            `Upper quartile: ${valueSpan('{point.q3}')}`,
            `Median: ${valueSpan('{point.median}')}`,
            `Lower quartile: ${valueSpan('{point.q1}')}`,
            `Minimum: ${valueSpan('{point.low}')}`,
        ].join('<br/>')
    };

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'boxplot',
            height: height
        },
        title: { text: null },
        legend: { enabled: false },
        xAxis: {
            ...chartTheme.xAxis,
            categories: orderedCategories
        },
        yAxis: {
            ...chartTheme.yAxis,
            title: { ...chartTheme.yAxis.title, text: yAxisLabel }
        },
        tooltip: tooltipFormat,
        plotOptions: {
            boxplot: {
                fillColor: BRAND,
                lineWidth: CHART_LINE_WIDTH_NUMBER,
                medianColor: CHROME.separator,
                // The median line reads as the one line in the box this chart asks a reader to find first — a step bolder than the box outline, off the same stroke token rather than a bare `3`.
                medianWidth: CHART_LINE_WIDTH_NUMBER * 1.5,
                stemColor: BRAND,
                stemWidth: CHART_GRID_WIDTH_NUMBER,
                whiskerColor: BRAND,
                whiskerLength: '50%',
                whiskerWidth: CHART_LINE_WIDTH_NUMBER,
                tooltip: tooltipFormat
            }
        },
        series: [{
            name: 'Distribution',
            data: orderedData,
            color: BRAND
        }]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
        </div>
    );
};

BoxPlotChart.propTypes = {
    /** Array of [low, q1, median, q3, high] for each category */
    data: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
    /** Category labels */
    categories: PropTypes.arrayOf(PropTypes.string),
    /** Y-axis label */
    yAxisLabel: PropTypes.string,
    /** Chart height */
    height: PropTypes.number,
    /** Sort categories from most to least by median; pass false for ordinal or temporal axes. */
    sort: PropTypes.bool
};

export default BoxPlotChart;
