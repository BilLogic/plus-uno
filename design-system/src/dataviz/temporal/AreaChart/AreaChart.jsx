import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme, { CHART_MARKER_RADIUS } from '@/dataviz/chartTheme';
import { seriesColor, sortCategories } from '@/dataviz/palette';

/**
 * AreaChart Component
 * Visualizes volume or magnitude trends.
 */
const AreaChart = ({
    data,
    categories,
    stacking = null, // 'normal', 'percent', or null
    xAxisLabel,
    yAxisLabel,
    height = 300,
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
        color: s.color || seriesColor(i, all.length)
    }));

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'area',
            height: height
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            categories: orderedCategories,
            title: {
                ...chartTheme.xAxis.title,
                text: xAxisLabel,
            }
        },
        yAxis: {
            ...chartTheme.yAxis,
            title: {
                ...chartTheme.yAxis.title,
                text: yAxisLabel,
            }
        },
        plotOptions: {
            area: {
                stacking: stacking,
                marker: {
                    enabled: false,
                    symbol: 'circle',
                    radius: CHART_MARKER_RADIUS
                }
            }
        },
        legend: { enabled: true },
        tooltip: {
            ...chartTheme.tooltip,
            shared: true
        },
        series: seriesWithTheme
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
        </div>
    );
};

AreaChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        data: PropTypes.array.isRequired,
        color: PropTypes.string,
        categories: PropTypes.array
    })).isRequired,
    /** X-axis period labels, one per point. Without them the axis counts 0, 1, 2. */
    categories: PropTypes.arrayOf(PropTypes.string),
    stacking: PropTypes.oneOf(['normal', 'percent', null]),
    xAxisLabel: PropTypes.string,
    yAxisLabel: PropTypes.string,
    height: PropTypes.number,
    /** Sort categories from most to least by the first series; false by default on temporal axes. */
    sort: PropTypes.bool,
};

export default AreaChart;
