/**
 * Play-function checks for the field box states, shared by the stories of
 * every component drawn on `_Field`. Each reads computed styles from the box
 * (`.plus-field`) around a control and compares them with the token the state
 * should resolve to, so a wrong mapping fails in the browser.
 */
import { expect, waitFor } from 'storybook/test';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { expectFieldDisabled, expectFieldReadOnly } from '@/storybook-docs/lib/field-states.js';

const boxOf = (control) => control.closest('.plus-field');

export const expectRest = async (canvasElement, control) => {
    const style = getComputedStyle(boxOf(control));
    await expect(style.backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-input'));
    await expect(style.borderTopColor).toBe(tokenColor(canvasElement, '--ds-border-input'));
    await expect(boxOf(control).querySelector('.plus-field__invalid-icon'), 'a valid field draws no danger icon').toBeNull();
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

/** Disabled is a change of color, not an opacity fade: see `expectFieldDisabled`. */
export const expectDisabled = async (canvasElement, control) => {
    const box = boxOf(control);
    await expectFieldDisabled(box);
    // The label around it turns `text.disabled` too, at full opacity.
    const label = box.closest('.plus-field-stack')?.querySelector('.plus-field-label');
    if (label) {
        await expect(getComputedStyle(label).color, 'disabled label').toBe(tokenColor(canvasElement, '--ds-text-disabled'));
        await expect(getComputedStyle(label.parentElement).opacity, 'the label does not fade').toBe('1');
    }
};

/** `withIcon: false` for a multi-line field (Text area), which draws the border and no icon. */
export const expectInvalid = async (canvasElement, control, { withIcon = true } = {}) => {
    await expect(control).toHaveAttribute('aria-invalid', 'true');
    await expect(getComputedStyle(boxOf(control)).borderTopColor).toBe(tokenColor(canvasElement, '--ds-border-danger'));
    const icons = boxOf(control).querySelectorAll('.plus-field__invalid-icon');
    if (!withIcon) {
        await expect(icons).toHaveLength(0);
        return;
    }
    // The border is not the only sign: one decorative danger icon sits in Trailing.
    await expect(icons).toHaveLength(1);
    await expect(icons[0]).toHaveAttribute('aria-hidden', 'true');
    await expect(getComputedStyle(icons[0]).color).toBe(tokenColor(canvasElement, '--ds-icon-danger'));
    await expect(px(getComputedStyle(icons[0]).fontSize)).toBe(16);
};

/** Read-only, whole: see `expectFieldReadOnly`. */
export const expectReadOnly = async (canvasElement, control) =>
    expectFieldReadOnly(canvasElement, boxOf(control));
