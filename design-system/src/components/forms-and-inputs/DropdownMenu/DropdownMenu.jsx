import React, { useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import Icon from '@/components/images-and-icons/Icon';
import Spinner from '@/components/loading/Spinner/Spinner';
import { ButtonItem, CustomItem, MenuGroup } from '@/components/forms-and-inputs/_internal/MenuGroup';
import './DropdownMenu.scss';

/** Every placement this component accepts, matching Popup's side+align shape. */
const PLACEMENTS = [
    'bottom-start', 'bottom', 'bottom-end',
    'top-start', 'top', 'top-end',
    'right-start', 'right', 'right-end',
    'left-start', 'left', 'left-end',
];

/** `bottom-start` → `{ side: 'bottom', align: 'start' }`. */
function sideAlignOf(placement) {
    const [side, align = 'center'] = placement.split('-');
    return { side, align };
}

/** Host tags Base UI should NOT treat as a native button when merging its props in. */
const NON_BUTTON_TAGS = new Set(['div', 'span', 'a', 'p']);

function isButtonLike(element) {
    return !(typeof element.type === 'string' && NON_BUTTON_TAGS.has(element.type));
}

/**
 * DropdownMenu: a trigger that opens a list of menu items in a
 * floating popup. Positioning and
 * dismissal (outside click, Escape) are Base UI Menu's; the rows are
 * `ButtonItem`, `LinkItem`, `CustomItem` and `Section`, which this folder's
 * `index.js` re-exports.
 */
const DropdownMenu = ({
    trigger,
    children,
    isOpen,
    defaultOpen = false,
    onOpenChange,
    placement = 'bottom-start',
    shouldFlip = true,
    spacing = 'default',
    loading = false,
    hasError = false,
    onRetry,
    minWidth,
    maxHeight,
    container,
    testId,
    id,
    className = '',
}) => {
    const { side, align } = sideAlignOf(placement);
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const isControlled = isOpen !== undefined;
    const open = isControlled ? isOpen : uncontrolledOpen;

    const handleOpenChange = (next) => {
        if (!isControlled) setUncontrolledOpen(next);
        onOpenChange?.(next);
    };

    const triggerNodeRef = useRef(null);
    const ownRef = trigger.props?.ref ?? trigger.ref;
    const mergedTrigger = React.cloneElement(trigger, {
        // Base UI's Trigger sets `aria-haspopup`/`aria-controls` itself but
        // leaves `aria-expanded` to the caller, since it only knows this
        // trigger's open state as a `data-popup-open` attribute.
        'aria-expanded': open,
        // A `Button` trigger (the default pattern: Button + chevron)
        // shows selected while the menu is open; `isSelected` is a custom
        // prop a plain DOM element (`button`, `a`, ...) would warn on, so it
        // is only passed to a component trigger.
        ...(typeof trigger.type !== 'string' ? { isSelected: open } : {}),
        ref: (node) => {
            triggerNodeRef.current = node;
            if (typeof ownRef === 'function') ownRef(node);
            else if (ownRef) ownRef.current = node;
        },
    });

    const labelId = useId();

    // A plain `ButtonItem`/`LinkItem`/`CustomItem` row knows nothing about the
    // popup it sits in, so picking one closes the menu here, by delegation,
    // rather than in the Menu family itself (an always-visible `MenuGroup`
    // must not close on a click). Only an interactive row closes it — a
    // `CustomItem` static row (Figma's "say the words, press nothing") has no
    // button or link in it and leaves the menu open. `data-keep-open` on a
    // row opts it out, for a toggle meant to be picked more than once.
    const handleRowPick = (event) => {
        const interactive = event.target.closest(
            'button[role="menuitem"], a[role="menuitem"], [role="menuitem"] button, [role="menuitem"] a'
        );
        if (!interactive || interactive.closest('[data-keep-open="true"]')) return;
        handleOpenChange(false);
    };

    return (
        <BaseMenu.Root open={open} onOpenChange={handleOpenChange} loopFocus modal={false}>
            <BaseMenu.Trigger
                render={mergedTrigger}
                nativeButton={isButtonLike(mergedTrigger)}
            />
            <BaseMenu.Portal container={container}>
                <BaseMenu.Positioner
                    side={side}
                    align={align}
                    sideOffset={4}
                    collisionPadding={8}
                    collisionAvoidance={{ side: shouldFlip ? 'flip' : 'none' }}
                >
                    <BaseMenu.Popup
                        id={id}
                        data-testid={testId}
                        className={clsx('plus-dropdown-menu', className)}
                        aria-labelledby={labelId}
                        aria-busy={loading || undefined}
                        onClick={handleRowPick}
                    >
                        {hasError && !loading ? (
                            <MenuGroup density={spacing} minWidth={minWidth}>
                                <CustomItem elemBefore={<Icon name="circle-exclamation" />}>Couldn't load options</CustomItem>
                                <ButtonItem onClick={onRetry} data-keep-open="true">Retry</ButtonItem>
                            </MenuGroup>
                        ) : loading ? (
                            // `role="menu"` only owns menuitem/group children, so the
                            // Spinner's own `role="status"` is hidden from the tree
                            // entirely rather than left as a disallowed child;
                            // `aria-busy` above carries the loading announcement.
                            <div className="plus-dropdown-menu-loading" aria-hidden="true">
                                <Spinner size={16} label="" />
                                <span>Loading options</span>
                            </div>
                        ) : (
                            <MenuGroup density={spacing} maxHeight={maxHeight} minWidth={minWidth}>
                                {children}
                            </MenuGroup>
                        )}
                    </BaseMenu.Popup>
                </BaseMenu.Positioner>
            </BaseMenu.Portal>
        </BaseMenu.Root>
    );
};

DropdownMenu.propTypes = {
    /** The element that opens the menu. A `Button` with a chevron is the default pattern. */
    trigger: PropTypes.element.isRequired,
    /** The menu's rows: `Section`, `ButtonItem`, `LinkItem`, `CustomItem`. */
    children: PropTypes.node,
    /** Controlled open state. Pair it with `onOpenChange`; leave it out for an uncontrolled menu. */
    isOpen: PropTypes.bool,
    /** Whether an uncontrolled menu starts open. */
    defaultOpen: PropTypes.bool,
    /** Called with the next open state (a boolean) when the menu opens or closes: trigger press, outside click, Escape or picking a row. */
    onOpenChange: PropTypes.func,
    /** Side and alignment against the trigger, such as `bottom-start` (default), `top-end` or `right`. A bare side centers the menu on that side. */
    placement: PropTypes.oneOf(PLACEMENTS),
    /** Flips to the opposite side when there isn't room. */
    shouldFlip: PropTypes.bool,
    /** `default` draws 32px rows, `compact` draws 24px. */
    spacing: PropTypes.oneOf(['default', 'compact']),
    /** Shows one "Loading options" row, with a spinner, in place of the menu's rows while its options load. Never skeleton rows. */
    loading: PropTypes.bool,
    /** Shows "Couldn't load options" with a Retry row in place of the menu's rows, after loading failed. */
    hasError: PropTypes.bool,
    /** Called when Retry is pressed. The menu stays open. */
    onRetry: PropTypes.func,
    /** Minimum width of the menu list, as a CSS length such as `240px`. */
    minWidth: PropTypes.string,
    /** Maximum height of the menu list, as a CSS length such as `320px`. */
    maxHeight: PropTypes.string,
    /** Where the menu portals to. Defaults to the page. */
    container: PropTypes.object,
    /** Maps to `data-testid` on the menu popup, for test queries. */
    testId: PropTypes.string,
    /** Id set on the menu popup. */
    id: PropTypes.string,
    /** Extra class on the menu popup, beside `plus-dropdown-menu`. */
    className: PropTypes.string,
};

export default DropdownMenu;
