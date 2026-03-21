import React from 'react';
import PropTypes from 'prop-types';
import Radio from './Radio';
import Checkbox from './Checkbox';
import './MultipleChoice.scss';

/**
 * MultipleChoice Component
 * A vertical list of radio buttons or checkboxes for multiple choice selections.
 * Supports both single selection (radio) and multiple selection (checkbox) modes.
 */
const MultipleChoice = ({
    id,
    name,
    type = 'radio', // 'radio' or 'checkbox'
    options = [],
    value, // For radio: single value; For checkbox: array of values
    defaultValue, // For radio: single value; For checkbox: array of values
    size = 'medium',
    disabled = false,
    onChange,
    className = '',
    style,
    ...props
}) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(
        defaultValue || (type === 'checkbox' ? [] : null)
    );

    const currentValue = isControlled ? value : internalValue;

    const handleRadioChange = (optionValue) => {
        if (disabled) return;

        if (!isControlled) {
            setInternalValue(optionValue);
        }

        if (onChange) {
            onChange(optionValue);
        }
    };

    const handleCheckboxChange = (optionValue, checked) => {
        if (disabled) return;

        const currentValues = Array.isArray(currentValue) ? currentValue : [];
        let newValues;

        if (checked) {
            newValues = [...currentValues, optionValue];
        } else {
            newValues = currentValues.filter(v => v !== optionValue);
        }

        if (!isControlled) {
            setInternalValue(newValues);
        }

        if (onChange) {
            onChange(newValues);
        }
    };

    const wrapperClasses = [
        'plus-multiple-choice-wrapper',
        `plus-multiple-choice-${type}`,
        disabled ? 'plus-multiple-choice-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={wrapperClasses} style={style} {...props}>
            <div className="plus-multiple-choice-options">
                {options.map((option, index) => {
                    const optionId = option.id || `${id || name}-option-${index}`;
                    const optionValue = option.value !== undefined ? option.value : (typeof option === 'string' ? option : index);
                    const optionLabel = option.label !== undefined ? option.label : (typeof option === 'string' ? option : 'Text');

                    if (type === 'radio') {
                        const isChecked = currentValue === optionValue;
                        return (
                            <Radio
                                key={optionId}
                                id={optionId}
                                name={name}
                                value={optionValue}
                                label={optionLabel}
                                checked={isChecked}
                                disabled={disabled}
                                size={size}
                                onChange={() => handleRadioChange(optionValue)}
                            />
                        );
                    } else {
                        const isChecked = Array.isArray(currentValue) && currentValue.includes(optionValue);
                        return (
                            <Checkbox
                                key={optionId}
                                id={optionId}
                                name={name}
                                value={optionValue}
                                label={optionLabel}
                                checked={isChecked}
                                disabled={disabled}
                                size={size}
                                onChange={(e) => handleCheckboxChange(optionValue, e.target.checked)}
                            />
                        );
                    }
                })}
            </div>
        </div>
    );
};

MultipleChoice.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['radio', 'checkbox']),
    options: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                id: PropTypes.string,
                value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
                label: PropTypes.node
            })
        ])
    ).isRequired,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
    ]),
    defaultValue: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
    ]),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default MultipleChoice;

