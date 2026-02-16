import React, { useState, forwardRef } from 'react';
import { Dropdown } from 'react-bootstrap';
// Import the reusable Toolkit components from dedicated files
import { AttendanceBadge } from './badges/AttendanceBadge.jsx';
import { AttendanceListItems } from './AttendanceListItems.jsx';
import '../../../../../packages/plus-ds/src/components/Dropdown/Dropdown.scss'; // Ensure styles are loaded

// Custom Toggle to use the exported AttendanceBadge component
const CustomToggle = forwardRef(({ children, onClick, className }, ref) => (
    <div
        ref={ref}
        onClick={(e) => {
            e.preventDefault();
            onClick(e);
        }}
        className={`${className} cursor-pointer custom-toggle-no-caret`}
        style={{ display: 'inline-block' }}
    >
        <style>{`
            .custom-toggle-no-caret::after {
                display: none !important;
                content: none !important;
                border: none !important;
            }
        `}</style>
        {children}
    </div>
));

export const AttendanceDropdown = ({
    initialStatus = 'unknown',
    onStatusChange,
    className = 'pdropdown'
}) => {
    // State to manage the selected value and interaction
    const [status, setStatus] = useState(initialStatus);
    const [show, setShow] = useState(false);

    const handleSelect = (val) => {
        setStatus(val);
        setShow(false); // Close the dropdown on selection
        if (onStatusChange) {
            onStatusChange(val);
        }
    };

    return (
        <Dropdown
            className={className}
            show={show}
            onToggle={(isOpen) => setShow(isOpen)}
        >
            <Dropdown.Toggle as={CustomToggle} id="attendance-dropdown">
                {/* Reuse the AttendanceBadge component from the Toolkit */}
                <AttendanceBadge status={status} showDropdown={true} />
            </Dropdown.Toggle>

            <Dropdown.Menu className="dropdown-menu">
                {/* Reuse the AttendanceListItems component from the Toolkit */}
                <AttendanceListItems
                    status={status}
                    onSelect={handleSelect}
                />
            </Dropdown.Menu>
        </Dropdown>
    );
};
