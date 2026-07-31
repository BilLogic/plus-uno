import React from 'react';
import PropTypes from 'prop-types';
import DatePicker from '@/components/forms-and-inputs/DatePicker';

/**
 * Session date field (Figma Elements · Session date `10882:170725`).
 * Composes DS DatePicker — Empty / Filled states.
 *
 * @param {object} props
 * @param {string} [props.id='session-date']
 * @param {string} [props.label='Select Date']
 * @param {string} [props.value]
 * @param {(value: string) => void} [props.onChange]
 * @param {boolean} [props.required=true]
 */
const SessionDate = ({
    id = 'session-date',
    label = 'Select Date',
    value = '',
    onChange,
    required = true,
}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)', width: '100%', maxWidth: 'var(--col-4)' }}>
        <label htmlFor={id} className="body3-txt font-weight-semibold m-0" style={{ color: 'var(--color-on-surface)' }}>
            {label}
            {required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
        </label>
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
    required: PropTypes.bool,
};

export default SessionDate;
