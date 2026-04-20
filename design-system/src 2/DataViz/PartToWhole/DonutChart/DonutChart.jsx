import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

/**
 * DonutChart Component
 * Displays a donut chart using Highcharts with centered text overlay.
 */
import chartTheme from '../../chartTheme';

const DonutChart = ({
    size = 228,
    segments = [],
    value,
    label,
    centerTextSize = 'h1',
    animate = false,
    animationDelay = 0,
    animationDuration = 900
}) => {
    // Transform segments into Highcharts series data
    const chartData = useMemo(() => segments.map(segment => ({
        y: segment.value,
        color: segment.color,
        name: segment.label || 'Segment'
    })), [segments]);

    // Get font size value for the center text using Figma semantic tokens
    const getFontSize = () => {
        const sizeMap = {
            'h1': 'var(--font-size-title-l, 48px)',      // Title/L
            'h2': 'var(--font-size-title-m1, 36px)',     // Title/M1
            'h3': 'var(--font-size-title-m2, 32px)',     // Title/M2
            'h4': 'var(--font-size-title-m4, 24px)',     // Title/M4 (Metric Cards)
            'h5': 'var(--font-size-title-s, 20px)',      // Title/S
            'body3': 'var(--font-size-body3, 12px)'      // Body3
        };
        return sizeMap[centerTextSize] || sizeMap['h4'];
    };

    const getFontWeight = () => {
        // Title tokens use bold weight, body uses normal
        return centerTextSize === 'body3' ? 'var(--font-weight-normal, 400)' : 'var(--font-weight-bold, 700)';
    };

    const getLineHeight = () => {
        // Semantic line heights from Figma
        const lineHeightMap = {
            'h1': 'var(--font-line-height-title, 1.2)',
            'h2': 'var(--font-line-height-title, 1.2)',
            'h3': 'var(--font-line-height-title, 1.2)',
            'h4': 'var(--font-line-height-title, 1.2)',
            'h5': 'var(--font-line-height-title, 1.2)',
            'body3': 'var(--font-line-height-body3, 1.667)'
        };
        return lineHeightMap[centerTextSize] || lineHeightMap['h4'];
    };

    const options = useMemo(() => ({
        ...chartTheme, // Apply theme defaults
        chart: {
            type: 'pie',
            width: size,
            height: size,
            backgroundColor: 'transparent',
            spacing: [0, 0, 0, 0],
            margin: [0, 0, 0, 0]
        },
        title: {
            text: null
        },
        plotOptions: {
            pie: {
                animation: animate ? { duration: animationDuration, defer: animationDelay } : false,
                innerSize: '85%', // Donut thickness
                borderWidth: 0,
                allowPointSelect: false,
                cursor: 'default',
                dataLabels: {
                    enabled: false
                },
                states: {
                    hover: {
                        enabled: false,
                        halo: null
                    },
                    inactive: {
                        opacity: 1
                    }
                }
            }
        },
        tooltip: {
            enabled: true,
            pointFormat: '<b>{point.name}</b>: {point.y}'
        },
        credits: {
            enabled: false
        },
        series: [{
            name: 'Data',
            data: chartData,
            size: '100%',
            innerSize: '85%',
            animation: animate ? { duration: animationDuration, defer: animationDelay } : false,
        }]
    }), [size, chartData, animate, animationDelay, animationDuration]);

    return (
        <div style={{ width: size, height: size, position: 'relative' }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
                width: '100%'
            }}>
                <div style={{
                    fontFamily: centerTextSize === 'body3' ? 'var(--font-family-body, "Merriweather Sans", sans-serif)' : 'var(--font-family-header, "Lato", sans-serif)',
                    fontWeight: getFontWeight(),
                    fontSize: getFontSize(),
                    lineHeight: getLineHeight(),
                    color: centerTextSize === 'body3' ? 'var(--color-on-surface-variant, #3f484a)' : 'var(--color-on-surface, #191c1e)'
                }}>
                    {value || ''}
                </div>
                {label && (
                    <div style={{
                        fontFamily: 'var(--font-family-body, "Merriweather Sans", sans-serif)',
                        fontSize: 'var(--font-size-body3, 12px)',
                        lineHeight: '1.667',
                        color: 'var(--color-on-surface-variant, #3f484a)',
                        marginTop: '4px'
                    }}>
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
        color: PropTypes.string.isRequired,
        label: PropTypes.string
    })),
    /** Text to display in the center */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** Label text below the value */
    label: PropTypes.string,
    /** CSS class for the center value text size */
    centerTextSize: PropTypes.oneOf(['h1', 'h2', 'h3', 'h4', 'h5', 'body3']),
    /** Whether to animate the donut fill on first render */
    animate: PropTypes.bool,
    /** Delay before donut animation starts in milliseconds */
    animationDelay: PropTypes.number,
    /** Duration of donut animation in milliseconds */
    animationDuration: PropTypes.number
};

export default DonutChart;
