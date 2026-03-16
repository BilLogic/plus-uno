import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * RadarChart Component
 * A polar chart (spider web chart) using Highcharts.
 * Useful for comparing multivariate data.
 * @param {number|'100%'} height - Chart height in pixels, or '100%' to fill container (responsive).
 */
const RadarChart = ({
    categories,
    series,
    height = 400,
    filled = false,
    yAxisMax,
    showLegend = true,
    categoryColors,
    categoryIcons,
    showDataLabels = false,
    chartSpacing,
    showYAxisLabels = true,
    categoryLabelBody3Regular = false
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

    // Build xAxis labels: B3 regular when requested, optional category colors.
    // overflow: 'allow' and allowOverlap prevent polar chart labels from being truncated.
    const xAxisConfig = {
        ...chartTheme.xAxis,
        categories: categories,
        tickmarkPlacement: 'on',
        lineWidth: 0,
        labels: {
            ...chartTheme.xAxis.labels,
            overflow: 'allow',
            allowOverlap: true,
            crop: false,
            style: {
                ...chartTheme.xAxis.labels.style,
                ...(categoryLabelBody3Regular && {
                    fontWeight: 'var(--font-weight-body3-regular, 400)'
                })
            }
        }
    };

    // Label formatter: icons when categoryIcons provided for this category; otherwise show category name (no generic circle)
    if (categoryIcons && categories) {
        xAxisConfig.labels = {
            ...xAxisConfig.labels,
            formatter: function() {
                const categoryIndex = this.pos;
                const iconClass = categoryIcons[categoryIndex];
                if (iconClass) {
                    return `<i class="fa-solid ${iconClass}" style="font-size: 14px; color: var(--color-on-surface-variant, #3f484a);" aria-hidden="true"></i>`;
                }
                return this.value ?? '';
            },
            useHTML: true
        };
    } else if (categoryColors && categories) {
        xAxisConfig.labels = {
            ...xAxisConfig.labels,
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

    // When height is '100%', we measure the container and pass pixel height to Highcharts
    const containerRef = useRef(null);
    const [measuredHeight, setMeasuredHeight] = useState(
        height === '100%' ? 300 : null
    );
    const isResponsive = height === '100%';

    useEffect(() => {
        if (!isResponsive || !containerRef.current) return;
        const el = containerRef.current;
        const updateHeight = () => {
            if (el?.offsetHeight) setMeasuredHeight(el.offsetHeight);
        };
        updateHeight();
        const ro = new ResizeObserver(updateHeight);
        ro.observe(el);
        return () => ro.disconnect();
    }, [isResponsive]);

    const chartHeightPx = isResponsive ? (measuredHeight ?? 300) : height;

    // Determine chart type - use 'line' for mixed area/line, or specific type
    const chartType = filled ? 'line' : 'line'; // Use 'line' as base, series will define their types

    const options = {
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            polar: true,
            type: chartType,
            height: chartHeightPx,
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
                enabled: showYAxisLabels
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
                fillOpacity: 0.45,
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

    const wrapperStyle = {
        width: '100%',
        height: isResponsive ? '100%' : height
    };

    return (
        <div ref={containerRef} style={wrapperStyle}>
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
    /** Height in pixels or '100%' to fill container (responsive) */
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(['100%'])]),
    filled: PropTypes.bool,
    yAxisMax: PropTypes.number,
    showLegend: PropTypes.bool,
    categoryColors: PropTypes.oneOfType([
        PropTypes.object, // Object mapping category names to colors
        PropTypes.arrayOf(PropTypes.string) // Array of colors matching category order
    ]),
    /** Font Awesome icon class names (e.g. ['fa-calculator', 'fa-comments']) – shown instead of category text; tooltip shows full name on hover */
    categoryIcons: PropTypes.arrayOf(PropTypes.string),
    showDataLabels: PropTypes.bool,
    chartSpacing: PropTypes.arrayOf(PropTypes.number), // [top, right, bottom, left] spacing for chart
    showYAxisLabels: PropTypes.bool,
    categoryLabelBody3Regular: PropTypes.bool
};

export default RadarChart;
