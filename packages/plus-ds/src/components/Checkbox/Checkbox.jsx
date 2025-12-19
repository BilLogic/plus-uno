import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const Checkbox = ({
    label,
    name,
    value,
    id,
    className = '',
    checked = false,
    indeterminate = false,
    disabled = false,
    required = false,
    onChange
}) => {
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.indeterminate = indeterminate;
        }
    }, [indeterminate]);

    const wrapperClasses = [
        'form-check',
        'body2-txt',
        'plus-checkbox-wrapper',
        indeterminate ? 'plus-checkbox-indeterminate' : '',
        disabled ? 'plus-checkbox-disabled' : '',
        required ? 'plus-checkbox-required-wrapper' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={wrapperClasses}>
            <input
                ref={inputRef}
                type="checkbox"
                className="form-check-input plus-checkbox"
                name={name}
                id={id}
                value={value}
                checked={checked}
                disabled={disabled}
                required={required}
                onChange={onChange}
            />
            <label className="form-check-label plus-checkbox-label" htmlFor={id}>
                {label}
                {required && (
                    <span className="plus-checkbox-required" aria-label="required">*</span>
                )}
            </label>
        </div>
    );
};

Checkbox.propTypes = {
    label: PropTypes.string.isRequired,
    name: PropTypes.string,
    value: PropTypes.string,
    id: PropTypes.string,
    className: PropTypes.string,
    checked: PropTypes.bool,
    indeterminate: PropTypes.bool,
    disabled: PropTypes.bool,
    required: PropTypes.bool,
    onChange: PropTypes.func
};

export default Checkbox;
