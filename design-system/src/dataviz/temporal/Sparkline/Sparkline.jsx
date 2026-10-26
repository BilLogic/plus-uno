import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from '@/dataviz/highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import chartTheme from '@/dataviz/chartTheme';
import { BRAND, STATUS } from '@/dataviz/palette';

/** What a sparkline's line may mean: the brand by default, or a status. */
export const SPARKLINE_TONES = {
    brand: BRAND,
    success: STATUS.success,
    warning: STATUS.warning,
    danger: STATUS.danger,
    information: STATUS.information,
};

/**
 * Sparkline Component
 * A word-sized line chart for a trend beside a number: no axes, no grid, no
 * legend, one 2px line in the brand chart color, and a marker on the latest
 * value. It shares the theme with LineChart, so it follows every color mode,
 * and a hover still reads each value. `label` names it for screen readers,
 * since the number beside it carries the meaning and the line only its shape.
 */
const Sparkline = ({
    data,
    categories,
    label,
    tone = 'brand',
    width = 120,
    height = 32,
    showLastPoint = true,
    valueSuffix = ''
}) => {
    const color = SPARKLINE_TONES[tone];
    // Every point keeps a marker so keyboard focus and hover can land on it, but only the
    // latest value draws one at rest: the rest are radius 0 until hovered.
    const points = data.map((y, i) => ({
        y,
        ...(showLastPoint && i === data.length - 1 && { marker: { radius: 3 } })
    }));

    const options = {
        ...chartTheme,
        accessibility: {
            ...chartTheme.accessibility,
            description: label
        },
        chart: {
            ...chartTheme.chart,
            type: 'line',
            width,
            height,
            spacing: [4, 4, 4, 4],
            margin: [4, 4, 4, 4]
        },
        title: { text: null },
        xAxis: {
            visible: false,
            categories
        },
        yAxis: {
            visible: false,
            startOnTick: false,
            endOnTick: false
        },
        legend: { enabled: false },
        tooltip: {
            ...chartTheme.tooltip,
            outside: true,
            headerFormat: categories ? '<span>{point.key}</span><br/>' : '',
            pointFormat: `<b>{point.y}${valueSuffix}</b>`
        },
        plotOptions: {
            series: {
                animation: false,
                lineWidth: 2,
                states: { hover: { lineWidthPlus: 0 } },
                marker: {
                    enabled: true,
                    radius: 0,
                    states: { hover: { radius: 3, radiusPlus: 0 } },
                    symbol: 'circle',
                    lineWidth: 2,
                    lineColor: 'var(--ds-border-inverse)'
                }
            }
        },
        series: [{
            name: label,
            color,
            data: points
        }]
    };

    return (
        <div style={{ width, height }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

Sparkline.propTypes = {
    /** The values, oldest first */
    data: PropTypes.arrayOf(PropTypes.number).isRequired,
    /** A label per value, shown in the tooltip (dates, session ranges) */
    categories: PropTypes.arrayOf(PropTypes.string),
    /** What the line shows, for screen readers and the tooltip */
    label: PropTypes.string.isRequired,
    /** The line's color: the brand, or a status when the trend means one */
    tone: PropTypes.oneOf(Object.keys(SPARKLINE_TONES)),
    /** Width in pixels */
    width: PropTypes.number,
    /** Height in pixels */
    height: PropTypes.number,
    /** When true, marks the latest value */
    showLastPoint: PropTypes.bool,
    /** Text after each value in the tooltip, e.g. "%" */
    valueSuffix: PropTypes.string
};

export default Sparkline;
