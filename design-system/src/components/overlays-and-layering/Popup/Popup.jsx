import React, { useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Popover as BasePopover } from '@base-ui/react/popover';
import { popupMountOf } from '@/lib/popoverPlacement';
import { isOverlayRaisedOver, isPressInRaisedOverlay } from '@/lib/overlay';
import './Popup.scss';

/** The width tiers, Popover/width-sm · md · lg: 320 · 400 · 480. */
const WIDTHS = ['sm', 'md', 'lg'];

/** Every placement this component accepts, ADS-shaped (side + optional `-start`/`-end`). */
const PLACEMENTS = [
    'auto', 'top', 'bottom', 'left', 'right',
    'top-start', 'top-end', 'bottom-start', 'bottom-end',
    'right-start', 'right-end', 'left-start', 'left-end',
];

/** `top-start` → `{ side: 'top', align: 'start' }`. `auto` falls back to `bottom`/`center`: Base UI's own collision handling picks the side that fits. */
function sideAlignOf(placement) {
    if (!placement || placement === 'auto') return { side: 'bottom', align: 'center' };
    const [side, align = 'center'] = placement.split('-');
    return { side, align };
}

/** Host tags Base UI should NOT treat as a native button when merging its props in. */
const NON_BUTTON_TAGS = new Set(['div', 'span', 'a', 'p']);

/**
 * Does this trigger render a `<button>` once Base UI merges its own props
 * into it? A custom component (`Button`, most often) is assumed to, since
 * guessing its rendered tag from here would otherwise mean guessing for every
 * component in the system; a known non-button host tag is the one case this
 * can actually tell.
 */
function isButtonLike(element) {
    return !(typeof element.type === 'string' && NON_BUTTON_TAGS.has(element.type));
}

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
    return isButtonLike(element);
}

/** Dismiss attempts Base UI reports through `onOpenChange`'s event detail. */
const DISMISS_REASONS = new Set(['outside-press', 'escape-key', 'focus-out']);

const Popup = ({
    trigger,
    children,
    title,
    label,
    placement = 'top',
    triggerType = 'click',
    defaultShow = false,
    show,
    onToggle,
    container,
    offset,
    rootClose,
    width = 'sm',
    className = '',
    id,
    ...props
}) => {
    const widthClass = WIDTHS.includes(width) && width !== 'sm' ? `plus-popup--${width}` : '';
    const { side, align } = sideAlignOf(placement);
    const [along = 4, away] = offset ?? [];

    // Every trigger but `manual` dismisses on a click away and Escape, unless
    // the caller says otherwise with `rootClose={false}`.
    const dismissible = rootClose !== undefined ? rootClose : triggerType !== 'manual';

    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultShow);
    const isOpen = show !== undefined ? Boolean(show) : uncontrolledOpen;

    const handleOpenChange = (next, eventDetails) => {
        if (!next && !dismissible && DISMISS_REASONS.has(eventDetails?.reason)) return;
        // A press inside a Modal or Drawer this popup sits outside of is not a click away from it.
        if (!next && eventDetails?.reason === 'outside-press'
            && isPressInRaisedOverlay(eventDetails.event?.target, triggerNodeRef.current)) return;
        // Escape and focus moving into the Modal belong to the Modal; the popup stays under it.
        if (!next && (eventDetails?.reason === 'escape-key' || eventDetails?.reason === 'focus-out')
            && isOverlayRaisedOver(triggerNodeRef.current)) return;
        if (show === undefined) setUncontrolledOpen(next);
        onToggle?.(next);
    };

    const isTextTrigger = !React.isValidElement(trigger);
    const triggerElement = isTextTrigger
        ? <button type="button" className="plus-popup-trigger">{trigger}</button>
        : trigger;
    const expandable = acceptsExpandedState(triggerElement);
    const openOnHover = triggerType === 'hover' || triggerType === 'focus'
        || (Array.isArray(triggerType) && (triggerType.includes('hover') || triggerType.includes('focus')));

    // The trigger's node, so a popup opened inside a modal mounts in it,
    // unless the caller names a container. Set during render, not an effect,
    // so it is current by the time the Portal below reads it on first open.
    const triggerNodeRef = useRef(null);
    const containerRef = useRef(null);
    containerRef.current = container ?? popupMountOf(triggerNodeRef);
    const ownRef = triggerElement.props?.ref ?? triggerElement.ref;
    const mergedTrigger = React.cloneElement(triggerElement, {
        ref: (node) => {
            triggerNodeRef.current = node;
            if (typeof ownRef === 'function') ownRef(node);
            else if (ownRef) ownRef.current = node;
        },
    });

    // A dialog needs an accessible name. `title`, when given, is it; a
    // body-only popup falls back to `label`, and failing that to the
    // trigger's own text — "Learn more" names the popup it opens as much as
    // it names the control that opens it.
    const titleId = useId();
    const generatedTriggerId = useId();
    const triggerId = triggerElement.props?.id ?? generatedTriggerId;
    const labelledBy = title ? titleId : (label ? undefined : triggerId);

    return (
        <BasePopover.Root open={isOpen} onOpenChange={handleOpenChange}>
            <BasePopover.Trigger
                render={mergedTrigger}
                id={triggerElement.props?.id ? undefined : triggerId}
                nativeButton={isTextTrigger || isButtonLike(triggerElement)}
                openOnHover={openOnHover}
                {...(expandable ? { 'aria-haspopup': 'dialog' } : {})}
            />
            <BasePopover.Portal container={containerRef}>
                <BasePopover.Positioner
                    side={side}
                    align={align}
                    sideOffset={away ?? along}
                    collisionPadding={8}
                >
                    <BasePopover.Popup
                        id={id}
                        className={['plus-popup', widthClass, className].filter(Boolean).join(' ')}
                        finalFocus={dismissible ? undefined : false}
                        aria-label={label}
                        aria-labelledby={labelledBy}
                        {...props}
                    >
                        {title && <div className="plus-popup-title" id={titleId}>{title}</div>}
                        <div className="plus-popup-body">{children}</div>
                    </BasePopover.Popup>
                </BasePopover.Positioner>
            </BasePopover.Portal>
        </BasePopover.Root>
    );
};

Popup.propTypes = {
    /** The element that triggers the popup. A plain string becomes a real `button`. */
    trigger: PropTypes.node.isRequired,
    /** The popup's body content. */
    children: PropTypes.node.isRequired,
    title: PropTypes.node,
    /** Names the popup for assistive tech when there is no `title`. Falls back to the trigger's own accessible text when neither is given. */
    label: PropTypes.string,
    placement: PropTypes.oneOf(PLACEMENTS),
    /** `click` (default), `hover`, `focus`, an array of those, or `manual` for a popup you drive with `show`. */
    triggerType: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string),
    ]),
    defaultShow: PropTypes.bool,
    show: PropTypes.bool,
    onToggle: PropTypes.func,
    /** Where the popup portals to. Defaults to the page, or the modal the trigger sits in. */
    container: PropTypes.object,
    offset: PropTypes.array,
    /** Dismiss on a click outside. Defaults to true for every trigger but `manual`. */
    rootClose: PropTypes.bool,
    /** The width tier: sm 320 (default), md 400 or lg 480. */
    width: PropTypes.oneOf(WIDTHS),
    className: PropTypes.string,
    id: PropTypes.string,
};

export default Popup;
