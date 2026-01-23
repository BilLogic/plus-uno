import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * RadarChart Component
 * A polar chart (spider web chart) using Highcharts.
 * Useful for comparing multivariate data.
 */
const RadarChart = ({
    categories,
    series,
    height = 400,
    filled = false,
    yAxisMax,
    showLegend = true,
    categoryColors,
    showDataLabels = false,
    chartSpacing
}) => {
    // Merge theme colors into series if not provided
    // Handle dashStyle and type for mixed area/line charts
    const seriesWithTheme = series.map((s, i) => {
        const baseSeries = {
            ...s,
            color: s.color || chartTheme.colors[i % chartTheme.colors.length],
            pointPlacement: 'on'
        };
        
        // If filled is true, first series should be area, others should be line
        if (filled) {
            if (i === 0) {
                // First series: filled area
                baseSeries.type = 'area';
            } else {
                // Other series: line (can be dashed)
                baseSeries.type = 'line';
                if (s.dashStyle) {
                    baseSeries.dashStyle = s.dashStyle;
                }
            }
        } else {
            // All series are lines
            baseSeries.type = 'line';
            if (s.dashStyle) {
                baseSeries.dashStyle = s.dashStyle;
            }
        }
        
        return baseSeries;
    });

    // Build xAxis labels with colors if categoryColors provided
    const xAxisConfig = {
        ...chartTheme.xAxis,
        categories: categories,
        tickmarkPlacement: 'on',
        lineWidth: 0
    };

    if (categoryColors && categories) {
        xAxisConfig.labels = {
            ...chartTheme.xAxis.labels,
            formatter: function() {
                const categoryIndex = this.pos;
                const category = categories[categoryIndex];
                let color = 'var(--color-on-surface)';
                
                // Handle object mapping (category name -> color)
                if (Array.isArray(categoryColors)) {
                    color = categoryColors[categoryIndex] || color;
                } else {
                    // Handle object mapping
                    color = categoryColors[category] || categoryColors[categoryIndex] || color;
                }
                
                return `<span style="color: ${color}">${this.value}</span>`;
            },
            useHTML: true
        };
    }

    // Determine chart type - use 'line' for mixed area/line, or specific type
    const chartType = filled ? 'line' : 'line'; // Use 'line' as base, series will define their types
    
    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            polar: true,
            type: chartType,
            height: height,
            spacing: chartSpacing !== undefined ? chartSpacing : chartTheme.chart.spacing
        },
        title: { text: null },
        xAxis: xAxisConfig,
        yAxis: {
            ...chartTheme.yAxis,
            gridLineInterpolation: 'polygon',
            lineWidth: 0,
            min: 0,
            max: yAxisMax,
            labels: {
                ...chartTheme.yAxis.labels,
                enabled: true // Show y-axis labels
            }
        },
        tooltip: {
            ...chartTheme.tooltip,
            shared: true,
            pointFormat: '<span style="color:{series.color}">{series.name}: <b>{point.y:,.0f}</b><br/>'
        },
        legend: {
            ...chartTheme.legend,
            enabled: showLegend,
            align: 'right',
            verticalAlign: 'top',
            layout: 'vertical'
        },
        plotOptions: {
            area: {
                dataLabels: {
                    enabled: showDataLabels && filled,
                    format: '{y}%',
                    style: {
                        fontSize: 'var(--font-size-body3, 0.75rem)', // 12px
                        fontWeight: 'var(--font-weight-body3-semibold, 400)', // Semibold
                        fontFamily: 'var(--font-family-body, "Merriweather Sans", "Open Sans", sans-serif)',
                        color: 'var(--color-on-surface, #191c1e)',
                        textOutline: 'none'
                    },
                    allowOverlap: true,
                    y: -5 // Slight offset above the point
                }
            },
            line: {
                dataLabels: {
                    enabled: showDataLabels && !filled,
                    format: '{y}%',
                    style: {
                        fontSize: 'var(--font-size-body3, 0.75rem)', // 12px
                        fontWeight: 'var(--font-weight-body3-semibold, 400)', // Semibold
                        fontFamily: 'var(--font-family-body, "Merriweather Sans", "Open Sans", sans-serif)',
                        color: 'var(--color-on-surface, #191c1e)',
                        textOutline: 'none'
                    },
                    allowOverlap: true,
                    y: -5 // Slight offset above the point
                }
            }
        },
        series: seriesWithTheme
    };

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

RadarChart.propTypes = {
    categories: PropTypes.arrayOf(PropTypes.string).isRequired,
    series: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        data: PropTypes.arrayOf(PropTypes.number).isRequired,
        color: PropTypes.string
    })).isRequired,
    height: PropTypes.number,
    filled: PropTypes.bool,
    yAxisMax: PropTypes.number,
    showLegend: PropTypes.bool,
    categoryColors: PropTypes.oneOfType([
        PropTypes.object, // Object mapping category names to colors
        PropTypes.arrayOf(PropTypes.string) // Array of colors matching category order
    ]),
    showDataLabels: PropTypes.bool,
    chartSpacing: PropTypes.arrayOf(PropTypes.number) // [top, right, bottom, left] spacing for chart
};

export default RadarChart;
