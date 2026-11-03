import React from 'react';

/**
 * What goes before or after a field's control.
 *
 * A string is a text affix ("$", ".00", "https://"), drawn quieter than the
 * value. Anything else is rendered as given: an icon, a Status tag, a Button.
 * Put a control in a slot only when it is a Button the field is built for;
 * an element that takes focus of its own is announced apart from the field.
 *
 * @param {React.ReactNode} elem
 * @returns {React.ReactNode}
 */
export default function renderFieldElem(elem) {
    if (elem === undefined || elem === null || elem === false) return null;
    if (typeof elem === 'string') return <span className="plus-field-affix">{elem}</span>;
    return elem;
}
