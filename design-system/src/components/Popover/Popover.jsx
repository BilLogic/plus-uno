import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Popover.scss';
import { Popover as BootstrapPopover, OverlayTrigger } from 'react-bootstrap';
import Button from '@/components/Button/Button';

// Wrapper for the Popover content
const PopoverContent = forwardRef(({
    title,
    children,
    className = '',
    style,
    ...props
}, ref) => (
    <BootstrapPopover
        ref={ref}
        className={`plus-popover ${className}`}
        style={style}
        {...props}
    >
        {title && <BootstrapPopover.Header className="plus-popover-title">{title}</BootstrapPopover.Header>}
        <BootstrapPopover.Body className="plus-popover-body">
            {children}
        </BootstrapPopover.Body>
    </BootstrapPopover>
));
PopoverContent.displayName = 'PopoverContent';

const Popover = ({
    trigger, // The element that triggers the popover
    children, // Content of the popover
    title,
    placement = 'top',
    triggerType = 'click', // 'click', 'hover', 'focus', ['hover', 'focus']
    defaultShow = false,
    show, // Controlled state
    onToggle, // Callback for controlled state
    container,
    offset = [0, 8],
    className = '',
    id,
    ...props
}) => {

    // Map our trigger types to react-bootstrap trigger types
    // RB uses 'click', 'hover', 'focus' or arrays.
    // Legacy mapping: 'manual' -> controlled mode (user handles 'show')

    const overlayTriggerProps = {
        placement,
        overlay: (
            <PopoverContent title={title} className={className} id={id} {...props}>
                {children}
            </PopoverContent>
        ),
        defaultShow,
        container,
        offset
    };

    if (triggerType === 'manual') {
        overlayTriggerProps.trigger = [];
        overlayTriggerProps.show = show;
    } else {
        overlayTriggerProps.trigger = triggerType;
    }

    if (show !== undefined && triggerType !== 'manual') {
        overlayTriggerProps.show = show;
    }

    if (onToggle) {
        overlayTriggerProps.onToggle = onToggle;
    }

    // Wrap the trigger element
    // OverlayTrigger requires a single child capable of accepting a ref
    // If trigger is a string, wrap it in a button or span? Legacy uses Button if using createPopoverButton

    const triggerElement = React.isValidElement(trigger) ? trigger : <span className="d-inline-block" tabIndex="0">{trigger}</span>;

    return (
        <OverlayTrigger {...overlayTriggerProps}>
            {triggerElement}
        </OverlayTrigger>
    );
};

Popover.propTypes = {
    trigger: PropTypes.node.isRequired,
    children: PropTypes.node.isRequired,
    title: PropTypes.node,
    placement: PropTypes.oneOf(['auto', 'top', 'bottom', 'left', 'right', 'top-start', 'top-end', 'bottom-start', 'bottom-end', 'right-start', 'right-end', 'left-start', 'left-end']),
    triggerType: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
    ]),
    defaultShow: PropTypes.bool,
    show: PropTypes.bool,
    onToggle: PropTypes.func,
    container: PropTypes.any,
    offset: PropTypes.array,
    className: PropTypes.string,
    id: PropTypes.string
};

export default Popover;
