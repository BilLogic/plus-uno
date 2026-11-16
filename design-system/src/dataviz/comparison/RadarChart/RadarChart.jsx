import React, { useMemo, useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme from '@/dataviz/chartTheme';
import { tooltipPointFormat } from '@/dataviz/chartFormat';
import { seriesColor, sortCategories } from '@/dataviz/palette';
import { iconClass } from '@/lib/icon';

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
    categoryLabelBody3Regular = false,
    sort = true,
}) => {
    const {
        categories: orderedCategories,
        series: orderedSeries,
        orderedIcons,
        orderedColors,
    } = useMemo(() => {
        const indexMeta = (categories || []).map((_, index) => index);
        const { categories: nextCategories, data: nextIndices, series: nextSeries } = sortCategories({
            categories,
            data: indexMeta,
            series,
            sort,
            value: (_, idx) => (Array.isArray(series?.[0]?.data) ? series[0].data[idx] ?? 0 : 0),
        });
        return {
            categories: nextCategories,
            series: nextSeries,
            orderedIcons: Array.isArray(categoryIcons)
                ? nextIndices.map((i) => categoryIcons[i])
                : categoryIcons,
            orderedColors: Array.isArray(categoryColors)
                ? nextIndices.map((i) => categoryColors[i])
                : categoryColors,
        };
    }, [categories, series, categoryIcons, categoryColors, sort]);

    // Merge theme colors into series if not provided
    // Handle dashStyle and type for mixed area/line charts
    const seriesWithTheme = orderedSeries.map((s, i, all) => {
        const baseSeries = {
            ...s,
            color: s.color || seriesColor(i, all.length),
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
        categories: orderedCategories,
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
                    fontWeight: 'var(--type-weight-regular)'
                })
            }
        }
    };

    // Label formatter: icons when categoryIcons provided for this category; otherwise show category name (no generic circle)
    if (orderedIcons && orderedCategories) {
        xAxisConfig.labels = {
            ...xAxisConfig.labels,
            formatter: function() {
                const categoryIndex = this.pos;
                const glyph = orderedIcons[categoryIndex];
                if (glyph) {
                    return `<i class="${iconClass(glyph.replace(/^fa-/, ''))}" style="font-size: var(--icon-md); color: var(--ds-icon-subtle);" aria-hidden="true"></i>`;
                }
                return this.value ?? '';
            },
            useHTML: true
        };
    } else if (orderedColors && orderedCategories) {
        xAxisConfig.labels = {
            ...xAxisConfig.labels,
            formatter: function() {
                const categoryIndex = this.pos;
                const category = orderedCategories[categoryIndex];
                let color = 'var(--ds-text)';
                
                // Handle object mapping (category name -> color)
                if (Array.isArray(orderedColors)) {
                    color = orderedColors[categoryIndex] || color;
                } else {
                    // Handle object mapping
                    color = orderedColors[category] || orderedColors[categoryIndex] || color;
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
            pointFormat: tooltipPointFormat('{point.y:,.0f}')
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
                    allowOverlap: true
                }
            },
            line: {
                dataLabels: {
                    enabled: showDataLabels && !filled,
                    format: '{y}%',
                    allowOverlap: true
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
            <PlusChart options={options} />
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
    categoryLabelBody3Regular: PropTypes.bool,
    /** Sort categories from most to least by default; pass false for ordinal or temporal axes. */
    sort: PropTypes.bool,
};

export default RadarChart;
