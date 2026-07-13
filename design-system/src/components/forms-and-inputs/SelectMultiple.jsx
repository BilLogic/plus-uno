import React, { useState } from 'react';
import PropTypes from 'prop-types';

const SelectMultiple = ({
    id,
    name,
    options = [],
    selectedValues = [], // Controlled state
    defaultSelectedValues = [],
    size = 'medium',
    disabled = false,
    onChange, // returns { value, selected }
    className = '',
    style,
    ...props
}) => {
    // Internal state for uncontrolled usage if selectedValues not provided
    const [internalSelected, setInternalSelected] = useState(defaultSelectedValues);
    const isControlled = selectedValues !== undefined && selectedValues !== null && selectedValues.length >= 0 && props.selectedValues !== undefined;

    const currentSelected = isControlled ? selectedValues : internalSelected;

    const sizeClass = size === 'small' ? 'body3-txt' : (size === 'large' ? 'body1-txt' : 'body2-txt');

    const handleItemClick = (optionValue) => {
        if (disabled) return;

        const isSelected = currentSelected.includes(optionValue);
        let newSelected;

        if (isSelected) {
            newSelected = currentSelected.filter(v => v !== optionValue);
        } else {
            newSelected = [...currentSelected, optionValue];
        }

        if (!isControlled) {
            setInternalSelected(newSelected);
        }

        if (onChange) {
            // Match legacy signature: { value, selected } 
            // OR provide standard event? Legacy was custom.
            onChange({
                value: optionValue,
                selected: !isSelected,
                allSelected: newSelected
            });
        }
    };

    return (
        <div
            id={id}
            className={`plus-form-select-multiple-wrapper ${disabled ? 'plus-form-select-multiple-disabled' : ''} ${className}`}
            style={style}
        >
            <div className={`plus-form-select-multiple-list plus-form-select-multiple-${size} ${sizeClass}`}>
                {options.map((option, idx) => {
                    const val = option.value;
                    const text = option.text || val;
                    const isSelected = currentSelected.includes(val);

                    return (
                        <div
                            key={idx}
                            className={`plus-form-select-multiple-item ${isSelected ? 'plus-form-select-multiple-item-selected' : ''}`}
                            onClick={() => handleItemClick(val)}
                        >
                            {text}
                        </div>
                    );
                })}
            </div>

            {/* Custom Scrollbar Visuals - optional/decorative in React as CSS handles native scroll usually, 
                 but keeping structure for parity if CSS relies on it. 
                 Legacy JS created DOM elements for scrollbar? NO, just HTML structure. 
                 Wait, if the list scrolls natively, these custom scrollbar elements need JS to work or are just visual overlays.
                 Legacy implementation adds them but I don't see JS logic to sync them in `createSelectMultiple`. 
                 They might be styled via CSS to overlay native scroll? Or just decorative.
                 I'll include them.
             */}
            <div className="plus-form-select-multiple-scrollbar">
                <div className="plus-form-select-multiple-scrollbar-icon">
                    <i className="fas fa-caret-up"></i>
                </div>
                <div className="plus-form-select-multiple-scrollbar-track">
                    <div className="plus-form-select-multiple-scrollbar-bar"></div>
                </div>
                <div className="plus-form-select-multiple-scrollbar-icon">
                    <i className="fas fa-caret-down"></i>
                </div>
            </div>
        </div>
    );
};

SelectMultiple.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        text: PropTypes.string
    })),
    selectedValues: PropTypes.arrayOf(PropTypes.string),
    defaultSelectedValues: PropTypes.arrayOf(PropTypes.string),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default SelectMultiple;
