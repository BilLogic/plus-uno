import { useCallback, useLayoutEffect, useState } from 'react';

/** The gap between a field and its popup, in px; matches `--size-element-gap-xs`. */
export const ANCHOR_GAP = 4;

/**
 * Where a popup goes against its field, by the popup placement rule: below
 * with the gap, or above when there is less room below than it needs and more
 * above; left edges together, or right edges together when a left-aligned
 * popup would run past the viewport's right edge and a right-aligned one fits.
 *
 * @param {DOMRect} anchor The field's box.
 * @param {{ width: number, height: number }} size The popup's size.
 * @param {{ width: number, height: number }} viewport
 * @returns {{ placement: 'top'|'bottom', align: 'start'|'end', top: number, left: number, anchorWidth: number }}
 *   `top` and `left` are viewport coordinates, for a popup placed with `position: fixed`.
 */
export const placePopup = (anchor, size, viewport) => {
    const below = viewport.height - anchor.bottom - ANCHOR_GAP;
    const above = anchor.top - ANCHOR_GAP;
    const placement = below < size.height && above > below ? 'top' : 'bottom';
    const align = anchor.left + size.width > viewport.width && anchor.right - size.width >= 0 ? 'end' : 'start';
    return {
        placement,
        align,
        top: placement === 'top' ? Math.max(anchor.top - ANCHOR_GAP - size.height, 0) : anchor.bottom + ANCHOR_GAP,
        left: align === 'end' ? anchor.right - size.width : anchor.left,
        anchorWidth: anchor.width,
    };
};

const samePlace = (a, b) => Boolean(a && b)
    && a.placement === b.placement && a.align === b.align
    && a.top === b.top && a.left === b.left && a.anchorWidth === b.anchorWidth;

/**
 * Keeps an open popup placed against its field: on open, on resize and scroll,
 * and whenever the popup or the field changes size. Every field-anchored
 * popup in the group places itself through this, so they flip and align alike.
 *
 * A popup in a portal positions itself from `top` and `left`. A popup inside
 * its field's wrapper reads `placement` and `align` and lets CSS place it
 * (`.plus-listbox--anchored` in `Listbox.scss`).
 *
 * @param {{ open: boolean, anchorRef?: { current: HTMLElement|null }, surfaceRef: { current: HTMLElement|null } }} options
 * @returns {ReturnType<typeof placePopup>|null} `null` until first placed.
 */
const usePopupPlacement = ({ open, anchorRef, surfaceRef }) => {
    const [place, setPlace] = useState(null);

    const reposition = useCallback(() => {
        const anchor = anchorRef?.current;
        const surface = surfaceRef.current;
        if (!anchor || !surface) return;
        const next = placePopup(
            anchor.getBoundingClientRect(),
            { width: surface.offsetWidth, height: surface.offsetHeight },
            { width: document.documentElement.clientWidth, height: window.innerHeight }
        );
        setPlace((prev) => (samePlace(prev, next) ? prev : next));
    }, [anchorRef, surfaceRef]);

    useLayoutEffect(() => {
        if (!open || !anchorRef) return undefined;
        reposition();
        window.addEventListener('resize', reposition);
        window.addEventListener('scroll', reposition, true);
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(reposition);
        if (observer) {
            if (surfaceRef.current) observer.observe(surfaceRef.current);
            if (anchorRef.current) observer.observe(anchorRef.current);
        }
        return () => {
            window.removeEventListener('resize', reposition);
            window.removeEventListener('scroll', reposition, true);
            observer?.disconnect();
        };
    }, [open, anchorRef, surfaceRef, reposition]);

    return place;
};

export default usePopupPlacement;
