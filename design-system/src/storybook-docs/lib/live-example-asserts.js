import { expect } from 'storybook/test';

/**
 * Shared play assertions for live template examples: nothing is inert (ignoring
 * Base UI's own `data-base-ui-inert` siblings while a popup is open) and the
 * stage renders at 1:1 scale with no shrinking `transform` or CSS `zoom`.
 */
export const INERT_SELECTOR = '[inert]:not([data-base-ui-inert])';

/** Asserts neither `canvasElement` nor any non-Base-UI descendant is `inert`. */
export const expectNotInert = async (canvasElement) => {
    await expect(canvasElement.closest('[inert]'), 'live example has no inert ancestor').toBeNull();
    await expect(canvasElement.querySelector(INERT_SELECTOR), 'live example has no inert descendant').toBeNull();
};

/**
 * Asserts the rendered live example (`target`) and its wrapper ancestors inside
 * `canvasElement` have `transform` of `none` (or identity `matrix(1, 0, 0, 1, 0, 0)`),
 * `zoom` of `1` (or `normal`), and 1:1 rendered width.
 */
export const expectFullScale = async (
    canvasElement,
    target = canvasElement.querySelector('.plus-frame, .plus-pattern-page') ?? canvasElement.firstElementChild,
) => {
    await expect(target, 'live example renders a target element').not.toBeNull();
    for (let el = target; el && el !== canvasElement.parentElement; el = el.parentElement) {
        const { transform, zoom } = getComputedStyle(el);
        await expect(
            transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)',
            `${el.tagName.toLowerCase()} has scale-1 transform (got ${transform})`,
        ).toBe(true);
        await expect(
            zoom === '1' || zoom === '' || zoom === 'normal',
            `${el.tagName.toLowerCase()} has zoom 1 (got ${zoom})`,
        ).toBe(true);
    }
    if (target.offsetWidth > 0) {
        await expect(
            target.getBoundingClientRect().width / target.offsetWidth,
            'live example renders at scale 1',
        ).toBeCloseTo(1, 2);
    }
};
