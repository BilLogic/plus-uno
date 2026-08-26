import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import useFieldId from './useFieldId';
import './Radio.scss';

/**
 * Radio — single option within a named radio group.
 * Supports controlled (`checked`) and uncontrolled (`defaultChecked`) usage.
 */
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
    /**
     * One id for this option's input and the `for` `Form.Check` puts on its
     * label (#222).
     *
     * The line here used to be `id={id || name}`, the defect #206 fixed on
     * eight other components — `name` is a form key, not an id, and nothing on
     * the page carries it as one. It is worse on a radio: radios in a group
     * share a `name` by definition, so a group written without explicit ids
     * gave *every* option the same id and every label resolved to whichever
     * one the browser reached first.
     *
     * `Radio` is one option, not the group, so the id can come straight from
     * `useFieldId` — `useId` runs per instance and each option in the group
     * gets its own value. Components that render the whole group derive one
     * base and suffix it per option instead; see `optionIdBase` in
     * `RadioButtonGroup` and `MultipleChoice`.
     *
     * A caller who passes `id` gets exactly that id back.
     */
    const fieldId = useFieldId(id);
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



