/**
 * AdminDateRangeFilter Component
 * 
 * Shared date range filter component used across all Admin sections.
 * Shows: School dropdown, Tutor dropdown, and date range (from/to).
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-262321
 */

import React from 'react';
import PropTypes from 'prop-types';
import Button from '../../../../components/Button';
import './AdminDateRangeFilter.scss';

const AdminDateRangeFilter = ({
    selectedSchool = 'All Schools',
    selectedTutor = 'All Tutors',
    dateFrom = '01/10/25',
    dateTo = '02/10/25',
    onSchoolChange,
    onTutorChange,
    onDateFromChange,
    onDateToChange,
    className = '',
    ...props
}) => {
    return (
        <div className={`admin-date-range-filter ${className}`} {...props}>
            {/* School & Tutor Filters */}
            <div className="admin-date-range-filter__dropdowns">
                <Button
                    text={selectedSchool}
                    style="secondary"
                    fill="text"
                    size="small"
                    trailingVisual="caret-down"
                    onClick={onSchoolChange}
                    className="admin-date-range-filter__dropdown"
                />
                <Button
                    text={selectedTutor}
                    style="secondary"
                    fill="text"
                    size="small"
                    trailingVisual="caret-down"
                    onClick={onTutorChange}
                    className="admin-date-range-filter__dropdown"
                />
            </div>

            {/* Date Range */}
            <div className="admin-date-range-filter__date-range">
                <Button
                    text={dateFrom}
                    style="primary"
                    fill="outlined"
                    size="small"
                    trailingVisual="caret-down"
                    onClick={onDateFromChange}
                    className="admin-date-range-filter__date-button"
                />
                <span className="body2-txt admin-date-range-filter__separator">to</span>
                <Button
                    text={dateTo}
                    style="primary"
                    fill="outlined"
                    size="small"
                    trailingVisual="caret-down"
                    onClick={onDateToChange}
                    className="admin-date-range-filter__date-button"
                />
            </div>
        </div>
    );
};

AdminDateRangeFilter.propTypes = {
    /** Selected school filter */
    selectedSchool: PropTypes.string,
    /** Selected tutor filter */
    selectedTutor: PropTypes.string,
    /** From date */
    dateFrom: PropTypes.string,
    /** To date */
    dateTo: PropTypes.string,
    /** Callback when school changes */
    onSchoolChange: PropTypes.func,
    /** Callback when tutor changes */
    onTutorChange: PropTypes.func,
    /** Callback when from date changes */
    onDateFromChange: PropTypes.func,
    /** Callback when to date changes */
    onDateToChange: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default AdminDateRangeFilter;
