import React from 'react';

/**
 * ResponsiveFrame
 * A wrapper component that simulates different viewport widths for Storybook stories.
 * 
 * @param {Object} props
 * @param {string} props.breakpoint - The breakpoint to simulate (md, lg, xl, xxl)
 * @param {React.ReactNode} props.children - The content to wrap
 */
const ResponsiveFrame = ({ breakpoint, children }) => {
    // Map breakpoints to fixed widths
    const widthMap = {
        md: 768,
        lg: 992,
        xl: 1200,
        xxl: 1400,
    };

    const width = widthMap[breakpoint] || '100%';

    return (
        <div
            className="responsive-frame-wrapper"
            style={{
                width: '100%',
                minHeight: '100vh',
                backgroundColor: 'var(--color-surface-container-lowest, #f8f9fa)',
                display: 'flex',
                justifyContent: 'center',
                overflowX: 'auto',
                padding: '20px 0'
            }}
        >
            <div
                className="responsive-frame-inner"
                style={{
                    width: typeof width === 'number' ? `${width}px` : width,
                    transition: 'width 0.3s ease-in-out',
                    backgroundColor: 'var(--color-surface, #ffffff)',
                    boxShadow: '0 0 20px rgba(0,0,0,0.1)',
                    height: 'max-content',
                    minHeight: 'calc(100vh - 40px)',
                    margin: '0 auto',
                    overflow: 'hidden',
                    position: 'relative'
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default ResponsiveFrame;
