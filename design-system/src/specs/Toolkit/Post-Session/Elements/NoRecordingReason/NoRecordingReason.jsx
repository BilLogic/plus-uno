import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Select from '@/components/forms-and-inputs/Select';

const DEFAULT_REASONS = [
    'Forgot to record',
    'Recording failed / tech issue',
    'Other',
];

/**
 * Why is there no recording? (Figma Elements · No Recording Reason `10925:11334`).
 *
 * @param {object} props
 * @param {string} [props.id='no-recording-reason']
 * @param {string} [props.value='']
 * @param {(value: string) => void} [props.onChange]
 * @param {string[]} [props.reasons=DEFAULT_REASONS]
 * @param {boolean} [props.required=true]
 */
const NoRecordingReason = ({
    id = 'no-recording-reason',
    value = '',
    onChange,
    reasons = DEFAULT_REASONS,
    required = true,
}) => {
    const options = useMemo(
        () => reasons.map((text) => ({ value: text, label: text })),
        [reasons],
    );

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-element-gap-xs)',
                width: '100%',
                maxWidth: '480px',
            }}
        >
            <label htmlFor={id} className="body3-txt font-weight-semibold m-0" style={{ color: 'var(--color-on-surface)' }}>
                Why is there no recording?
                {required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
            </label>
            <div className="w-100" style={{ width: '100%' }}>
                <Select
                    id={id}
                    mode="single"
                    options={options}
                    value={value}
                    onChange={onChange}
                    placeholder="Select a reason"
                />
            </div>
        </div>
    );
};

NoRecordingReason.propTypes = {
    id: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    reasons: PropTypes.arrayOf(PropTypes.string),
    required: PropTypes.bool,
};

export default NoRecordingReason;
