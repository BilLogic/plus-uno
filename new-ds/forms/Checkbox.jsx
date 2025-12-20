import React, { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import './Checkbox.scss';

const Checkbox = ({
    id,
    name,
    label,
    value,
    checked,
    defaultChecked,
    indeterminate = false,
    size = 'medium',
    disabled = false,
    required = false,
    onChange,
    onFocus,
    onBlur,
    className = '',
    style,
    ...props
}) => {
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const isControlled = checked !== undefined;

    // Callback ref to get the actual input element from Form.Check
    const setInputRef = useCallback((node) => {
        if (node) {
            const input = node.querySelector('input[type="checkbox"]');
            if (input) {
                inputRef.current = input;
            }
        }
    }, []);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.indeterminate = indeterminate;
        }
    }, [indeterminate]);

    const sizeClass = size === 'small' ? 'body3-txt' : (size === 'large' ? 'body1-txt' : 'body2-txt');

    const wrapperClasses = [
        'plus-form-checkbox-wrapper',
        `plus-form-checkbox-${size}`,
        sizeClass,
        indeterminate ? 'plus-form-checkbox-indeterminate' : '',
        disabled ? 'plus-form-checkbox-disabled' : '',
        required ? 'plus-form-checkbox-required' : '',
        className
    ].filter(Boolean).join(' ');

    const labelContent = required && label ? (
        <>
            {label}
            <span className="plus-form-checkbox-required-asterisk" aria-label="required">*</span>
        </>
    ) : label;

    return (
        <div className={wrapperClasses} style={style} ref={wrapperRef}>
            <div ref={setInputRef}>
                <Form.Check
                    type="checkbox"
                    id={id || name}
                    name={name}
                    value={value}
                    checked={isControlled ? checked : undefined}
                    defaultChecked={!isControlled ? defaultChecked : undefined}
                    disabled={disabled}
                    required={required}
                    onChange={onChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    label={labelContent}
                    className="plus-form-checkbox"
                    {...props}
                />
            </div>
        </div>
    );
};

Checkbox.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    label: PropTypes.node,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    checked: PropTypes.bool,
    defaultChecked: PropTypes.bool,
    indeterminate: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    required: PropTypes.bool,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default Checkbox;

