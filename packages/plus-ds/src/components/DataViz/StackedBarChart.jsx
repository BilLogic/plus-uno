import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from './chartTheme';

/**
 * StackedBarChart Component
 * Displays a stacked bar chart using Highcharts.
 */
const StackedBarChart = ({ data, dates, yLabels, height = 207 }) => {
    // data: Array of { segments: [{ value, color, height (%), textColor }] }
    // dates: Array of strings (x-axis categories)

    // Transform data:
    // Highcharts stacked column needs series by "Category" (segment type).
    // The input makes it array-of-bars. We need to transpose this if the segments align (e.g. all bars have "Segment 1", "Segment 2").
    // If segments are arbitrary, Highcharts is tricky. 
    // Assuming segments are consistent across bars for a stacked chart.

    // Let's assume the order of segments in each bar corresponds to the same series.
    // e.g. Bottom segment is Series 1, Next is Series 2, etc.

    const maxSegments = Math.max(...data.map(d => d.segments.length));
    const series = [];

    for (let i = 0; i < maxSegments; i++) {
        const seriesData = data.map(bar => {
            const segment = bar.segments[i];
            // If this bar doesn't have this segment, 0
            if (!segment) return 0;

            // value is the label e.g. "15", height is string "%".
            // We need a numeric Y value. If height is implicit % of total, we can use it.
            return {
                y: parseFloat(segment.height), // Parse "25%" -> 25
                color: segment.color,
                // Custom data label value to check later
                customValue: segment.value,
                textColor: segment.textColor
            };
        });

        series.push({
            name: `Segment ${i + 1}`, // Placeholder names as they aren't provided
            data: seriesData,
            stack: 'total'
        });
    }

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'column',
            height: height
        },
        title: { text: null },
        xAxis: {
            categories: dates,
            labels: {
                style: {
                    fontSize: 'var(--font-size-body3, 12px)',
                    color: 'var(--color-on-surface-variant, #3f484a)'
                }
            },
            lineColor: 'var(--color-outline-variant, #bec8ca)',
            tickWidth: 0
        },
        yAxis: {
            min: 0,
            max: 100, // Stacked percent
            title: { text: null },
            gridLineWidth: 1,
            gridLineColor: 'var(--color-surface-container, #eaeef0)',
            tickPositions: [0, 25, 50, 75, 100],
            labels: {
                format: '{value}%',
                style: {
                    fontSize: 'var(--font-size-body3, 12px)',
                    color: 'var(--color-on-surface-variant, #3f484a)'
                }
            }
        },
        plotOptions: {
            column: {
                stacking: 'normal',
                dataLabels: {
                    enabled: true,
                    // Use the customValue we stored (the number inside the bar)
                    formatter: function () {
                        return this.point.customValue;
                    },
                    style: {
                        color: 'var(--color-on-primary, #ffffff)',
                        textOutline: 'none',
                        fontWeight: 'var(--font-weight-normal, 400)',
                        fontSize: 'var(--font-size-body3, 12px)'
                    }
                },
                borderWidth: 0,
                // Adjust bar width if needed
                pointWidth: 34
            }
        },
        tooltip: {
            enabled: true
        },
        legend: { enabled: false },
        credits: { enabled: false },
        series: series
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

StackedBarChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
        segments: PropTypes.arrayOf(PropTypes.shape({
            value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            color: PropTypes.string.isRequired,
            height: PropTypes.string.isRequired, // '25%'
            textColor: PropTypes.string
        })).isRequired
    })).isRequired,
    dates: PropTypes.arrayOf(PropTypes.string).isRequired,
    yLabels: PropTypes.arrayOf(PropTypes.string), // ignored in favor of axis logic mostly
    height: PropTypes.number
};

export default StackedBarChart;
