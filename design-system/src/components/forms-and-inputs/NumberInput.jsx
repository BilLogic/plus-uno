import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../actions/Button/Button';
import useFieldId from './useFieldId';
import Field, { FieldCaption, FieldLabel, FieldStack, fieldDescription, toneProps } from './_internal/Field';

const toText = (value) => (value === undefined || value === null ? '' : String(value));

/** Decimal places in a number, so 0.1 + 0.2 steps land on 0.3. */
const decimals = (number) => {
    const [, fraction = ''] = String(number).split('.');
    return fraction.length;
};

/**
 * NumberInput — a number on `_Field`, with steppers in Trailing.
 *
 * Empty is not 0: an empty field stays empty, and stepping from it starts at
 * 0 (or the nearest bound). A typed value outside `min`/`max` is clamped when
 * the field loses focus, not while it is typed. The steppers are named
 * "Decrease {label}" and "Increase {label}", minus before plus as in Figma.
 * The field is a text input, so the scroll wheel never changes the value.
 */
const NumberInput = ({
    id,
    name,
    label,
    required = false,
    showLabel = true,
    info,
    caption,
    placeholder = 'Number',
    value,
    defaultValue,
    size = 'medium',
    disabled = false,
    readOnly,
    /** @deprecated Prefer `readOnly` */
    readonly,
    validation = 'none', // 'none', 'invalid', 'success'
    validationMessage,
    min,
    max,
    step = 1,
    subtle = false,
    className = '',
    style,
    onChange,
    onFocus,
    onBlur,
    onIncrement,
    onDecrement,
    ...props
}) => {
    /** One id for the label and the input — see `useFieldId`. */
    const fieldId = useFieldId(id);
    const isReadOnly = readOnly !== undefined ? readOnly : Boolean(readonly);

    const [text, setText] = useState(toText(value !== undefined ? value : defaultValue));
    // A held value replaces what is shown whenever the caller changes it.
    useEffect(() => {
        if (value !== undefined) setText(toText(value));
    }, [value]);

    const tone = validation === 'invalid' ? 'invalid' : (validation === 'success' ? 'success' : 'help');
    const message = (validation !== 'none' && validationMessage) || caption;
    const { messageId, countId, describedBy } = fieldDescription({
        fieldId,
        message,
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
        if (disabled || isReadOnly) return;
        const current = parseFloat(text);
        const start = Number.isFinite(current) ? current : 0;
        const places = Math.max(decimals(step), decimals(start));
        const next = clamp(Number((start + direction * step).toFixed(places)));
        emit(String(next));
        if (direction > 0 && onIncrement) onIncrement(next);
        if (direction < 0 && onDecrement) onDecrement(next);
    };

    const handleChange = (event) => {
        setText(event.target.value);
        if (onChange) onChange(event);
    };

    const handleBlur = (event) => {
        const typed = parseFloat(text);
        if (text.trim() !== '' && Number.isFinite(typed)) {
            const clamped = clamp(typed);
            if (clamped !== typed) emit(String(clamped));
        }
        if (onBlur) onBlur(event);
    };

    const current = parseFloat(text);
    const atMin = min !== undefined && Number.isFinite(current) && current <= min;
    const atMax = max !== undefined && Number.isFinite(current) && current >= max;
    const fieldName = typeof label === 'string' && label ? label : 'value';

    const stepper = (direction, icon, words, atBound) => (
        <Button
            size="small"
            style="secondary"
            fill="outline"
            leadingVisual={icon}
            className="plus-field-stepper"
            disabled={disabled || atBound}
            onClick={() => stepBy(direction)}
        >
            <span className="visually-hidden">{`${words} ${fieldName}`}</span>
        </Button>
    );

    const steppers = isReadOnly ? null : (
        <>
            {stepper(-1, 'minus', 'Decrease', atMin)}
            {stepper(1, 'plus', 'Increase', atMax)}
        </>
    );

    return (
        <FieldStack disabled={disabled} className={`plus-number-input ${className}`.trim()} style={style}>
            <FieldLabel htmlFor={fieldId} required={required} info={info} hidden={!showLabel}>
                {label}
            </FieldLabel>
            <Field
                size={size}
                subtle={subtle}
                disabled={disabled}
                readOnly={isReadOnly}
                {...toneProps(tone).field}
                trailing={steppers}
            >
                <input
                    id={fieldId}
                    name={name}
                    type="text"
                    inputMode="decimal"
                    placeholder={placeholder}
                    value={text}
                    disabled={disabled}
                    readOnly={isReadOnly}
                    onChange={handleChange}
                    onFocus={onFocus}
                    onBlur={handleBlur}
                    className="plus-field__control plus-number-input__control"
                    aria-required={required || undefined}
                    {...props}
                    aria-describedby={describedBy}
                    {...toneProps(tone).control}
                />
            </Field>
            <FieldCaption messageId={messageId} message={message} tone={tone} countId={countId} />
        </FieldStack>
    );
};

NumberInput.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    label: PropTypes.node,
    /** Shows an asterisk and sets `aria-required`. */
    required: PropTypes.bool,
    showLabel: PropTypes.bool,
    /** Text for an info tooltip beside the label. */
    info: PropTypes.node,
    /** Standing help under the field. A validation message takes its place. */
    caption: PropTypes.node,
    placeholder: PropTypes.string,
    /** Empty (`''` or `null`) stays empty; it is never read as 0. */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    /** Hides the steppers; the value can be read and copied. */
    readOnly: PropTypes.bool,
    /** @deprecated Prefer `readOnly` */
    readonly: PropTypes.bool,
    validation: PropTypes.oneOf(['none', 'invalid', 'success']),
    validationMessage: PropTypes.node,
    /** Lower bound. A typed value below it is raised to it when the field loses focus. */
    min: PropTypes.number,
    /** Upper bound. A typed value above it is lowered to it when the field loses focus. */
    max: PropTypes.number,
    step: PropTypes.number,
    /** Borderless until hovered or edited. */
    subtle: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onIncrement: PropTypes.func,
    onDecrement: PropTypes.func
};

export default NumberInput;
