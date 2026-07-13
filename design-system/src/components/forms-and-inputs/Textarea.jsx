import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import './Textarea.scss';

const Textarea = ({
    id,
    name,
    label,
    value,
    defaultValue,
    placeholder,
    rows = 3,
    size = 'medium',
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
    const normalizeState = (nextState) => {
        // Back-compat aliases used in stories/docs.
        if (nextState === 'read-only' || nextState === 'readOnly') return 'readonly';
        if (nextState === 'valid') return 'success';
        return nextState;
    };

    // Determine effective state (disabled/readonly override)
    let visualState = normalizeState(state);
    if (disabled) visualState = 'disabled';
    else if (readOnly) visualState = 'readonly';

    const sizeClass = size === 'small' ? 'plus-textarea-v2--sm' : (size === 'large' ? 'plus-textarea-v2--lg' : 'plus-textarea-v2--md');

    const containerClass = `plus-textarea-v2 ${sizeClass} plus-textarea-v2--${variant} plus-textarea-v2--${visualState} ${className}`;

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

Textarea.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    label: PropTypes.node,
    value: PropTypes.string,
    defaultValue: PropTypes.string,
    placeholder: PropTypes.string,
    rows: PropTypes.number,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    variant: PropTypes.oneOf(['long', 'short']),
    state: PropTypes.oneOf(['default', 'focus', 'error', 'success', 'readonly', 'disabled', 'valid', 'read-only']),
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default Textarea;
