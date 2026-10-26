/**
 * ExportSearchFilterBar Component
 *
 * Action bar with Export CSV button, search input, filters and sort.
 * Each filter is a FilterSelect: pick-many filters apply when their list
 * closes, and with nothing picked read their placeholder ("All lessons").
 * Sort is a single Select.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=433-370346
 */

import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/forms-and-inputs/Button/Button';
import InputGroup from '@/components/forms-and-inputs/InputGroup/InputGroup';
import { FilterSelect } from '@/specs/Toolkit/Pre-Session/Elements/Filters/FilterSelect';
import './ExportSearchFilterBar.scss';

const defaultFilters = [
    {
        key: 'lessons',
        label: 'Lessons',
        placeholder: 'All lessons',
        mode: 'multi',
        options: [
            { value: 'math-101', label: 'Math 101' },
            { value: 'science-lab', label: 'Science Lab' },
            { value: 'history-101', label: 'History 101' },
        ],
    },
    {
        key: 'startDate',
        label: 'Start date',
        placeholder: 'All start dates',
        options: [
            { value: 'last-7-days', label: 'Last 7 days' },
            { value: 'last-30-days', label: 'Last 30 days' },
            { value: 'this-month', label: 'This month' },
        ],
    },
];

const defaultSortOptions = [
    { value: 'name-az', label: 'Name A-Z' },
    { value: 'name-za', label: 'Name Z-A' },
];

const ExportSearchFilterBar = ({
    exportLabel = 'Export CSV',
    searchPlaceholder = 'Search',
    filters = defaultFilters,
    selectedFilters,
    sortOptions = defaultSortOptions,
    sortBy,
    onExport,
    onSearch,
    onFilterChange,
    onSort,
    hideExport = false,
    className = '',
    ...props
}) => {
    const emptyFor = (filter) => (filter.mode === 'multi' ? [] : '');

    return (
        <div className={`export-search-filter-bar ${className}`} {...props}>
            {/* Export CSV Button */}
            {!hideExport && (
                <Button
                    text={exportLabel}
                    style="primary"
                    fill="filled"
                    size="small"
                    leadingVisual="download"
                    onClick={onExport}
                    className="export-search-filter-bar__export-btn"
                />
            )}

            {/* Search Input */}
            <div className="export-search-filter-bar__search">
                <InputGroup
                    placeholder={searchPlaceholder}
                    onChange={(e) => onSearch && onSearch(e.target.value)}
                    leadingVisual={{ type: 'icon', icon: 'fa-solid fa-magnifying-glass' }}
                    size="small"
                    className="export-search-filter-bar__search-input-group"
                />
            </div>

            {/* Filters and sort */}
            <div className="export-search-filter-bar__filters">
                {filters.map((filter) => {
                    const picked = selectedFilters?.[filter.key];
                    return (
                        <FilterSelect
                            key={filter.key}
                            aria-label={filter.label}
                            mode={filter.mode || 'single'}
                            placeholder={filter.placeholder}
                            options={filter.options}
                            value={onFilterChange ? (picked ?? emptyFor(filter)) : undefined}
                            defaultValue={picked ?? emptyFor(filter)}
                            onChange={onFilterChange ? (next) => onFilterChange(filter.key, next) : undefined}
                        />
                    );
                })}
                {sortOptions.length > 0 && (
                    <FilterSelect
                        aria-label="Sort"
                        clearable={false}
                        options={sortOptions}
                        value={onSort ? (sortBy ?? sortOptions[0].value) : undefined}
                        defaultValue={sortBy ?? sortOptions[0].value}
                        onChange={onSort}
                    />
                )}
            </div>
        </div>
    );
};

ExportSearchFilterBar.propTypes = {
    /** Export button label */
    exportLabel: PropTypes.string,
    /** Search input placeholder */
    searchPlaceholder: PropTypes.string,
    /** Filters: `label` names the field, `placeholder` is its "all" reading */
    filters: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            placeholder: PropTypes.string,
            mode: PropTypes.oneOf(['single', 'multi']),
            options: PropTypes.arrayOf(PropTypes.shape({
                value: PropTypes.string.isRequired,
                label: PropTypes.string.isRequired,
            })).isRequired,
        })
    ),
    /** Picked values by filter key: an id, or ids for a multi filter */
    selectedFilters: PropTypes.object,
    /** Sort options; pass `[]` for no sort */
    sortOptions: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
    })),
    /** The picked sort id */
    sortBy: PropTypes.string,
    /** Callback when Export is clicked */
    onExport: PropTypes.func,
    /** Callback when search value changes */
    onSearch: PropTypes.func,
    /** `(key, value)` when a filter applies */
    onFilterChange: PropTypes.func,
    /** `(sortId)` when the sort changes */
    onSort: PropTypes.func,
    /** Whether to hide the export button */
    hideExport: PropTypes.bool,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default ExportSearchFilterBar;
