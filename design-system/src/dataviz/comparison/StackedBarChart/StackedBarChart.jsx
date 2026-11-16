import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme, { CHART_GRID_WIDTH_NUMBER, CHART_LINE_WIDTH_NUMBER, CHART_BAR_RADIUS } from '@/dataviz/chartTheme';
import { CHART_VALUE_CLASS } from '@/dataviz/chartFormat';
import { BRAND, CATEGORICAL, CHROME, sortCategories } from '@/dataviz/palette';
import { inkFor, resolveColor, textInks, useColorModeKey } from '@/dataviz/colorMode';

/**
 * StackedBarChart Component
 * Displays a stacked bar chart using Highcharts.
 */
const StackedBarChart = ({ data = [], dates = [], yLabels, height = 207, yAxisMax, sort = false }) => {
    // Labels sit on their segment, so their ink is resolved per mode: re-render when it changes.
    useColorModeKey();
    const inks = textInks();

    const { categories: orderedDates, series: [{ data: orderedData }] } = useMemo(
        () =>
            sort
                ? sortCategories({
                    categories: dates,
                    series: [{ data }],
                    value: (bar) =>
                        (bar?.segments || []).reduce((sum, seg) => sum + parseFloat(seg.height), 0),
                })
                : { categories: dates, series: [{ data }] },
        [dates, data, sort],
    );

    const maxSegments = Math.max(0, ...orderedData.map(d => d.segments.length));
    const series = [];

    for (let i = 0; i < maxSegments; i++) {
        const defaultColor = maxSegments === 1 ? BRAND : CATEGORICAL[i % CATEGORICAL.length];
        const seriesData = orderedData.map(bar => {
            const segment = bar.segments[i];
            if (!segment) return 0;

            return {
                y: parseFloat(segment.height),
                color: segment.color || defaultColor,
                customValue: segment.value,
                textColor: segment.textColor
            };
        });

        series.push({
            name: `Segment ${i + 1}`,
            data: seriesData,
            stack: 'total'
        });
    }

    // Calculate max value from all segments if not provided
    let calculatedMax = yAxisMax;
    if (!calculatedMax) {
        const barTotals = orderedData.map(bar => {
            return bar.segments.reduce((sum, seg) => sum + parseFloat(seg.height), 0);
        });
        const maxValue = Math.max(...barTotals, 0);
        calculatedMax = Math.ceil(maxValue / 10) * 10;
        if (calculatedMax < 10) calculatedMax = 10;
    }

    const tickCount = 6;
    const tickStep = calculatedMax / (tickCount - 1);
    const tickPositions = Array.from({ length: tickCount }, (_, i) => 
        Math.round(i * tickStep)
    );

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'column',
            height: height
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            categories: orderedDates,
            tickWidth: 0
        },
        yAxis: {
            ...chartTheme.yAxis,
            min: 0,
            max: calculatedMax,
            reversedStacks: false,
            lineWidth: CHART_GRID_WIDTH_NUMBER,
            tickPositions: tickPositions,
            title: { ...chartTheme.yAxis.title, text: null },
            gridLineDashStyle: 'Dot',
        },
        plotOptions: {
            column: {
                stacking: 'normal',
                dataLabels: {
                    enabled: true,
                    formatter: function () {
                        if (this.point.y < 1) return null;
                        const ink = this.point.textColor || inkFor(resolveColor(this.point.color), inks);
                        return `<span class="${CHART_VALUE_CLASS}" style="color: ${ink}">${this.point.customValue}</span>`;
                    },
                },
                // A line-width inverse-border gap separates adjacent stacked segments so touching fills stay distinct.
                borderWidth: CHART_LINE_WIDTH_NUMBER,
                borderColor: CHROME.separator,
                borderRadius: CHART_BAR_RADIUS,
            }
        },
        tooltip: {
            ...chartTheme.tooltip,
            enabled: true
        },
        legend: { enabled: false },
        credits: { enabled: false },
        series: series
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <PlusChart options={options} />
        </div>
    );
};

StackedBarChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
        segments: PropTypes.arrayOf(PropTypes.shape({
            value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            color: PropTypes.string,
            height: PropTypes.string.isRequired, // '25%'
            textColor: PropTypes.string
        })).isRequired
    })).isRequired,
    dates: PropTypes.arrayOf(PropTypes.string).isRequired,
    yLabels: PropTypes.arrayOf(PropTypes.string), // ignored in favor of axis logic mostly
    height: PropTypes.number,
    yAxisMax: PropTypes.number, // Optional override for y-axis max (auto-calculated if not provided)
    /** Sort columns from most to least by total height; false by default because dates is a temporal axis. */
    sort: PropTypes.bool,
};

export default StackedBarChart;
