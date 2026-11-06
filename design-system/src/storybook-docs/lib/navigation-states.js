/**
 * Shared reads for the Navigation family's state stories.
 *
 * Breadcrumb, Link, Menu group, Pagination and Tabs draw hover, pressed,
 * selected and disabled through the state mixin, so each story names the
 * token a state should resolve to and these helpers read the cascade against
 * it. Ground checks come from `label-states.js`; focus rings from
 * `button-states.js` (an outset ring) or `expectInsetRing` below (a ring
 * drawn inside a segment so its neighbors do not cover it).
 */
import { expect, waitFor } from 'storybook/test';
import { withForcedPseudo } from './force-pseudo.js';
import { px, tokenColor } from './style-probes.js';

/** The ink of an element, read at rest or with a forced `:hover` / `:active`. */
export const inkUnder = (element, pseudo) => {
    element.style.transition = 'none';
    const read = () => getComputedStyle(element).color;
    return pseudo ? withForcedPseudo(element, pseudo, read) : read();
};

/** The ink under `pseudo` (or at rest) resolves to `token`. */
export const expectInk = async (host, element, pseudo, token, name = 'item') => {
    await expect(inkUnder(element, pseudo), `${name} ${pseudo || 'rest'} ink is ${token}`).toBe(tokenColor(host, token));
};

/** The text decoration under `pseudo` (or at rest). */
export const decorationUnder = (element, pseudo) => {
    element.style.transition = 'none';
    const read = () => getComputedStyle(element).textDecorationLine;
    return pseudo ? withForcedPseudo(element, pseudo, read) : read();
};

/** Keyboard focus draws the 2px ring inside the segment (a negative offset). */
export const expectInsetRing = async (host, element, name = 'segment') => {
    element.style.transition = 'none';
    element.focus({ focusVisible: true });
    await expect(element.matches(':focus-visible'), `${name} is keyboard-focused`).toBe(true);
    const style = getComputedStyle(element);
    await waitFor(() => expect(style.outlineStyle).toBe('solid'));
    await expect(px(style.outlineWidth), `${name} ring width`).toBe(2);
    await expect(px(style.outlineOffset), `${name} ring sits inside`).toBe(-2);
    await expect(style.outlineColor, `${name} ring color`).toBe(tokenColor(host, '--ds-border-focused'));
    element.blur();
};
