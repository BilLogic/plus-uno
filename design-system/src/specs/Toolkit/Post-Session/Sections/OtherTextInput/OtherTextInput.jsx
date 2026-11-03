import React, { useId } from 'react';
import PropTypes from 'prop-types';
import { TextArea } from '@/components';

/**
 * Free-text follow-up when an "Other" answer is selected
 * (Figma Sections · Other Text Input `10807:115523`).
 *
 * @param {object} props
 * @param {string} [props.label='Other (please specify)']
 * @param {string} [props.placeholder='Tell us more…']
 * @param {string} [props.value]
 * @param {(event: React.ChangeEvent) => void} [props.onChange]
 * @param {boolean} [props.isRequired=true]
 * @param {string} [props.id] - Unique field id (defaults to React useId)
 */
const OtherTextInput = ({
    label = 'Other (please specify)',
    placeholder = 'Tell us more…',
    value = '',
    onChange,
    isRequired = true,
    id,
}) => {
    const autoId = useId();
    const fieldId = id || autoId;

    return (
        <div style={{ width: '100%', maxWidth: 'var(--col-7)' }}>
            <TextArea
                id={fieldId}
                name={fieldId}
                label={label}
                isRequired={isRequired}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={1}
            />
        </div>
    );
};

OtherTextInput.propTypes = {
    label: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    isRequired: PropTypes.bool,
    id: PropTypes.string,
};

export default OtherTextInput;
