/**
 * DropdownListOptions Component
 * 
 * Dropdown menu with sorting options: name, duration, progress.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121962
 */

import React from 'react';
import PropTypes from 'prop-types';
import './DropdownListOptions.scss';

const DropdownListOptions = ({
    type = 'name',
    selectedSort = null,
    selectedOrder = null,
    onSortChange,
    onOrderChange,
    className = '',
    ...props
}) => {
    // Define options based on type
    const sortOptions = ['Name', 'Duration', 'Progress'];
    
    const orderOptionsMap = {
        'name': ['A-Z', 'Z-A'],
        'duration': ['Shortest First', 'Longest Last'],
        'progress': ['Completed First', 'Completed Last']
    };

    const orderOptions = orderOptionsMap[type] || orderOptionsMap['name'];

    // Determine default selections
    const activeSort = selectedSort || type.charAt(0).toUpperCase() + type.slice(1);
    const activeOrder = selectedOrder || orderOptions[0];

    const handleSortClick = (option) => {
        if (onSortChange) {
            onSortChange(option.toLowerCase());
        }
    };

    const handleOrderClick = (option) => {
        if (onOrderChange) {
            onOrderChange(option);
        }
    };

    return (
        <div className={`dropdown-list-options ${className}`} {...props}>
            <div className="dropdown-list-options__menu">
                {/* Sort By Header */}
                <div className="dropdown-list-options__item dropdown-list-options__item--header">
                    <span className="dropdown-list-options__check-placeholder" />
                    <span className="dropdown-list-options__text">Sort by</span>
                </div>

                {/* Sort Options */}
                {sortOptions.map((option) => {
                    const isSelected = option.toLowerCase() === type;
                    return (
                        <button
                            key={option}
                            type="button"
                            className={`dropdown-list-options__item ${isSelected ? 'dropdown-list-options__item--selected' : ''}`}
                            onClick={() => handleSortClick(option)}
                        >
                            <span className={`dropdown-list-options__check ${isSelected ? 'dropdown-list-options__check--visible' : ''}`}>
                                <i className="fas fa-check" aria-hidden="true" />
                            </span>
                            <span className="dropdown-list-options__text">{option}</span>
                        </button>
                    );
                })}

                {/* Divider */}
                <div className="dropdown-list-options__divider" />

                {/* Order Header */}
                <div className="dropdown-list-options__item dropdown-list-options__item--header">
                    <span className="dropdown-list-options__check-placeholder" />
                    <span className="dropdown-list-options__text">Order</span>
                </div>

                {/* Order Options */}
                {orderOptions.map((option, index) => {
                    const isSelected = index === 0; // First option is selected by default
                    return (
                        <button
                            key={option}
                            type="button"
                            className={`dropdown-list-options__item ${isSelected ? 'dropdown-list-options__item--selected' : ''}`}
                            onClick={() => handleOrderClick(option)}
                        >
                            <span className={`dropdown-list-options__check ${isSelected ? 'dropdown-list-options__check--visible' : ''}`}>
                                <i className="fas fa-check" aria-hidden="true" />
                            </span>
                            <span className="dropdown-list-options__text">{option}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

DropdownListOptions.propTypes = {
    /** Dropdown type: "name", "duration", "progress" */
    type: PropTypes.oneOf(['name', 'duration', 'progress']),
    /** Currently selected sort option */
    selectedSort: PropTypes.string,
    /** Currently selected order option */
    selectedOrder: PropTypes.string,
    /** Callback when sort option changes */
    onSortChange: PropTypes.func,
    /** Callback when order option changes */
    onOrderChange: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default DropdownListOptions;
