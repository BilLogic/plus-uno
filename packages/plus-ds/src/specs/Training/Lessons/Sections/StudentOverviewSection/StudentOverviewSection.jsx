/**
 * StudentOverviewSection Component
 * 
 * Section with "My Students" title, "View All" button, and student table.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=686-296266
 */

import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Button';
import Table from '@/components/Table';
import { StaticBadgeSmart } from '@/components/StaticBadgeSmart';
import './StudentOverviewSection.scss';

const StudentOverviewSection = ({
    students = [],
    onViewAll,
    className = '',
    ...props
}) => {
    // Default sample data
    const defaultStudents = [
        { id: 1, name: 'Hermione Granger', status: 'Needs Motivation', focusArea: null },
        { id: 2, name: 'Ron Weasley', status: 'Needs Motivation', focusArea: null },
        { id: 3, name: 'Harry Potter', status: 'Needs Motivation', focusArea: null },
        { id: 4, name: 'Luna Lovegood', status: 'Needs Motivation', focusArea: 'relationships' },
        { id: 5, name: 'Harry Potter', status: 'Needs Motivation', focusArea: 'advocacy' }
    ];

    const displayStudents = students.length > 0 ? students : defaultStudents;

    const tableHeaders = [
        { text: 'Student Name', key: 'name' },
        { text: 'Status', key: 'status' },
        { text: 'Focus Area', key: 'focusArea' }
    ];

    const tableRows = displayStudents.map(student => ({
        name: <span className="body2-txt">{student.name}</span>,
        status: <span className="body2-txt">{student.status}</span>,
        focusArea: student.focusArea ? (
            <StaticBadgeSmart type={student.focusArea} size="b3" />
        ) : (
            <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>—</span>
        )
    }));

    return (
        <section className={`student-overview-section ${className}`} {...props}>
            {/* Title row */}
            <div className="student-overview-section__header">
                <h4 className="student-overview-section__title h4">
                    My Students
                </h4>
                <Button
                    text="View All"
                    style="primary"
                    fill="ghost"
                    size="small"
                    onClick={onViewAll}
                />
            </div>

            {/* Table */}
            <div className="student-overview-section__table-wrapper">
                <Table
                    headers={tableHeaders}
                    rows={tableRows}
                    hover
                    className="student-overview-section__table"
                />
            </div>
        </section>
    );
};

StudentOverviewSection.propTypes = {
    /** Array of student objects */
    students: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        status: PropTypes.string,
        focusArea: PropTypes.oneOf([
            'socio-emotional',
            'mastering-content',
            'advocacy',
            'relationships',
            'technology-tools'
        ])
    })),
    /** View All button click handler */
    onViewAll: PropTypes.func,
    /** Additional CSS class */
    className: PropTypes.string,
};

export default StudentOverviewSection;
