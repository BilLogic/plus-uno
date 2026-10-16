import React, { useState } from 'react';
import { StatusSelect } from './StatusSelect.jsx';

/**
 * Engagement picker: a small single Select for a student's engagement in a
 * session.
 *
 * - **Partially engaged** needs a reason, so it adds a Reason Select beside
 *   the field, and `onStatusChange` fires once a reason is picked.
 * - The other statuses apply at once.
 * - Before a pick the field reads "Select"; it takes the colour of the status
 *   picked.
 */

const engagementOptions = [
    { value: 'fully-engaged', label: 'Fully engaged on zoom' },
    { value: 'partially-engaged', label: 'Partially engaged' },
    { value: 'not-engaged', label: 'Not engaged at all' },
    // Shown when the status is set elsewhere; it is not a pick.
    { value: 'na', label: 'N/A', disabled: true },
];

const reasonOptions = [
    { value: 'joined-late', label: 'Joined late (10+ min)' },
    { value: 'unresponsive', label: 'Unresponsive on zoom' },
    { value: 'left-early', label: 'Left zoom early' },
    { value: 'other', label: 'Other', description: 'If none apply, pick Other and message your supervisor on Slack.' },
];

const toneFor = {
    'fully-engaged': 'success',
    'partially-engaged': 'warning',
    'not-engaged': 'danger',
};

export const EngagementDropdown = ({
    initialStatus = 'unknown',
    initialReason = '',
    onStatusChange,
    disabled = false,
    className = '',
}) => {
    const [status, setStatus] = useState(initialStatus === 'unknown' ? '' : initialStatus);
    const [reason, setReason] = useState(initialReason);

    const handleStatusChange = (next) => {
        setStatus(next);
        setReason('');
        if (next !== 'partially-engaged' && onStatusChange) onStatusChange(next || 'unknown', null);
    };

    const handleReasonChange = (next) => {
        setReason(next);
        if (next && onStatusChange) onStatusChange(status, next);
    };

    return (
        <div className={`d-flex align-items-center ${className}`.trim()} style={{ gap: 'var(--size-element-gap-sm)' }}>
            <StatusSelect
                aria-label="Engagement"
                placeholder="Select"
                options={engagementOptions}
                value={status}
                onChange={handleStatusChange}
                disabled={disabled}
                tone={toneFor[status]}
            />
            {status === 'partially-engaged' && (
                <StatusSelect
                    aria-label="Reason"
                    placeholder="Pick a reason"
                    options={reasonOptions}
                    value={reason}
                    onChange={handleReasonChange}
                    disabled={disabled}
                />
            )}
        </div>
    );
};
