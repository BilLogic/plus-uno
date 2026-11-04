import React from 'react';
import PropTypes from 'prop-types';
import { DatePicker } from '@/components';
import { QuestionLabel } from '@/specs/Toolkit/Post-Session/QuestionText';

/**
 * Session date field (Figma Elements · Session date `10882:170725`).
 * Composes DS DatePicker — Empty / Filled states.
 *
 * @param {object} props
 * @param {string} [props.id='session-date']
 * @param {string} [props.label='Select Date']
 * @param {string} [props.value]
 * @param {(value: string) => void} [props.onChange]
 * @param {boolean} [props.isRequired=true]
 */
const SessionDate = ({
    id = 'session-date',
    label = 'Select Date',
    value = '',
    onChange,
    isRequired = true,
}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)', width: '100%', maxWidth: 'var(--col-4)' }}>
        <QuestionLabel htmlFor={id} isRequired={isRequired}>{label}</QuestionLabel>
        <DatePicker
            id={id}
            name="date"
            placeholder="MM/DD/YYYY"
            value={value}
            onChange={onChange}
            style={{ width: '100%' }}
            className="w-100"
        />
    </div>
);

SessionDate.propTypes = {
    id: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    isRequired: PropTypes.bool,
};

export default SessionDate;
