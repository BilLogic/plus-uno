import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../Button/Button';
import useFieldId from '../useFieldId';
import FieldBox from '../_internal/FieldBox';
import { FieldCaption, FieldLabel, FieldFrame, fieldDescription, toneProps } from '../_internal/FieldFrame';
import renderFieldElem from '../_internal/fieldSlots';
import useInlineEdit from '../_internal/useInlineEdit';

export const TEXT_FIELD_APPEARANCES = ['standard', 'subtle'];
export const TEXT_FIELD_SPACINGS = ['default', 'compact'];

const toText = (value) => (value === undefined || value === null ? '' : String(value));

/** Decimal places in a number, so 0.1 + 0.2 steps land on 0.3. */
const decimals = (number) => {
    const [, fraction = ''] = String(number).split('.');
    return fraction.length;
};

/**
 * Text field — a labeled single-line field on `_Field`, 40 high and 32 when
 * `spacing="compact"`.
 *
 * Label, field and caption: the caption shows a message (or standing help) on
 * the left and, when `maxLength` is set, a count on the right. `elemBeforeInput`
 * and `elemAfterInput` fill the slots on either side of the control; a string is a
 * text affix. With `appearance="subtle"`, the field reads as plain text until
 * it is hovered or edited, and saves on blur or Enter through `onSave`.
 *
 * `type="number"` adds steppers after the control. Empty is not 0: an empty
 * field stays empty, and stepping from it starts at 0 (or the nearest bound).
 * A typed value outside `min`/`max` is clamped when the field loses focus, not
 * while it is typed. The field is a text input, so the scroll wheel never
 * changes the value.
 */
const TextField = ({
    id,
    name,
    label,
    isRequired = false,
    /**
     * Hide the label visually. It is still rendered and still names the input —
     * see Accessibility in `TextField.mdx` for why it cannot remove it.
     */
    isLabelHidden = false,
    info,
    caption,
    placeholder,
    value,
    defaultValue,
    inputRef,
    spacing = 'default',
    appearance = 'standard',
    isDisabled = false,
    isReadOnly = false,
    isInvalid = false,
    errorMessage,
    warningMessage,
    successMessage,
    elemBeforeInput,
    elemAfterInput,
    type = 'text',
    maxLength,
    min,
    max,
    step = 1,
    onSave,
    className = '',
    style,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    testId,
    ...props
}) => {
    /** One id for the label and the input — see `useFieldId`. */
    const fieldId = useFieldId(id);
    const isNumber = type === 'number';
    const isSubtle = appearance === 'subtle';

    const edit = useInlineEdit({
        enabled: isSubtle && !isNumber && !isDisabled && !isReadOnly,
        value,
        defaultValue,
        onSave,
    });

    // The count follows what is in the field, held or not.
    const [typedLength, setTypedLength] = useState(String(defaultValue ?? '').length);
    const currentValue = edit.enabled ? edit.draft : value;
    const length = currentValue !== undefined && currentValue !== null
        ? String(currentValue).length
        : typedLength;

    // A number is held as text, so an empty or half-typed field is not read as 0.
    const [text, setText] = useState(toText(value !== undefined ? value : defaultValue));
    useEffect(() => {
        if (isNumber && value !== undefined) setText(toText(value));
    }, [isNumber, value]);

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
    const counted = maxLength !== undefined;
    const { messageId, countId, describedBy } = fieldDescription({
        fieldId,
        message,
        counted,
        describedBy: props['aria-describedby'],
    });

    const clamp = (number) => {
        let next = number;
        if (max !== undefined) next = Math.min(next, max);
        if (min !== undefined) next = Math.max(next, min);
        return next;
    };

    /** Tells the caller, in the shape of a change event. */
    const emit = (nextText) => {
        setText(nextText);
        if (onChange) onChange({ target: { name, value: nextText, type: 'number' } });
    };

    const stepBy = (direction) => {
        if (isDisabled || isReadOnly) return;
        const current = parseFloat(text);
        const start = Number.isFinite(current) ? current : 0;
        const places = Math.max(decimals(step), decimals(start));
        emit(String(clamp(Number((start + direction * step).toFixed(places)))));
    };

    const handleChange = (event) => {
        if (isNumber) setText(event.target.value);
        else if (edit.enabled) edit.setDraft(event.target.value);
        else if (value === undefined) setTypedLength(event.target.value.length);
        if (onChange) onChange(event);
    };
    const handleFocus = (event) => {
        if (edit.enabled) edit.handlers.onFocus(event);
        if (onFocus) onFocus(event);
    };
    const handleBlur = (event) => {
        if (isNumber) {
            const typed = parseFloat(text);
            if (text.trim() !== '' && Number.isFinite(typed)) {
                const clamped = clamp(typed);
                if (clamped !== typed) emit(String(clamped));
            }
        }
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

    const current = parseFloat(text);
    const atMin = min !== undefined && Number.isFinite(current) && current <= min;
    const atMax = max !== undefined && Number.isFinite(current) && current >= max;
    const fieldName = typeof label === 'string' && label ? label : 'value';

    const stepper = (direction, icon, words, atBound) => (
        <Button
            appearance="default"
            spacing={spacing}
            iconBefore={icon}
            className="plus-field-stepper"
            isDisabled={isDisabled || atBound}
            onClick={() => stepBy(direction)}
        >
            <span className="visually-hidden">{`${words} ${fieldName}`}</span>
        </Button>
    );

    const steppers = isNumber && !isReadOnly ? (
        <>
            {stepper(-1, 'minus', 'Decrease', atMin)}
            {stepper(1, 'plus', 'Increase', atMax)}
        </>
    ) : null;

    const after = edit.enabled && edit.saving
        ? <span className="plus-field-saving" role="status">saving…</span>
        : renderFieldElem(elemAfterInput);

    const valueProps = isNumber
        ? { value: text }
        : (edit.enabled ? { value: edit.draft } : { value, defaultValue });

    return (
        <FieldFrame disabled={isDisabled} invalid={tone === 'invalid'} className={`plus-text-field ${className}`.trim()} style={style}>
            <FieldLabel htmlFor={fieldId} required={isRequired} info={info} hidden={isLabelHidden}>
                {label}
            </FieldLabel>
            <FieldBox
                spacing={spacing}
                subtle={isSubtle}
                disabled={isDisabled}
                readOnly={isReadOnly}
                {...toneProps(tone).field}
                busy={edit.enabled && edit.saving}
                elemBefore={renderFieldElem(elemBeforeInput)}
                trailing={(after || steppers) ? <>{after}{steppers}</> : null}
            >
                <input
                    id={fieldId}
                    name={name}
                    type={isNumber ? 'text' : type}
                    inputMode={isNumber ? 'decimal' : undefined}
                    placeholder={placeholder}
                    {...valueProps}
                    ref={setRefs}
                    disabled={isDisabled}
                    readOnly={isReadOnly}
                    maxLength={maxLength}
                    className="plus-field__control plus-text-field__control"
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    aria-required={isRequired || undefined}
                    data-testid={testId}
                    {...props}
                    /* After the spread: this value already contains the
                     * caller's, so letting the spread win would drop ours. */
                    aria-describedby={describedBy}
                    {...toneProps(tone).control}
                />
            </FieldBox>
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

TextField.propTypes = {
    /** Id of the input, which the label points at. A generated id is used when omitted. */
    id: PropTypes.string,
    /** Form key of the input. Number steppers also report it in the `onChange` event. */
    name: PropTypes.string,
    /** Visible label above the field. A string label also names the number steppers, as "Increase" and "Decrease" followed by the label. */
    label: PropTypes.node,
    /** Shows an asterisk and sets `aria-required`. Explain the asterisk once, in the form's legend. */
    isRequired: PropTypes.bool,
    /** Hides the label visually. It is still rendered and still names the input. */
    isLabelHidden: PropTypes.bool,
    /** Text for an info tooltip beside the label. */
    info: PropTypes.node,
    /** Standing help under the field. A message takes its place. */
    caption: PropTypes.node,
    /** Hint text shown while the input is empty. It does not replace a label. */
    placeholder: PropTypes.string,
    /** With `type="number"`, empty (`''` or `null`) stays empty; it is never read as 0. */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** Starting value of an uncontrolled field. Use `value` to control it instead. */
    defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** Ref to the underlying `<input>`, as a callback or a ref object. */
    inputRef: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.shape({ current: PropTypes.any })
    ]),
    /** `default` is 40; `compact` is 32. */
    spacing: PropTypes.oneOf(TEXT_FIELD_SPACINGS),
    /** `subtle` is borderless until hovered or edited, for editing in place. */
    appearance: PropTypes.oneOf(TEXT_FIELD_APPEARANCES),
    /** Disables the input and its number steppers and dims the field. */
    isDisabled: PropTypes.bool,
    /** With `type="number"`, also hides the steppers; the value can be read and copied. */
    isReadOnly: PropTypes.bool,
    /** Draws the error border and sets `aria-invalid`; `errorMessage` says why. */
    isInvalid: PropTypes.bool,
    /** Shown in the caption in place of `caption` when `isInvalid` is true. */
    errorMessage: PropTypes.node,
    /** Draws the warning border. Does not set `aria-invalid`: the value is accepted. */
    warningMessage: PropTypes.node,
    /** Draws the confirmation border. */
    successMessage: PropTypes.node,
    /** Before the control. A string is a text affix; a node is rendered as given. */
    elemBeforeInput: PropTypes.node,
    /** After the control. A string is a text affix; a node is rendered as given. */
    elemAfterInput: PropTypes.node,
    /** `number` shows steppers and holds the value as text. */
    type: PropTypes.string,
    /** Limits the length and shows a count on the right of the caption. */
    maxLength: PropTypes.number,
    /** `type="number"`: lower bound. A typed value below it is raised to it when the field loses focus. */
    min: PropTypes.number,
    /** `type="number"`: upper bound. A typed value above it is lowered to it when the field loses focus. */
    max: PropTypes.number,
    /** `type="number"`: how much a stepper changes the value. */
    step: PropTypes.number,
    /** Subtle only: called on blur or Enter with the new value. Throw or reject to keep the field open in `invalid`. */
    onSave: PropTypes.func,
    /** Browser autofill token, e.g. `email`, `current-password`, `one-time-code`. */
    autoComplete: PropTypes.string,
    /** Extra class on the outer field wrapper, beside `plus-text-field`. */
    className: PropTypes.string,
    /** Inline style on the outer field wrapper. */
    style: PropTypes.object,
    /** Called on every edit with the change event. Stepper presses and clamping call it with `{ target: { name, value, type: "number" } }`, the value as text. */
    onChange: PropTypes.func,
    /** Called with the focus event when the input gains focus. */
    onFocus: PropTypes.func,
    /** Called with the blur event when the input loses focus. A number field is clamped to `min` and `max` first. */
    onBlur: PropTypes.func,
    /** Called with the keydown event before the field handles it. Call `event.preventDefault()` to skip a subtle field's own key handling. */
    onKeyDown: PropTypes.func,
    /** Maps to `data-testid`, for test queries. */
    testId: PropTypes.string,
};

export default TextField;
