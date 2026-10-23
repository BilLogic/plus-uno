import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Checkbox from './Checkbox';
import Radio from './Radio';
import Input from './Input';
import useFieldId from './useFieldId';
import './ChoiceGroup.scss';

const OTHER_VALUE = 'other';

/** An option as `{ value, label, ... }`, whether it was given as a string or an object. */
const normalize = (option) => (
    typeof option === 'object' && option !== null
        ? option
        : { value: option, label: String(option) }
);

/**
 * ChoiceGroup — one question and its answers.
 *
 * A `fieldset` whose `legend` is the question, holding Radios (`type="radio"`,
 * pick one) or Checkboxes (`type="checkbox"`, pick any). It can lay them out
 * stacked or inline, put scale ends either side (`leadingText`, `trailingText`),
 * add an "Other" answer with its own text box, and show one error for the group.
 *
 * The value is the answer: one option value (or `null`, unanswered) for radios,
 * an array of values for checkboxes. `onChange` receives the next answer.
 */
const ChoiceGroup = ({
    id,
    name,
    legend,
    type = 'radio',
    orientation = 'stacked',
    options = [],
    value,
    defaultValue,
    onChange,
    leadingText,
    trailingText,
    other,
    appearance = 'plain',
    size = 'medium',
    required = false,
    disabled = false,
    readOnly = false,
    error,
    className = '',
    style,
    ...props
}) => {
    const isCheckbox = type === 'checkbox';
    const isControlled = value !== undefined;
    /*
     * Unanswered until someone answers. A radio group does not fall back to its
     * first option: a response of 1 has to be told apart from no response.
     */
    const [internalValue, setInternalValue] = useState(
        defaultValue !== undefined ? defaultValue : (isCheckbox ? [] : null),
    );
    const answer = isControlled ? value : internalValue;
    const picked = isCheckbox ? (Array.isArray(answer) ? answer : []) : answer;

    /*
     * One base for every id in the group. `useFieldId` generates one when the
     * caller gave no `id`, so two unnamed groups never share option ids or a
     * radio `name`, and answering one cannot clear the other.
     */
    const fieldId = useFieldId(id);
    const groupName = name || fieldId;
    const legendId = `${fieldId}-legend`;
    const leadingId = leadingText ? `${fieldId}-leading` : undefined;
    const trailingId = trailingText ? `${fieldId}-trailing` : undefined;
    const errorId = error ? `${fieldId}-error` : undefined;

    const commit = (next) => {
        if (disabled || readOnly) return;
        if (!isControlled) setInternalValue(next);
        onChange?.(next);
    };

    const choose = (optionValue, checked) => {
        if (!isCheckbox) {
            commit(optionValue);
            return;
        }
        const without = picked.filter((v) => v !== optionValue);
        commit(checked ? [...without, optionValue] : without);
    };

    const isPicked = (optionValue) => (
        isCheckbox ? picked.includes(optionValue) : picked === optionValue
    );

    const renderChoice = (option, index) => {
        const { value: optionValue, label, description, disabled: optionDisabled, id: optionId, reveal } = normalize(option);
        const Control = isCheckbox ? Checkbox : Radio;
        const checked = isPicked(optionValue);
        return (
            <div key={optionId || `${optionValue}`} className="plus-choice-group-item">
                <Control
                    id={optionId || `${fieldId}-option-${index}`}
                    name={groupName}
                    value={optionValue}
                    label={label}
                    description={description}
                    appearance={appearance}
                    size={size}
                    checked={checked}
                    disabled={disabled || optionDisabled}
                    readOnly={readOnly}
                    // Radios: the platform enforces "one of these". Checkboxes:
                    // `required` on each box would demand every box, so the
                    // group says it instead.
                    required={!isCheckbox && required}
                    onChange={(event) => choose(optionValue, event.target.checked)}
                />
                {reveal && checked && (
                    <div className="plus-choice-group-reveal">{reveal}</div>
                )}
            </div>
        );
    };

    const otherOption = other ? {
        value: other.value ?? OTHER_VALUE,
        label: other.label ?? 'Other',
    } : null;

    const renderOther = () => {
        const index = options.length;
        const otherLabel = otherOption.label;
        const typeOther = (event) => {
            other.onTextChange?.(event.target.value);
            // Writing an answer is choosing it.
            if (event.target.value && !isPicked(otherOption.value)) {
                choose(otherOption.value, true);
            }
        };
        return (
            <div className="plus-choice-group-other">
                {renderChoice(otherOption, index)}
                <Input
                    id={`${fieldId}-other-text`}
                    label={other.inputLabel ?? `${typeof otherLabel === 'string' ? otherLabel : 'Other'}, please specify`}
                    showLabel={false}
                    size="small"
                    placeholder={other.placeholder}
                    value={other.text}
                    defaultValue={other.text === undefined ? other.defaultText : undefined}
                    disabled={disabled}
                    readOnly={readOnly}
                    onChange={typeOther}
                />
            </div>
        );
    };

    const describedBy = [leadingId, trailingId, errorId].filter(Boolean).join(' ') || undefined;

    const classes = [
        'plus-choice-group',
        `plus-choice-group-${type}`,
        `plus-choice-group-${orientation}`,
        appearance === 'card' ? 'plus-choice-group-card' : '',
        error ? 'plus-choice-group-invalid' : '',
        className,
    ].filter(Boolean).join(' ');

    const choices = (
        <div className="plus-choice-group-options">
            {options.map(renderChoice)}
        </div>
    );

    return (
        <fieldset
            className={classes}
            style={style}
            /*
             * A radio group is a `radiogroup`: it is the role ARIA lets carry
             * `aria-required` and `aria-readonly`, and `fieldset` may take it.
             * A checkbox group stays a plain group, and each box says it is
             * read-only itself.
             */
            role={isCheckbox ? undefined : 'radiogroup'}
            aria-labelledby={legend ? legendId : undefined}
            aria-describedby={describedBy}
            aria-required={!isCheckbox && required ? true : undefined}
            aria-readonly={!isCheckbox && readOnly ? true : undefined}
            disabled={disabled}
            {...props}
        >
            {legend && (
                <legend id={legendId} className="plus-choice-group-legend">
                    {legend}
                    {required && (
                        <>
                            <span className="plus-choice-group-required" aria-hidden="true"> *</span>
                            <span className="visually-hidden"> (required)</span>
                        </>
                    )}
                </legend>
            )}
            {leadingText || trailingText ? (
                <div className="plus-choice-group-scale">
                    {leadingText && (
                        <span id={leadingId} className="plus-choice-group-scale-end">{leadingText}</span>
                    )}
                    {choices}
                    {trailingText && (
                        <span id={trailingId} className="plus-choice-group-scale-end">{trailingText}</span>
                    )}
                </div>
            ) : choices}
            {otherOption && renderOther()}
            {error && (
                <div id={errorId} className="plus-choice-group-error" role="alert">
                    {error}
                </div>
            )}
        </fieldset>
    );
};

const optionValueType = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);

ChoiceGroup.propTypes = {
    /** Base for every id in the group. Generated when omitted. */
    id: PropTypes.string,
    /** The form key the choices submit under. Defaults to the group's id. */
    name: PropTypes.string,
    /** The question. Names the group. */
    legend: PropTypes.node,
    /** `radio`: pick one. `checkbox`: pick any. */
    type: PropTypes.oneOf(['radio', 'checkbox']),
    orientation: PropTypes.oneOf(['stacked', 'inline']),
    /**
     * The answers. A string is its own value and label. An object can add a
     * `description` under the label, `disabled`, an `id`, and `reveal`: content
     * shown under the option while it is chosen.
     */
    options: PropTypes.arrayOf(PropTypes.oneOfType([
        optionValueType,
        PropTypes.shape({
            value: optionValueType.isRequired,
            label: PropTypes.node.isRequired,
            description: PropTypes.node,
            disabled: PropTypes.bool,
            id: PropTypes.string,
            reveal: PropTypes.node,
        }),
    ])).isRequired,
    /** Radio: one value or `null`. Checkbox: an array of values. */
    value: PropTypes.oneOfType([optionValueType, PropTypes.arrayOf(optionValueType)]),
    defaultValue: PropTypes.oneOfType([optionValueType, PropTypes.arrayOf(optionValueType)]),
    /** Receives the next answer: a value for radios, an array for checkboxes. */
    onChange: PropTypes.func,
    /** Scale end before the options, e.g. "Not at all". Describes the group. */
    leadingText: PropTypes.node,
    /** Scale end after the options, e.g. "Very". Describes the group. */
    trailingText: PropTypes.node,
    /**
     * Adds an "Other" answer with a text box after the options. `value` is the
     * answer it adds (default `'other'`); `text` and `onTextChange` hold what
     * was typed. Typing chooses it.
     */
    other: PropTypes.shape({
        label: PropTypes.node,
        value: optionValueType,
        inputLabel: PropTypes.string,
        placeholder: PropTypes.string,
        text: PropTypes.string,
        defaultText: PropTypes.string,
        onTextChange: PropTypes.func,
    }),
    /** Passed to every choice. `card` draws each as a bordered tile. */
    appearance: PropTypes.oneOf(['plain', 'card']),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    /** The group needs an answer. Marked on the legend. */
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    /** Shown and focusable, not changeable. */
    readOnly: PropTypes.bool,
    /** One error for the group, announced when it appears. */
    error: PropTypes.node,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default ChoiceGroup;
