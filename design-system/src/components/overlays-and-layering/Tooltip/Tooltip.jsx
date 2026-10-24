import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { OverlayTrigger, Overlay, Tooltip as BSTooltip } from 'react-bootstrap';
import { popoverOverlayProps } from '@/lib/popoverPlacement';
import './Tooltip.scss';

/**
 * Design-system tooltip wrapper around Bootstrap OverlayTrigger.
 *
 * @param {object} props
 * @param {React.ReactNode} props.text - Tooltip body
 * @param {'top'|'bottom'|'left'|'right'} [props.placement='top']
 * @param {string|string[]} [props.trigger]
 * @param {'small'|'default'|'large'} [props.size='default'] - kept so no call site breaks; every size draws the one tooltip
 * @param {React.ReactElement} props.children - Single trigger element
 * @param {string} [props.id]
 * @param {string} [props.className]
 * @param {boolean} [props.show] - Controlled visibility (skips hover delay)
 * @param {number} [props.delayShow=250] - ms before show on hover/focus
 * @param {number} [props.delayHide=400] - ms before hide
 */
const Tooltip = ({
    text,
    placement = 'top',
    trigger = ['hover', 'focus'],
    size = 'default',
    children,
    id,
    className = '',
    show,
    delayShow = 250,
    delayHide = 400,
}) => {
    const uniqueId = useRef(`tooltip-${Math.random().toString(36).substring(2, 9)}`);
    const [targetElement, setTargetElement] = useState(null);

    /**
     * @param {object} props
     * @returns {React.ReactElement}
     */
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
                <Overlay
                    target={targetElement}
                    show={show}
                    placement={placement}
                    {...popoverOverlayProps()}
                >
                    {renderTooltip}
                </Overlay>
            </>
        );
    }

    return (
        <OverlayTrigger
            placement={placement}
            delay={{ show: delayShow, hide: delayHide }}
            overlay={renderTooltip}
            trigger={trigger}
            {...popoverOverlayProps()}
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
        PropTypes.arrayOf(PropTypes.string),
    ]),
    size: PropTypes.oneOf(['small', 'default', 'large']),
    children: PropTypes.node.isRequired,
    id: PropTypes.string,
    className: PropTypes.string,
    show: PropTypes.bool,
    delayShow: PropTypes.number,
    delayHide: PropTypes.number,
};

export default Tooltip;
