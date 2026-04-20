/**
 * ResponsiveFrame Component
 * 
 * Wrapper component for simulating responsive breakpoints in Storybook.
 * Applies a fixed width based on the selected breakpoint to preview responsive layouts.
 */

import React from 'react';
import PropTypes from 'prop-types';

const BREAKPOINT_WIDTHS = {
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
};

const ResponsiveFrame = ({ children, breakpoint = 'lg' }) => {
    const width = BREAKPOINT_WIDTHS[breakpoint] || BREAKPOINT_WIDTHS.lg;

    return (
        <div style={{
            width: `${width}px`,
            height: 'auto',
            margin: '0 auto',
            overflow: 'auto'
        }}>
            {children}
        </div>
    );
};

ResponsiveFrame.propTypes = {
    children: PropTypes.node.isRequired,
    breakpoint: PropTypes.oneOf(['md', 'lg', 'xl', 'xxl']),
};

export default ResponsiveFrame;
