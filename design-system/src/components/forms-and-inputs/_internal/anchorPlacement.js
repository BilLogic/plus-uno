import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

/**
 * Where a popup opens against the field that opened it — the placement rule
 * every field popup shares with `_Listbox`.
 *
 * - **Gap:** `--size-element-gap-xs` (4px) between the field's edge and the
 *   popup, never Bootstrap's 2px menu spacer.
 * - **Alignment:** the popup's left edge meets the field's, and it is at least
 *   as wide. `center` and `right` are for callers that ask (DatePicker's
 *   `calendarAlign`). A popup that would run off the right of the viewport
 *   right-aligns with the field instead.
 * - **Flip:** with no room below, it opens above, the same gap away.
 */

/** The gap in px when the token can't be read; matches `--size-element-gap-xs`. */
export const ANCHOR_GAP = 4;

/**
 * The gap token's value in px, read from the document.
 *
 * @returns {number}
 */
export function readAnchorGap() {
    if (typeof window === 'undefined') return ANCHOR_GAP;
    const raw = window.getComputedStyle(document.documentElement).getPropertyValue('--size-element-gap-xs');
    const px = parseFloat(raw);
    return Number.isFinite(px) ? px : ANCHOR_GAP;
}

/**
 * @param {object} options
 * @param {{top: number, bottom: number, left: number, right: number, width: number}} options.anchor the field's box
 * @param {number} options.width the popup's width
 * @param {number} options.height the popup's height
 * @param {{width: number, height: number}} options.viewport
 * @param {'left'|'center'|'right'} [options.align]
 * @param {number} [options.gap]
 * @returns {{placement: 'top'|'bottom', top: number, left: number, minWidth: number}}
 */
export function placePopup({ anchor, width, height, viewport, align = 'left', gap = ANCHOR_GAP }) {
    const below = viewport.height - anchor.bottom - gap;
    const above = anchor.top - gap;
    const flip = below < height && above > below;

    let left = anchor.left;
    if (align === 'center') left = anchor.left + (anchor.width - width) / 2;
    if (align === 'right') left = anchor.right - width;
    if (left + width > viewport.width) left = anchor.right - width;
    left = Math.max(left, 0);

    return {
        placement: flip ? 'top' : 'bottom',
        top: flip ? Math.max(anchor.top - gap - height, 0) : anchor.bottom + gap,
        left,
        minWidth: anchor.width,
    };
}

/**
 * Places an open popup against its field, and keeps it there on scroll and
 * resize. A press outside both calls `onClose('outside')`.
 *
 * @param {object} options
 * @param {boolean} options.open
 * @param {{current: HTMLElement|null}} options.anchorRef the field
 * @param {{current: HTMLElement|null}} options.popupRef the popup surface
 * @param {'left'|'center'|'right'} [options.align]
 * @param {(reason: string) => void} [options.onClose]
 * @returns {{placement: 'top'|'bottom', top: number, left: number, minWidth: number}|null}
 */
export function useAnchoredPopup({ open, anchorRef, popupRef, align = 'left', onClose }) {
    const [place, setPlace] = useState(null);

    const reposition = useCallback(() => {
        const anchor = anchorRef.current;
        const popup = popupRef.current;
        if (!anchor || !popup) return;
        setPlace(placePopup({
            anchor: anchor.getBoundingClientRect(),
            width: popup.offsetWidth,
            height: popup.offsetHeight,
            viewport: { width: window.innerWidth, height: window.innerHeight },
            align,
            gap: readAnchorGap(),
        }));
    }, [anchorRef, popupRef, align]);

    useLayoutEffect(() => {
        if (!open) { setPlace(null); return undefined; }
        reposition();
        window.addEventListener('resize', reposition);
        window.addEventListener('scroll', reposition, true);
        return () => {
            window.removeEventListener('resize', reposition);
            window.removeEventListener('scroll', reposition, true);
        };
    }, [open, reposition]);

    useEffect(() => {
        if (!open || !onClose) return undefined;
        const onPointerDown = (event) => {
            if (popupRef.current?.contains(event.target) || anchorRef.current?.contains(event.target)) return;
            onClose('outside');
        };
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [open, onClose, anchorRef, popupRef]);

    return place;
}
