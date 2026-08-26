import React, { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import useFieldId from './useFieldId';
import './Checkbox.scss';

/**
 * Checkbox — single boolean control with optional indeterminate state.
 * Supports controlled (`checked`) and uncontrolled (`defaultChecked`) usage.
 */
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
    /**
     * `Form.Check` gives its label a `for` from the id it is handed, so an id of
     * `undefined` produced a label that named nothing — the same defect #206
     * fixed on the eight components that wrote `htmlFor={id || name}`, arriving
     * here through the id instead of through the `for`. `useFieldId` supplies
     * one when the caller gave none; a caller who passes `id` gets that id back.
     * `name` is a form key, not an id, so it no longer stands in for one (#213).
     */
    const fieldId = useFieldId(id);

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
                    id={fieldId}
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



