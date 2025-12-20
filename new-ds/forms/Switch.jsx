import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import './Switch.scss';

const Switch = ({
    id,
    name,
    label,
    value = 'on',
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
        'plus-form-switch-wrapper',
        `plus-form-switch-${size}`,
        sizeClass,
        disabled ? 'plus-form-switch-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={wrapperClasses} style={style}>
            <Form.Check
                type="switch"
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
                className="plus-form-switch"
                {...props}
            />
        </div>
    );
};

Switch.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
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

export default Switch;


