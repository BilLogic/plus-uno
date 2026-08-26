import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import useFieldId from './useFieldId';
import './Range.scss';

/**
 * Range — slider over a numeric span.
 *
 * A range input carries its value, never its meaning: "49" says nothing about
 * what is being set. `label` is the only thing that names it, so it takes the
 * same pair as `Input` — `label` for the text, `showLabel={false}` to hide that
 * text without taking the name away (#213).
 */
const Range = ({
    id,
    name,
    label,
    showLabel = true,
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
    /** One id for the label and the slider — see `useFieldId` (#206). */
    const fieldId = useFieldId(id);

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
            {label && (
                <Form.Label
                    htmlFor={fieldId}
                    className={`plus-form-range-label${showLabel ? '' : ' plus-form-range-label-hidden'}`}
                >
                    {label}
                </Form.Label>
            )}
            <Form.Range
                ref={rangeRef}
                id={fieldId}
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
    /** Text that names the slider. Without it the slider has no accessible name. */
    label: PropTypes.node,
    /** Render the label visually hidden rather than visible. It still names the slider. */
    showLabel: PropTypes.bool,
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


