import React from 'react';
import PropTypes from 'prop-types';
import './ScrollBar.scss';

/**
 * ScrollBar — a wrapper that applies the Design System's tokenized custom
 * scrollbar styling (thin width, outline-colored thumb, transparent track)
 * to its scrollable content.
 */
const ScrollBar = ({
    children,
    maxHeight = '320px',
    horizontal = false,
    id,
    className = '',
    style,
    ...props
}) => {
    const classes = [
        'plus-scrollbar',
        horizontal ? 'plus-scrollbar-horizontal' : 'plus-scrollbar-vertical',
        className
    ].filter(Boolean).join(' ');

    const inlineStyles = {
        ...(horizontal ? {} : { maxHeight }),
        ...style
    };

    return (
        <div id={id} className={classes} style={inlineStyles} {...props}>
            {children}
        </div>
    );
};

ScrollBar.propTypes = {
    children: PropTypes.node,
    maxHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    horizontal: PropTypes.bool,
    id: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object
};

export default ScrollBar;
