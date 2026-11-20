import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import PlusChart from '@/dataviz/PlusChart';
import chartTheme from '@/dataviz/chartTheme';
import { tooltipPointFormat } from '@/dataviz/chartFormat';
import { CATEGORICAL, CHROME, mostToLeast } from '@/dataviz/palette';

export const DONUT_CENTER_TEXT_SIZES = ['metric-lg', 'metric-md', 'metric-sm'];

const METRIC_CLASSES = {
    'metric-lg': 'metric-lg',
    'metric-md': 'metric-md',
    'metric-sm': 'metric-sm',
};

/**
 * DonutChart Component
 * Displays a donut chart using Highcharts with a centered Metric figure.
 */
const DonutChart = ({
    size = 228,
    segments = [],
    value,
    label,
    centerTextSize = 'metric-lg',
    sort = true,
}) => {
    const hasTrack = useMemo(
        () => segments.some((segment) => segment.color === CHROME.track),
        [segments],
    );

    const orderedSegments = useMemo(() => {
        if (!sort || hasTrack) return segments;
        return mostToLeast(segments, (segment) => segment.value);
    }, [segments, sort, hasTrack]);

    const chartData = useMemo(
        () => orderedSegments.map((segment, index) => ({
            y: segment.value,
            color: segment.color || CATEGORICAL[index % CATEGORICAL.length],
            name: segment.label || 'Segment',
        })),
        [orderedSegments],
    );

    const metricClass = METRIC_CLASSES[centerTextSize] || METRIC_CLASSES['metric-lg'];

    const options = useMemo(() => ({
        ...chartTheme,
        chart: {
            ...chartTheme.chart,
            type: 'pie',
            width: size,
            height: size,
            spacing: [0, 0, 0, 0],
            margin: [0, 0, 0, 0],
        },
        title: {
            text: null,
        },
        plotOptions: {
            ...chartTheme.plotOptions,
            pie: {
                allowPointSelect: !hasTrack,
                borderRadius: 0,
                innerSize: '85%',
                borderWidth: 0,
                cursor: hasTrack ? 'default' : 'pointer',
                dataLabels: {
                    enabled: false,
                },
            },
        },
        tooltip: {
            ...chartTheme.tooltip,
            enabled: true,
            headerFormat: '',
            pointFormat: tooltipPointFormat({ label: '{point.name}', value: '{point.y}' }),
        },
        credits: {
            enabled: false,
        },
        series: [{
            name: 'Data',
            data: chartData,
            size: '100%',
            innerSize: '85%',
        }],
    }), [size, chartData, hasTrack]);

    return (
        <div style={{ width: size, height: size, position: 'relative' }}>
            {/*
              * Do not wrap this in `aria-hidden` — chartTheme enables the
              * Highcharts accessibility module, so the chart names and
              * describes itself, and hiding it would bury the focusable
              * keyboard-navigation proxies the module renders inside it.
              */}
            <PlusChart options={options} />
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none',
                    width: '100%',
                }}
            >
                <div
                    className={metricClass}
                    style={{
                        color: 'var(--ds-text)',
                    }}
                >
                    {value || ''}
                </div>
                {label && (
                    <div
                        style={{
                            font: 'var(--body-sm)',
                            lineHeight: 'inherit', // the role's size only; the line height stays the page's
                            fontWeight: 'var(--type-weight-medium)',
                            color: 'var(--ds-text-subtle)',
                            marginTop: 'var(--pad-x-xs)',
                        }}
                    >
                        {label}
                    </div>
                )}
            </div>
        </div>
    );
};

DonutChart.propTypes = {
    /** Diameter of the chart in pixels */
    size: PropTypes.number,
    /** Array of segment objects { value, color, label } */
    segments: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.number.isRequired,
        color: PropTypes.string,
        label: PropTypes.string,
    })),
    /** Text to display in the center */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** Label text below the value */
    label: PropTypes.string,
    /** Metric scale type token for the center figure */
    centerTextSize: PropTypes.oneOf(DONUT_CENTER_TEXT_SIZES),
    /** Sort categorical segments from most to least by default; pass false to keep input order. */
    sort: PropTypes.bool,
};

export default DonutChart;
