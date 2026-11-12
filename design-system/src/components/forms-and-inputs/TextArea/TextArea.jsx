import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../Button/Button';
import useFieldId from '../useFieldId';
import FieldBox from '../_internal/FieldBox';
import { FieldCaption, FieldLabel, FieldFrame, fieldDescription, toneProps } from '../_internal/FieldFrame';
import useInlineEdit from '../_internal/useInlineEdit';

export const TEXT_AREA_APPEARANCES = ['standard', 'subtle'];
export const TEXT_AREA_SPACINGS = ['default', 'compact'];

/**
 * Text area — free text over several lines, on `_Field`.
 *
 * The field is 80 high at least, and `rows` grows it from there. With
 * `maxLength`, the caption counts characters on the right. With
 * `appearance="subtle"`, it reads as plain text until hovered or edited, shows
 * Save and Cancel while editing, and stays open when it loses focus.
 */
const TextArea = ({
    id,
    name,
    label,
    isRequired = false,
    isLabelHidden = false,
    info,
    caption,
    value,
    defaultValue,
    placeholder,
    rows = 3,
    spacing = 'default',
    appearance = 'standard',
    isDisabled = false,
    isReadOnly = false,
    isInvalid = false,
    errorMessage,
    warningMessage,
    successMessage,
    maxLength,
    onSave,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    className = '',
    style,
    ...props
}) => {
    /** One id for the label and the control — see `useFieldId`. */
    const fieldId = useFieldId(id);
    const isSubtle = appearance === 'subtle';

    const edit = useInlineEdit({
        enabled: isSubtle && !isDisabled && !isReadOnly,
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
    let tone = 'help';
    let message = caption;
    if (failed) {
        tone = 'invalid';
        message = edit.error;
    } else if (isInvalid) {
        tone = 'invalid';
        message = errorMessage || caption;
    } else if (warningMessage) {
        tone = 'warning';
        message = warningMessage;
    } else if (successMessage) {
        tone = 'success';
        message = successMessage;
    }
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
        <FieldFrame disabled={isDisabled} invalid={tone === 'invalid'} className={`plus-text-area ${className}`.trim()} style={style}>
            <FieldLabel htmlFor={fieldId} required={isRequired} info={info} hidden={isLabelHidden}>
                {label}
            </FieldLabel>
            <FieldBox
                spacing={spacing}
                multiline
                subtle={isSubtle}
                disabled={isDisabled}
                readOnly={isReadOnly}
                {...toneProps(tone).field}
                busy={edit.enabled && edit.saving}
                elemAfter={edit.enabled && edit.saving
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
                    className="plus-field__control plus-text-area__control"
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    aria-required={isRequired || undefined}
                    {...props}
                    aria-describedby={describedBy}
                    {...toneProps(tone).control}
                />
            </FieldBox>
            {showActions && (
                <div className="plus-field-actions">
                    <Button
                        text="Cancel"
                        spacing="compact"
                        isDisabled={edit.saving}
                        onClick={edit.cancel}
                    />
                    <Button
                        text="Save"
                        spacing="compact"
                        appearance="primary"
                        isDisabled={edit.saving}
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
        </FieldFrame>
    );
};

TextArea.propTypes = {
    /** The `id` of the `textarea`; the label points at it. Generated when omitted. */
    id: PropTypes.string,
    /** The form key the text submits under. */
    name: PropTypes.string,
    /** The visible label above the field. Hide it with `isLabelHidden`. */
    label: PropTypes.node,
    /** Shows an asterisk and sets `aria-required`. */
    isRequired: PropTypes.bool,
    /** Hides the label without removing it. */
    isLabelHidden: PropTypes.bool,
    /** Text for an info tooltip beside the label. */
    info: PropTypes.node,
    /** Standing help under the field. A message takes its place. */
    caption: PropTypes.node,
    /** The text. Pass it, with `onChange`, to control the field. */
    value: PropTypes.string,
    /** The text to start with when the field is uncontrolled. */
    defaultValue: PropTypes.string,
    /** Hint text shown while the field is empty. */
    placeholder: PropTypes.string,
    /** Visible lines of text. One row is the short textarea. */
    rows: PropTypes.number,
    /** `default` starts at 80 high with 10 corners; `compact` has 8 corners, to sit beside a 32 field. */
    spacing: PropTypes.oneOf(TEXT_AREA_SPACINGS),
    /** `subtle` is borderless until hovered or edited, with Save and Cancel while editing. */
    appearance: PropTypes.oneOf(TEXT_AREA_APPEARANCES),
    /** Dims the field and blocks focus and editing. */
    isDisabled: PropTypes.bool,
    /** Shows the text and keeps it focusable, but it cannot be changed. */
    isReadOnly: PropTypes.bool,
    /** Draws the error border and sets `aria-invalid`; `errorMessage` says why. */
    isInvalid: PropTypes.bool,
    /** The caption shown under the field while `isInvalid` is set. It replaces `caption`. */
    errorMessage: PropTypes.node,
    /** Draws the warning border. Does not set `aria-invalid`: the value is accepted. */
    warningMessage: PropTypes.node,
    /** Draws the confirmation border. */
    successMessage: PropTypes.node,
    /** Limits the length and shows a count on the right of the caption. */
    maxLength: PropTypes.number,
    /** Subtle only: called by Save (or Ctrl/⌘+Enter). Throw or reject to keep the field open in `invalid`. */
    onSave: PropTypes.func,
    /** Called with the change event on each edit. */
    onChange: PropTypes.func,
    /** Called with the focus event when the field gains focus. */
    onFocus: PropTypes.func,
    /** Called with the blur event when the field loses focus. */
    onBlur: PropTypes.func,
    /** Called with the keydown event. Call `preventDefault` to stop the subtle appearance's own key handling. */
    onKeyDown: PropTypes.func,
    /** Extra class names added to the field wrapper beside the component's own. */
    className: PropTypes.string,
    /** Inline styles for the field wrapper. */
    style: PropTypes.object
};

export default TextArea;
