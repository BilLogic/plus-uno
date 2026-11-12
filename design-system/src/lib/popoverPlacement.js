/**
 * The Popups pattern's placement rule, read from its tokens: a menu, popup,
 * tooltip or flag opens `--popover-offset` (4px) from its trigger and never
 * comes nearer than `--popover-gap-screen` (8px) to the screen's edge.
 * Field popups place themselves with `placePopup` (forms-and-inputs).
 */
import { overlayMountOf } from '@/lib/overlay';

/** The offset in px when the token can't be read; matches `--popover-offset`. */
export const POPOVER_OFFSET = 4;

/** The screen gap in px when the token can't be read; matches `--popover-gap-screen`. */
export const SCREEN_GAP = 8;

/** A length token's value in px, read from the document, or `fallback`. */
function readPx(name, fallback) {
    if (typeof window === 'undefined') return fallback;
    const raw = window.getComputedStyle(document.documentElement).getPropertyValue(name);
    const px = parseFloat(raw);
    return Number.isFinite(px) ? px : fallback;
}

/**
 * The offset token's value in px, read from the document.
 *
 * @returns {number}
 */
export function readPopoverOffset() {
    return readPx('--popover-offset', POPOVER_OFFSET);
}

/**
 * The screen gap token's value in px, read from the document.
 *
 * @returns {number}
 */
export function readScreenGap() {
    return readPx('--popover-gap-screen', SCREEN_GAP);
}

/**
 * Where a popup mounts: the page, or the modal its trigger sits in.
 *
 * A popup is on the popup layer (400), under a modal (510). One opened from a
 * trigger inside a modal mounts in the modal's overlay instead, so it takes
 * the modal's layer and draws above the dialog. Resolved through the shared
 * overlay module (`@/lib/overlay`), the one place this rule is spelled out.
 *
 * @param {{current: Element | null} | undefined} triggerRef the trigger
 * @returns {Element}
 */
export function popupMountOf(triggerRef) {
    return overlayMountOf(triggerRef?.current);
}
