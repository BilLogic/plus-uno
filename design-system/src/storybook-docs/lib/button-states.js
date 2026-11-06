/**
 * Shared reads for the Buttons family's hover, pressed and focus stories.
 *
 * Every button in the family is drawn by `Button`, so each one takes the same
 * named tokens: a bold appearance its own bold step, default and subtle the
 * neutral subtle step. A story names the appearance it renders and these
 * helpers read the cascade against the tokens, so a rule that drifts fails in
 * the browser.
 */
import { expect, waitFor } from 'storybook/test';
import { withForcedPseudo } from './force-pseudo.js';
import { px, tokenColor } from './style-probes.js';

/** Hovered and pressed ground per appearance. */
export const STATE_GROUNDS = {
    default: ['--ds-background-neutral-subtle-hovered', '--ds-background-neutral-subtle-pressed'],
    subtle: ['--ds-background-neutral-subtle-hovered', '--ds-background-neutral-subtle-pressed'],
    primary: ['--ds-background-brand-bold-hovered', '--ds-background-brand-bold-pressed'],
    warning: ['--ds-background-warning-bold-hovered', '--ds-background-warning-bold-pressed'],
    danger: ['--ds-background-danger-bold-hovered', '--ds-background-danger-bold-pressed'],
    discovery: ['--ds-background-discovery-bold-hovered', '--ds-background-discovery-bold-pressed'],
    ai: ['--ds-ai-background-bold-hovered', '--ds-ai-background-bold-pressed'],
};

/** Reads a background with the transition out of the way. */
const readGround = (element, pseudo) => {
    element.style.transition = 'none';
    return pseudo
        ? withForcedPseudo(element, pseudo, () => getComputedStyle(element).backgroundColor)
        : getComputedStyle(element).backgroundColor;
};

/** The ground under a forced `:hover` is the appearance's hovered step. */
export const expectHovered = async (host, element, appearance, name = appearance) => {
    const [hovered] = STATE_GROUNDS[appearance];
    await expect(readGround(element, ':hover'), `${name} hovered`).toBe(tokenColor(host, hovered));
};

/** The ground under a forced `:active` is the appearance's pressed step. */
export const expectPressed = async (host, element, appearance, name = appearance) => {
    const [, pressed] = STATE_GROUNDS[appearance];
    await expect(readGround(element, ':active'), `${name} pressed`).toBe(tokenColor(host, pressed));
};

/** Keyboard focus draws the 2px ring 2px off the edge and leaves the fill alone. */
export const expectFocusRing = async (host, element, name = 'button') => {
    element.style.transition = 'none';
    const rest = getComputedStyle(element).backgroundColor;
    element.focus({ focusVisible: true });
    await expect(element.matches(':focus-visible'), `${name} is keyboard-focused`).toBe(true);
    const style = getComputedStyle(element);
    await waitFor(() => expect(style.outlineStyle).toBe('solid'));
    await expect(px(style.outlineWidth), `${name} ring width`).toBe(2);
    await expect(px(style.outlineOffset), `${name} ring gap`).toBe(2);
    await expect(style.outlineColor, `${name} ring color`).toBe(tokenColor(host, '--ds-border-focused'));
    await expect(style.backgroundColor, `${name} no focus fill`).toBe(rest);
    element.blur();
};
