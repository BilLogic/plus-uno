import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './SwitchButton.scss';

/**
 * SwitchButton Component
 * Form toggle switch implementing the Form Switch Button Figma spec.
 * Renders a styled toggle with optional label and required indicator.
 */
const SwitchButton = ({
    // Content
    label,
    required = false,

    // State
    checked = false,
    defaultChecked,
    disabled = false,
    readOnly = false,

    // Behavior
    onChange,

    // Dev
    id,
    name,
    className,
    ...props
}) => {
    const isControlled = checked !== undefined && onChange !== undefined;

    const wrapperClasses = classNames(
        'plus-switch',
        {
            'plus-switch--checked': checked,
            'plus-switch--disabled': disabled,
            'plus-switch--readonly': readOnly,
        },
        className
    );

    const handleChange = (e) => {
        if (disabled || readOnly) return;
        if (onChange) onChange(e);
    };

    return (
        <label className={wrapperClasses} htmlFor={id}>
            <span className="plus-switch__track" aria-hidden="true">
                <span className="plus-switch__thumb" />
            </span>
            <input
                type="checkbox"
                id={id}
                name={name}
                className="plus-switch__input"
                checked={isControlled ? checked : undefined}
                defaultChecked={!isControlled ? defaultChecked : undefined}
                disabled={disabled}
                readOnly={readOnly}
                aria-readonly={readOnly}
                onChange={handleChange}
                {...props}
            />
            {label && (
                <span className="plus-switch__label body2-txt">
                    {label}
                    {required && (
                        <span className="plus-switch__required" aria-hidden="true">*</span>
                    )}
                </span>
            )}
        </label>
    );
};

SwitchButton.propTypes = {
    // Content
    label: PropTypes.string,
    required: PropTypes.bool,

    // State
    checked: PropTypes.bool,
    defaultChecked: PropTypes.bool,
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,

    // Behavior
    onChange: PropTypes.func,

    // Dev
    id: PropTypes.string,
    name: PropTypes.string,
    className: PropTypes.string,
};

export default SwitchButton;
