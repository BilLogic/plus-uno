import React, { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-bootstrap';
import useFieldId from './useFieldId';
import { choiceInputProps, choiceClasses, ChoiceDescription } from './choiceItem';
import './Checkbox.scss';

/**
 * Checkbox — single boolean control with optional indeterminate state.
 * Supports controlled (`isChecked`) and uncontrolled (`defaultChecked`) usage.
 */
const Checkbox = ({
    id,
    name,
    label,
    value,
    isChecked,
    defaultChecked,
    isIndeterminate = false,
    /** Marks the unselected box as failing validation. A selected box does not change. */
    isInvalid = false,
    isDisabled = false,
    /**
     * Shown and announced, not changeable. Unlike `isDisabled` the box stays in
     * the tab order and keeps full contrast, so the answer can still be read.
     */
    isReadOnly = false,
    isRequired = false,
    /** Secondary text under the label. It describes the box; it does not name it. */
    description,
    /** `card` draws the choice as a bordered tile. */
    appearance = 'plain',
    onChange,
    onFocus,
    onBlur,
    onClick,
    className = '',
    style,
    testId,
    ...props
}) => {
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const isControlled = isChecked !== undefined;
    /**
     * `Form.Check` gives its label a `for` from the id it is handed, so an id of
     * `undefined` produced a label that named nothing — the same defect #206
     * fixed on the eight components that wrote `htmlFor={id || name}`, arriving
     * here through the id instead of through the `for`. `useFieldId` supplies
     * one when the caller gave none; a caller who passes `id` gets that id back.
     * `name` is a form key, not an id, so it no longer stands in for one (#213).
     */
    const fieldId = useFieldId(id);

    // Callback ref to get the actual input element from Form.Check
    const setInputRef = useCallback((node) => {
        if (node) {
            const input = node.querySelector('input[type="checkbox"]');
            if (input) {
                inputRef.current = input;
            }
        }
    }, []);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.indeterminate = isIndeterminate;
        }
    }, [isIndeterminate]);

    const { 'aria-describedby': describedBy, ...inputRest } = props;
    const { descriptionId, inputProps } = choiceInputProps({
        fieldId, description, readOnly: isReadOnly, onChange, onClick, describedBy,
    });

    const wrapperClasses = [
        'plus-form-checkbox-wrapper',
        isIndeterminate ? 'plus-form-checkbox-indeterminate' : '',
        isDisabled ? 'plus-form-checkbox-disabled' : '',
        isRequired ? 'plus-form-checkbox-required' : '',
        isInvalid ? 'plus-form-checkbox-invalid' : '',
        choiceClasses({ appearance, readOnly: isReadOnly, description }),
        className
    ].filter(Boolean).join(' ');

    const labelContent = isRequired && label ? (
        <>
            {label}
            <span className="plus-form-checkbox-required-asterisk" aria-label="required">*</span>
        </>
    ) : label;

    return (
        <div className={wrapperClasses} style={style} ref={wrapperRef}>
            <div ref={setInputRef}>
                <Form.Check
                    type="checkbox"
                    id={fieldId}
                    name={name}
                    value={value}
                    checked={isControlled ? isChecked : undefined}
                    defaultChecked={!isControlled ? defaultChecked : undefined}
                    disabled={isDisabled}
                    required={isRequired}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    label={labelContent}
                    className="plus-form-checkbox"
                    {...inputRest}
                    {...inputProps}
                    aria-readonly={isReadOnly || undefined}
                    aria-invalid={isInvalid || undefined}
                    data-testid={testId}
                />
            </div>
            <ChoiceDescription id={descriptionId}>{description}</ChoiceDescription>
        </div>
    );
};

Checkbox.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    label: PropTypes.node,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isChecked: PropTypes.bool,
    defaultChecked: PropTypes.bool,
    isIndeterminate: PropTypes.bool,
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
    style: PropTypes.object,
    /** Maps to `data-testid`, for test queries. */
    testId: PropTypes.string,
};

export default Checkbox;



