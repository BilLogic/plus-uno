import React, { useState } from 'react';
import PropTypes from 'prop-types';
import TextField from '../TextField/TextField';
import InlineEdit from '@/components/text-and-data-display/InlineEdit';

/**
 * InlineEditableTextfield — `InlineEdit` with a Text field for its edit view.
 *
 * It reads as the text, or the placeholder when there is none, and opens as
 * the standard text field at the same size. Validation shows under the field
 * through the field's own caption, and a failed `onConfirm` shows there too.
 *
 * With `value` the parent holds the text; without it, the field keeps what
 * was last confirmed.
 */
const InlineEditableTextfield = ({
    id,
    label,
    value,
    defaultValue = '',
    placeholder,
    maxLength,
    type = 'text',
    required = false,
    onConfirm,
    compact = false,
    ...inlineEditProps
}) => {
    const [kept, setKept] = useState(defaultValue);
    const held = value !== undefined ? value : kept;
    const text = String(held ?? '');

    const handleConfirm = async (next) => {
        if (onConfirm) await onConfirm(next);
        setKept(next);
    };

    return (
        <InlineEdit
            {...inlineEditProps}
            compact={compact}
            id={id}
            label={label}
            defaultValue={text}
            onConfirm={handleConfirm}
            readView={() => (text
                ? text
                : <span className="plus-inline-edit__placeholder">{placeholder}</span>)}
            editView={({ validation, validationMessage, value: draft, onChange, id: fieldId }) => (
                <TextField
                    id={fieldId}
                    value={draft ?? ''}
                    onChange={onChange}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    type={type}
                    spacing={compact ? 'compact' : 'default'}
                    isRequired={required}
                    isInvalid={validation === 'invalid'}
                    errorMessage={validationMessage}
                />
            )}
        />
    );
};

InlineEditableTextfield.propTypes = {
    id: PropTypes.string,
    /** Shown above both views and naming the field. */
    label: PropTypes.node,
    /** The saved text, when the parent holds it. */
    value: PropTypes.string,
    /** The starting text when the field holds it itself. */
    defaultValue: PropTypes.string,
    /** Shown in the read view when there is no text, and in the field. */
    placeholder: PropTypes.string,
    maxLength: PropTypes.number,
    type: PropTypes.string,
    required: PropTypes.bool,
    /** Called with the new text. Throw or reject to keep the field open with the error. */
    onConfirm: PropTypes.func,
    /** Returns a message to refuse the text, or nothing to accept it. May be async. */
    validate: PropTypes.func,
    onCancel: PropTypes.func,
    onEdit: PropTypes.func,
    keepEditViewOpenOnBlur: PropTypes.bool,
    startWithEditViewOpen: PropTypes.bool,
    hideActionButtons: PropTypes.bool,
    compact: PropTypes.bool,
    readViewFitContainerWidth: PropTypes.bool,
    editLabel: PropTypes.string,
    confirmLabel: PropTypes.string,
    cancelLabel: PropTypes.string,
    className: PropTypes.string,
};

export default InlineEditableTextfield;
