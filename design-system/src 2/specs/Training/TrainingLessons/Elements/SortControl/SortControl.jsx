/**
 * SortControl Component
 * 
 * Dropdown sort control with Sort by and Order sections.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=747-54853
 */

import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Dropdown } from 'react-bootstrap';
import './SortControl.scss';

const SortControl = ({
    sortBy = 'Name',
    sortOrder = 'A-Z',
    onChange,
    className = '',
    style
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (value) => {
        if (value === 'Sort by' || value === 'Order') return; // Ignore section headers

        // Determine if it's a sort by or order selection
        const sortByOptions = ['Name', 'SMART Competency', 'Status', 'Competency Areas'];
        const orderOptions = ['A-Z', 'Z-A', 'Least Progress First', 'Most Progress First', '"Technology" Competencies First'];

        if (sortByOptions.includes(value)) {
            onChange && onChange({ sortBy: value, sortOrder });
        } else if (orderOptions.includes(value)) {
            onChange && onChange({ sortBy, sortOrder: value });
        }

        setIsOpen(false);
    };

    const getButtonText = () => {
        return sortBy;
    };

    const menuItems = [
        { type: 'header', text: 'Sort by' },
        { type: 'option', text: 'Name', value: 'Name', selected: sortBy === 'Name' },
        { type: 'option', text: 'SMART Competency', value: 'SMART Competency', selected: sortBy === 'SMART Competency' },
        { type: 'option', text: 'Status', value: 'Status', selected: sortBy === 'Status' },
        { type: 'option', text: 'Competency Areas', value: 'Competency Areas', selected: sortBy === 'Competency Areas' },
        { type: 'header', text: 'Order' },
        { type: 'option', text: 'A-Z', value: 'A-Z', selected: sortOrder === 'A-Z' },
        { type: 'option', text: 'Z-A', value: 'Z-A', selected: sortOrder === 'Z-A' },
    ];

    // Adjust menu items based on sortBy selection
    if (sortBy === 'Status') {
        menuItems.splice(6, 2,
            { type: 'option', text: 'Least Progress First', value: 'Least Progress First', selected: sortOrder === 'Least Progress First' },
            { type: 'option', text: 'Most Progress First', value: 'Most Progress First', selected: sortOrder === 'Most Progress First' }
        );
    } else if (sortBy === 'Competency Areas') {
        menuItems.splice(6, 2,
            { type: 'option', text: '"Technology" Competencies First', value: '"Technology" Competencies First', selected: sortOrder === '"Technology" Competencies First' }
        );
    }

    return (
        <div
            ref={dropdownRef}
            className={`sort-control ${className}`}
            style={style}
            data-node-id="747-54853"
        >
            <Dropdown show={isOpen} onToggle={setIsOpen}>
                <Dropdown.Toggle
                    as="button"
                    className="sort-control__button"
                    id="sort-control-dropdown"
                >
                    <span className="sort-control__button-text">{getButtonText()}</span>
                    <i className="fas fa-caret-down sort-control__caret" />
                </Dropdown.Toggle>

                <Dropdown.Menu className="sort-control__menu">
                    {menuItems.map((item, index) => {
                        if (item.type === 'header') {
                            return (
                                <div key={index} className="sort-control__header">
                                    {item.text}
                                </div>
                            );
                        }
                        return (
                            <Dropdown.Item
                                key={index}
                                className={`sort-control__item ${item.selected ? 'sort-control__item--selected' : ''}`}
                                onClick={() => handleSelect(item.value)}
                            >
                                <i className={`fas fa-check sort-control__check ${item.selected ? 'sort-control__check--visible' : ''}`} />
                                <span className="sort-control__item-text">{item.text}</span>
                            </Dropdown.Item>
                        );
                    })}
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
};

SortControl.propTypes = {
    /** Current sort by value */
    sortBy: PropTypes.oneOf(['Name', 'SMART Competency', 'Status', 'Competency Areas']),
    /** Current sort order */
    sortOrder: PropTypes.string,
    /** Change handler: receives { sortBy, sortOrder } */
    onChange: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Additional inline styles */
    style: PropTypes.object
};

export default SortControl;
