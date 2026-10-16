/**
 * AdminDateRangeFilter Component
 *
 * Shared filter bar used across all Admin sections: a school, a tutor, and a
 * date range (from/to). Each is a small single Select; an admin view scopes to
 * one school and one tutor at a time, and "All" is the widest scope.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-262321
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Select } from '@/components';
import './AdminDateRangeFilter.scss';

/** Options are their own labels, so the selected string is the value. */
const toOptions = (labels) => labels.map((label) => ({ value: label, label }));

/**
 * A field the page controls once it listens for changes; until then, the
 * field keeps its own pick, so a static page still responds.
 */
const FilterField = ({ label, value, options, onChange, className }) => (
    <Select
        aria-label={label}
        clearable={false}
        size="small"
        options={toOptions(options)}
        value={onChange ? value : undefined}
        defaultValue={value}
        onChange={onChange}
        className={className}
    />
);

FilterField.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.string).isRequired,
    onChange: PropTypes.func,
    className: PropTypes.string,
};

const AdminDateRangeFilter = ({
    selectedSchool = 'All Schools',
    selectedTutor = 'All Tutors',
    dateFrom = '01/10/25',
    dateTo = '02/10/25',
    schoolOptions = ['All Schools', 'Lincoln High School', 'Washington Middle School', 'Jefferson Elementary'],
    tutorOptions = ['All Tutors', 'John Smith', 'Jane Doe', 'Mike Johnson'],
    dateFromOptions = ['01/10/25', '12/01/24', '11/01/24'],
    dateToOptions = ['02/10/25', '12/31/24', '11/30/24'],
    onSchoolChange,
    onTutorChange,
    onDateFromChange,
    onDateToChange,
    className = '',
    ...props
}) => (
    <div className={`admin-date-range-filter ${className}`} {...props}>
        {/* School & Tutor Filters */}
        <div className="admin-date-range-filter__selects">
            <FilterField
                label="School"
                value={selectedSchool}
                options={schoolOptions}
                onChange={onSchoolChange}
                className="admin-date-range-filter__select"
            />
            {selectedTutor && (
                <FilterField
                    label="Tutor"
                    value={selectedTutor}
                    options={tutorOptions}
                    onChange={onTutorChange}
                    className="admin-date-range-filter__select"
                />
            )}
        </div>

        {/* Date Range */}
        <div className="admin-date-range-filter__date-range">
            <FilterField
                label="From date"
                value={dateFrom}
                options={dateFromOptions}
                onChange={onDateFromChange}
                className="admin-date-range-filter__date"
            />
            <span className="body2-txt admin-date-range-filter__separator">to</span>
            <FilterField
                label="To date"
                value={dateTo}
                options={dateToOptions}
                onChange={onDateToChange}
                className="admin-date-range-filter__date"
            />
        </div>
    </div>
);

AdminDateRangeFilter.propTypes = {
    /** Selected school; one of `schoolOptions` */
    selectedSchool: PropTypes.string,
    /** Selected tutor; one of `tutorOptions`. Pass `null` to hide the tutor field */
    selectedTutor: PropTypes.string,
    /** From date; one of `dateFromOptions` */
    dateFrom: PropTypes.string,
    /** To date; one of `dateToOptions` */
    dateTo: PropTypes.string,
    /** School names */
    schoolOptions: PropTypes.arrayOf(PropTypes.string),
    /** Tutor names */
    tutorOptions: PropTypes.arrayOf(PropTypes.string),
    /** From dates offered */
    dateFromOptions: PropTypes.arrayOf(PropTypes.string),
    /** To dates offered */
    dateToOptions: PropTypes.arrayOf(PropTypes.string),
    /** `(school)` when the school changes */
    onSchoolChange: PropTypes.func,
    /** `(tutor)` when the tutor changes */
    onTutorChange: PropTypes.func,
    /** `(date)` when the from date changes */
    onDateFromChange: PropTypes.func,
    /** `(date)` when the to date changes */
    onDateToChange: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default AdminDateRangeFilter;
