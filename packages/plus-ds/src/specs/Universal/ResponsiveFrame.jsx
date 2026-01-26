import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';


/**
 * ResponsiveFrame
 * A wrapper component that simulates different viewport widths for Storybook stories.
 * Includes an interactive toolbar to switch between breakpoints.
 * 
 * @param {Object} props
 * @param {string} props.breakpoint - The initial breakpoint to simulate (md, lg, xl)
 * @param {React.ReactNode} props.children - The content to wrap
 */
const ResponsiveFrame = ({ breakpoint = 'xl', children }) => {
    const [selectedBreakpoint, setSelectedBreakpoint] = useState(breakpoint);

    // Sync with prop if it changes
    useEffect(() => {
        setSelectedBreakpoint(breakpoint);
    }, [breakpoint]);

    // Map breakpoints to fixed widths (using sizes from Screenshot 2)
    const widthMap = {
        md: 768,
        lg: 1024,
        xl: 1440,
    };

    const width = widthMap[selectedBreakpoint] || widthMap.xl;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh' }}>
            {/* Breakpoint Toolbar */}
            <div
                style={{
                    padding: '12px 24px',
                    borderBottom: '1px solid var(--color-outline-variant, #e0e0e0)',
                    backgroundColor: 'var(--color-surface, #ffffff)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1000,
                }}
            >
                <span className="label-medium" style={{ color: 'var(--color-on-surface-variant, #444746)' }}>
                    Breakpoint:
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                        { key: 'md', label: 'MD (768px)' },
                        { key: 'lg', label: 'LG (1024px)' },
                        { key: 'xl', label: 'XL (1440px)' },
                    ].map((bp) => (
                        <button
                            key={bp.key}
                            onClick={() => setSelectedBreakpoint(bp.key)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '4px',
                                border: '1px solid',
                                borderColor: selectedBreakpoint === bp.key
                                    ? 'var(--color-primary, #00639b)'
                                    : 'var(--color-outline, #747775)',
                                backgroundColor: selectedBreakpoint === bp.key
                                    ? 'var(--color-primary-container, #d3e3fd)'
                                    : 'transparent',
                                color: selectedBreakpoint === bp.key
                                    ? 'var(--color-on-primary-container, #001d32)'
                                    : 'var(--color-on-surface, #1f1f1f)',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {bp.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Frame Canvas */}
            <div
                className="responsive-frame-wrapper"
                style={{
                    flex: 1,
                    backgroundColor: 'var(--color-surface-container-lowest, #f8f9fa)',
                    display: 'flex',
                    justifyContent: 'center',
                    overflowX: 'auto',
                    padding: '24px'
                }}
            >
                <div
                    className="responsive-frame-inner"
                    style={{
                        width: `${width}px`,
                        minWidth: `${width}px`, // Force width
                        transition: 'width 0.3s cubic-bezier(0.2, 0, 0.2, 1)',
                        backgroundColor: 'var(--color-surface, #ffffff)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        height: 'max-content',
                        minHeight: 'calc(100vh - 120px)', // Adjust for toolbar and padding
                        overflow: 'hidden',
                        position: 'relative',
                        border: '1px solid var(--color-outline-variant, #e0e0e0)',
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
};

ResponsiveFrame.propTypes = {
    breakpoint: PropTypes.oneOf(['md', 'lg', 'xl']),
    children: PropTypes.node.isRequired,
};

export default ResponsiveFrame;
