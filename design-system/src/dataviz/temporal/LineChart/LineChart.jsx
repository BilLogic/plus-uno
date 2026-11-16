import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme from '@/dataviz/chartTheme';
import { seriesColor, sortCategories } from '@/dataviz/palette';

/**
 * LineChart Component
 * Visualizes trends over time or categories.
 */
const LineChart = ({
    data,
    categories,
    xAxisLabel,
    yAxisLabel,
    height = 300,
    yDomain,
    yTicks,
    sort = false,
}) => {
    const rawCategories = categories ?? data[0]?.categories;
    const { categories: orderedCategories, series: orderedData } = useMemo(
        () =>
            sort && Array.isArray(rawCategories)
                ? sortCategories({
                      categories: rawCategories,
                      series: data,
                      value: (d) => (typeof d === 'number' ? d : d?.y),
                  })
                : { categories: rawCategories, series: data },
        [rawCategories, data, sort],
    );

    const seriesWithTheme = orderedData.map((s, i, all) => ({
        ...s,
        color: s.color || seriesColor(i, all.length),
    }));

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'line',
            height: height,
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            title: {
                ...chartTheme.xAxis.title,
                text: xAxisLabel,
            },
            categories: orderedCategories,
        },
        yAxis: {
            ...chartTheme.yAxis,
            title: {
                ...chartTheme.yAxis.title,
                text: yAxisLabel,
            },
            ...(yDomain ? { min: yDomain[0], max: yDomain[1] } : {}),
            ...(yTicks ? { tickPositions: yTicks } : {}),
        },
        plotOptions: {
            line: {
                marker: {
                    enabled: true,
                    symbol: 'circle',
                },
            },
        },
        legend: { enabled: true },
        series: seriesWithTheme,
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
        </div>
    );
};

LineChart.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            data: PropTypes.array.isRequired,
            color: PropTypes.string,
            categories: PropTypes.array,
        }),
    ).isRequired,
    /** X-axis period labels, one per point. May also be passed on the first series. */
    categories: PropTypes.arrayOf(PropTypes.string),
    xAxisLabel: PropTypes.string,
    yAxisLabel: PropTypes.string,
    height: PropTypes.number,
    /** The y-axis domain as [min, max]; omitted, Highcharts fits it to the data */
    yDomain: PropTypes.arrayOf(PropTypes.number),
    /** The y-axis tick values, e.g. [0, 25, 50, 75, 100]; omitted, Highcharts picks them */
    yTicks: PropTypes.arrayOf(PropTypes.number),
    /** Sort categories from most to least by the first series; false by default on temporal axes. */
    sort: PropTypes.bool,
};

export default LineChart;
