import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme from '@/dataviz/chartTheme';
import { seriesColor, sortCategories } from '@/dataviz/palette';

/**
 * StreamgraphChart Component
 * Shows how composition changes over time with flowing shapes.
 * Great for showing trends and relative proportions.
 */
const StreamgraphChart = ({
    series = [],
    categories = [],
    height = 400,
    sort = false,
}) => {
    const { categories: orderedCategories, series: orderedSeries } = useMemo(
        () =>
            sort
                ? sortCategories({
                      categories,
                      series,
                      value: (d) => (typeof d === 'number' ? d : d?.y),
                  })
                : { categories, series },
        [categories, series, sort],
    );

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'streamgraph',
            height: height
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            categories: orderedCategories,
            maxPadding: 0,
            type: 'category'
        },
        yAxis: {
            visible: false,
            startOnTick: false,
            endOnTick: false
        },
        tooltip: {
            ...chartTheme.tooltip,
            shared: true
        },
        plotOptions: {
            series: {
                label: { enabled: false }
            }
        },
        legend: {
            enabled: true
        },
        series: orderedSeries.map((s, i, all) => ({
            name: s.name,
            data: s.data,
            color: s.color || seriesColor(i, all.length)
        }))
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
        </div>
    );
};

StreamgraphChart.propTypes = {
    /** Array of series {name, data: []} */
    series: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        data: PropTypes.arrayOf(PropTypes.number).isRequired,
        color: PropTypes.string
    })),
    /** X-axis categories */
    categories: PropTypes.arrayOf(PropTypes.string),
    /** Chart height */
    height: PropTypes.number,
    /** Sort categories from most to least by the first series; false by default on temporal axes. */
    sort: PropTypes.bool,
};

export default StreamgraphChart;
