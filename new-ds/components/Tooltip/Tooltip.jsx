import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { OverlayTrigger, Tooltip as BSTooltip } from 'react-bootstrap';

const Tooltip = ({
    text,
    placement = 'top',
    trigger = ['hover', 'focus'],
    size = 'default',
    children,
    id,
    className = ''
}) => {
    const renderTooltip = (props) => (
        <BSTooltip
            id={id || `tooltip-${placement}`}
            {...props}
            className={`plus-tooltip-${size} ${className}`}
            data-tooltip-size={size}
        >
            {text}
        </BSTooltip>
    );

    return (
        <OverlayTrigger
            placement={placement}
            delay={{ show: 250, hide: 400 }}
            overlay={renderTooltip}
            trigger={trigger}
        >
            {children}
        </OverlayTrigger>
    );
};

Tooltip.propTypes = {
    text: PropTypes.node.isRequired,
    placement: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
    trigger: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
    ]),
    size: PropTypes.oneOf(['small', 'default', 'large']),
    children: PropTypes.node.isRequired,
    id: PropTypes.string,
    className: PropTypes.string
};

export default Tooltip;
