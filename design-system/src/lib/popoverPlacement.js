/**
 * The Popover family's placement rule, read from its tokens: a menu, popup,
 * tooltip or flag opens `--popover-offset` (4px) from its trigger and never
 * comes nearer than `--popover-gap-screen` (8px) to the screen's edge.
 * Field popups place themselves with `placePopup` (forms-and-inputs); popups
 * and tooltips hand the same two numbers to Popper.
 */

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
 * The props a react-bootstrap `Overlay` or `OverlayTrigger` takes to follow
 * the rule: the offset from its trigger, and Popper padding so neither
 * flipping nor sliding along its edge brings it nearer than the screen gap.
 *
 * @param {[number, number]} [offset] a caller's own `[skidding, distance]`
 * @returns {{offset: [number, number], popperConfig: object}}
 */
export function popoverOverlayProps(offset) {
    const padding = readScreenGap();
    return {
        offset: offset ?? [0, readPopoverOffset()],
        popperConfig: {
            modifiers: [
                { name: 'preventOverflow', options: { padding } },
                { name: 'flip', options: { padding } },
            ],
        },
    };
}
