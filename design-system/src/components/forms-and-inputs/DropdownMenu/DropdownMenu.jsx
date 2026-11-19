import { useMotionReduced } from '@/lib/motionPreference';
import React, { useId } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import { FLOATING_PLACEMENTS, useFloatingOverlay } from '@/lib/overlay';
import Icon from '@/components/images-and-icons/Icon';
import Spinner from '@/components/loading/Spinner/Spinner';
import { ButtonItem, CustomItem, MenuGroup } from '@/components/forms-and-inputs/_internal/MenuGroup';
import useOpenState from '../_internal/useOpenState';
import './DropdownMenu.scss';

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
    isLoading = false,
    hasError = false,
    onRetry,
    minWidth,
    maxHeight,
    container,
    testId,
    id,
    className = '',
}) => {
    const reduced = useMotionReduced();
    const { isOpen: open, setOpen: handleOpenChange, closeList } = useOpenState({
        isOpen,
        defaultOpen,
        onOpenChange,
    });

    const floating = useFloatingOverlay({
        trigger,
        triggerProps: {
            'aria-expanded': open,
            // Only component triggers accept Button's selected-state prop.
            ...(typeof trigger.type !== 'string' ? { isSelected: open } : {}),
        },
        placement,
        container,
        collisionAvoidance: { side: shouldFlip ? 'flip' : 'none' },
        onOpenChange: handleOpenChange,
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
        closeList();
    };

    return (
        <BaseMenu.Root open={open} onOpenChange={floating.onOpenChange} loopFocus modal={false}>
            <BaseMenu.Trigger {...floating.triggerProps} />
            <BaseMenu.Portal container={floating.container}>
                <BaseMenu.Positioner {...floating.positionerProps}>
                    <BaseMenu.Popup
                        data-reduced={reduced ? 'true' : undefined}
                        id={id}
                        data-testid={testId}
                        className={clsx('plus-dropdown-menu', className)}
                        aria-labelledby={labelId}
                        aria-busy={isLoading || undefined}
                        onClick={handleRowPick}
                    >
                        {hasError && !isLoading ? (
                            <MenuGroup spacing={spacing} minWidth={minWidth}>
                                <CustomItem elemBefore={<Icon name="circle-exclamation" />}>Couldn't load options</CustomItem>
                                <ButtonItem onClick={onRetry} data-keep-open="true">Retry</ButtonItem>
                            </MenuGroup>
                        ) : isLoading ? (
                            // `role="menu"` only owns menuitem/group children, so the
                            // Spinner's own `role="status"` is hidden from the tree
                            // entirely rather than left as a disallowed child;
                            // `aria-busy` above carries the loading announcement.
                            <div className="plus-dropdown-menu-loading" aria-hidden="true">
                                <Spinner size={16} label="" />
                                <span>Loading options</span>
                            </div>
                        ) : (
                            <MenuGroup spacing={spacing} maxHeight={maxHeight} minWidth={minWidth}>
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
    placement: PropTypes.oneOf(FLOATING_PLACEMENTS),
    /** Flips to the opposite side when there isn't room. */
    shouldFlip: PropTypes.bool,
    /** `default` draws 32px rows, `compact` draws 24px. */
    spacing: PropTypes.oneOf(['default', 'compact']),
    /** Shows one "Loading options" row, with a spinner, in place of the menu's rows while its options load. Never skeleton rows. */
    isLoading: PropTypes.bool,
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
