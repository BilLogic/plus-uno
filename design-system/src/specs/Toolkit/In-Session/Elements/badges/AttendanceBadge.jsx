import React from 'react';
import StatusTag from '@/components/labels/StatusTag';

const caretIcon = <i className="fa-solid fa-caret-down" aria-hidden="true"></i>;

// Reusable component
export const AttendanceBadge = ({ status = 'unknown', showDropdown = true, className = '' }) => {
    let text = 'Select';
    let style = 'neutral';

    if (status === 'present') {
        text = 'Joined';
        style = 'success';
    } else if (status === 'absent') {
        text = 'Did not join';
        style = 'danger';
    } else if (status === 'na') {
        text = 'N/A';
        style = 'neutral';
    }

    return (
        <span className={`d-inline-flex align-items-center gap-1 ${className}`.trim()}>
            <StatusTag appearance={style}>{text}</StatusTag>
            {showDropdown && caretIcon}
        </span>
    );
};
