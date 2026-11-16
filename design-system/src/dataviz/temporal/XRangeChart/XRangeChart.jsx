import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme from '@/dataviz/chartTheme';
import { seriesColor, sortCategories } from '@/dataviz/palette';

/**
 * XRangeChart Component
 * Shows ranges on an X-axis, often used for Gantt-like charts.
 * Great for scheduling, duration tracking, and resource allocation.
 */
const XRangeChart = ({
    data = [],
    categories = [],
    height = 400,
    sort = false,
}) => {
    const { categories: orderedCategories, items: orderedItems } = useMemo(() => {
        if (!sort || categories.length === 0) {
            return { categories, items: data };
        }
        const durations = categories.map((_, idx) =>
            data
                .filter((item) => item.y === idx)
                .reduce((sum, item) => sum + Math.max(0, (item.end ?? 0) - (item.start ?? 0)), 0),
        );
        const { categories: nextCategories, order } = sortCategories({
            categories,
            series: [{ data: durations }],
            value: (d) => d,
        });
        const newRowByOld = new Map(order.map((oldIdx, newIdx) => [oldIdx, newIdx]));
        return {
            categories: nextCategories,
            items: data.map((item) => ({
                ...item,
                y: newRowByOld.get(item.y) ?? item.y,
            })),
        };
    }, [categories, data, sort]);

    const rowCount = Math.max(orderedCategories.length, 1);

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'xrange',
            height: height,
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            type: 'datetime',
        },
        yAxis: {
            ...chartTheme.yAxis,
            title: {
                ...chartTheme.yAxis.title,
                text: '',
            },
            categories: orderedCategories,
            reversed: true,
        },
        tooltip: {
            ...chartTheme.tooltip,
        },
        series: [
            {
                name: 'Tasks',
                data: orderedItems.map((item) => ({
                    x: item.start,
                    x2: item.end,
                    y: item.y,
                    name: item.name,
                    color: item.color || seriesColor(item.y, rowCount),
                })),
                dataLabels: {
                    enabled: true,
                },
            },
        ],
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
        </div>
    );
};

XRangeChart.propTypes = {
    /** Array of tasks {start, end, y, name, color} */
    data: PropTypes.arrayOf(
        PropTypes.shape({
            start: PropTypes.number.isRequired,
            end: PropTypes.number.isRequired,
            y: PropTypes.number.isRequired,
            name: PropTypes.string,
            color: PropTypes.string,
        }),
    ),
    /** Y-axis categories */
    categories: PropTypes.arrayOf(PropTypes.string),
    /** Chart height */
    height: PropTypes.number,
    /** Sort rows from most to least total duration; false by default to preserve schedule or stage order. */
    sort: PropTypes.bool,
};

export default XRangeChart;
