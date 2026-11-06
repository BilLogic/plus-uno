/**
 * Play-function checks for the field box states, shared by the stories of
 * every component drawn on `_Field`. Each reads computed styles from the box
 * (`.plus-field`) around a control and compares them with the token the state
 * should resolve to, so a wrong mapping fails in the browser.
 */
import { expect, waitFor } from 'storybook/test';
import { px, probe, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';

const boxOf = (control) => control.closest('.plus-field');

export const expectRest = async (canvasElement, control) => {
    const style = getComputedStyle(boxOf(control));
    await expect(style.backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-input'));
    await expect(style.borderTopColor).toBe(tokenColor(canvasElement, '--ds-border-input'));
};

export const expectHovered = async (canvasElement, control) => {
    const box = boxOf(control);
    box.style.transition = 'none';
    const border = withForcedPseudo(box, ':hover', () => getComputedStyle(box).borderTopColor);
    await expect(border).toBe(tokenColor(canvasElement, '--ds-border-focused'));
};

export const expectFocused = async (canvasElement, control) => {
    const box = boxOf(control);
    box.style.transition = 'none';
    control.focus({ focusVisible: true });
    await waitFor(() => expect(getComputedStyle(box).outlineStyle).toBe('solid'));
    const style = getComputedStyle(box);
    await expect(px(style.outlineWidth)).toBe(2);
    await expect(px(style.outlineOffset)).toBe(2);
    await expect(style.outlineColor).toBe(tokenColor(canvasElement, '--ds-border-focused'));
    control.blur();
};

export const expectDisabled = async (canvasElement, control) => {
    const box = boxOf(control);
    await expect(box).toHaveClass('plus-field--disabled');
    await expect(getComputedStyle(box).opacity).toBe(probe(canvasElement, 'opacity', 'var(--ds-opacity-disabled)'));
};

export const expectInvalid = async (canvasElement, control) => {
    await expect(control).toHaveAttribute('aria-invalid', 'true');
    await expect(getComputedStyle(boxOf(control)).borderTopColor).toBe(tokenColor(canvasElement, '--ds-border-danger'));
};

export const expectReadOnly = async (canvasElement, control) => {
    const box = boxOf(control);
    await expect(box).toHaveClass('plus-field--readonly');
    await expect(getComputedStyle(box).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-neutral'));
};
