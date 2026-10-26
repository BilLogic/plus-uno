import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Highcharts from '@/dataviz/highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '@/dataviz/chartTheme';
import { HUES, divergingRamp, rampStops, sequentialRamp } from '@/dataviz/palette';
import { inkFor, resolveColor, textInks, useColorModeKey } from '@/dataviz/colorMode';

/**
 * HeatmapChart Component
 * Displays data as a matrix of colored cells.
 * Color intensity represents magnitude: the strongest tone is the biggest value.
 *
 * The color axis is a sequential ramp of one hue by default, or a diverging
 * ramp around a neutral midpoint when `diverging` names two hues. A color axis
 * interpolates, so its stops are the tokens resolved in the current color
 * mode, and resolved again when the mode changes.
 */
const HeatmapChart = ({
    xCategories = [],
    yCategories = [],
    data = [],
    height = 400,
    /** The ramp's hue (see `HUES` in palette.js). */
    hue = 'blue',
    /** Two hues, [low, high], for a diverging ramp; overrides `hue`. */
    diverging = null,
    /** Lowest and highest values on the color axis; default to the data's own. */
    min,
    max,
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
    const mode = useColorModeKey();
    const options = useMemo(() => {
        const ramp = diverging ? divergingRamp(...diverging) : sequentialRamp(hue);
        const inks = textInks();
        return {
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
            min,
            max,
            // The ramp spans the data, not the rounded ticks, so the biggest value takes the strongest tone.
            startOnTick: false,
            endOnTick: false,
            stops: rampStops(ramp, resolveColor)
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
                // A label sits on its cell, so it takes whichever text ink reads on that cell.
                formatter: function () {
                    const ink = inkFor(this.point.color, inks);
                    return `<span style="color: ${ink}">${this.point.value}</span>`;
                },
                style: {
                    textOutline: 'none'
                }
            }
        }]
    };
    }, [
        animationDuration,
        compactSpacing,
        data,
        diverging,
        enableAnimation,
        height,
        hideLegendNavigation,
        hue,
        max,
        min,
        mode,
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
    /** The sequential ramp's hue */
    hue: PropTypes.oneOf(HUES),
    /** Two hues, [low, high], for a diverging ramp around a neutral midpoint */
    diverging: PropTypes.arrayOf(PropTypes.string),
    /** Lowest value on the color axis */
    min: PropTypes.number,
    /** Highest value on the color axis */
    max: PropTypes.number,
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
