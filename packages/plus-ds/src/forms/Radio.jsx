import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import './Radio.scss';

const Radio = ({
    id,
    name,
    label,
    value,
    checked,
    defaultChecked,
    size = 'medium',
    disabled = false,
    onChange,
    onFocus,
    onBlur,
    className = '',
    style,
    ...props
}) => {
    const isControlled = checked !== undefined;
    const sizeClass = size === 'small' ? 'body3-txt' : (size === 'large' ? 'body1-txt' : 'body2-txt');

    const wrapperClasses = [
        'plus-form-radio-wrapper',
        `plus-form-radio-${size}`,
        sizeClass,
        disabled ? 'plus-form-radio-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={wrapperClasses} style={style}>
            <Form.Check
                type="radio"
                id={id || name}
                name={name}
                value={value}
                checked={isControlled ? checked : undefined}
                defaultChecked={!isControlled ? defaultChecked : undefined}
                disabled={disabled}
                onChange={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                label={label}
                className="plus-form-radio"
                {...props}
            />
        </div>
    );
};

Radio.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    label: PropTypes.node,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    checked: PropTypes.bool,
    defaultChecked: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default Radio;



