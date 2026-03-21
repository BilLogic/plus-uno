/**
 * SessionsTable Component
 * 
 * Table displaying session data with metrics: Day, Shift, School, Teacher,
 * Attended students, Engaged student, Attended tutors, Completed Check-in.
 * Metrics use color-coded badges based on thresholds (≥80% green, 50-79% yellow, <50% red).
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=987-127618
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'react-bootstrap';
import Badge from '../../../../../components/Badge/Badge';
import './SessionsTable.scss';

/**
 * Get badge style based on percentage value
 * ≥80% → success (green)
 * 50-79% → warning (yellow)
 * <50% → danger (red)
 */
const getMetricStyle = (value) => {
    if (value >= 80) return 'success';
    if (value >= 50) return 'warning';
    return 'danger';
};

const SessionsTable = ({
    sessions = [],
    sortable = true,
    sortColumn = 'date',
    sortDirection = 'asc',
    hover = true,
    onRowClick,
    onSort,
    className = '',
    ...props
}) => {
    // Column definitions
    const columns = [
        { key: 'date', label: 'Day (Date)', sortable: true },
        { key: 'shift', label: 'Shift (ET)', sortable: true },
        { key: 'school', label: 'School', sortable: true },
        { key: 'teacher', label: 'Teacher', sortable: true },
        { key: 'attendedStudents', label: 'Attended students', sortable: true },
        { key: 'engagedStudent', label: 'Engaged student', sortable: true },
        { key: 'attendedTutors', label: 'Attended tutors', sortable: true },
        { key: 'completedCheckIn', label: 'Completed Check-in', sortable: true },
    ];

    // Default 9 rows of sample data
    const defaultSessions = [
        { id: 1, date: 'Mon (01/06/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 85, engagedStudent: 92, attendedTutors: 100, completedCheckIn: 88 },
        { id: 2, date: 'Tue (01/07/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 78, engagedStudent: 85, attendedTutors: 95, completedCheckIn: 82 },
        { id: 3, date: 'Wed (01/08/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 45, engagedStudent: 52, attendedTutors: 88, completedCheckIn: 48 },
        { id: 4, date: 'Thu (01/09/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 8, engagedStudent: 8, attendedTutors: 8, completedCheckIn: 8 },
        { id: 5, date: 'Fri (01/10/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 92, engagedStudent: 95, attendedTutors: 100, completedCheckIn: 90 },
        { id: 6, date: 'Mon (01/13/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 65, engagedStudent: 70, attendedTutors: 85, completedCheckIn: 68 },
        { id: 7, date: 'Tue (01/14/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 35, engagedStudent: 40, attendedTutors: 75, completedCheckIn: 38 },
        { id: 8, date: 'Wed (01/15/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 88, engagedStudent: 90, attendedTutors: 98, completedCheckIn: 85 },
        { id: 9, date: 'Thu (01/16/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 55, engagedStudent: 60, attendedTutors: 82, completedCheckIn: 58 },
    ];

    const displaySessions = sessions.length > 0 ? sessions : defaultSessions;

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
                className={`fas fa-arrow-up sessions-table__sort-icon ${isActive ? 'sessions-table__sort-icon--active' : ''}`}
            />
        );
    };

    const renderMetricCell = (value) => {
        const style = getMetricStyle(value);
        return (
            <Badge style={style} size="b3">
                {value}%
            </Badge>
        );
    };

    return (
        <div className={`sessions-table ${className}`} {...props}>
            <Table hover={hover} className="sessions-table__table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th 
                                key={col.key}
                                onClick={() => col.sortable && handleSort(col.key)}
                                className={`sessions-table__th ${col.sortable ? 'sessions-table__th--sortable' : ''} ${sortColumn === col.key ? 'sessions-table__th--active' : ''}`}
                            >
                                <div className="sessions-table__th-content">
                                    <span className="body3-txt">{col.label}</span>
                                    {col.sortable && renderSortIcon(col.key)}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {displaySessions.map((session) => (
                        <tr 
                            key={session.id}
                            onClick={() => onRowClick && onRowClick(session)}
                            className={onRowClick ? 'sessions-table__row--clickable' : ''}
                        >
                            <td>
                                <span className="body3-txt">{session.date}</span>
                            </td>
                            <td>
                                <span className="body3-txt">{session.shift}</span>
                            </td>
                            <td>
                                <Badge style="secondary" size="b3">
                                    {session.school}
                                </Badge>
                            </td>
                            <td>
                                <span className="body3-txt">{session.teacher}</span>
                            </td>
                            <td>{renderMetricCell(session.attendedStudents)}</td>
                            <td>{renderMetricCell(session.engagedStudent)}</td>
                            <td>{renderMetricCell(session.attendedTutors)}</td>
                            <td>{renderMetricCell(session.completedCheckIn)}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

SessionsTable.propTypes = {
    /** Array of session objects */
    sessions: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        date: PropTypes.string,
        shift: PropTypes.string,
        school: PropTypes.string,
        teacher: PropTypes.string,
        attendedStudents: PropTypes.number,
        engagedStudent: PropTypes.number,
        attendedTutors: PropTypes.number,
        completedCheckIn: PropTypes.number,
    })),
    /** Enable column sorting */
    sortable: PropTypes.bool,
    /** Currently sorted column key */
    sortColumn: PropTypes.string,
    /** Sort direction */
    sortDirection: PropTypes.oneOf(['asc', 'desc']),
    /** Enable row hover effect */
    hover: PropTypes.bool,
    /** Callback when row is clicked */
    onRowClick: PropTypes.func,
    /** Callback when sort changes */
    onSort: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default SessionsTable;
