import React, { useId } from 'react';
import PropTypes from 'prop-types';
import Textarea from '@/components/forms-and-inputs/Textarea';

/**
 * Free-text follow-up when an "Other" option chip is selected
 * (Figma Sections · Other Text Input `10807:115523`).
 *
 * @param {object} props
 * @param {string} [props.label='Other (please specify)']
 * @param {string} [props.placeholder='Tell us more…']
 * @param {string} [props.value]
 * @param {(event: React.ChangeEvent) => void} [props.onChange]
 * @param {boolean} [props.required=true]
 * @param {string} [props.id] - Unique field id (defaults to React useId)
 */
const OtherTextInput = ({
    label = 'Other (please specify)',
    placeholder = 'Tell us more…',
    value = '',
    onChange,
    required = true,
    id,
}) => {
    const autoId = useId();
    const fieldId = id || autoId;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-element-gap-xs)',
                width: '100%',
                maxWidth: 'var(--col-7)',
            }}
        >
            <label
                htmlFor={fieldId}
                className="body3-txt font-weight-semibold m-0"
                style={{ color: 'var(--color-on-surface)' }}
            >
                {label}
                {required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
            </label>
            <Textarea
                id={fieldId}
                name={fieldId}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={1}
                variant="short"
                size="medium"
            />
        </div>
    );
};

OtherTextInput.propTypes = {
    label: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    required: PropTypes.bool,
    id: PropTypes.string,
};

export default OtherTextInput;
