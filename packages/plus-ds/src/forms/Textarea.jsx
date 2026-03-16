import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';

const Textarea = ({
    id,
    name,
    label,
    value,
    defaultValue,
    placeholder,
    rows = 3,
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
    // Legacy sizing classes based on body typography
    const sizeClass = size === 'small' ? 'body3-txt' : (size === 'large' ? 'body1-txt' : 'body2-txt');
    const formClass = `plus-form-textarea plus-form-textarea-${size} ${sizeClass}`;

    return (
        <>
            {label && <Form.Label htmlFor={id || name}>{label}</Form.Label>}
            <Form.Control
                as="textarea"
                id={id}
                name={name}
                value={value}
                defaultValue={defaultValue}
                placeholder={placeholder}
                rows={rows}
                disabled={disabled}
                readOnly={readOnly}
                onChange={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                className={`${formClass} ${readOnly ? 'plus-form-textarea-readonly' : ''} ${disabled ? 'plus-form-textarea-disabled' : ''} ${className}`}
                style={style}
                {...props}
            />
        </>
    );
};

Textarea.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    label: PropTypes.node,
    value: PropTypes.string,
    defaultValue: PropTypes.string,
    placeholder: PropTypes.string,
    rows: PropTypes.number,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default Textarea;
