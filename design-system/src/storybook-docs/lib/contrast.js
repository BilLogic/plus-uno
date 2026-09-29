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
    const back = parseColour(background);
    const front = parseColour(foreground);
    if (!back || !front) throw new Error(`cannot read ${foreground} on ${background}`);
    return contrast(front.a < 1 ? composite(front, back) : front, back);
}
