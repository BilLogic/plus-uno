import React from 'react';
import useFieldId from './useFieldId';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import './Switch.scss';

/**
 * Form Switch — Foundations Form Switch Button (Figma `82:16570`).
 * Controlled via `checked` or uncontrolled via `defaultChecked`.
 * `type` is locked to `"switch"` — extra DOM attrs may be passed via `inputProps`.
 *
 * @param {object} props
 * @param {string} [props.id]
 * @param {string} [props.name]
 * @param {React.ReactNode} [props.label]
 * @param {string|number} [props.value='on']
 * @param {boolean} [props.checked]
 * @param {boolean} [props.defaultChecked]
 * @param {'small'|'medium'|'large'} [props.size='medium'] - Label density; control geometry matches Figma (large scales up)
 * @param {boolean} [props.disabled=false]
 * @param {(event: React.ChangeEvent) => void} [props.onChange]
 * @param {(event: React.FocusEvent) => void} [props.onFocus]
 * @param {(event: React.FocusEvent) => void} [props.onBlur]
 * @param {string} [props.className]
 * @param {React.CSSProperties} [props.style]
 * @param {object} [props.inputProps] - Extra Form.Check props (cannot override type)
 */
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
    inputProps = {},
}) => {
    // `name` is a form key, not an id: two <Switch name="x"> siblings share it,
    // so `id || name` collapses them onto one id and every label resolves to the
    // first. Same fix as Checkbox (#213) and Radio (#222).
    const fieldId = useFieldId(id);
    const isControlled = checked !== undefined;
    const sizeClass = size === 'small'
        ? 'body3-txt'
        : (size === 'large' ? 'body1-txt' : 'body2-txt');

    const wrapperClasses = [
        'plus-form-switch-wrapper',
        `plus-form-switch-${size}`,
        sizeClass,
        disabled ? 'plus-form-switch-disabled' : '',
        className,
    ].filter(Boolean).join(' ');

    const { type: _ignoredType, ...safeInputProps } = inputProps;

    return (
        <div className={wrapperClasses} style={style}>
            {/*
              * `role="switch"` — decided in #207. The evidence and the two
              * conditions it comes with are in the accessibility section of
              * `Switch.mdx`; read that before changing this line.
              *
              * Short version. `Form.Check type="switch"` rewrites the type
              * back to `"checkbox"` and adds a `form-switch` class, so the
              * switch was entirely visual and the control announced itself as
              * a checkbox. Bootstrap's own documented markup for `.form-switch`
              * carries `role="switch"`; react-bootstrap simply never emitted
              * it. The W3C APG's switch pattern ships this exact markup —
              * `input[type=checkbox]` plus the role, with no `aria-checked`,
              * because the platform maps the native `checked` state for us.
              *
              * It is a default, not a lock: set before the spread, so
              * `inputProps={{ role: 'checkbox' }}` still wins.
              */}
            <Form.Check
                role="switch"
                {...safeInputProps}
                type="switch"
                id={fieldId}
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
    style: PropTypes.object,
    inputProps: PropTypes.object,
};

export default Switch;
