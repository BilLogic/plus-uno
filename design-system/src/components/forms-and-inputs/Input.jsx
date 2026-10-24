import React, { useState } from 'react';
import PropTypes from 'prop-types';
import useFieldId from './useFieldId';
import Field, { FieldCaption, FieldLabel, FieldStack, fieldDescription, toneProps } from './_internal/Field';
import useInlineEdit from './_internal/useInlineEdit';
import { useDeprecatedFieldSize } from '../../lib/useDeprecatedLargeSize';

/** A string visual is a Font Awesome class; `'dropdown'` is the caret. */
const renderVisual = (visual) => {
    if (!visual) return null;
    if (typeof visual !== 'string') return visual;
    const className = visual === 'dropdown' ? 'fa-solid fa-caret-down' : visual;
    return <i className={className} aria-hidden="true" />;
};

/**
 * Input — a labeled single-line text field on `_Field`.
 *
 * Label, field and caption: the caption shows a validation message (or
 * standing help) on the left and, when `maxLength` is set, a count on the
 * right. With `subtle`, the field reads as plain text until it is hovered or
 * edited, and saves on blur or Enter through `onSave`.
 *
 * Prefer `readOnly` (camelCase); legacy `readonly` is still accepted.
 */
const Input = ({
    id,
    name,
    label,
    required = false,
    /**
     * Hide the label visually. It is still rendered and still names the input —
     * see the `showLabel` section in `Input.mdx` for why it cannot remove it.
     */
    showLabel = true,
    info,
    caption,
    placeholder,
    value,
    defaultValue,
    inputRef,
    size = 'medium',
    disabled = false,
    readOnly,
    /** @deprecated Prefer `readOnly` — kept for existing call sites */
    readonly,
    validation = 'none', // 'none', 'invalid', 'success'
    validationMessage,
    leadingVisual,
    trailingVisual,
    type = 'text',
    maxLength,
    subtle = false,
    onSave,
    className = '',
    style,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    ...props
}) => {
    useDeprecatedFieldSize('Input', size);
    /** One id for the label and the input — see `useFieldId`. */
    const fieldId = useFieldId(id);
    /** Prefer `readOnly`; honor legacy `readonly` when explicitly passed */
    const isReadOnly = readOnly !== undefined ? readOnly : Boolean(readonly);

    const edit = useInlineEdit({ enabled: subtle && !disabled && !isReadOnly, value, defaultValue, onSave });

    // The count follows what is in the field, held or not.
    const [typedLength, setTypedLength] = useState(String(defaultValue ?? '').length);
    const currentValue = edit.enabled ? edit.draft : value;
    const length = currentValue !== undefined && currentValue !== null
        ? String(currentValue).length
        : typedLength;

    const failed = edit.enabled && edit.error;
    const tone = failed || validation === 'invalid' ? 'invalid' : (validation === 'success' ? 'success' : 'help');
    const message = failed
        ? edit.error
        : (validation !== 'none' && validationMessage) || caption;
    const counted = maxLength !== undefined;
    const { messageId, countId, describedBy } = fieldDescription({
        fieldId,
        message,
        counted,
        describedBy: props['aria-describedby'],
    });

    const handleChange = (event) => {
        if (edit.enabled) edit.setDraft(event.target.value);
        else if (value === undefined) setTypedLength(event.target.value.length);
        if (onChange) onChange(event);
    };
    const handleFocus = (event) => {
        if (edit.enabled) edit.handlers.onFocus(event);
        if (onFocus) onFocus(event);
    };
    const handleBlur = (event) => {
        if (edit.enabled) edit.handlers.onBlur(event);
        if (onBlur) onBlur(event);
    };
    const handleKeyDown = (event) => {
        if (onKeyDown) onKeyDown(event);
        if (edit.enabled && !event.defaultPrevented) edit.handlers.onKeyDown(event);
    };

    const setRefs = (node) => {
        if (edit.enabled) edit.controlRef.current = node;
        if (typeof inputRef === 'function') inputRef(node);
        else if (inputRef) inputRef.current = node;
    };

    const trailing = edit.enabled && edit.saving
        ? <span className="plus-field-saving" role="status">saving…</span>
        : renderVisual(trailingVisual);

    const valueProps = edit.enabled
        ? { value: edit.draft }
        : { value, defaultValue };

    const inputClasses = [
        'plus-field__control',
        'plus-input',
        className,
    ].filter(Boolean).join(' ');

    return (
        <FieldStack disabled={disabled} className="plus-input-wrapper">
            <FieldLabel htmlFor={fieldId} required={required} info={info} hidden={!showLabel}>
                {label}
            </FieldLabel>
            <Field
                size={size}
                subtle={subtle}
                disabled={disabled}
                readOnly={isReadOnly}
                {...toneProps(tone).field}
                busy={edit.enabled && edit.saving}
                leading={renderVisual(leadingVisual)}
                trailing={trailing}
            >
                <input
                    id={fieldId}
                    name={name}
                    type={type}
                    placeholder={placeholder}
                    {...valueProps}
                    ref={setRefs}
                    disabled={disabled}
                    readOnly={isReadOnly}
                    maxLength={maxLength}
                    className={inputClasses}
                    style={style}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    aria-required={required || undefined}
                    {...props}
                    /* After the spread: this value already contains the
                     * caller's, so letting the spread win would drop ours. */
                    aria-describedby={describedBy}
                    {...toneProps(tone).control}
                />
            </Field>
            <FieldCaption
                messageId={messageId}
                message={message}
                tone={tone}
                countId={countId}
                count={length}
                maxLength={maxLength}
            />
        </FieldStack>
    );
};

Input.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    label: PropTypes.node,
    /** Shows an asterisk and sets `aria-required`. Explain the asterisk once, in the form's legend. */
    required: PropTypes.bool,
    showLabel: PropTypes.bool,
    /** Text for an info tooltip beside the label. */
    info: PropTypes.node,
    /** Standing help under the field. A validation message takes its place. */
    caption: PropTypes.node,
    placeholder: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    inputRef: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.shape({ current: PropTypes.any })
    ]),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    /** @deprecated Prefer `readOnly` */
    readonly: PropTypes.bool,
    validation: PropTypes.oneOf(['none', 'invalid', 'success']),
    validationMessage: PropTypes.node,
    leadingVisual: PropTypes.oneOfType([
        PropTypes.string, // Icon class name
        PropTypes.node // React element
    ]),
    trailingVisual: PropTypes.oneOfType([
        PropTypes.string, // Icon class name or 'dropdown'
        PropTypes.node // React element
    ]),
    type: PropTypes.string,
    /** Limits the length and shows a count on the right of the caption. */
    maxLength: PropTypes.number,
    /** Borderless until hovered or edited, for editing in place. */
    subtle: PropTypes.bool,
    /** Subtle only: called on blur or Enter with the new value. Throw or reject to keep the field open in `invalid`. */
    onSave: PropTypes.func,
    /** Browser autofill token, e.g. `email`, `current-password`, `one-time-code`. */
    autoComplete: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onKeyDown: PropTypes.func
};

export default Input;
