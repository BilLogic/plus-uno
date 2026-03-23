/**
 * SessionBreakdownTable Component
 * 
 * Table displaying session breakdown data: Student Name, Student Status, 
 * Tutor Name, Tutor Type, Time Spent (Mins).
 * Used inside the SessionModal component.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=987-127671
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'react-bootstrap';
import Badge from '../../../../../components/Badge/Badge';
import './SessionBreakdownTable.scss';

const SessionBreakdownTable = ({
    students = [],
    sortable = true,
    sortColumn = 'tutorName',
    sortDirection = 'asc',
    onSort,
    className = '',
    ...props
}) => {
    // Column definitions
    const columns = [
        { key: 'studentName', label: 'Student Name', sortable: true },
        { key: 'studentStatus', label: 'Student Status', sortable: true },
        { key: 'tutorName', label: 'Tutor Name', sortable: true },
        { key: 'tutorType', label: 'Tutor Type', sortable: true },
        { key: 'timeSpent', label: 'Time Spent (Mins)', sortable: true },
    ];

    // Default sample data matching Figma
    const defaultStudents = [
        { id: 1, studentName: 'Amanda Novak', studentStatus: 'Needs to set goals', tutorName: 'Ethan Cole', tutorType: 'Lead', timeSpent: 11 },
        { id: 2, studentName: 'Ashley Brown', studentStatus: 'Needs to set goals', tutorName: 'Martha Dunn', tutorType: 'Regular', timeSpent: 8 },
        { id: 3, studentName: 'Frank Bass', studentStatus: 'Needs to set goals', tutorName: 'Martha Dunn', tutorType: 'Regular', timeSpent: 11 },
        { id: 4, studentName: 'Henry Hamm', studentStatus: 'Needs to set goals', tutorName: 'Martha Dunn', tutorType: 'Regular', timeSpent: 15 },
        { id: 5, studentName: 'Jose Green', studentStatus: 'Needs to set goals', tutorName: 'Ethan Cole', tutorType: 'Lead', timeSpent: 10 },
        { id: 6, studentName: 'Miles Hazel', studentStatus: 'Needs to set goals', tutorName: 'Ethan Cole', tutorType: 'Lead', timeSpent: 14 },
        { id: 7, studentName: 'Olga Petra', studentStatus: 'Needs to set goals', tutorName: 'Martha Dunn', tutorType: 'Regular', timeSpent: 3 },
        { id: 8, studentName: 'Pete Smith', studentStatus: 'Needs to set goals', tutorName: 'Martha Dunn', tutorType: 'Regular', timeSpent: 4 },
        { id: 9, studentName: 'Sam Morales', studentStatus: 'Needs to set goals', tutorName: 'Martha Dunn', tutorType: 'Regular', timeSpent: 11 },
    ];

    const displayStudents = students.length > 0 ? students : defaultStudents;

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
                className={`fas fa-arrow-up session-breakdown-table__sort-icon ${isActive ? 'session-breakdown-table__sort-icon--active' : ''}`}
            />
        );
    };

    const getTutorTypeBadgeStyle = (type) => {
        return type === 'Lead' ? 'info' : 'secondary';
    };

    return (
        <div className={`session-breakdown-table ${className}`} {...props}>
            <Table className="session-breakdown-table__table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th 
                                key={col.key}
                                onClick={() => col.sortable && handleSort(col.key)}
                                className={`session-breakdown-table__th ${col.sortable ? 'session-breakdown-table__th--sortable' : ''} ${sortColumn === col.key ? 'session-breakdown-table__th--active' : ''}`}
                            >
                                <div className="session-breakdown-table__th-content">
                                    <span className="body3-txt">{col.label}</span>
                                    {col.sortable && renderSortIcon(col.key)}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {displayStudents.map((student) => (
                        <tr key={student.id}>
                            <td>
                                <span className="body3-txt">{student.studentName}</span>
                            </td>
                            <td>
                                <Badge style="info" size="b3">
                                    {student.studentStatus}
                                </Badge>
                            </td>
                            <td>
                                <span className="body3-txt">{student.tutorName}</span>
                            </td>
                            <td>
                                <Badge style={getTutorTypeBadgeStyle(student.tutorType)} size="b3">
                                    {student.tutorType}
                                </Badge>
                            </td>
                            <td>
                                <span className="body3-txt">{student.timeSpent}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

SessionBreakdownTable.propTypes = {
    /** Array of student breakdown objects */
    students: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        studentName: PropTypes.string,
        studentStatus: PropTypes.string,
        tutorName: PropTypes.string,
        tutorType: PropTypes.oneOf(['Lead', 'Regular']),
        timeSpent: PropTypes.number,
    })),
    /** Enable column sorting */
    sortable: PropTypes.bool,
    /** Currently sorted column key */
    sortColumn: PropTypes.string,
    /** Sort direction */
    sortDirection: PropTypes.oneOf(['asc', 'desc']),
    /** Callback when sort changes */
    onSort: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default SessionBreakdownTable;
