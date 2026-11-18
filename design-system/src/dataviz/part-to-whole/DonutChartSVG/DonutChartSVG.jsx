import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';

const METRIC_CLASSES = {
    'metric-lg': 'metric-lg',
    'metric-md': 'metric-md',
    'metric-sm': 'metric-sm',
};

/**
 * DonutChartSVG Component
 * Renders a donut chart using exact SVG paths from Figma for pixel-perfect matching.
 * Includes interactive tooltips on hover showing segment data.
 */
const DonutChartSVG = ({
    size = 228,
    paths = [],
    value,
    label = '',
    centerTextSize = 'metric-lg',
}) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0, visible: false });
    const svgRef = useRef(null);
    const metricClass = METRIC_CLASSES[centerTextSize] || METRIC_CLASSES['metric-lg'];

    const updateTooltipPosition = (event) => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        setTooltipPosition({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            visible: true,
        });
    };

    return (
        <div
            style={{
                width: `${size}px`,
                height: `${size}px`,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <svg
                ref={svgRef}
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                fill="none"
                style={{ position: 'absolute', top: 0, left: 0 }}
                onMouseMove={(event) => {
                    if (hoveredIndex !== null) {
                        updateTooltipPosition(event);
                    }
                }}
                onMouseLeave={() => {
                    setHoveredIndex(null);
                    setTooltipPosition({ x: 0, y: 0, visible: false });
                }}
            >
                {paths.map((path, index) => {
                    const hasTooltip = path.label || path.value !== undefined || path.percentage !== undefined;

                    return (
                        <path
                            key={index}
                            d={path.d}
                            fill={path.fill}
                            style={{
                                cursor: hasTooltip ? 'pointer' : 'default',
                                opacity: hoveredIndex !== null && hoveredIndex !== index ? 'var(--ds-opacity-chart-inactive)' : 1,
                                transition: 'opacity var(--ds-motion-appearance-fast-duration) var(--ds-motion-appearance-fast)',
                            }}
                            onMouseEnter={(event) => {
                                setHoveredIndex(index);
                                updateTooltipPosition(event);
                            }}
                        />
                    );
                })}
            </svg>

            {hoveredIndex !== null && paths[hoveredIndex] && tooltipPosition.visible && (
                <div
                    style={{
                        position: 'absolute',
                        left: `${tooltipPosition.x}px`,
                        top: `calc(${tooltipPosition.y}px - var(--popup-offset))`,
                        transform: 'translate(-50%, -100%)',
                        backgroundColor: 'var(--ds-surface-overlay)',
                        color: 'var(--ds-text)',
                        padding: 'var(--popup-pad)',
                        borderRadius: 'var(--popup-radius)',
                        fontSize: 'var(--type-size-0875)',
                        fontFamily: 'var(--type-family-body)',
                        fontWeight: 'var(--type-weight-medium)',
                        fontVariantNumeric: 'tabular-nums',
                        pointerEvents: 'none',
                        zIndex: 'var(--layer-popup)',
                        whiteSpace: 'nowrap',
                        boxShadow: 'var(--ds-shadow-overlay)',
                        textAlign: 'center',
                    }}
                >
                    {paths[hoveredIndex].label && (
                        <div style={{ fontWeight: 'var(--type-weight-semibold)', marginBottom: 'var(--pad-x-xs)' }}>
                            {paths[hoveredIndex].label}
                        </div>
                    )}
                    {paths[hoveredIndex].percentage !== undefined && (
                        <div>{paths[hoveredIndex].percentage}%</div>
                    )}
                    {paths[hoveredIndex].value !== undefined && paths[hoveredIndex].percentage === undefined && (
                        <div>{paths[hoveredIndex].value}</div>
                    )}
                </div>
            )}

            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: `${size}px`,
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                }}
            >
                <p
                    className={metricClass}
                    style={{
                        margin: 0,
                        color: 'var(--ds-text)',
                    }}
                >
                    {value}
                </p>
                {label && (
                    <span
                        style={{
                            fontFamily: 'var(--type-family-body)',
                            fontSize: 'var(--type-size-075)',
                            fontWeight: 'var(--type-weight-medium)',
                            color: 'var(--ds-text-subtle)',
                            marginTop: 'var(--pad-x-xs)',
                        }}
                    >
                        {label}
                    </span>
                )}
            </div>
        </div>
    );
};

DonutChartSVG.propTypes = {
    /** Size of the chart in pixels (width and height) */
    size: PropTypes.number,
    /** Array of path objects { d: string (SVG path data), fill: string (color), label?: string, value?: number, percentage?: number } */
    paths: PropTypes.arrayOf(PropTypes.shape({
        d: PropTypes.string.isRequired,
        fill: PropTypes.string.isRequired,
        label: PropTypes.string,
        value: PropTypes.number,
        percentage: PropTypes.number,
    })).isRequired,
    /** Text to display in the center */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** Label text below the value */
    label: PropTypes.string,
    /** Metric scale type token for the center figure */
    centerTextSize: PropTypes.oneOf(['metric-lg', 'metric-md', 'metric-sm']),
};

export default DonutChartSVG;
