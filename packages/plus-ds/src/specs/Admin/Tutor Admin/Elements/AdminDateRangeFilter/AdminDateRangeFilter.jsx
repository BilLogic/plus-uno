/**
 * AdminDateRangeFilter Component
 * 
 * Shared date range filter component used across all Admin sections.
 * Shows: School dropdown, Tutor dropdown, and date range (from/to).
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-262321
 */

import React from 'react';
import PropTypes from 'prop-types';
import Dropdown from '../../../../../components/Dropdown/Dropdown';
import './AdminDateRangeFilter.scss';

const AdminDateRangeFilter = ({
    selectedSchool = 'All Schools',
    selectedTutor = 'All Tutors',
    dateFrom = '01/10/25',
    dateTo = '02/10/25',
    schoolOptions = [
        { text: 'All Schools', onClick: () => { } },
        { text: 'Lincoln High School', onClick: () => { } },
        { text: 'Washington Middle School', onClick: () => { } },
        { text: 'Jefferson Elementary', onClick: () => { } }
    ],
    tutorOptions = [
        { text: 'All Tutors', onClick: () => { } },
        { text: 'John Smith', onClick: () => { } },
        { text: 'Jane Doe', onClick: () => { } },
        { text: 'Mike Johnson', onClick: () => { } }
    ],
    dateFromOptions = [
        { text: '01/10/25', onClick: () => { } },
        { text: '12/01/24', onClick: () => { } },
        { text: '11/01/24', onClick: () => { } }
    ],
    dateToOptions = [
        { text: '02/10/25', onClick: () => { } },
        { text: '12/31/24', onClick: () => { } },
        { text: '11/30/24', onClick: () => { } }
    ],
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
                <Dropdown
                    buttonText={selectedSchool}
                    items={schoolOptions}
                    style="secondary"
                    fill="ghost"
                    size="small"
                    className="admin-date-range-filter__dropdown"
                />
                <Dropdown
                    buttonText={selectedTutor}
                    items={tutorOptions}
                    style="secondary"
                    fill="ghost"
                    size="small"
                    className="admin-date-range-filter__dropdown"
                />
            </div>

            {/* Date Range */}
            <div className="admin-date-range-filter__date-range">
                <Dropdown
                    buttonText={dateFrom}
                    items={dateFromOptions}
                    style="primary"
                    fill="outline"
                    size="small"
                    className="admin-date-range-filter__date-button"
                />
                <span className="body2-txt admin-date-range-filter__separator">to</span>
                <Dropdown
                    buttonText={dateTo}
                    items={dateToOptions}
                    style="primary"
                    fill="outline"
                    size="small"
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
    /** School dropdown options */
    schoolOptions: PropTypes.arrayOf(PropTypes.shape({
        text: PropTypes.string,
        onClick: PropTypes.func
    })),
    /** Tutor dropdown options */
    tutorOptions: PropTypes.arrayOf(PropTypes.shape({
        text: PropTypes.string,
        onClick: PropTypes.func
    })),
    /** Date from dropdown options */
    dateFromOptions: PropTypes.arrayOf(PropTypes.shape({
        text: PropTypes.string,
        onClick: PropTypes.func
    })),
    /** Date to dropdown options */
    dateToOptions: PropTypes.arrayOf(PropTypes.shape({
        text: PropTypes.string,
        onClick: PropTypes.func
    })),
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
