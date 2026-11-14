import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Fieldset from '../Fieldset';
import Checkbox from '../Checkbox';
import useFieldId from '../useFieldId';
import './CheckboxGroup.scss';

/** An option as `{ value, label, ... }`, whether it was given as a string or an object. */
const normalize = (option) => (
    typeof option === 'object' && option !== null
        ? option
        : { value: option, label: String(option) }
);

/**
 * CheckboxGroup — one question and its checkbox answers, any number of which
 * may be chosen.
 *
 * Mirrors `RadioGroup` on `Fieldset`: a `<fieldset>` named by `legend`, stacked
 * or inline (wrapping 224px tiles when `appearance` is `tile`), with an array
 * `value`, `onChange(nextArray)`, and one group `error` announced via `Fieldset`.
 * `isDisabled` on the group overrides every `Checkbox`'s own.
 */
const CheckboxGroup = ({
    id,
    name,
    legend,
    orientation = 'stacked',
    options = [],
    value,
    defaultValue,
    onChange,
    appearance = 'plain',
    isRequired = false,
    isDisabled = false,
    isReadOnly = false,
    isInvalid,
    error,
    className = '',
    style,
    ...props
}) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(() => (Array.isArray(defaultValue) ? defaultValue : []));
    const answers = isControlled ? (Array.isArray(value) ? value : []) : internalValue;

    const fieldId = useFieldId(id);
    const groupName = name || fieldId;
    const invalid = isInvalid ?? Boolean(error);

    const toggle = (optionValue, checked) => {
        if (isDisabled || isReadOnly) return;
        const next = checked
            ? (answers.includes(optionValue) ? answers : [...answers, optionValue])
            : answers.filter((v) => v !== optionValue);
        if (!isControlled) setInternalValue(next);
        onChange?.(next);
    };

    const renderOption = (option, index) => {
        const {
            value: optionValue,
            label,
            description,
            illustration,
            isDisabled: optionDisabled,
            id: optionId,
            reveal,
        } = normalize(option);
        const checked = answers.includes(optionValue);
        return (
            <div key={optionId || `${optionValue}`} className="plus-checkbox-group-item">
                <Checkbox
                    id={optionId || `${fieldId}-option-${index}`}
                    name={groupName}
                    value={optionValue}
                    label={label}
                    description={description}
                    illustration={illustration}
                    appearance={appearance}
                    isChecked={checked}
                    onChange={(event) => toggle(optionValue, event.target.checked)}
                    isDisabled={isDisabled || optionDisabled}
                    isReadOnly={isReadOnly}
                    isInvalid={invalid}
                />
                {reveal && checked && (
                    <div className="plus-checkbox-group-reveal">{reveal}</div>
                )}
            </div>
        );
    };

    const classes = [
        'plus-checkbox-group',
        `plus-checkbox-group-${orientation}`,
        appearance === 'card' ? 'plus-checkbox-group-card' : '',
        appearance === 'tile' ? 'plus-checkbox-group-tile' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <Fieldset
            id={fieldId}
            legend={legend}
            isDisabled={isDisabled}
            isRequired={isRequired}
            error={error}
            className={classes}
            style={style}
            {...props}
        >
            <div className="plus-checkbox-group-options">
                {options.map(renderOption)}
            </div>
        </Fieldset>
    );
};

const optionValueType = PropTypes.oneOfType([PropTypes.string, PropTypes.number]);

CheckboxGroup.propTypes = {
    /** Base for every id in the group. Generated when omitted. */
    id: PropTypes.string,
    /** The form key the choices submit under. Defaults to the group's id. */
    name: PropTypes.string,
    /** The question. Names the group. */
    legend: PropTypes.node,
    /** `stacked` (default) puts one option per line; `inline` lays them in a row. */
    orientation: PropTypes.oneOf(['stacked', 'inline']),
    /**
     * The choices. A string is its own value and label. An object can add a
     * `description` under the label, a decorative `illustration` (for `tile`),
     * `isDisabled`, an `id`, and `reveal`: content shown under the option while
     * it is selected.
     */
    options: PropTypes.arrayOf(PropTypes.oneOfType([
        optionValueType,
        PropTypes.shape({
            value: optionValueType.isRequired,
            label: PropTypes.node.isRequired,
            description: PropTypes.node,
            illustration: PropTypes.node,
            isDisabled: PropTypes.bool,
            id: PropTypes.string,
            reveal: PropTypes.node,
        }),
    ])).isRequired,
    /** Controlled selected option values. Pair with `onChange`. */
    value: PropTypes.arrayOf(optionValueType),
    /** Option values selected at the start when uncontrolled. Defaults to `[]`. */
    defaultValue: PropTypes.arrayOf(optionValueType),
    /** Receives the next array of selected option values when a box is toggled. */
    onChange: PropTypes.func,
    /** Passed to every Checkbox. `card` draws each as a bordered row; `tile` draws centered pictured tiles with a Checkbox at the top end. */
    appearance: PropTypes.oneOf(['plain', 'card', 'tile']),
    /** Marks the question as needing an answer on the legend. */
    isRequired: PropTypes.bool,
    /** Overrides every Checkbox's own `isDisabled`. */
    isDisabled: PropTypes.bool,
    /** Shown and focusable, not changeable. */
    isReadOnly: PropTypes.bool,
    /** Marks every unselected Checkbox as failing validation. Defaults to whether `error` is set. */
    isInvalid: PropTypes.bool,
    /** One error for the group, announced when it appears. */
    error: PropTypes.node,
    /** Extra class names added to the fieldset beside the component's own. */
    className: PropTypes.string,
    /** Inline styles for the fieldset. */
    style: PropTypes.object,
};

export default CheckboxGroup;
