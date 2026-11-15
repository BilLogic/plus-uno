/**
 * What Checkbox and Radio share as choices: the card and tile appearance
 * classes and the read-only class. Label, description and invalid styling are
 * FieldFrame's (A7). Not a component of its own, so it is not in the barrel.
 */

/** The wrapper classes for the appearance and read-only states. */
export function choiceClasses({ appearance, readOnly }) {
    return [
        appearance === 'card' ? 'plus-choice-card' : '',
        appearance === 'tile' ? 'plus-choice-tile' : '',
        readOnly ? 'plus-choice-readonly' : '',
    ].filter(Boolean).join(' ');
}

/**
 * Clicks anywhere inside a choice tile (illustration, caption or padding)
 * activate its radio or checkbox control, without double-firing when the click
 * already hit the label or the control itself.
 */
export function activateChoiceTile(event) {
    if (event.target.closest('label, [role="radio"], [role="checkbox"], input')) return;
    event.currentTarget.querySelector('[role="radio"], [role="checkbox"]')?.click();
}
