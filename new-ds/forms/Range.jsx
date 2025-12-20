import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import './Range.scss';

const Range = ({
    id,
    name,
    min = 0,
    max = 100,
    value,
    defaultValue,
    step = 1,
    size = 'medium',
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
        className
    ].filter(Boolean).join(' ');

    return (
        <div className="plus-form-range-wrapper">
            <Form.Range
                ref={rangeRef}
                id={id}
                name={name}
                min={min}
                max={max}
                step={step}
                value={value}
                defaultValue={defaultValue}
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
    min: PropTypes.number,
    max: PropTypes.number,
    value: PropTypes.number,
    defaultValue: PropTypes.number,
    step: PropTypes.number,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    onChange: PropTypes.func,
    onInput: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default Range;


