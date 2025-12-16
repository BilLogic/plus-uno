import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';

const Switch = ({
    id,
    label,
    name,
    checked,
    defaultChecked,
    value = 'on',
    disabled = false,
    onChange,
    className = '',
    style,
    ...props
}) => {
    // Determine if controlled or uncontrolled
    const isControlled = checked !== undefined;

    return (
        <div className={`plus-switch-wrapper body2-txt ${disabled ? 'plus-switch-disabled' : ''} ${className}`} style={style}>
            <Form.Check
                type="switch"
                id={id || name} // Ensure ID for label association
                label={label}
                name={name}
                checked={isControlled ? checked : undefined}
                defaultChecked={!isControlled ? defaultChecked : undefined}
                value={value}
                disabled={disabled}
                onChange={onChange}
                className="plus-switch-input" // Note: Form.Check puts this on container usually, might need custom styling targeting .custom-control-input inside
                custom // Triggers Bootstrap generic custom-control
                {...props}
            />
        </div>
    );
};

Switch.propTypes = {
    id: PropTypes.string,
    label: PropTypes.node,
    name: PropTypes.string,
    checked: PropTypes.bool,
    defaultChecked: PropTypes.bool,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default Switch;
