/**
 * Shared reads for the Labels family's state stories.
 *
 * A label that is not a control has one state: Rest. Its hover, pressed,
 * focus and disabled stories assert that nothing moves, so a state layer that
 * leaks in later fails in the browser. The controls in the family (Tag,
 * Suggestion, the explain link) assert their own tokens in their own stories
 * and take the focus ring check from `button-states.js`.
 */
import { expect, userEvent } from 'storybook/test';
import { withForcedPseudo } from './force-pseudo.js';

const SNAPSHOT = ['backgroundColor', 'color', 'boxShadow', 'borderTopColor', 'opacity', 'textDecorationLine'];

const snapshot = (element, pseudo) => {
    element.style.transition = 'none';
    const read = () => {
        const style = getComputedStyle(element);
        return Object.fromEntries(SNAPSHOT.map((key) => [key, style[key]]));
    };
    return pseudo ? withForcedPseudo(element, pseudo, read) : read();
};

/** Forced `:hover` or `:active` leaves ground, ink, edge, opacity and underline as they were at rest. */
export const expectNoStateChange = async (element, pseudo, name = 'label') => {
    await expect(snapshot(element, pseudo), `${name} under ${pseudo}`).toEqual(snapshot(element));
};

/** A label that is not a control is skipped by Tab and carries no disabled semantics. */
export const expectNotAControl = async (element, name = 'label') => {
    await userEvent.tab();
    await expect(element, `${name} is not in the tab order`).not.toHaveFocus();
    await expect(element, `${name} has no disabled state`).not.toHaveAttribute('aria-disabled');
    await expect(getComputedStyle(element).opacity, `${name} is never dimmed`).toBe('1');
};

/** The ground of an element, read at rest or with a forced `:hover` / `:active`. */
export const groundUnder = (element, pseudo) => {
    element.style.transition = 'none';
    const read = () => getComputedStyle(element).backgroundColor;
    return pseudo ? withForcedPseudo(element, pseudo, read) : read();
};

/** The ground under `pseudo` resolves to `token`, read through a probe on `host`. */
export const expectGroundUnder = async (host, element, pseudo, token, name = 'label') => {
    const probe = document.createElement('i');
    probe.style.backgroundColor = `var(${token})`;
    host.appendChild(probe);
    const wanted = getComputedStyle(probe).backgroundColor;
    probe.remove();
    await expect(groundUnder(element, pseudo), `${name} ${pseudo || 'rest'} ground is ${token}`).toBe(wanted);
};
