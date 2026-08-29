import React from 'react';
import PropTypes from 'prop-types';
import Radio from './Radio';
import Checkbox from './Checkbox';
import useFieldId from './useFieldId';
import './MultipleChoice.scss';

/**
 * MultipleChoice Component
 * A vertical list of radio buttons or checkboxes for multiple choice selections.
 * Supports both single selection (radio) and multiple selection (checkbox) modes.
 */
const MultipleChoice = ({
    id,
    name,
    /**
     * #329. The question the options answer. This component rendered the
     * options and nothing around them — no `fieldset`, no legend, no group name
     * — so the question was on the page and not attached to the answers, and a
     * screen-reader user heard four options with no idea what they were for.
     */
    legend,
    type = 'radio', // 'radio' or 'checkbox'
    options = [],
    value, // For radio: single value; For checkbox: array of values
    defaultValue, // For radio: single value; For checkbox: array of values
    size = 'medium',
    disabled = false,
    onChange,
    className = '',
    style,
    ...props
}) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(
        defaultValue || (type === 'checkbox' ? [] : null)
    );

    /**
     * The base each option's id is suffixed from (#222), the way `Scale` does
     * it in `RadioButtonGroup`. `id || name` comes first so the per-option ids
     * shipped call sites already see are byte-for-byte what they were;
     * `fieldId` only fills the case where the caller passed neither, which
     * used to produce `undefined-option-0`.
     */
    const fieldId = useFieldId(id);
    const optionIdBase = id || name || fieldId;

    const currentValue = isControlled ? value : internalValue;

    const handleRadioChange = (optionValue) => {
        if (disabled) return;

        if (!isControlled) {
            setInternalValue(optionValue);
        }

        if (onChange) {
            onChange(optionValue);
        }
    };

    const handleCheckboxChange = (optionValue, checked) => {
        if (disabled) return;

        const currentValues = Array.isArray(currentValue) ? currentValue : [];
        let newValues;

        if (checked) {
            newValues = [...currentValues, optionValue];
        } else {
            newValues = currentValues.filter(v => v !== optionValue);
        }

        if (!isControlled) {
            setInternalValue(newValues);
        }

        if (onChange) {
            onChange(newValues);
        }
    };

    const wrapperClasses = [
        'plus-multiple-choice-wrapper',
        `plus-multiple-choice-${type}`,
        disabled ? 'plus-multiple-choice-disabled' : '',
        className
    ].filter(Boolean).join(' ');

    /*
     * A real `fieldset`/`legend` rather than `role="group"` with a label id.
     * For radios and checkboxes that is the element the platform already knows
     * about: it groups them for the browser as well as for the accessibility
     * tree, and it needs no id to do it. Without a legend the fieldset would be
     * an unnamed group, which is worse than none — so the wrapper only becomes
     * one when there is something to call it.
     */
    const Wrapper = legend ? 'fieldset' : 'div';

    return (
        <Wrapper className={wrapperClasses} style={style} {...props}>
            {legend && <legend className="plus-multiple-choice-legend body2-txt">{legend}</legend>}
            <div className="plus-multiple-choice-options">
                {options.map((option, index) => {
                    const optionId = option.id || `${optionIdBase}-option-${index}`;
                    const optionValue = option.value !== undefined ? option.value : (typeof option === 'string' ? option : index);
                    const optionLabel = option.label !== undefined ? option.label : (typeof option === 'string' ? option : 'Text');

                    if (type === 'radio') {
                        const isChecked = currentValue === optionValue;
                        return (
                            <Radio
                                key={optionId}
                                id={optionId}
                                name={name}
                                value={optionValue}
                                label={optionLabel}
                                checked={isChecked}
                                disabled={disabled}
                                size={size}
                                onChange={() => handleRadioChange(optionValue)}
                            />
                        );
                    } else {
                        const isChecked = Array.isArray(currentValue) && currentValue.includes(optionValue);
                        return (
                            <Checkbox
                                key={optionId}
                                id={optionId}
                                name={name}
                                value={optionValue}
                                label={optionLabel}
                                checked={isChecked}
                                disabled={disabled}
                                size={size}
                                onChange={(e) => handleCheckboxChange(optionValue, e.target.checked)}
                            />
                        );
                    }
                })}
            </div>
        </Wrapper>
    );
};

MultipleChoice.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    /** The question. Renders a `fieldset`/`legend` around the options. */
    legend: PropTypes.node,
    type: PropTypes.oneOf(['radio', 'checkbox']),
    options: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                id: PropTypes.string,
                value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
                label: PropTypes.node
            })
        ])
    ).isRequired,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
    ]),
    defaultValue: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
    ]),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default MultipleChoice;

