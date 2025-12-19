import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';

const Select = ({
    id,
    name,
    label,
    value,
    defaultValue,
    placeholder,
    options = [],
    size = 'medium',
    disabled = false,
    readOnly = false,
    onChange,
    onFocus,
    onBlur,
    className = '',
    style,
    ...props
}) => {
    const sizeClass = size === 'small' ? 'body3-txt' : (size === 'large' ? 'body1-txt' : 'body2-txt');
    const selectClass = `plus-form-select plus-form-select-${size} ${sizeClass}`;

    // Check if value is present to apply 'has-value' class style if needed
    const hasValue = value || defaultValue;
    const valueClass = hasValue ? 'plus-form-select-has-value' : '';

    return (
        <div className="plus-form-select-wrapper" id={id ? `${id}-wrapper` : undefined}>
            {label && <Form.Label htmlFor={id || name}>{label}</Form.Label>}
            <Form.Select
                id={id}
                name={name}
                value={value}
                defaultValue={defaultValue}
                disabled={disabled}
                onChange={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                className={`${selectClass} ${valueClass} ${readOnly ? 'plus-form-select-readonly' : ''} ${disabled ? 'plus-form-select-disabled' : ''} ${className}`}
                style={style}
                // ReadOnly not natively supported on select in HTML, but we can simulate or just rely on 'disabled' if strict
                // For HTML semantics, 'disabled' is often used. 
                // Legacy used a read-only class and attr, but browser support varies.
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
    label: PropTypes.node,
    value: PropTypes.string,
    defaultValue: PropTypes.string,
    placeholder: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        text: PropTypes.string
    })),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default Select;
