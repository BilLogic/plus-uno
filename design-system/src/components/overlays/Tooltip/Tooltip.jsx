import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { OverlayTrigger, Overlay, Tooltip as BSTooltip } from 'react-bootstrap';
import './Tooltip.scss';

const Tooltip = ({
    text,
    placement = 'top',
    trigger = ['hover', 'focus'],
    size = 'default',
    children,
    id,
    className = '',
    show
}) => {
    const uniqueId = useRef(`tooltip-${Math.random().toString(36).substring(2, 9)}`);
    const [targetElement, setTargetElement] = useState(null);

    const renderTooltip = (props) => (
        <BSTooltip
            id={id || uniqueId.current}
            {...props}
            className={`plus-tooltip-${size} ${className}`}
            data-tooltip-size={size}
        >
            {text}
        </BSTooltip>
    );

    if (show !== undefined) {
        return (
            <>
                {React.cloneElement(children, { ref: setTargetElement })}
                <Overlay target={targetElement} show={show} placement={placement}>
                    {renderTooltip}
                </Overlay>
            </>
        );
    }

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
    className: PropTypes.string,
    show: PropTypes.bool
};

export default Tooltip;
