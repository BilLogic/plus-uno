import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import './TextareaVer2.scss';

const TextareaVer2 = ({
    id,
    name,
    label,
    value,
    defaultValue,
    placeholder,
    rows = 3,
    variant = 'long',
    state = 'default',
    disabled = false,
    readOnly = false,
    onChange,
    onFocus,
    onBlur,
    className = '',
    style,
    ...props
}) => {
    // Determine effective state
    let visualState = state;
    if (disabled) visualState = 'disabled';
    else if (readOnly) visualState = 'readonly';

    const containerClass = `plus-textarea-v2 plus-textarea-v2--${variant} plus-textarea-v2--${visualState} ${className}`;

    // Adjust rows for short variant if not explicitly set
    const effectiveRows = variant === 'short' ? 1 : rows;

    return (
        <div className={containerClass} style={style}>
            {label && <label htmlFor={id || name} className="plus-textarea-v2__label">{label}</label>}
            <Form.Control
                as="textarea"
                id={id}
                name={name}
                value={value}
                defaultValue={defaultValue}
                placeholder={placeholder}
                rows={effectiveRows}
                disabled={disabled}
                readOnly={readOnly}
                onChange={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                className="plus-textarea-v2__control"
                {...props}
            />
        </div>
    );
};

TextareaVer2.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    label: PropTypes.node,
    value: PropTypes.string,
    defaultValue: PropTypes.string,
    placeholder: PropTypes.string,
    rows: PropTypes.number,
    variant: PropTypes.oneOf(['long', 'short']),
    state: PropTypes.oneOf(['default', 'focus', 'error', 'read-only', 'disabled']),
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default TextareaVer2;
