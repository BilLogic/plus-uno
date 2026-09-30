import { composite, contrast, parseColour } from '../../lib/tokens.mjs';

/**
 * WCAG contrast between two COMPUTED colors, for story `play:` functions.
 *
 * A test util, not shipped code: no shipped component imports it. It is a
 * thin adapter over `design-system/src/lib/tokens.mjs`, the same luminance
 * `check:text-contrast`, `check:button-contrast` and `check:focus-ring` fail
 * the build on — so the ratio a story asserts on a rendered pixel and the ratio
 * a check asserts on a token are computed by one function.
 *
 * Both arguments are what `getComputedStyle` returns (`rgb(…)` / `rgba(…)`).
 * A translucent foreground is laid over the background before measuring,
 * which is how it paints.
 *
 * @param {string} foreground
 * @param {string} background  must be opaque
 * @returns {number}
 */
export function contrastRatio(foreground, background) {
    const { front, back } = flatten(foreground, background);
    return contrast(front, back);
}

/**
 * A translucent COMPUTED color laid over an opaque one, as the opaque
 * `rgb(…)` it paints — the ground a border or text next to a tinted fill
 * actually sits on.
 *
 * @param {string} color
 * @param {string} background  must be opaque
 * @returns {string}
 */
export function paintedOver(color, background) {
    const { r, g, b } = flatten(color, background).front;
    return `rgb(${r}, ${g}, ${b})`;
}

/** Both colors parsed, the front one laid over the (opaque) back one. */
function flatten(color, background) {
    const back = parseColour(background);
    const front = parseColour(color);
    if (!back || !front) throw new Error(`cannot read ${color} on ${background}`);
    return { front: front.a < 1 ? composite(front, back) : front, back };
}
