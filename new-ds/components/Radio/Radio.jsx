import React from 'react';
import PropTypes from 'prop-types';

const Radio = ({
    label,
    name,
    value,
    id,
    checked = false,
    disabled = false,
    className = '',
    onChange
}) => {
    const classes = [
        'form-check',
        'plus-radio-wrapper',
        'body2-txt',
        disabled ? 'plus-radio-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classes}>
            <input
                type="radio"
                className="form-check-input plus-radio"
                name={name}
                id={id}
                value={value}
                checked={checked}
                disabled={disabled}
                onChange={onChange}
            />
            <label className="form-check-label plus-radio-label" htmlFor={id}>
                {label}
            </label>
        </div>
    );
};

Radio.propTypes = {
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    value: PropTypes.string,
    id: PropTypes.string,
    checked: PropTypes.bool,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    onChange: PropTypes.func
};

export default Radio;
