/**
 * What Checkbox and Radio share as choices: the card appearance class and the
 * read-only class. Label, description and invalid styling are FieldFrame's
 * (A7). Not a component of its own, so it is not in the barrel.
 */

/** The wrapper classes for the appearance and read-only states. */
export function choiceClasses({ appearance, readOnly }) {
    return [
        appearance === 'card' ? 'plus-choice-card' : '',
        readOnly ? 'plus-choice-readonly' : '',
    ].filter(Boolean).join(' ');
}
