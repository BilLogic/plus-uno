import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Popover.scss';
import { Popover as BootstrapPopover, OverlayTrigger } from 'react-bootstrap';

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

/**
 * Can this element carry `aria-expanded` without lying?
 *
 * The attribute is only meaningful on something with an interactive role. Put
 * on a bare `span` it is invalid ARIA — a state on a thing that has none — so
 * it is applied to a `button`, an `a`, anything the caller has already given a
 * `role`, and to the button this component generates for a text trigger. A
 * caller who passes a plain `div` gets no `aria-expanded`, which is correct:
 * the fix there is to pass a control, not to decorate a `div`.
 */
export function acceptsExpandedState(element) {
    if (!React.isValidElement(element)) return false;
    if (element.props && element.props.role) return true;
    if (element.type === 'button' || element.type === 'a') return true;
    // A component, not a host element — its rendered tag is unknowable here.
    // `Button` is the overwhelmingly common case and renders a `button`, but
    // guessing for every component would be guessing.
    return Boolean(element.type && element.type.displayName === 'Button');
}

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
    rootClose,
    className = '',
    id,
    ...props
}) => {

    // Map our trigger types to react-bootstrap trigger types
    // RB uses 'click', 'hover', 'focus' or arrays.
    // Legacy mapping: 'manual' -> controlled mode (user handles 'show')

    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultShow);
    const isOpen = show !== undefined ? show : uncontrolledOpen;

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

    /*
     * #321. react-bootstrap's Overlay defaults `rootClose` to false, and this
     * component used to pass no value and expose no way to set one — extra props
     * are spread onto the overlay's CONTENT, not onto OverlayTrigger. So a click
     * popover stayed open until the trigger was clicked a second time: no
     * click-away, no Escape. Clicking away to dismiss is what a click popover is
     * expected to do, and it is what Modal and Dropdown already do.
     *
     * Not defaulted on for `manual`: there the caller owns `show`, and a root
     * close it did not ask for would fight its own state.
     */
    overlayTriggerProps.rootClose = rootClose !== undefined
        ? rootClose
        : triggerType !== 'manual';

    if (show !== undefined && triggerType !== 'manual') {
        overlayTriggerProps.show = show;
    }

    /*
     * The open state is tracked here so the trigger can report it. Controlled
     * callers still own it — `show` wins whenever it is passed, and `onToggle`
     * is always called — this only fills in the uncontrolled case, which is the
     * default and the one that previously announced nothing at all.
     */
    overlayTriggerProps.onToggle = (next) => {
        if (show === undefined) setUncontrolledOpen(next);
        if (onToggle) onToggle(next);
    };

    /*
     * #321. A TEXT TRIGGER IS A BUTTON, not a focusable span.
     *
     * `OverlayTrigger` needs one child that can take a ref, so a string had to
     * be wrapped in something. It used to be wrapped in
     * `<span className="d-inline-block" tabIndex="0">` — a tab stop with no
     * role and no accessible name. A keyboard user reached it, heard nothing,
     * and pressing Enter did nothing either, because implicit activation
     * belongs to the `button` ELEMENT and not to a tabindex.
     *
     * A real `button` carries the role, the name (its own text) and Enter/Space
     * for free. `.plus-popover-trigger` strips the browser chrome so it still
     * looks like the text it replaced.
     */
    const isTextTrigger = !React.isValidElement(trigger);
    const triggerElement = isTextTrigger
        ? <button type="button" className="plus-popover-trigger">{trigger}</button>
        : trigger;

    /*
     * #321. The trigger says a panel exists, and whether it is open.
     *
     * Nothing announced either before this: no `aria-haspopup`, no
     * `aria-expanded`. react-bootstrap adds `aria-describedby` while the
     * popover is shown, which points AT the content once it is open and says
     * nothing beforehand.
     *
     * `aria-controls` is deliberately absent. It needs the rendered popover's
     * id, `id` is optional on this component, and an `aria-controls` pointing
     * at an element that does not exist yet is worse than none.
     */
    const expandable = acceptsExpandedState(triggerElement);

    return (
        <OverlayTrigger {...overlayTriggerProps}>
            {expandable
                ? React.cloneElement(triggerElement, {
                    'aria-haspopup': 'dialog',
                    'aria-expanded': isOpen,
                })
                : triggerElement}
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
    /** Dismiss on a click outside. Defaults to true for every trigger but `manual`. */
    rootClose: PropTypes.bool,
    className: PropTypes.string,
    id: PropTypes.string
};

export default Popover;
