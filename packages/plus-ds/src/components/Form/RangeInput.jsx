import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';

const RangeInput = ({
    id,
    name,
    label,
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
    const inputRef = useRef(null);

    // Logic to update --value-percent CSS variable for track filling
    const updateValuePercent = () => {
        if (inputRef.current) {
            const val = parseFloat(inputRef.current.value);
            const percent = ((val - min) / (max - min)) * 100;
            inputRef.current.style.setProperty('--value-percent', `${percent}%`);
        }
    };

    useEffect(() => {
        updateValuePercent();
    }, [value, defaultValue, min, max]);

    const handleInput = (e) => {
        updateValuePercent();
        if (onInput) onInput(e);
        // We also trigger onChange for standard Controlled input behavior match if user relies on it
        if (onChange) onChange(e);
    };

    return (
        <div>
            {label && <Form.Label htmlFor={id || name}>{label}</Form.Label>}
            <input
                ref={inputRef}
                type="range"
                id={id}
                name={name}
                min={min}
                max={max}
                step={step}
                value={value}
                defaultValue={defaultValue}
                disabled={disabled}
                onChange={handleInput}
                className={`plus-form-range plus-form-range-${size} ${disabled ? 'plus-form-range-disabled' : ''} ${className}`}
                style={style}
                {...props}
            />
        </div>
    );
};

RangeInput.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    label: PropTypes.node,
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

export default RangeInput;
