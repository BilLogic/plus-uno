import React from 'react';

// Reusable component
export const AttendanceListItems = ({ status = 'unknown', onSelect }) => {
    // Helper to ensure consistency
    const handleSelect = (val) => (e) => {
        if (onSelect) {
            onSelect(val);
        }
    };

    return (
        <div className="attendance-list-items-wrapper">
            {/* Note: This component assumes it is rendered INSIDE a .dropdown-menu container, 
                 OR acts as the content. The parent story handles the container. */}
            <button
                type="button"
                className={`dropdown-item ${status === 'present' ? 'selected' : ''}`}
                onClick={handleSelect('present')}
            >
                <span className="pdropdown-item-text">Joined</span>
            </button>
            <button
                type="button"
                className={`dropdown-item ${status === 'absent' ? 'selected' : ''}`}
                onClick={handleSelect('absent')}
            >
                <span className="pdropdown-item-text">Did not join</span>
            </button>
        </div>
    );
};
