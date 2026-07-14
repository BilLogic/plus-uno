import React from 'react';
import PropTypes from 'prop-types';

/**
 * SelectionIndicator - purely visual checkbox/radio glyph for listbox-style
 * options (`ListGroup.Item selectable="single|multi"`, `ListGroup.Option`).
 * Not a real form control: selection state and interaction live on the
 * parent `role="option"` element (`aria-selected` + `onClick`). A native
 * `<input>` here would be a focusable, unlabeled control nested inside
 * another interactive element — invalid per ARIA and flagged by axe.
 *
 * @param {object} props
 * @param {'single'|'multi'} props.mode Selection mode driving the glyph shape.
 * @param {boolean} props.selected Whether the option is currently selected.
 * @param {boolean} [props.disabled] Whether the option is disabled.
 * @returns {JSX.Element}
 */
const SelectionIndicator = ({ mode, selected, disabled = false }) => (
    <span
        aria-hidden="true"
        className={[
            'plus-list-option-indicator',
            mode === 'multi' ? 'plus-list-option-indicator--checkbox' : 'plus-list-option-indicator--radio',
            selected ? 'is-selected' : '',
            disabled ? 'is-disabled' : ''
        ].filter(Boolean).join(' ')}
    >
        {mode === 'multi' && selected && <i className="fa-solid fa-check" />}
    </span>
);

SelectionIndicator.propTypes = {
    mode: PropTypes.oneOf(['single', 'multi']).isRequired,
    selected: PropTypes.bool.isRequired,
    disabled: PropTypes.bool
};

export default SelectionIndicator;
