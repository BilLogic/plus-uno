import React from 'react';
import PropTypes from 'prop-types';

const Input = ({
    id,
    name,
    type = 'text',
    placeholder,
    value,
    size = 'medium',
    readonly = false,
    disabled = false,
    className = '',
    style = {},
    onChange,
    onFocus,
    onBlur
}) => {
    const sizeMap = {
        small: 'body3-txt',
        medium: 'body2-txt',
        large: 'body1-txt'
    };

    const classes = [
        'plus-text-field',
        sizeMap[size] || 'body2-txt',
        className
    ].filter(Boolean).join(' ');

    return (
        <input
            id={id}
            name={name}
            type={type}
            className={classes}
            placeholder={placeholder}
            value={value}
            readOnly={readonly}
            disabled={disabled}
            style={style}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
        />
    );
};

Input.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    readonly: PropTypes.bool,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func
};

export default Input;
