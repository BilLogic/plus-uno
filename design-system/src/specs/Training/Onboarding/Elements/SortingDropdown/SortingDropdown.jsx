/**
 * SortingDropdown Component
 * 
 * Dropdown button with open/closed states for sorting.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121969
 */

import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import DropdownListOptions from '../DropdownListOptions/DropdownListOptions';
import './SortingDropdown.scss';

const SortingDropdown = ({
    isOpen = false,
    sortType = 'name',
    label = 'Name',
    onToggle,
    onSortChange,
    onOrderChange,
    className = '',
    ...props
}) => {
    const [internalOpen, setInternalOpen] = useState(isOpen);
    const dropdownRef = useRef(null);

    // Use controlled or uncontrolled state
    const open = onToggle !== undefined ? isOpen : internalOpen;

    const handleToggle = () => {
        if (onToggle) {
            onToggle(!open);
        } else {
            setInternalOpen(!internalOpen);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                if (onToggle) {
                    onToggle(false);
                } else {
                    setInternalOpen(false);
                }
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open, onToggle]);

    return (
        <div 
            className={`sorting-dropdown ${className}`} 
            ref={dropdownRef}
            {...props}
        >
            <button
                type="button"
                className={`sorting-dropdown__button ${open ? 'sorting-dropdown__button--open' : ''}`}
                onClick={handleToggle}
                aria-expanded={open}
                aria-haspopup="listbox"
            >
                <span className="sorting-dropdown__label">{label}</span>
                <span className="sorting-dropdown__icon">
                    <i className="fas fa-caret-down" aria-hidden="true" />
                </span>
            </button>

            {open && (
                <div className="sorting-dropdown__menu">
                    <DropdownListOptions 
                        type={sortType}
                        onSortChange={onSortChange}
                        onOrderChange={onOrderChange}
                    />
                </div>
            )}
        </div>
    );
};

SortingDropdown.propTypes = {
    /** Whether dropdown is open */
    isOpen: PropTypes.bool,
    /** Sort type: "name", "duration", "progress" */
    sortType: PropTypes.oneOf(['name', 'duration', 'progress']),
    /** Button label text */
    label: PropTypes.string,
    /** Callback when dropdown is toggled */
    onToggle: PropTypes.func,
    /** Callback when sort option changes */
    onSortChange: PropTypes.func,
    /** Callback when order option changes */
    onOrderChange: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default SortingDropdown;
