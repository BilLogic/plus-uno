import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import useFieldId from '../useFieldId';
import { choiceClasses } from '../choiceItem';
import FieldFrame, { FieldLabel, FieldCaption, toneProps, fieldDescription } from '../_internal/FieldFrame';
import './Checkbox.scss';

/**
 * Checkbox — single boolean control with optional indeterminate state.
 * Supports controlled (`isChecked`) and uncontrolled (`defaultChecked`) usage.
 *
 * Built on Base UI's Checkbox: a `role="checkbox"` span with a hidden native
 * input beside it for form submission, wrapped in `FieldFrame` (A7) for the
 * label and the description caption. `isInvalid` marks the unselected box
 * only, through `data-invalid` scoped off `data-checked` in the stylesheet.
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
    const fieldId = useFieldId(id);
    const isControlled = isChecked !== undefined;
    const tone = isInvalid ? 'invalid' : undefined;
    const { control } = toneProps(tone);
    const { 'aria-describedby': describedBy, ...inputRest } = props;
    const { messageId, describedBy: computedDescribedBy } = fieldDescription({
        fieldId, message: description, describedBy,
    });

    const handleCheckedChange = (checked) => {
        onChange?.({ target: { name, value, checked } });
    };

    const wrapperClasses = [
        'plus-form-checkbox-wrapper',
        isIndeterminate ? 'plus-form-checkbox-indeterminate' : '',
        isRequired ? 'plus-form-checkbox-required' : '',
        isInvalid ? 'plus-form-checkbox-invalid' : '',
        choiceClasses({ appearance, readOnly: isReadOnly }),
        className,
    ].filter(Boolean).join(' ');

    return (
        <FieldFrame disabled={isDisabled} invalid={isInvalid} className={wrapperClasses} style={style}>
            <div className="plus-form-checkbox-row">
                <BaseCheckbox.Root
                    id={fieldId}
                    name={name}
                    value={value}
                    checked={isControlled ? isChecked : undefined}
                    defaultChecked={!isControlled ? defaultChecked : undefined}
                    disabled={isDisabled}
                    readOnly={isReadOnly}
                    required={isRequired}
                    indeterminate={isIndeterminate}
                    onCheckedChange={handleCheckedChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onClick={onClick}
                    className="plus-form-checkbox"
                    aria-describedby={computedDescribedBy}
                    data-testid={testId}
                    {...control}
                    {...inputRest}
                >
                    <BaseCheckbox.Indicator keepMounted className="plus-form-checkbox-indicator" />
                </BaseCheckbox.Root>
                <FieldLabel htmlFor={fieldId} required={isRequired} name={name} className="plus-form-checkbox-label">
                    {label}
                </FieldLabel>
            </div>
            <FieldCaption messageId={messageId} message={description} tone={tone ?? 'help'} />
        </FieldFrame>
    );
};

Checkbox.propTypes = {
    /** The `id` of the checkbox; the label points at it. Generated when omitted. */
    id: PropTypes.string,
    /** The form key the box submits under, and sent in the `onChange` payload. */
    name: PropTypes.string,
    label: PropTypes.node,
    /** The value submitted with a form when the box is selected, and sent in the `onChange` payload. */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** Whether the box is selected. Pass it, with `onChange`, to control the checkbox. */
    isChecked: PropTypes.bool,
    /** Whether the box starts selected, when `isChecked` is not controlling it. */
    defaultChecked: PropTypes.bool,
    isIndeterminate: PropTypes.bool,
    isInvalid: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isReadOnly: PropTypes.bool,
    isRequired: PropTypes.bool,
    /** Secondary text under the label. It describes the box and does not name it. */
    description: PropTypes.node,
    /** `plain` (default) draws the box and label inline; `card` draws the choice as a bordered tile. */
    appearance: PropTypes.oneOf(['plain', 'card']),
    /** Called with `{ target: { name, value, checked } }` when the box is toggled. */
    onChange: PropTypes.func,
    /** Called with the focus event when the checkbox gains focus. */
    onFocus: PropTypes.func,
    /** Called with the blur event when the checkbox loses focus. */
    onBlur: PropTypes.func,
    /** Called with the click event on the checkbox. */
    onClick: PropTypes.func,
    /** Extra class names added to the field wrapper beside the component's own. */
    className: PropTypes.string,
    /** Inline styles for the field wrapper. */
    style: PropTypes.object,
    /** Maps to `data-testid`, for test queries. */
    testId: PropTypes.string,
};

export default Checkbox;
