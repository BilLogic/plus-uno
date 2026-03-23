import React from 'react';
import Badge from '../../../../../components/Badge/Badge';

const caretIcon = <i className="fa-solid fa-caret-down"></i>;

// Reusable component
export const AttendanceBadge = ({ status = 'unknown', showDropdown = true, className = '' }) => {
    let text = 'Select';
    let style = 'secondary';
    let trailingVisual = showDropdown ? caretIcon : null;

    if (status === 'present') {
        text = 'Joined';
        style = 'success';
    } else if (status === 'absent') {
        text = 'Did not join';
        style = 'danger';
    } else if (status === 'na') {
        text = 'N/A';
        style = 'secondary';
        trailingVisual = null; // N/A is typically static or doesn't imply selection in the same way, but let's check. 
        // User said "missing an n/a state". 
        // If it's in a dropdown, it might still need a caret if it's selectable?
        // Usually N/A means "Not Applicable" and might not be a dropdown option, or it IS an option.
        // I will assume it behaves like others for now. 
        trailingVisual = showDropdown ? caretIcon : null;
    }

    return (
        <Badge
            size="b3"
            className={`fw-normal ${className}`}
            text={text}
            style={style}
            trailingVisual={trailingVisual}
        />
    );
};
