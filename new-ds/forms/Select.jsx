import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import './Select.scss';

const Select = ({
    id,
    name,
    value,
    defaultValue,
    placeholder,
    options = [],
    multiple = false,
    size = 'medium',
    readOnly = false,
    onChange,
    onFocus,
    onBlur,
    className = '',
    style,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    
    const sizeClass = size === 'small' ? 'body3-txt' : (size === 'large' ? 'body1-txt' : 'body2-txt');
    const selectClass = `plus-form-select plus-form-select-${size} ${sizeClass} ${multiple ? 'plus-form-select-multiple' : ''}`;

    // Check if value is present to apply 'has-value' class style if needed
    // For multiple select, check if array has items
    const hasValue = multiple 
        ? (Array.isArray(value) ? value.length > 0 : Array.isArray(defaultValue) ? defaultValue.length > 0 : false)
        : (value || defaultValue);
    const valueClass = hasValue ? 'plus-form-select-has-value' : '';

    const handleFocus = (e) => {
        setIsFocused(true);
        if (onFocus) onFocus(e);
    };

    const handleBlur = (e) => {
        setIsFocused(false);
        if (onBlur) onBlur(e);
    };

    return (
        <div className="plus-form-select-wrapper" id={id ? `${id}-wrapper` : undefined}>
            <Form.Select
                id={id}
                name={name}
                multiple={multiple}
                value={value}
                defaultValue={defaultValue}
                readOnly={readOnly}
                onChange={onChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={`${selectClass} ${valueClass} ${readOnly ? 'plus-form-select-readonly' : ''} ${isFocused ? 'plus-form-select-focused' : ''} ${className}`}
                style={style}
                {...props}
            >
                {placeholder && <option value="" disabled>{placeholder}</option>}
                {options.map((opt, idx) => (
                    <option key={idx} value={opt.value}>
                        {opt.text || opt.value}
                    </option>
                ))}
            </Form.Select>
        </div>
    );
};

Select.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
    ]),
    defaultValue: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
    ]),
    placeholder: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        text: PropTypes.string
    })),
    multiple: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    readOnly: PropTypes.bool,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default Select;
