import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import Fieldset from '../Fieldset';
import Radio from '../Radio';
import useFieldId from '../useFieldId';
import './RadioGroup.scss';

/** An option as `{ value, label, ... }`, whether it was given as a string or an object. */
const normalize = (option) => (
    typeof option === 'object' && option !== null
        ? option
        : { value: option, label: String(option) }
);

/**
 * RadioGroup — one question and its radio answers.
 *
 * A `Fieldset` (legend plus grouped fields) holding one real Base UI
 * `RadioGroup`, which carries the `role="radiogroup"`, the keyboard roving
 * tabindex across options, and `aria-required`/`aria-readonly`; the Fieldset
 * stays plain grouping and the legend, which the group inherits as its own
 * accessible name. Lays them out stacked or inline, can put scale ends
 * either side (`leadingText`, `trailingText` — see the "Linear scale"
 * story), and shows one error for the group. `isDisabled` on the group
 * overrides every `Radio`'s own.
 *
 * The value is the chosen option's value, or `null`/`undefined` while
 * unanswered — a radio group does not fall back to its first option, so a
 * response of `1` can be told apart from no response.
 */
const RadioGroup = ({
    id,
    name,
    legend,
    orientation = 'stacked',
    options = [],
    value,
    defaultValue,
    onChange,
    leadingText,
    trailingText,
    appearance = 'plain',
    /** Radio control (dot) width, in px; unset keeps today's rendering. */
    size,
    isRequired = false,
    isDisabled = false,
    isReadOnly = false,
    isInvalid,
    error,
    className = '',
    style,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    ...props
}) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(defaultValue !== undefined ? defaultValue : null);
    const answer = isControlled ? value : internalValue;

    const fieldId = useFieldId(id);
    const groupName = name || fieldId;
    const leadingId = leadingText ? `${fieldId}-leading` : undefined;
    const trailingId = trailingText ? `${fieldId}-trailing` : undefined;

    const invalid = isInvalid ?? Boolean(error);

    const choose = (optionValue) => {
        if (isDisabled || isReadOnly) return;
        if (!isControlled) setInternalValue(optionValue);
        onChange?.(optionValue);
    };

    const renderOption = (option, index) => {
        const { value: optionValue, label, description, isDisabled: optionDisabled, id: optionId, reveal } = normalize(option);
        const checked = answer === optionValue;
        return (
            <div key={optionId || `${optionValue}`} className="plus-radio-group-item">
                <Radio
                    grouped
                    id={optionId || `${fieldId}-option-${index}`}
                    value={optionValue}
                    label={label}
                    description={description}
                    appearance={appearance}
                    isDisabled={isDisabled || optionDisabled}
                    isReadOnly={isReadOnly}
                    isInvalid={invalid}
                    isRequired={isRequired}
                />
                {reveal && checked && (
                    <div className="plus-radio-group-reveal">{reveal}</div>
                )}
            </div>
        );
    };

    // Fieldset computes this same id internally for the error it renders;
    // repeated here so the real `role="radiogroup"` — now the inner Base UI
    // group, not the `<fieldset>` — points at it too.
    const errorId = error ? `${fieldId}-error` : undefined;
    const describedBy = [leadingId, trailingId, errorId].filter(Boolean).join(' ') || undefined;

    // Base UI's RadioGroup does not inherit the ambient Fieldset's legend as
    // its own accessible name (unlike Radio's private group, which inherits
    // too much and has to suppress it — see Radio.jsx). `legendId` repeats
    // Fieldset's own `${fieldId}-legend` so the one real group gets named by
    // the question it groups. A caller's own `aria-label`/`aria-labelledby`
    // (the "Pick one" story) wins over the legend.
    const legendId = legend ? `${fieldId}-legend` : undefined;
    const groupLabelledBy = ariaLabelledBy ?? (ariaLabel ? undefined : legendId);

    const classes = [
        'plus-radio-group',
        `plus-radio-group-${orientation}`,
        appearance === 'card' ? 'plus-radio-group-card' : '',
        className,
    ].filter(Boolean).join(' ');

    const options_ = (
        <div className="plus-radio-group-options">
            {options.map(renderOption)}
        </div>
    );

    return (
        <Fieldset
            id={fieldId}
            legend={legend}
            isDisabled={isDisabled}
            isRequired={isRequired}
            error={error}
            className={classes}
            data-size={size}
            style={style}
            {...props}
        >
            <BaseRadioGroup
                name={groupName}
                value={answer}
                onValueChange={choose}
                disabled={isDisabled}
                readOnly={isReadOnly}
                required={isRequired}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                aria-label={ariaLabel}
                aria-labelledby={groupLabelledBy}
            >
                {leadingText || trailingText ? (
                    <div className="plus-radio-group-scale">
                        {leadingText && (
                            <span id={leadingId} className="plus-radio-group-scale-end">{leadingText}</span>
                        )}
                        {options_}
                        {trailingText && (
                            <span id={trailingId} className="plus-radio-group-scale-end">{trailingText}</span>
                        )}
                    </div>
                ) : options_}
            </BaseRadioGroup>
        </Fieldset>
    );
};

const optionValueType = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);

RadioGroup.propTypes = {
    /** Base for every id in the group. Generated when omitted. */
    id: PropTypes.string,
    /** The form key the choices submit under. Defaults to the group's id. */
    name: PropTypes.string,
    /** The question. Names the group. */
    legend: PropTypes.node,
    /** `stacked` (default) puts one option per line; `inline` lays them in a row, for short labels or a scale. */
    orientation: PropTypes.oneOf(['stacked', 'inline']),
    /**
     * The answers. A string is its own value and label. An object can add a
     * `description` under the label, `isDisabled`, an `id`, and `reveal`:
     * content shown under the option while it is chosen.
     */
    options: PropTypes.arrayOf(PropTypes.oneOfType([
        optionValueType,
        PropTypes.shape({
            value: optionValueType.isRequired,
            label: PropTypes.node.isRequired,
            description: PropTypes.node,
            isDisabled: PropTypes.bool,
            id: PropTypes.string,
            reveal: PropTypes.node,
        }),
    ])).isRequired,
    /** The answer: one option value, or `null`/`undefined` while unanswered. */
    value: optionValueType,
    /** The option value chosen at the start, when the group is uncontrolled. Leave it out for no answer. */
    defaultValue: optionValueType,
    /** Receives the next answer's value. */
    onChange: PropTypes.func,
    /** Scale end before the options, e.g. "Not at all". Describes the group. */
    leadingText: PropTypes.node,
    /** Scale end after the options, e.g. "Very". Describes the group. */
    trailingText: PropTypes.node,
    /** Passed to every Radio. `card` draws each as a bordered tile. */
    appearance: PropTypes.oneOf(['plain', 'card']),
    /** Radio control (dot) width, in px; unset keeps today's rendering. */
    size: PropTypes.oneOf([10, 12, 14]),
    /** The group needs an answer. Marked on the legend. */
    isRequired: PropTypes.bool,
    /** Overrides every Radio's own `isDisabled`. */
    isDisabled: PropTypes.bool,
    /** Shown and focusable, not changeable. */
    isReadOnly: PropTypes.bool,
    /** Marks every Radio as failing validation. Defaults to whether `error` is set. */
    isInvalid: PropTypes.bool,
    /** One error for the group, announced when it appears. */
    error: PropTypes.node,
    /** Extra class names added to the fieldset beside the component's own. */
    className: PropTypes.string,
    /** Inline styles for the fieldset. */
    style: PropTypes.object,
};

export default RadioGroup;
