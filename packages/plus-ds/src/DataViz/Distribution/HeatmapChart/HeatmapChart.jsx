import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '../../chartTheme';

/**
 * HeatmapChart Component
 * Displays data as a matrix of colored cells.
 * Color intensity represents magnitude.
 */
const HeatmapChart = ({
    xCategories = [],
    yCategories = [],
    data = [],
    height = 400,
    minColor = '#c3e8ff',
    maxColor = '#0066cc',
    /** When false, hides the legend (including the color bar). */
    showLegend = true,
    /** When true, hides legend pagination/navigation (e.g. scroll arrows). */
    hideLegendNavigation = false,
    /** When true, uses smaller chart spacing so the heatmap appears larger. */
    compactSpacing = false,
    /** When false, hides values in cells; value is represented by color/opacity only. */
    showDataLabels = true,
    /** Gap between cells (0–1). Larger = more room for breath. */
    pointPadding = 0,
    /** When false, disables Highcharts series animation (useful to avoid replay on redraw). */
    enableAnimation = true,
    /** Animation duration in ms when animation is enabled. */
    animationDuration = 1000
}) => {
    const options = useMemo(() => ({
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'heatmap',
            height: height,
            ...(compactSpacing && { spacing: [6, 6, 6, 6] })
        },
        title: { text: null },
        xAxis: {
            ...chartTheme.xAxis,
            categories: xCategories
        },
        yAxis: {
            ...chartTheme.yAxis,
            categories: yCategories,
            title: null,
            reversed: true
        },
        colorAxis: {
            min: 0,
            max: 1,
            stops: [
                [0, minColor],
                [0.5, minColor], // Hold the lower color a bit longer
                [1, maxColor]
            ]
        },
        plotOptions: {
            heatmap: {
                pointPadding: pointPadding,
                animation: enableAnimation ? { duration: animationDuration } : false
            }
        },
        legend: {
            ...chartTheme.legend,
            enabled: showLegend,
            align: 'right',
            layout: 'vertical',
            margin: 0,
            verticalAlign: 'top',
            y: 25,
            symbolHeight: 280,
            ...(hideLegendNavigation && { navigation: { enabled: false } })
        },
        tooltip: {
            ...chartTheme.tooltip,
            formatter: function () {
                return `<b>${this.series.xAxis.categories[this.point.x]}</b><br/>
                        <b>${this.series.yAxis.categories[this.point.y]}</b>: ${this.point.value.toFixed(2)}`;
            }
        },
        series: [{
            name: 'Heatmap',
            borderWidth: 0,
            data: data,
            dataLabels: {
                enabled: showDataLabels,
                color: '#000000',
                style: {
                    textOutline: 'none'
                }
            }
        }]
    }), [
        animationDuration,
        compactSpacing,
        data,
        enableAnimation,
        height,
        hideLegendNavigation,
        maxColor,
        minColor,
        pointPadding,
        showDataLabels,
        showLegend,
        xCategories,
        yCategories
    ]);

    return (
        <div style={{ width: '100%', height: height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

HeatmapChart.propTypes = {
    /** Categories for X axis */
    xCategories: PropTypes.arrayOf(PropTypes.string),
    /** Categories for Y axis */
    yCategories: PropTypes.arrayOf(PropTypes.string),
    /** Array of [x, y, value] data points */
    data: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
    /** Chart height in pixels */
    height: PropTypes.number,
    /** Color for minimum values */
    minColor: PropTypes.string,
    /** Color for maximum values */
    maxColor: PropTypes.string,
    /** When false, hides the legend (including the color bar) */
    showLegend: PropTypes.bool,
    /** When true, hides legend pagination/navigation */
    hideLegendNavigation: PropTypes.bool,
    /** When true, uses smaller chart spacing for a larger heatmap */
    compactSpacing: PropTypes.bool,
    /** When false, hides values in cells (color/opacity only) */
    showDataLabels: PropTypes.bool,
    /** Gap between cells (0–1) for visual breathing room */
    pointPadding: PropTypes.number,
    /** When false, disables Highcharts series animation */
    enableAnimation: PropTypes.bool,
    /** Animation duration in ms */
    animationDuration: PropTypes.number
};

export default HeatmapChart;
