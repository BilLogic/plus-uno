import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../actions/Button/Button';
import useFieldId from './useFieldId';
import Field, { FieldCaption, FieldLabel, FieldStack, fieldDescription, toneProps } from './_internal/Field';
import useInlineEdit from './_internal/useInlineEdit';
import { useDeprecatedFieldSize } from '../../lib/useDeprecatedLargeSize';

/** Older `state` names, kept for existing call sites. */
const LEGACY_STATE = {
    error: 'invalid',
    invalid: 'invalid',
    success: 'success',
    valid: 'success',
    readonly: 'readonly',
    'read-only': 'readonly',
    readOnly: 'readonly',
};

/**
 * Textarea — free text over several lines, on `_Field`.
 *
 * The field is 80 high at least, and `rows` grows it from there. With
 * `maxLength`, the caption counts characters on the right. With `subtle`, it
 * reads as plain text until hovered or edited, shows Save and Cancel while
 * editing, and stays open when it loses focus.
 */
const Textarea = ({
    id,
    name,
    label,
    required = false,
    showLabel = true,
    info,
    caption,
    value,
    defaultValue,
    placeholder,
    rows = 3,
    size = 'medium',
    validation = 'none',
    validationMessage,
    /** Draws a state still (`focus` for documentation), or an older name for one. */
    state = 'default',
    disabled = false,
    readOnly = false,
    maxLength,
    subtle = false,
    onSave,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    className = '',
    style,
    ...props
}) => {
    useDeprecatedFieldSize('Textarea', size);
    /** One id for the label and the control — see `useFieldId`. */
    const fieldId = useFieldId(id);
    const legacy = LEGACY_STATE[state];
    const isReadOnly = readOnly || legacy === 'readonly';
    const isDisabled = disabled || state === 'disabled';

    const edit = useInlineEdit({
        enabled: subtle && !isDisabled && !isReadOnly,
        multiline: true,
        value,
        defaultValue,
        onSave,
    });

    const [typedLength, setTypedLength] = useState(String(defaultValue ?? '').length);
    const currentValue = edit.enabled ? edit.draft : value;
    const length = currentValue !== undefined && currentValue !== null
        ? String(currentValue).length
        : typedLength;

    const failed = edit.enabled && edit.error;
    const result = validation !== 'none' ? validation : (legacy === 'invalid' || legacy === 'success' ? legacy : 'none');
    const tone = failed || result === 'invalid' ? 'invalid' : (result === 'success' ? 'success' : 'help');
    const message = failed ? edit.error : (result !== 'none' && validationMessage) || caption;
    const { messageId, countId, describedBy } = fieldDescription({
        fieldId,
        message,
        counted: maxLength !== undefined,
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

    const valueProps = edit.enabled ? { value: edit.draft } : { value, defaultValue };
    const showActions = edit.enabled && edit.editing;

    return (
        <FieldStack disabled={isDisabled} className={`plus-textarea ${className}`.trim()} style={style}>
            <FieldLabel htmlFor={fieldId} required={required} info={info} hidden={!showLabel}>
                {label}
            </FieldLabel>
            <Field
                size={size}
                multiline
                subtle={subtle}
                disabled={isDisabled}
                readOnly={isReadOnly}
                {...toneProps(tone).field}
                busy={edit.enabled && edit.saving}
                state={state === 'focus' ? 'focus' : undefined}
                trailing={edit.enabled && edit.saving
                    ? <span className="plus-field-saving" role="status">saving…</span>
                    : null}
            >
                <textarea
                    id={fieldId}
                    name={name}
                    placeholder={placeholder}
                    rows={rows}
                    {...valueProps}
                    ref={edit.enabled ? edit.controlRef : undefined}
                    disabled={isDisabled}
                    readOnly={isReadOnly}
                    maxLength={maxLength}
                    className="plus-field__control plus-textarea__control"
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    aria-required={required || undefined}
                    {...props}
                    aria-describedby={describedBy}
                    {...toneProps(tone).control}
                />
            </Field>
            {showActions && (
                <div className="plus-field-actions">
                    <Button
                        text="Cancel"
                        size="small"
                        style="secondary"
                        fill="outline"
                        disabled={edit.saving}
                        onClick={edit.cancel}
                    />
                    <Button
                        text="Save"
                        size="small"
                        style="primary"
                        fill="filled"
                        disabled={edit.saving}
                        onClick={edit.save}
                    />
                </div>
            )}
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

Textarea.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    label: PropTypes.node,
    /** Shows an asterisk and sets `aria-required`. */
    required: PropTypes.bool,
    /** Hides the label without removing it. */
    showLabel: PropTypes.bool,
    /** Text for an info tooltip beside the label. */
    info: PropTypes.node,
    /** Standing help under the field. A validation message takes its place. */
    caption: PropTypes.node,
    value: PropTypes.string,
    defaultValue: PropTypes.string,
    placeholder: PropTypes.string,
    /** Visible lines of text. One row is the short textarea. */
    rows: PropTypes.number,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    validation: PropTypes.oneOf(['none', 'invalid', 'success']),
    validationMessage: PropTypes.node,
    /** `focus` draws focus still, for documentation. The other values are older names for `validation`, `readOnly` and `disabled`. */
    state: PropTypes.oneOf(['default', 'focus', 'error', 'success', 'readonly', 'disabled', 'valid', 'read-only', 'invalid']),
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    /** Limits the length and shows a count on the right of the caption. */
    maxLength: PropTypes.number,
    /** Borderless until hovered or edited, with Save and Cancel while editing. */
    subtle: PropTypes.bool,
    /** Subtle only: called by Save (or Ctrl/⌘+Enter). Throw or reject to keep the field open in `invalid`. */
    onSave: PropTypes.func,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onKeyDown: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default Textarea;
