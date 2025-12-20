import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import './Range.scss';

const Range = ({
    id,
    name,
    label,
    required = false,
    showLabel = true,
    min = 0,
    max = 100,
    value,
    defaultValue,
    step = 1,
    size = 'medium',
    disabled = false,
    onChange,
    onInput,
    className = '',
    style,
    ...props
}) => {
    const rangeRef = useRef(null);

    // Logic to update --value-percent CSS variable for track filling
    const updateValuePercent = () => {
        if (rangeRef.current) {
            let currentValue;
            if (value !== undefined) {
                // Controlled component
                currentValue = value;
            } else if (defaultValue !== undefined) {
                // Uncontrolled component with default
                currentValue = defaultValue;
            } else {
                // Uncontrolled component - read from DOM
                currentValue = parseFloat(rangeRef.current.value) || min;
            }
            const val = parseFloat(currentValue);
            const percent = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
            rangeRef.current.style.setProperty('--value-percent', `${percent}%`);
        }
    };

    useEffect(() => {
        updateValuePercent();
    }, [value, defaultValue, min, max]);

    const handleInput = (e) => {
        // Update CSS variable immediately for smooth visual feedback
        if (rangeRef.current) {
            const val = parseFloat(e.target.value);
            const percent = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
            rangeRef.current.style.setProperty('--value-percent', `${percent}%`);
        }
        if (onInput) onInput(e);
        // We also trigger onChange for standard Controlled input behavior match if user relies on it
        if (onChange) onChange(e);
    };

    const handleChange = (e) => {
        // Update CSS variable
        if (rangeRef.current) {
            const val = parseFloat(e.target.value);
            const percent = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
            rangeRef.current.style.setProperty('--value-percent', `${percent}%`);
        }
        if (onChange) onChange(e);
    };

    const rangeClasses = [
        'plus-form-range',
        `plus-form-range-${size}`,
        disabled ? 'plus-form-range-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={`plus-form-range-wrapper ${disabled ? 'plus-form-range-disabled' : ''}`}>
            {showLabel && label && (
                <Form.Label htmlFor={id || name} className="plus-form-range-label">
                    {label}
                    {required && (
                        <span className="plus-form-range-required" aria-label="required">*</span>
                    )}
                </Form.Label>
            )}
            <Form.Range
                ref={rangeRef}
                id={id}
                name={name}
                min={min}
                max={max}
                step={step}
                value={value}
                defaultValue={defaultValue}
                disabled={disabled}
                onChange={handleChange}
                onInput={handleInput}
                className={rangeClasses}
                style={style}
                {...props}
            />
        </div>
    );
};

Range.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    label: PropTypes.node,
    required: PropTypes.bool,
    showLabel: PropTypes.bool,
    min: PropTypes.number,
    max: PropTypes.number,
    value: PropTypes.number,
    defaultValue: PropTypes.number,
    step: PropTypes.number,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    onInput: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default Range;

