/**
 * TutorsPerformanceTable Component
 * 
 * Table displaying tutor performance data: Tutor Name, Signed-Up, % Attendance, Sessions, Students.
 * Color-coded attendance badges (≥80% green, 50-79% yellow, <50% red).
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-262435
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'react-bootstrap';
import Badge from '../../../../../components/Badge/Badge';
import './TutorsPerformanceTable.scss';

/**
 * Get badge style based on percentage value
 * ≥80% → success (green)
 * 50-79% → warning (yellow)
 * <50% → danger (red)
 */
const getAttendanceStyle = (value) => {
    if (!value || value === 'Null') return 'secondary';
    const numValue = parseInt(value);
    if (numValue >= 80) return 'success';
    if (numValue >= 50) return 'warning';
    return 'danger';
};

const TutorsPerformanceTable = ({
    tutors = [],
    sortable = true,
    sortColumn = 'tutorName',
    sortDirection = 'asc',
    onSort,
    onRowClick,
    className = '',
    ...props
}) => {
    // Column definitions
    const columns = [
        { key: 'tutorName', label: 'Tutor Name', sortable: true },
        { key: 'signedUp', label: 'Signed-Up', sortable: false },
        { key: 'attendance', label: '% Attendance', sortable: true },
        { key: 'sessions', label: 'Sessions', sortable: true },
        { key: 'students', label: 'Students', sortable: true },
    ];

    // Default sample data
    const defaultTutors = [
        { id: 1, tutorName: 'Amelia Blue', signedUp: 'Yes', attendance: 92, sessions: 25, students: 18, badge: null },
        { id: 2, tutorName: 'Ava Silver', signedUp: 'Yes', attendance: 22, sessions: 34, students: 12, badge: null },
        { id: 3, tutorName: 'Elijah Orange', signedUp: 'Yes', attendance: 68, sessions: 22, students: 7, badge: null },
        { id: 4, tutorName: 'Ethan Black', signedUp: 'Yes', attendance: 49, sessions: 65, students: 5, badge: null },
        { id: 5, tutorName: 'Ethan Cole', signedUp: 'Yes', attendance: 90, sessions: 52, students: 21, badge: 'Lead' },
        { id: 6, tutorName: 'Floyd Miles', signedUp: 'No', attendance: null, sessions: null, students: 13, badge: null },
        { id: 7, tutorName: 'Hannah Brown', signedUp: 'Yes', attendance: 94, sessions: 54, students: 7, badge: null },
        { id: 8, tutorName: 'Henry Gold', signedUp: 'Yes', attendance: 92, sessions: 33, students: 10, badge: null },
        { id: 9, tutorName: 'Liam Brown', signedUp: 'Yes', attendance: 50, sessions: 3, students: 8, badge: null },
    ];

    const displayTutors = tutors.length > 0 ? tutors : defaultTutors;

    const handleSort = (columnKey) => {
        if (sortable && onSort) {
            onSort(columnKey);
        }
    };

    const renderSortIcon = (columnKey) => {
        if (!sortable) return null;
        const isActive = sortColumn === columnKey;
        return (
            <i
                className={`fas fa-arrow-up tutors-performance-table__sort-icon ${isActive ? 'tutors-performance-table__sort-icon--active' : ''}`}
            />
        );
    };

    return (
        <div className={`tutors-performance-table ${className}`} {...props}>
            <Table hover className="tutors-performance-table__table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                onClick={() => col.sortable && handleSort(col.key)}
                                className={`tutors-performance-table__th ${col.sortable ? 'tutors-performance-table__th--sortable' : ''} ${sortColumn === col.key ? 'tutors-performance-table__th--active' : ''}`}
                            >
                                <div className="tutors-performance-table__th-content">
                                    <span className="body3-txt">{col.label}</span>
                                    {col.sortable && renderSortIcon(col.key)}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {displayTutors.map((tutor) => (
                        <tr
                            key={tutor.id}
                            onClick={() => onRowClick && onRowClick(tutor)}
                            className={onRowClick ? 'tutors-performance-table__row--clickable' : ''}
                        >
                            <td>
                                <div className="tutors-performance-table__tutor-cell">
                                    <span className="body3-txt">{tutor.tutorName}</span>
                                    {tutor.badge && (
                                        <Badge style="info" size="b3">
                                            {tutor.badge}
                                        </Badge>
                                    )}
                                </div>
                            </td>
                            <td>
                                <Badge
                                    style={tutor.signedUp === 'Yes' ? 'info' : 'secondary'}
                                    size="b3"
                                >
                                    {tutor.signedUp}
                                </Badge>
                            </td>
                            <td>
                                {tutor.attendance !== null ? (
                                    <Badge style={getAttendanceStyle(tutor.attendance)} size="b3">
                                        {tutor.attendance}%
                                    </Badge>
                                ) : (
                                    <Badge style="secondary" size="b3">Null</Badge>
                                )}
                            </td>
                            <td>
                                {tutor.sessions !== null ? (
                                    <Badge style="secondary" size="b3">{tutor.sessions}</Badge>
                                ) : (
                                    <Badge style="secondary" size="b3">Null</Badge>
                                )}
                            </td>
                            <td>
                                {tutor.students !== null ? (
                                    <Badge style="secondary" size="b3">{tutor.students}</Badge>
                                ) : (
                                    <Badge style="secondary" size="b3">Null</Badge>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>


        </div>
    );
};

TutorsPerformanceTable.propTypes = {
    /** Array of tutor objects */
    tutors: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        tutorName: PropTypes.string,
        signedUp: PropTypes.string,
        attendance: PropTypes.number,
        sessions: PropTypes.number,
        students: PropTypes.number,
        badge: PropTypes.string,
    })),
    /** Enable column sorting */
    sortable: PropTypes.bool,
    /** Currently sorted column key */
    sortColumn: PropTypes.string,
    /** Sort direction */
    sortDirection: PropTypes.oneOf(['asc', 'desc']),
    /** Callback when sort changes */
    onSort: PropTypes.func,
    /** Callback when row is clicked */
    onRowClick: PropTypes.func,

    /** Additional CSS classes */
    className: PropTypes.string,
};

export default TutorsPerformanceTable;
