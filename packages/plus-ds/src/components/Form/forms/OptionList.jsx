import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ListGroup from '@/components/ListGroup';
import './OptionList.scss';

/**
 * OptionList Component
 * Consolidated with ListGroup - uses ListGroup.Option subcomponent for flexible option list popups.
 * Supports single-select (radio) or multi-select (checkbox) modes.
 */
const OptionList = ({
    id,
    name,
    options = [],
    value, // Currently selected value(s)
    defaultValue,
    onSelect,
    disabled = false,
    mode = 'single', // 'single' (radio) or 'multi' (checkbox)
    size = 'medium',
    flush = false,
    className = '',
    style,
    ...props
}) => {
    const [internalValue, setInternalValue] = useState(
        defaultValue !== undefined ? defaultValue : (mode === 'multi' ? [] : null)
    );

    const isControlled = value !== undefined;
    const selectedValue = isControlled ? value : internalValue;

    // Helper to check if option is selected
    const isOptionSelected = (optionValue) => {
        if (mode === 'multi') {
            return Array.isArray(selectedValue) && selectedValue.includes(optionValue);
        }
        return selectedValue === optionValue;
    };

    const handleOptionClick = (optionValue, option, index) => {
        if (disabled) return;

        let newValue;
        if (mode === 'multi') {
            const currentValues = Array.isArray(selectedValue) ? [...selectedValue] : [];
            const idx = currentValues.indexOf(optionValue);
            if (idx > -1) {
                currentValues.splice(idx, 1);
            } else {
                currentValues.push(optionValue);
            }
            newValue = currentValues;
        } else {
            newValue = optionValue;
        }

        if (!isControlled) {
            setInternalValue(newValue);
        }

        if (onSelect) {
            onSelect(newValue, option, index);
        }
    };

    return (
        <div className={`plus-option-list-wrapper ${className}`} id={id} style={style}>
            <ListGroup flush={flush} className="plus-option-list" {...props}>
                {options.map((option, index) => {
                    const optionText = typeof option === 'string'
                        ? option
                        : (option.text || option.label || 'Option');
                    const optionValue = typeof option === 'string'
                        ? option
                        : (option.value ?? optionText);
                    const isDisabled = disabled || (typeof option === 'object' && option.disabled);
                    const isSelected = isOptionSelected(optionValue);

                    return (
                        <ListGroup.Option
                            key={index}
                            name={name || id || 'option-list'}
                            value={optionValue}
                            label={optionText}
                            selected={isSelected}
                            disabled={isDisabled}
                            mode={mode}
                            onClick={() => handleOptionClick(optionValue, option, index)}
                        />
                    );
                })}
            </ListGroup>
        </div>
    );
};

OptionList.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    options: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                text: PropTypes.string,
                label: PropTypes.string,
                value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
                disabled: PropTypes.bool
            })
        ])
    ),
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
    onSelect: PropTypes.func,
    disabled: PropTypes.bool,
    mode: PropTypes.oneOf(['single', 'multi']),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    flush: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object
};

export default OptionList;
