/**
 * ExportSearchFilterBar Component
 * 
 * Action bar with Export CSV button, search input, and filter dropdowns.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=433-370346
 */

import React from 'react';
import PropTypes from 'prop-types';
import { InputGroup, Form } from 'react-bootstrap';
import Button from '../../../../../components/Button/Button';
import './ExportSearchFilterBar.scss';

const ExportSearchFilterBar = ({
    exportLabel = 'Export CSV',
    searchPlaceholder = 'Search',
    filters = [
        { key: 'lessons', label: 'All Lessons' },
        { key: 'startDate', label: 'All Start Date' },
        { key: 'name', label: 'Name', sortable: true },
    ],
    selectedFilters = {},
    onExport,
    onSearch,
    onFilterChange,
    onSort,
    className = '',
    ...props
}) => {
    return (
        <div className={`export-search-filter-bar ${className}`} {...props}>
            {/* Export CSV Button */}
            <Button
                text={exportLabel}
                style="primary"
                fill="filled"
                size="medium"
                leadingVisual="download"
                onClick={onExport}
                className="export-search-filter-bar__export-btn"
            />

            {/* Search Input */}
            <div className="export-search-filter-bar__search">
                <InputGroup>
                    <InputGroup.Text className="export-search-filter-bar__search-icon">
                        <i className="fas fa-search" />
                    </InputGroup.Text>
                    <Form.Control
                        type="text"
                        placeholder={searchPlaceholder}
                        onChange={(e) => onSearch && onSearch(e.target.value)}
                        className="export-search-filter-bar__search-input"
                    />
                </InputGroup>
            </div>

            {/* Filter Dropdowns */}
            <div className="export-search-filter-bar__filters">
                {filters.map((filter) => (
                    <Button
                        key={filter.key}
                        text={selectedFilters[filter.key] || filter.label}
                        style="secondary"
                        fill="text"
                        size="medium"
                        trailingVisual="caret-down"
                        onClick={() => {
                            if (filter.sortable && onSort) {
                                onSort(filter.key);
                            } else if (onFilterChange) {
                                onFilterChange(filter.key);
                            }
                        }}
                        className="export-search-filter-bar__filter"
                    />
                ))}
            </div>
        </div>
    );
};

ExportSearchFilterBar.propTypes = {
    /** Export button label */
    exportLabel: PropTypes.string,
    /** Search input placeholder */
    searchPlaceholder: PropTypes.string,
    /** Array of filter definitions */
    filters: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            sortable: PropTypes.bool,
        })
    ),
    /** Selected filter values */
    selectedFilters: PropTypes.object,
    /** Callback when Export is clicked */
    onExport: PropTypes.func,
    /** Callback when search value changes */
    onSearch: PropTypes.func,
    /** Callback when filter changes */
    onFilterChange: PropTypes.func,
    /** Callback when sortable filter is clicked */
    onSort: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default ExportSearchFilterBar;
