import React from 'react';
import './choiceItem.scss';

/**
 * What Checkbox and Radio share as choices: a description under the label, the
 * card appearance, and the read-only state. Not a component of its own, so it is
 * not in the barrel.
 */

const noop = () => {};

/**
 * The props a choice adds to its native input.
 *
 * Read-only cancels the click, which is what Space and the arrow keys dispatch
 * too, so the browser puts the old checked state back. The change handler is
 * dropped as well: React reports a change during that click before the browser
 * undoes it, and a controlled caller would otherwise store a value the screen
 * never shows.
 *
 * @returns {{ descriptionId?: string, inputProps: object }}
 */
export function choiceInputProps({ fieldId, description, readOnly, onChange, onClick, describedBy }) {
    const descriptionId = description ? `${fieldId}-description` : undefined;
    return {
        descriptionId,
        inputProps: {
            'aria-describedby': [describedBy, descriptionId].filter(Boolean).join(' ') || undefined,
            onChange: readOnly ? noop : onChange,
            onClick: readOnly
                ? (event) => {
                    event.preventDefault();
                    onClick?.(event);
                }
                : onClick,
        },
    };
}

/** The wrapper classes for the appearance, read-only and description states. */
export function choiceClasses({ appearance, readOnly, description }) {
    return [
        appearance === 'card' ? 'plus-choice-card' : '',
        readOnly ? 'plus-choice-readonly' : '',
        description ? 'plus-choice-has-description' : '',
    ].filter(Boolean).join(' ');
}

/** The description line, with the id the input points at. */
export function ChoiceDescription({ id, children }) {
    if (!children) return null;
    return (
        <div id={id} className="plus-choice-description body3-txt">
            {children}
        </div>
    );
}
