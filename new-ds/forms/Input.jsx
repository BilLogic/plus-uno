import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import './Input.scss';

const Input = ({
    id,
    name,
    label,
    required = false,
    showLabel = true,
    placeholder,
    value,
    size = 'medium',
    disabled = false,
    readonly = false,
    validation = 'none', // 'none', 'invalid', 'success'
    validationMessage,
    leadingVisual,
    trailingVisual,
    type = 'text',
    className = '',
    style,
    onChange,
    onFocus,
    onBlur,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const sizeClass = size === 'small' ? 'body3-txt' : (size === 'large' ? 'body1-txt' : 'body2-txt');
    
    const handleFocus = (e) => {
        setIsFocused(true);
        if (onFocus) onFocus(e);
    };

    const handleBlur = (e) => {
        setIsFocused(false);
        if (onBlur) onBlur(e);
    };

    // Determine border color based on state
    const getBorderColor = () => {
        if (disabled || readonly) return 'var(--color-outline-variant)';
        if (validation === 'invalid') return 'var(--color-danger)';
        if (validation === 'success') return 'var(--color-success)';
        if (isFocused) return 'var(--color-primary)';
        return 'var(--color-outline-variant)';
    };

    // Determine background color based on state
    const getBackgroundColor = () => {
        if (disabled) return 'var(--color-surface-container-low)';
        if (readonly) return 'var(--color-surface-container)';
        return 'var(--color-surface-container-lowest)';
    };

    // Determine text color based on state
    const getTextColor = () => {
        if (disabled) return 'var(--color-on-surface-variant)';
        if (readonly && !value) return 'var(--color-on-surface-variant)';
        return 'var(--color-on-surface)';
    };

    const inputClasses = [
        'plus-input',
        `plus-input-${size}`,
        sizeClass,
        disabled ? 'plus-input-disabled' : '',
        readonly ? 'plus-input-readonly' : '',
        isFocused ? 'plus-input-focused' : '',
        validation !== 'none' ? `plus-input-${validation}` : '',
        className
    ].filter(Boolean).join(' ');

    const inputStyle = {
        borderColor: getBorderColor(),
        backgroundColor: getBackgroundColor(),
        color: getTextColor(),
        ...style
    };

    const validationIcon = validation === 'invalid' ? (
        <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
    ) : validation === 'success' ? (
        <i className="fa-solid fa-circle-check" aria-hidden="true" />
    ) : null;

    return (
        <div className="plus-input-wrapper">
            {showLabel && label && (
                <Form.Label htmlFor={id || name} className="plus-input-label">
                    {label}
                    {required && (
                        <span className="plus-input-required" aria-label="required">*</span>
                    )}
                </Form.Label>
            )}
            <div className="plus-input-container">
                {leadingVisual && (
                    <div className="plus-input-leading-visual">
                        {typeof leadingVisual === 'string' ? (
                            <i className={leadingVisual} aria-hidden="true" />
                        ) : (
                            leadingVisual
                        )}
                    </div>
                )}
                <Form.Control
                    id={id}
                    name={name}
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    disabled={disabled}
                    readOnly={readonly}
                    className={inputClasses}
                    style={inputStyle}
                    onChange={onChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    {...props}
                />
                {trailingVisual && (
                    <div className="plus-input-trailing-visual">
                        {typeof trailingVisual === 'string' ? (
                            trailingVisual === 'dropdown' ? (
                                <i className="fa-solid fa-chevron-down" aria-hidden="true" />
                            ) : (
                                <i className={trailingVisual} aria-hidden="true" />
                            )
                        ) : (
                            trailingVisual
                        )}
                    </div>
                )}
            </div>
            {validation !== 'none' && validationMessage && (
                <div className={`plus-input-validation plus-input-validation-${validation}`}>
                    {validationIcon}
                    <span className="plus-input-validation-message">{validationMessage}</span>
                </div>
            )}
        </div>
    );
};

Input.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    label: PropTypes.node,
    required: PropTypes.bool,
    showLabel: PropTypes.bool,
    placeholder: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    validation: PropTypes.oneOf(['none', 'invalid', 'success']),
    validationMessage: PropTypes.string,
    leadingVisual: PropTypes.oneOfType([
        PropTypes.string, // Icon class name
        PropTypes.node // React element
    ]),
    trailingVisual: PropTypes.oneOfType([
        PropTypes.string, // Icon class name or 'dropdown'
        PropTypes.node // React element
    ]),
    type: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func
};

export default Input;

