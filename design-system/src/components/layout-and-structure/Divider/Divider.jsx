import React from 'react';
import PropTypes from 'prop-types';
import './Divider.scss';

/** Deprecated sizes, still accepted, and the size each one now means. */
const DEPRECATED_SIZES = { '2.5px': 'xl' };

const Divider = ({
    size = 'md',
    style = 'light',
    opacity10 = false,
    id,
    width,
    className = '',
    customStyles = {}
}) => {
    const sizeMap = {
        "sm": "sm",
        "md": "md",
        "lg": "lg",
        "xl": "xl",
        "1px": "sm",
        "1.5px": "md",
        "2px": "lg"
    };

    if (DEPRECATED_SIZES[size] && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(`[Divider] size="${size}" is deprecated; use size="${DEPRECATED_SIZES[size]}".`);
    }
    const sizeClass = sizeMap[size] ?? DEPRECATED_SIZES[size] ?? "md";

    const classes = [
        'plus-divider',
        `plus-divider-${sizeClass}`,
        `plus-divider-${style}`,
        opacity10 ? 'plus-divider-opacity-10' : '',
        className
    ].filter(Boolean).join(' ');

    const inlineStyles = {
        ...(width ? { width } : {}),
        ...customStyles
    };

    return (
        <div id={id} className={classes} style={inlineStyles}>
            <div className="plus-divider-line"></div>
        </div>
    );
};

Divider.propTypes = {
    /** Thickness: sm 1px, md 1.5px, lg 2px, xl 3px. The pixel strings alias the names. `2.5px` is a deprecated alias for `xl`: it draws 3px; use `xl`. */
    size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', '1px', '1.5px', '2px', '2.5px']),
    style: PropTypes.oneOf(['light', 'dark']),
    opacity10: PropTypes.bool,
    id: PropTypes.string,
    width: PropTypes.string,
    className: PropTypes.string,
    customStyles: PropTypes.object
};

export default Divider;
