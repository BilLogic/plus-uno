import React, { useState } from 'react';
import { StatusSelect } from './StatusSelect.jsx';

const attendanceOptions = [
    { value: 'present', label: 'Joined' },
    { value: 'absent', label: 'Did not join' },
    // Shown when the status is set elsewhere; it is not a pick.
    { value: 'na', label: 'N/A', disabled: true },
];

const toneFor = { present: 'success', absent: 'danger' };

/**
 * Attendance picker: Joined or Did not join, on a small single Select. Before
 * a pick it reads "Select"; the field takes the colour of the status picked.
 */
export const AttendanceDropdown = ({
    initialStatus = 'unknown',
    onStatusChange,
    className = '',
}) => {
    const [status, setStatus] = useState(initialStatus === 'unknown' ? '' : initialStatus);

    const handleChange = (next) => {
        setStatus(next);
        if (onStatusChange) onStatusChange(next || 'unknown');
    };

    return (
        <StatusSelect
            aria-label="Attendance"
            placeholder="Select"
            options={attendanceOptions}
            value={status}
            onChange={handleChange}
            tone={toneFor[status]}
            className={className}
        />
    );
};
