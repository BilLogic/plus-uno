import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import './RadioButtonGroup.scss';

/**
 * Sub-component: RadioButton
 * Individual radio button with label, supporting all states
 * This is the subcomponent that should be used for Scale
 */
const RadioButton = ({
    id,
    name,
    label,
    value,
    checked = false,
    disabled = false,
    onChange,
    onFocus,
    onBlur,
    className = '',
    ...props
}) => {
    const wrapperClasses = [
        'plus-radio-button-wrapper',
        disabled ? 'plus-radio-button-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={wrapperClasses}>
            {label && (
                <div className="plus-radio-button-label body2-txt">
                    {label}
                </div>
            )}
            <Form.Check
                type="radio"
                id={id}
                name={name}
                value={value}
                checked={checked}
                disabled={disabled}
                onChange={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                className="plus-radio-button"
                {...props}
            />
        </div>
    );
};

RadioButton.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    label: PropTypes.node,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    checked: PropTypes.bool,
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    className: PropTypes.string
};

/**
 * Scale Component
 * Horizontal radio button group with end labels (e.g., "Lowest" and "Highest")
 * and radio buttons with labels in between.
 * Uses Scale.Button subcomponent for individual radio buttons.
 */
const Scale = ({
    id,
    name,
    label,
    required = false,
    lowestLabel = 'Lowest',
    highestLabel = 'Highest',
    options = [],
    value,
    defaultValue,
    disabled = false,
    onChange,
    className = '',
    style,
    ...props
}) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(defaultValue || (options.length > 0 ? options[0].value : null));

    const currentValue = isControlled ? value : internalValue;

    const handleChange = (optionValue) => {
        if (disabled) return;

        if (!isControlled) {
            setInternalValue(optionValue);
        }

        if (onChange) {
            onChange(optionValue);
        }
    };

    const wrapperClasses = [
        'plus-scale-wrapper',
        disabled ? 'plus-scale-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={wrapperClasses} style={style} {...props}>
            {label && (
                <Form.Label htmlFor={id || name} className="plus-scale-label">
                    {label}
                    {required && (
                        <span className="plus-scale-required" aria-label="required">*</span>
                    )}
                </Form.Label>
            )}
            <div className="plus-scale-container">
                {/* Left End Label */}
                <div className="plus-scale-end-label plus-scale-end-label-left body2-txt">
                    {lowestLabel}
                </div>

                {/* Radio Buttons */}
                <div className="plus-scale-options">
                    {options.map((option, index) => {
                        const optionId = option.id || `${id || name}-option-${index}`;
                        const optionValue = option.value !== undefined ? option.value : option;
                        const optionLabel = option.label !== undefined ? option.label : (typeof option === 'string' ? option : 'Text');
                        const isChecked = currentValue === optionValue;

                        return (
                            <div key={index} className="plus-scale-option">
                                <div className="plus-scale-option-label body2-txt">
                                    {optionLabel}
                                </div>
                                <RadioButton
                                    id={optionId}
                                    name={name}
                                    value={optionValue}
                                    checked={isChecked}
                                    disabled={disabled}
                                    onChange={() => handleChange(optionValue)}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Right End Label */}
                <div className="plus-scale-end-label plus-scale-end-label-right body2-txt">
                    {highestLabel}
                </div>
            </div>
        </div>
    );
};

Scale.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    label: PropTypes.node,
    required: PropTypes.bool,
    lowestLabel: PropTypes.string,
    highestLabel: PropTypes.string,
    options: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                id: PropTypes.string,
                value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
                label: PropTypes.string
            })
        ])
    ).isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

// Attach subcomponent - Scale.Button is the subcomponent used for scale
Scale.Button = RadioButton;

export default Scale;

