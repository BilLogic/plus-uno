import React, { useId, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Select, TextArea } from '@/components';

const DEFAULT_REASONS = [
    'Forgot to record',
    'Recording failed / tech issue',
    'Other',
];

/**
 * Reason for a missing recording (Figma Elements · No recording reason).
 * A Select of reasons; “Other” adds a text area for the detail.
 *
 * @param {object} props
 * @param {string} [props.id='no-recording-reason']
 * @param {string} [props.value='']
 * @param {(value: string) => void} [props.onChange]
 * @param {string} [props.otherDetail='']
 * @param {(event: React.ChangeEvent) => void} [props.onOtherDetailChange]
 * @param {string[]} [props.reasons]
 * @param {boolean} [props.isRequired=true]
 */
const NoRecordingReason = ({
    id = 'no-recording-reason',
    value = '',
    onChange,
    otherDetail = '',
    onOtherDetailChange,
    reasons = DEFAULT_REASONS,
    isRequired = true,
}) => {
    const otherAutoId = useId();
    const otherId = `${id}-other-${otherAutoId}`;
    const options = useMemo(
        () => reasons.map((text) => ({ value: text, label: text })),
        [reasons],
    );
    const showOther = value === 'Other';

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--section-stack-sm)',
                width: '100%',
                maxWidth: 'var(--col-9)',
            }}
        >
            <Select
                id={id}
                label="Why is there no recording?"
                isRequired={isRequired}
                options={options}
                value={value}
                onChange={onChange}
                placeholder="Select a reason"
            />
            {showOther && (
                <div style={{ width: '100%', maxWidth: 'var(--col-7)' }}>
                    <TextArea
                        id={otherId}
                        name={otherId}
                        label="Other (please specify)"
                        isRequired
                        value={otherDetail}
                        onChange={onOtherDetailChange}
                        placeholder="Briefly describe why there’s no recording"
                        rows={1}
                    />
                </div>
            )}
        </div>
    );
};

NoRecordingReason.propTypes = {
    id: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    otherDetail: PropTypes.string,
    onOtherDetailChange: PropTypes.func,
    reasons: PropTypes.arrayOf(PropTypes.string),
    isRequired: PropTypes.bool,
};

export default NoRecordingReason;
