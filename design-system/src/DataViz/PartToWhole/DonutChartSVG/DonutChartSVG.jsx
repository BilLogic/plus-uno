import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * DonutChartSVG Component
 * Renders a donut chart using exact SVG paths from Figma for pixel-perfect matching.
 * Used for Session Admin charts that require exact visual replication.
 * Includes interactive tooltips on hover showing segment data.
 */
const DonutChartSVG = ({ 
    size = 228,
    paths = [], // Array of { d: string, fill: string, label?: string, value?: number, percentage?: number } objects
    value, 
    label = '', 
    centerTextSize = 'h1'
}) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0, visible: false });
    const svgRef = useRef(null);
    // Text styling based on centerTextSize
    const getTextStyle = () => {
        if (centerTextSize === 'body3') {
            return {
                fontFamily: 'var(--font-family-body, "Merriweather Sans", sans-serif)',
                fontWeight: 'var(--font-weight-normal, 300)',
                fontSize: '12px',
                lineHeight: '1.4',
                color: 'var(--color-on-surface-variant, #3f484a)',
                letterSpacing: '0'
            };
        }
        // Default to header styles for other sizes
        return {
            fontFamily: 'var(--font-family-header, "Lato", sans-serif)',
            fontWeight: 'bold',
            fontSize: centerTextSize === 'h1' ? 'var(--font-size-h1)' : 'var(--font-size-h2)',
            lineHeight: '1',
            color: 'var(--color-on-surface, #191c1e)'
        };
    };
    
    const textStyle = getTextStyle();
    
    return (
        <div style={{ 
            width: `${size}px`, 
            height: `${size}px`, 
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <svg 
                ref={svgRef}
                xmlns="http://www.w3.org/2000/svg" 
                width={size} 
                height={size} 
                viewBox={`0 0 ${size} ${size}`} 
                fill="none"
                style={{ position: 'absolute', top: 0, left: 0 }}
                onMouseMove={(e) => {
                    if (hoveredIndex !== null && svgRef.current) {
                        const rect = svgRef.current.getBoundingClientRect();
                        setTooltipPosition({
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top,
                            visible: true
                        });
                    }
                }}
                onMouseLeave={() => {
                    setHoveredIndex(null);
                    setTooltipPosition({ x: 0, y: 0, visible: false });
                }}
            >
                {/* Render each path segment with hover support */}
                {paths.map((path, index) => {
                    const hasTooltip = path.label || path.value !== undefined || path.percentage !== undefined;
                    
                    return (
                        <path 
                            key={index}
                            d={path.d} 
                            fill={path.fill}
                            style={{
                                cursor: hasTooltip ? 'pointer' : 'default',
                                opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.6 : 1,
                                transition: 'opacity 0.2s ease'
                            }}
                            onMouseEnter={() => {
                                setHoveredIndex(index);
                            }}
                        />
                    );
                })}
            </svg>
            
            {/* Custom tooltip */}
            {hoveredIndex !== null && paths[hoveredIndex] && tooltipPosition.visible && (
                <div
                    style={{
                        position: 'absolute',
                        left: `${tooltipPosition.x}px`,
                        top: `${tooltipPosition.y - 40}px`,
                        transform: 'translate(-50%, -100%)',
                        backgroundColor: 'var(--color-on-surface, #191c1e)',
                        color: 'var(--color-surface, #fff)',
                        padding: 'var(--size-element-pad-y-sm, 4px) var(--size-element-pad-x-md, 8px)',
                        borderRadius: 'var(--size-element-radius-sm, 4px)',
                        fontSize: 'var(--font-size-body3, 12px)',
                        fontFamily: 'var(--font-family-body)',
                        pointerEvents: 'none',
                        zIndex: 1000,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                        textAlign: 'center'
                    }}
                >
                    {paths[hoveredIndex].label && (
                        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
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
            
            {/* Center text */}
            <div style={{
                position: 'absolute',
                top: 'calc(50% + 2.5px)',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: `${size}px`,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
            }}>
                <p style={{ 
                    margin: 0, 
                    lineHeight: '1',
                    ...textStyle
                }}>
                    {value}
                </p>
                {label && (
                    <span style={{
                        fontFamily: 'var(--font-family-body)',
                        fontSize: 'var(--font-size-body3)',
                        color: 'var(--color-on-surface-variant, #666)',
                        marginTop: '4px'
                    }}>
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
        percentage: PropTypes.number
    })).isRequired,
    /** Text to display in the center */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** Label text below the value */
    label: PropTypes.string,
    /** CSS class for the center value text size */
    centerTextSize: PropTypes.oneOf(['h1', 'h2', 'h3', 'h4', 'h5', 'body3'])
};

export default DonutChartSVG;
