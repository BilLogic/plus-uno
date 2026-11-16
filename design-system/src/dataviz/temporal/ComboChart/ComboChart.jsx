import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme, { CHART_BAR_RADIUS } from '@/dataviz/chartTheme';
import { seriesColor, sortCategories } from '@/dataviz/palette';

/**
 * ComboChart Component
 * Combines column/bar data with line data.
 */
const ComboChart = ({
    barData,
    lineData,
    categories,
    primaryAxisLabel,
    secondaryAxisLabel,
    height = 300,
    sort = false,
}) => {
    const {
        categories: orderedCategories,
        barSeriesData,
        lineSeriesData,
    } = useMemo(() => {
        if (!sort) {
            return {
                categories,
                barSeriesData: barData,
                lineSeriesData: lineData,
            };
        }
        const combined = [...barData, ...lineData];
        const { categories: nextCategories, series: nextCombined } = sortCategories({
            categories,
            series: combined,
            value: (d) => (typeof d === 'number' ? d : d?.y),
        });
        return {
            categories: nextCategories,
            barSeriesData: nextCombined.slice(0, barData.length),
            lineSeriesData: nextCombined.slice(barData.length),
        };
    }, [categories, barData, lineData, sort]);

    const totalSeries = barSeriesData.length + lineSeriesData.length;

    const barSeries = barSeriesData.map((s, i) => ({
        ...s,
        type: 'column',
        color: s.color || seriesColor(i, totalSeries)
    }));

    const lineSeries = lineSeriesData.map((s, i) => ({
        ...s,
        type: 'line',
        color: s.color || seriesColor(i + barSeriesData.length, totalSeries),
        marker: {
            symbol: 'circle',
        }
    }));

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
        yAxis: [
            { // Primary yAxis
                ...chartTheme.yAxis,
                title: {
                    ...chartTheme.yAxis.title,
                    text: primaryAxisLabel
                }
            },
            { // Secondary yAxis
                ...chartTheme.yAxis,
                title: {
                    ...chartTheme.yAxis.title,
                    text: secondaryAxisLabel,
                },
                opposite: true
            }
        ],
        plotOptions: {
            column: {
                borderRadius: CHART_BAR_RADIUS,
            },
        },
        tooltip: {
            ...chartTheme.tooltip,
            shared: true
        },
        legend: { enabled: true },
        series: [...barSeries, ...lineSeries]
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
        </div>
    );
};

ComboChart.propTypes = {
    barData: PropTypes.array.isRequired,
    lineData: PropTypes.array.isRequired,
    categories: PropTypes.array.isRequired,
    primaryAxisLabel: PropTypes.string,
    secondaryAxisLabel: PropTypes.string,
    height: PropTypes.number,
    /** Sort categories from most to least by the first bar series; false by default on temporal axes. */
    sort: PropTypes.bool,
};

export default ComboChart;
