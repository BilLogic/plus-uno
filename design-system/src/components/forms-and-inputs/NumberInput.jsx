import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { InputGroup as BootstrapInputGroup, Form } from 'react-bootstrap';
import useFieldId from './useFieldId';
import './NumberInput.scss';

const NumberInput = ({
    id,
    name,
    label,
    required = false,
    showLabel = true,
    placeholder = 'Number',
    value,
    disabled = false,
    readonly = false,
    validation = 'none', // 'none', 'invalid', 'success'
    validationMessage,
    min,
    max,
    step = 1,
    className = '',
    style,
    onChange,
    onFocus,
    onBlur,
    onIncrement,
    onDecrement,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState(value !== undefined ? value : '');
    /** One id for the label and the input — see `useFieldId` (#206). */
    const fieldId = useFieldId(id);

    // Sync internal value when external value prop changes
    useEffect(() => {
        if (value !== undefined) {
            setInternalValue(value);
        }
    }, [value]);

    const handleFocus = (e) => {
        setIsFocused(true);
        if (onFocus) onFocus(e);
    };

    const handleBlur = (e) => {
        setIsFocused(false);
        if (onBlur) onBlur(e);
    };

    const handleChange = (e) => {
        const newValue = e.target.value;
        setInternalValue(newValue);
        if (onChange) {
            onChange(e);
        }
    };

    const handleIncrement = () => {
        if (disabled || readonly) return;
        
        /*
         * #318. An empty field reads as 0, so `min={5}` used to step to 1 —
         * below its own floor. Clamping to BOTH bounds is what makes the
         * stepper unable to leave the range it was given, from any start.
         */
        const currentValue = parseFloat(value || internalValue) || 0;
        let finalValue = currentValue + step;
        if (max !== undefined) finalValue = Math.min(finalValue, max);
        if (min !== undefined) finalValue = Math.max(finalValue, min);
        
        const syntheticEvent = {
            target: {
                name: name,
                value: finalValue.toString(),
                type: 'number'
            }
        };
        
        setInternalValue(finalValue.toString());
        if (onChange) onChange(syntheticEvent);
        if (onIncrement) onIncrement(finalValue);
    };

    const handleDecrement = () => {
        if (disabled || readonly) return;
        
        const currentValue = parseFloat(value || internalValue) || 0;
        let finalValue = currentValue - step;
        if (min !== undefined) finalValue = Math.max(finalValue, min);
        if (max !== undefined) finalValue = Math.min(finalValue, max);
        
        const syntheticEvent = {
            target: {
                name: name,
                value: finalValue.toString(),
                type: 'number'
            }
        };
        
        setInternalValue(finalValue.toString());
        if (onChange) onChange(syntheticEvent);
        if (onDecrement) onDecrement(finalValue);
    };

    // Determine border color based on state
    const getBorderColor = () => {
        if (disabled || readonly) return 'var(--color-outline-variant)';
        if (validation === 'invalid') return 'var(--color-danger)';
        if (validation === 'success') return 'var(--color-success)';
        if (isFocused) return 'var(--color-primary)';
        return 'var(--color-outline-variant)';
    };

    // Determine background color based on state
    const getBackgroundColor = () => {
        if (disabled) return 'var(--color-surface-container-low)';
        if (readonly) return 'var(--color-surface-container)';
        return 'var(--color-surface-container-lowest)';
    };

    // Determine text color based on state
    const getTextColor = () => {
        if (disabled) return 'var(--color-on-surface-variant)';
        if (readonly && !value) return 'var(--color-on-surface-variant)';
        return 'var(--color-on-surface)';
    };


    const wrapperClasses = [
        'plus-number-input-wrapper',
        'plus-number-input-medium',
        'body2-txt',
        disabled ? 'plus-number-input-disabled' : '',
        readonly ? 'plus-number-input-readonly' : '',
        isFocused ? 'plus-number-input-focused' : '',
        validation !== 'none' ? `plus-number-input-${validation}` : '',
        className
    ].filter(Boolean).join(' ');

    const inputGroupStyle = {
        '--border-color': getBorderColor(),
        '--bg-color': getBackgroundColor(),
        '--text-color': getTextColor(),
        ...style
    };

    const validationIcon = validation === 'invalid' ? (
        <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
    ) : validation === 'success' ? (
        <i className="fa-solid fa-check" aria-hidden="true" />
    ) : null;

    const displayValue = value !== undefined ? value : internalValue;

    return (
        <div className="plus-number-input-container">
            {/*
              * #318. `showLabel={false}` HIDES the label; it does not delete it.
              * Deleting it left the input with no accessible name at all, which
              * is the defect `Input` was fixed for in #213 and which
              * `LabelAssociation.stories.jsx` states as a rule for the whole
              * group: showLabel moves pixels only.
              */}
            {label && (
                <Form.Label
                    htmlFor={fieldId}
                    className={`plus-number-input-label${showLabel ? '' : ' plus-number-input-label-hidden'}`}
                >
                    {label}
                    {required && (
                        <span className="plus-number-input-required" aria-label="required">*</span>
                    )}
                </Form.Label>
            )}
            {/*
              * #318. Extra props go to the FIELD, not to the group. The group is
              * a `div` with no role and no name, so a caller's `aria-describedby`
              * landed somewhere it could not help. `DateAndTimePicker` forwards
              * to a wrapper that IS the named group (#230); this component has no
              * such wrapper, so the input is the only correct destination.
              */}
            <BootstrapInputGroup
                className={wrapperClasses}
                style={inputGroupStyle}
            >
                <Form.Control
                    id={fieldId}
                    name={name}
                    type="text"
                    placeholder={placeholder}
                    value={displayValue}
                    disabled={disabled}
                    readOnly={readonly}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className="plus-number-input-field"
                    {...props}
                />
                <BootstrapInputGroup.Text className="plus-number-input-buttons">
                    <button
                        type="button"
                        className="plus-number-input-button plus-number-input-button-increment"
                        disabled={disabled || readonly || (max !== undefined && parseFloat(displayValue) >= max)}
                        onClick={handleIncrement}
                        aria-label="Increment"
                    >
                        <i className="fa-solid fa-plus" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className="plus-number-input-button plus-number-input-button-decrement"
                        disabled={disabled || readonly || (min !== undefined && parseFloat(displayValue) <= min)}
                        onClick={handleDecrement}
                        aria-label="Decrement"
                    >
                        <i className="fa-solid fa-minus" aria-hidden="true" />
                    </button>
                </BootstrapInputGroup.Text>
            </BootstrapInputGroup>
            {validation !== 'none' && validationMessage && (
                <div className={`plus-number-input-validation plus-number-input-validation-${validation}`}>
                    {validationIcon}
                    <span className="plus-number-input-validation-message">{validationMessage}</span>
                </div>
            )}
        </div>
    );
};

NumberInput.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    label: PropTypes.node,
    required: PropTypes.bool,
    showLabel: PropTypes.bool,
    placeholder: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    validation: PropTypes.oneOf(['none', 'invalid', 'success']),
    validationMessage: PropTypes.string,
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    className: PropTypes.string,
    style: PropTypes.object,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onIncrement: PropTypes.func,
    onDecrement: PropTypes.func
};

export default NumberInput;



