import React from 'react';
import PropTypes from 'prop-types';
import './Divider.scss';

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
        "2px": "lg",
        "2.5px": "xl"
    };

    const sizeClass = sizeMap[size] || "md";

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
    size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', '1px', '1.5px', '2px', '2.5px']),
    style: PropTypes.oneOf(['light', 'dark']),
    opacity10: PropTypes.bool,
    id: PropTypes.string,
    width: PropTypes.string,
    className: PropTypes.string,
    customStyles: PropTypes.object
};

export default Divider;
