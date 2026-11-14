import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { POPOVER_OFFSET, SCREEN_GAP, readPopoverOffset, readScreenGap } from '@/lib/popoverPlacement';
import { overlayMountOf } from '@/lib/overlay';

/**
 * Where a popup opens against the field that opened it — the placement rule
 * every field popup shares with `_Listbox`, and the one the Popups pattern
 * (menu, popup, tooltip, flag) follows.
 *
 * - **Offset:** `--popover-offset` (4px) between the field's edge and the
 *   popup.
 * - **Alignment:** the popup's left edge meets the field's, and it is at least
 *   as wide. `center` and `right` are for callers that ask (DatePicker's
 *   `calendarAlign`). A popup that would run off the right of the viewport
 *   right-aligns with the field instead.
 * - **Flip:** with no room below, it opens above, the same offset away.
 * - **Screen gap:** whatever the alignment, it stays `--popover-gap-screen`
 *   (8px) inside the left, right and top edges of the screen. A list taller
 *   than the room below and above caps at its own max height and scrolls.
 */

/**
 * @param {object} options
 * @param {{top: number, bottom: number, left: number, right: number, width: number}} options.anchor the field's box
 * @param {number} options.width the popup's width
 * @param {number} options.height the popup's height
 * @param {{width: number, height: number}} options.viewport
 * @param {'left'|'center'|'right'} [options.align]
 * @param {number} [options.offset] the distance from the field
 * @param {number} [options.screenGap] the least distance to the screen's edges
 * @returns {{placement: 'top'|'bottom', top: number, left: number, minWidth: number}}
 */
export function placePopup({ anchor, width, height, viewport, align = 'left', offset = POPOVER_OFFSET, screenGap = SCREEN_GAP }) {
    const below = viewport.height - anchor.bottom - offset;
    const above = anchor.top - offset;
    const flip = below < height && above > below;

    let left = anchor.left;
    if (align === 'center') left = anchor.left + (anchor.width - width) / 2;
    if (align === 'right') left = anchor.right - width;
    if (left + width > viewport.width) left = anchor.right - width;
    left = Math.min(left, viewport.width - screenGap - width);
    left = Math.max(left, screenGap);

    return {
        placement: flip ? 'top' : 'bottom',
        top: flip ? Math.max(anchor.top - offset - height, screenGap) : anchor.bottom + offset,
        left,
        minWidth: anchor.width,
    };
}

/**
 * Where a field's popup mounts: the page, or the modal its field sits in.
 *
 * A popup is on the popup layer (400), under a modal (510). One opened from a
 * field inside a modal takes the modal's layer instead: it mounts inside the
 * modal's overlay, so it draws above the dialog and stays inside its focus trap.
 * Resolved through the shared overlay module (`@/lib/overlay`), the one place
 * this rule is spelled out — `popupMountOf` (Popup) resolves the same rule.
 *
 * @param {{current: Element | null} | undefined} anchorRef the field
 * @returns {Element}
 */
export function popupLayerOf(anchorRef) {
    return overlayMountOf(anchorRef?.current);
}

const samePlace = (a, b) => Boolean(a && b)
    && a.placement === b.placement && a.side === b.side
    && a.top === b.top && a.left === b.left && a.minWidth === b.minWidth && a.shift === b.shift
    && a.maxWidth === b.maxWidth;

/**
 * Places an open popup against its field, and keeps it there on scroll,
 * resize, and whenever the popup or the field changes size. A press outside
 * both calls `onClose('outside')`. Every field-anchored popup in the group
 * places itself through this: the date pickers, `_Listbox` (Select,
 * TagInput), TreeSelect, Cascader and the Dropdown menu.
 *
 * A popup in a portal positions itself from `top` and `left`. A popup inside
 * its field's wrapper reads `placement` and `side` and lets CSS place it
 * (`.plus-listbox--anchored` in `Listbox.scss`).
 *
 * @param {object} options
 * @param {boolean} options.open
 * @param {{current: HTMLElement|null}} [options.anchorRef] the field; without one nothing is placed
 * @param {{current: HTMLElement|null}} options.popupRef the popup surface
 * @param {'left'|'center'|'right'} [options.align]
 * @param {(reason: string, event?: PointerEvent) => void} [options.onClose] an outside press passes its event
 * @param {{container: Element|null, collisionBoundary?: Element}|null} [options.bounded] an inline docs canvas; keeps the popup below its field
 * @returns {{placement: 'top'|'bottom', side: 'start'|'end', top: number, left: number, minWidth: number, shift: number}|null}
 *   `side` is `end` when the popup's right edge sits on the field's, `start` otherwise.
 *   `shift` is how far the popup's left edge sits from the field's, so a popup
 *   placed in place can honor the screen gap exactly.
 */
export function useAnchoredPopup({ open, anchorRef, popupRef, align = 'left', onClose, bounded }) {
    const [place, setPlace] = useState(null);
    const container = bounded?.container;
    const boundary = bounded?.collisionBoundary;

    const reposition = useCallback(() => {
        const anchor = anchorRef?.current;
        const popup = popupRef.current;
        if (!anchor || !popup) return;
        const box = anchor.getBoundingClientRect();
        // The exact size, not `offsetWidth`: a width rounded down would let the
        // popup's edge sit a fraction inside the screen gap.
        const size = popup.getBoundingClientRect();
        const { width } = size;
        const bounds = boundary?.getBoundingClientRect();
        const origin = bounds ?? { left: 0, top: 0 };
        const placed = placePopup({
            anchor: { top: box.top - origin.top, bottom: box.bottom - origin.top, left: box.left - origin.left, right: box.right - origin.left, width: box.width },
            width,
            height: size.height,
            viewport: { width: bounds?.width ?? document.documentElement.clientWidth, height: bounds ? Infinity : window.innerHeight },
            align,
            offset: readPopoverOffset(),
            screenGap: readScreenGap(),
        });
        // A bounded canvas uses absolute coordinates in its portal container,
        // while normal app popups use fixed viewport coordinates.
        const offsetParent = container ? (popup.offsetParent ?? container) : null;
        const offset = offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 };
        const left = placed.left + origin.left;
        const next = {
            ...placed,
            top: placed.top + origin.top - offset.top + (offsetParent?.scrollTop ?? 0) - (offsetParent?.clientTop ?? 0),
            left: left - offset.left + (offsetParent?.scrollLeft ?? 0) - (offsetParent?.clientLeft ?? 0),
            maxWidth: bounds ? Math.max(0, bounds.width - 2 * readScreenGap()) : undefined,
            side: width > box.width && left < box.left ? 'end' : 'start',
            shift: left - box.left,
        };
        setPlace((prev) => (samePlace(prev, next) ? prev : next));
    }, [anchorRef, popupRef, align, container, boundary]);

    useLayoutEffect(() => {
        if (!open || !anchorRef) { setPlace(null); return undefined; }
        reposition();
        window.addEventListener('resize', reposition);
        window.addEventListener('scroll', reposition, true);
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(reposition);
        if (popupRef.current) observer?.observe(popupRef.current);
        if (anchorRef.current) observer?.observe(anchorRef.current);
        if (boundary) observer?.observe(boundary);
        return () => {
            window.removeEventListener('resize', reposition);
            window.removeEventListener('scroll', reposition, true);
            observer?.disconnect();
        };
    }, [open, anchorRef, popupRef, reposition, boundary]);

    useEffect(() => {
        if (!open || !onClose || !anchorRef) return undefined;
        const onPointerDown = (event) => {
            if (popupRef.current?.contains(event.target) || anchorRef.current?.contains(event.target)) return;
            onClose('outside', event);
        };
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [open, onClose, anchorRef, popupRef]);

    return place;
}
