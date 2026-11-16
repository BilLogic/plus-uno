/**
 * What Checkbox and Radio share as choices: the card and tile appearance
 * classes and the read-only class. Label, description and invalid styling are
 * FieldFrame's (A7). Not a component of its own, so it is not in the barrel.
 */

/** The wrapper classes for the appearance and read-only states. */
export function choiceClasses({ appearance, readOnly }) {
    return [
        appearance === 'card' ? 'plus-choice-card' : '',
        appearance === 'soft' ? 'plus-choice-soft' : '',
        appearance === 'tile' ? 'plus-choice-tile' : '',
        readOnly ? 'plus-choice-readonly' : '',
    ].filter(Boolean).join(' ');
}

/**
 * Clicks anywhere inside a choice tile or soft row (illustration, caption or
 * padding) activate its radio or checkbox control, without double-firing when
 * the click already hit the label or the control itself, and ignoring disabled
 * or read-only rows.
 */
export function activateChoiceTile(event) {
    if (event.target.closest('label, [role="radio"], [role="checkbox"], input')) return;
    if (
        event.currentTarget.classList.contains('plus-field-stack--disabled')
        || event.currentTarget.classList.contains('plus-choice-readonly')
    ) {
        return;
    }
    const control = event.currentTarget.querySelector('[role="radio"], [role="checkbox"]');
    if (
        !control
        || control.hasAttribute('data-disabled')
        || control.hasAttribute('data-readonly')
        || control.getAttribute('aria-disabled') === 'true'
        || control.getAttribute('aria-readonly') === 'true'
    ) {
        return;
    }
    control.click();
}
