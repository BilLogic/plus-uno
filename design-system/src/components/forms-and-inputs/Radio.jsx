import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import useFieldId from './useFieldId';
import { choiceInputProps, choiceClasses, ChoiceDescription } from './choiceItem';
import './Radio.scss';

/**
 * Radio — single option within a named radio group.
 * Supports controlled (`isChecked`) and uncontrolled (`defaultChecked`) usage.
 */
const Radio = ({
    id,
    name,
    label,
    value,
    isChecked,
    defaultChecked,
    /** Marks the unselected radio as failing validation. A selected radio does not change. */
    isInvalid = false,
    isDisabled = false,
    /**
     * Shown, focusable, not changeable. ARIA allows `aria-readonly` on a
     * radiogroup and not on a radio, so a lone Radio carries the behavior and
     * the group (RadioGroup) carries the announcement.
     */
    isReadOnly = false,
    isRequired = false,
    /** Secondary text under the label. It describes the option; it does not name it. */
    description,
    /** `card` draws the option as a bordered tile. */
    appearance = 'plain',
    onChange,
    onFocus,
    onBlur,
    onClick,
    className = '',
    style,
    ...props
}) => {
    const isControlled = isChecked !== undefined;
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
     * `RadioGroup`.
     *
     * A caller who passes `id` gets exactly that id back.
     */
    const fieldId = useFieldId(id);
    const { 'aria-describedby': describedBy, ...inputRest } = props;
    const { descriptionId, inputProps } = choiceInputProps({
        fieldId, description, readOnly: isReadOnly, onChange, onClick, describedBy,
    });

    const wrapperClasses = [
        'plus-form-radio-wrapper',
        isDisabled ? 'plus-form-radio-disabled' : '',
        isInvalid ? 'plus-form-radio-invalid' : '',
        choiceClasses({ appearance, readOnly: isReadOnly, description }),
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={wrapperClasses} style={style}>
            <Form.Check
                type="radio"
                id={fieldId}
                name={name}
                value={value}
                checked={isControlled ? isChecked : undefined}
                defaultChecked={!isControlled ? defaultChecked : undefined}
                disabled={isDisabled}
                required={isRequired || undefined}
                aria-invalid={isInvalid || undefined}
                onFocus={onFocus}
                onBlur={onBlur}
                label={label}
                className="plus-form-radio"
                {...inputRest}
                {...inputProps}
            />
            <ChoiceDescription id={descriptionId}>{description}</ChoiceDescription>
        </div>
    );
};

Radio.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    label: PropTypes.node,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isChecked: PropTypes.bool,
    defaultChecked: PropTypes.bool,
    isInvalid: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isReadOnly: PropTypes.bool,
    isRequired: PropTypes.bool,
    description: PropTypes.node,
    appearance: PropTypes.oneOf(['plain', 'card']),
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onClick: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default Radio;



