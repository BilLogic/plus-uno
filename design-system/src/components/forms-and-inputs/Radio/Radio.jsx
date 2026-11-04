import React from 'react';
import PropTypes from 'prop-types';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import useFieldId from '../useFieldId';
import { choiceClasses } from '../choiceItem';
import FieldFrame, { FieldLabel, FieldCaption, toneProps, fieldDescription } from '../_internal/FieldFrame';
import './Radio.scss';

/**
 * Radio — single option within a named radio group.
 * Supports controlled (`isChecked`) and uncontrolled (`defaultChecked`) usage.
 *
 * Built on Base UI's Radio, wrapped in `FieldFrame` (A7) for the label and
 * the description caption. Base UI's Radio has no standalone `checked`
 * prop — selection lives on a `RadioGroup` ancestor.
 *
 * `RadioGroup` renders one real, shared Base UI `RadioGroup` around all of
 * its options and passes each one `grouped`, so the group gets Base UI's
 * native roving-tabindex keyboard nav across options for free, same as
 * `ChoiceGrid`'s radio-type rows. A `Radio` used on its own (no `grouped`,
 * the default) — a lone question, a `ChoiceGrid` cell, or sibling Radios
 * sharing a bare `name` the way the "Group" story composes them — owns a
 * private, single-item group instead, so it stays independently
 * controllable exactly like the native input it replaces. That private
 * group keeps its own `role="radiogroup"` (axe rejects `aria-readonly`/
 * `aria-required` on a role-less `div`) but drops the `aria-labelledby` it
 * would otherwise inherit from an ambient Fieldset legend it has no
 * business naming itself after.
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
    /** Set by `RadioGroup`: renders bare inside its ambient Base UI RadioGroup instead of a private one. Not for direct use. */
    grouped = false,
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

    const handleValueChange = () => {
        onChange?.({ target: { name, value, checked: true } });
    };

    const wrapperClasses = [
        'plus-form-radio-wrapper',
        isRequired ? 'plus-form-radio-required' : '',
        isInvalid ? 'plus-form-radio-invalid' : '',
        choiceClasses({ appearance, readOnly: isReadOnly }),
        className,
    ].filter(Boolean).join(' ');

    const groupValueProps = isControlled
        ? { value: isChecked ? value : undefined }
        : { defaultValue: defaultChecked ? value : undefined };

    const radioControl = (
        <BaseRadio.Root
            id={fieldId}
            value={value}
            onFocus={onFocus}
            onBlur={onBlur}
            onClick={onClick}
            className="plus-form-radio"
            aria-describedby={computedDescribedBy}
            data-testid={testId}
            {...control}
            {...inputRest}
        >
            <BaseRadio.Indicator keepMounted className="plus-form-radio-indicator" />
        </BaseRadio.Root>
    );

    return (
        <FieldFrame disabled={isDisabled} invalid={isInvalid} className={wrapperClasses} style={style}>
            <div className="plus-form-radio-row">
                {grouped ? radioControl : (
                    <BaseRadioGroup
                        name={name}
                        disabled={isDisabled}
                        readOnly={isReadOnly}
                        required={isRequired}
                        onValueChange={handleValueChange}
                        aria-labelledby={undefined}
                        {...groupValueProps}
                    >
                        {radioControl}
                    </BaseRadioGroup>
                )}
                <FieldLabel htmlFor={fieldId} required={isRequired} name={name} className="plus-form-radio-label">
                    {label}
                </FieldLabel>
            </div>
            <FieldCaption messageId={messageId} message={description} tone={tone ?? 'help'} />
        </FieldFrame>
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
    /** Set by `RadioGroup`. Not for direct use. */
    grouped: PropTypes.bool,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onClick: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
    /** Maps to `data-testid`, for test queries. */
    testId: PropTypes.string,
};

export default Radio;
