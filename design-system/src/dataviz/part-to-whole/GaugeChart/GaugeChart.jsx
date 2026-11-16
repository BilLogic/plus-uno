import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme, { CHART_TRACK_RADIUS } from '@/dataviz/chartTheme';
import { CHART_VALUE_CLASS, tooltipPointFormat, valueSpan } from '@/dataviz/chartFormat';
import { BRAND, CHROME } from '@/dataviz/palette';

const HTML_ENTITIES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
};

const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (ch) => HTML_ENTITIES[ch]);

/**
 * GaugeChart Component
 * Displays a single value on a half-circle dial with a Metric figure beneath the arc.
 */
const GaugeChart = ({
    value = 0,
    min = 0,
    max = 100,
    label = '',
    height = 300,
    color,
}) => {
    const gaugeColor = color || BRAND;
    const escapedLabel = label ? escapeHtml(label) : '';

    const options = useMemo(() => ({
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'solidgauge',
            height,
        },
        title: { text: null },
        pane: {
            center: ['50%', '72%'],
            size: '90%',
            startAngle: -90,
            endAngle: 90,
            background: {
                backgroundColor: CHROME.track,
                borderWidth: 0,
                borderRadius: CHART_TRACK_RADIUS,
                innerRadius: '60%',
                outerRadius: '100%',
                shape: 'arc',
            },
        },
        yAxis: {
            ...chartTheme.yAxis,
            min,
            max,
            stops: [
                [0, gaugeColor],
                [1, gaugeColor],
            ],
            gridLineWidth: 0,
            lineWidth: 0,
            tickWidth: 0,
            minorTickInterval: null,
            tickPositions: [min, max],
            title: {
                ...chartTheme.yAxis.title,
                text: null,
            },
        },
        tooltip: {
            ...chartTheme.tooltip,
            headerFormat: '',
            pointFormat: escapedLabel
                ? tooltipPointFormat({ label: escapedLabel, value: '{point.y}' })
                : valueSpan('{point.y}'),
        },
        plotOptions: {
            ...chartTheme.plotOptions,
            solidgauge: {
                borderRadius: CHART_TRACK_RADIUS,
                dataLabels: {
                    borderWidth: 0,
                    useHTML: true,
                    format: `<div style="text-align:center"><span class="metric-md ${CHART_VALUE_CLASS}" style="display:block;color:var(--ds-text)">{y}</span>${escapedLabel ? `<span style="display:block;color:var(--ds-text-subtle)">${escapedLabel}</span>` : ''}</div>`,
                },
            },
        },
        credits: { enabled: false },
        series: [{
            name: label,
            data: [value],
            innerRadius: '60%',
            radius: '100%',
        }],
    }), [value, min, max, label, escapedLabel, height, gaugeColor]);

    return (
        <div style={{ width: '100%', height }}>
            <PlusChart options={options} />
        </div>
    );
};

GaugeChart.propTypes = {
    /** Current value to display */
    value: PropTypes.number,
    /** Minimum scale value */
    min: PropTypes.number,
    /** Maximum scale value */
    max: PropTypes.number,
    /** Label text below the value */
    label: PropTypes.string,
    /** Chart height in pixels */
    height: PropTypes.number,
    /** Gauge fill color; defaults to `--chart-brand`, or pass a status token when encoding status */
    color: PropTypes.string,
};

export default GaugeChart;
