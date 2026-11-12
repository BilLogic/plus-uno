/**
 * Shared reads for the field-shaped inputs' hover, focus, invalid, disabled
 * and read-only stories (DatePicker, TimePicker, DateTimePicker).
 *
 * Each draws its box with `FieldBox` (`.plus-field`), so each takes the same
 * named tokens. A story hands over the box and these helpers read the cascade
 * against the tokens, so a rule that drifts fails in the browser.
 */
import { expect, waitFor } from 'storybook/test';
import { withForcedPseudo } from './force-pseudo.js';
import { px, tokenColor } from './style-probes.js';

/** The box that draws a field's border, fill and ring. */
export const fieldBox = (canvasElement, index = 0) => canvasElement.querySelectorAll('.plus-field')[index];

/** Hover turns the border `border.focused` and leaves the fill alone. */
export const expectFieldHovered = async (host, box, name = 'field') => {
    box.style.transition = 'none';
    const fill = getComputedStyle(box).backgroundColor;
    const border = withForcedPseudo(box, ':hover', () => getComputedStyle(box).borderTopColor);
    await expect(border, `${name} hovered border`).toBe(tokenColor(host, '--ds-border-focused'));
    await expect(getComputedStyle(box).backgroundColor, `${name} hover fill`).toBe(fill);
};

/** Keyboard focus draws the 2px ring, 2px off the box, in `border.focused`. */
export const expectFieldFocused = async (host, box, control, name = 'field') => {
    box.style.transition = 'none';
    control.focus({ focusVisible: true });
    const style = getComputedStyle(box);
    await waitFor(() => expect(style.outlineStyle).toBe('solid'));
    await expect(px(style.outlineWidth), `${name} ring width`).toBe(2);
    await expect(px(style.outlineOffset), `${name} ring gap`).toBe(2);
    await expect(style.outlineColor, `${name} ring color`).toBe(tokenColor(host, '--ds-border-focused'));
    control.blur();
};

/** Invalid is a `border.danger` edge. */
export const expectFieldInvalid = async (host, box, name = 'field') => {
    box.style.transition = 'none';
    await expect(box).toHaveClass('plus-field--invalid');
    await expect(getComputedStyle(box).borderTopColor, `${name} invalid border`).toBe(tokenColor(host, '--ds-border-danger'));
};

/** Disabled fades the box to the disabled opacity. */
export const expectFieldDisabled = async (box, name = 'field') => {
    await expect(box).toHaveClass('plus-field--disabled');
    await expect(parseFloat(getComputedStyle(box).opacity), `${name} disabled opacity`).toBeLessThan(1);
};

/**
 * Read-only, whole: the control stays in the tab order, at full contrast, and
 * says so (`readonly` or `aria-readonly`); the box takes the neutral fill and
 * the border does not answer a hover. Never the disabled look.
 */
export const expectFieldReadOnly = async (host, box, name = 'field') => {
    box.style.transition = 'none';
    await expect(box).toHaveClass('plus-field--readonly');
    await expect(box).not.toHaveClass('plus-field--disabled');
    await expect(getComputedStyle(box).backgroundColor, `${name} read-only fill`).toBe(tokenColor(host, '--ds-background-neutral'));
    await expect(parseFloat(getComputedStyle(box).opacity), `${name} read-only contrast`).toBe(1);

    const control = box.querySelector('input:not([type="hidden"]), textarea, [role="combobox"]');
    await expect(control, `${name} read-only control`).toBeTruthy();
    await expect(control.disabled, `${name} read-only is not disabled`).toBeFalsy();
    await expect(control.tabIndex, `${name} read-only stays in the tab order`).toBeGreaterThanOrEqual(0);
    await expect(control.readOnly || control.getAttribute('aria-readonly') === 'true', `${name} says it is read-only`).toBe(true);

    const rest = getComputedStyle(box).borderTopColor;
    const hovered = withForcedPseudo(box, ':hover', () => getComputedStyle(box).borderTopColor);
    await expect(hovered, `${name} read-only has no hover`).toBe(rest);
};

/**
 * Read-only on a choice control (the box of a Checkbox or Radio, the track of a
 * Toggle): at full contrast, in the tab order, no hover, and, unchecked, the
 * neutral fill. A checked control keeps its selected fill.
 */
export const expectChoiceReadOnly = async (host, control, name = 'choice') => {
    control.style.transition = 'none';
    await expect(control.hasAttribute('data-readonly'), `${name} is read-only`).toBe(true);
    await expect(control.hasAttribute('data-disabled'), `${name} is not disabled`).toBe(false);
    await expect(control.tabIndex, `${name} stays in the tab order`).toBeGreaterThanOrEqual(0);
    await expect(parseFloat(getComputedStyle(control).opacity), `${name} contrast`).toBe(1);
    const rest = getComputedStyle(control);
    const [fill, edge] = [rest.backgroundColor, rest.borderTopColor];
    const hovered = withForcedPseudo(control, ':hover', () => {
        const style = getComputedStyle(control);
        return [style.backgroundColor, style.borderTopColor];
    });
    await expect(hovered, `${name} has no hover`).toEqual([fill, edge]);
    if (!control.hasAttribute('data-checked') && !control.hasAttribute('data-indeterminate') && !control.classList.contains('plus-toggle')) {
        await expect(fill, `${name} read-only fill`).toBe(tokenColor(host, '--ds-background-neutral'));
    }
};
