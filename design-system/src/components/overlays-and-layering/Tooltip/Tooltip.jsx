import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { overlayMountOf } from '@/lib/overlay';
import './Tooltip.scss';

/**
 * One line of help on hover or focus, built on Base UI.
 *
 * @param {object} props
 * @param {React.ReactNode} props.text - Tooltip body
 * @param {'top'|'bottom'|'left'|'right'} [props.placement='top']
 * @param {string|string[]} [props.trigger=['hover','focus']] - an empty array disables the tooltip, for a caller that only wants one when its trigger is truncated
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
    children,
    id,
    className = '',
    show,
    delayShow = 250,
    delayHide = 400,
}) => {
    const baseTriggerElement = React.isValidElement(children) ? children : <span>{children}</span>;
    const disabled = Array.isArray(trigger) ? trigger.length === 0 : !trigger;

    // Where the tooltip portals to: the page, or the modal the trigger sits
    // in, through the shared overlay module.
    const triggerNodeRef = useRef(null);
    const containerRef = useRef(null);
    containerRef.current = overlayMountOf(triggerNodeRef.current);
    const ownRef = baseTriggerElement.props?.ref ?? baseTriggerElement.ref;
    const triggerElement = React.cloneElement(baseTriggerElement, {
        ref: (node) => {
            triggerNodeRef.current = node;
            if (typeof ownRef === 'function') ownRef(node);
            else if (ownRef) ownRef.current = node;
        },
    });

    return (
        <BaseTooltip.Root
            open={show}
            disabled={disabled}
            delay={delayShow}
            closeDelay={delayHide}
        >
            <BaseTooltip.Trigger render={triggerElement} />
            <BaseTooltip.Portal container={containerRef}>
                <BaseTooltip.Positioner side={placement} sideOffset={4} collisionPadding={8}>
                    <BaseTooltip.Popup
                        id={id}
                        role="tooltip"
                        className={`plus-tooltip ${className}`}
                    >
                        {text}
                    </BaseTooltip.Popup>
                </BaseTooltip.Positioner>
            </BaseTooltip.Portal>
        </BaseTooltip.Root>
    );
};

Tooltip.propTypes = {
    text: PropTypes.node.isRequired,
    placement: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
    trigger: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string),
    ]),
    children: PropTypes.node.isRequired,
    id: PropTypes.string,
    className: PropTypes.string,
    show: PropTypes.bool,
    delayShow: PropTypes.number,
    delayHide: PropTypes.number,
};

export default Tooltip;
