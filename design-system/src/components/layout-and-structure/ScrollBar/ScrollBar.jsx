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
    'aria-label': ariaLabel = 'Scrollable content',
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
        <div
            id={id}
            className={classes}
            style={inlineStyles}
            // Makes the scroll container keyboard-focusable (arrow keys scroll
            // it) so it satisfies the "scrollable-region-focusable" a11y rule.
            // (No `role="region"` — that creates a landmark, and multiple
            // ScrollBars on one page would collide under "landmark-unique".)
            tabIndex={0}
            aria-label={ariaLabel}
            {...props}
        >
            {children}
        </div>
    );
};

ScrollBar.propTypes = {
    children: PropTypes.node,
    maxHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    horizontal: PropTypes.bool,
    id: PropTypes.string,
    'aria-label': PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object
};

export default ScrollBar;
