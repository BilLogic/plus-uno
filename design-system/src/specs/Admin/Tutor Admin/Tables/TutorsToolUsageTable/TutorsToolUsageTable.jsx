/**
 * TutorsToolUsageTable Component
 * 
 * Table displaying tool usage stats: %Recording, %Reflection, etc.
 * Matches Figma: node-id=1013-81092
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'react-bootstrap';
import Badge from '../../../../../components/Badge/Badge';
import './TutorsToolUsageTable.scss';

const TutorsToolUsageTable = ({
    tutors = [],
    sortable = true,
    sortColumn = 'tutorName',
    sortDirection = 'asc',
    onSort,
    onRowClick,
    className = '',
    ...props
}) => {
    const columns = [
        { key: 'tutorName', label: 'Tutor Name', sortable: true },
        { key: 'recording', label: '%Recording', sortable: true },
        { key: 'reflection', label: '%Reflection', sortable: true },
        { key: 'attendanceTracking', label: '% Attendance Tracking', sortable: true },
        { key: 'goalChecking', label: '% Goal Checking', sortable: true },
    ];

    const defaultTutors = [
        { id: 1, tutorName: 'Floyd Miles', recording: null, reflection: null, attendanceTracking: 20, goalChecking: null },
        { id: 2, tutorName: 'Floyd Miles', recording: null, reflection: null, attendanceTracking: 20, goalChecking: null },
        { id: 3, tutorName: 'Floyd Miles', recording: null, reflection: null, attendanceTracking: 20, goalChecking: null },
        { id: 4, tutorName: 'Floyd Miles', recording: null, reflection: null, attendanceTracking: 20, goalChecking: null },
        { id: 5, tutorName: 'Floyd Miles', recording: null, reflection: null, attendanceTracking: 20, goalChecking: null },
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
                className={`fas fa-arrow-up tutors-tool-usage-table__sort-icon ${isActive ? 'tutors-tool-usage-table__sort-icon--active' : ''}`}
            />
        );
    };

    const renderBadge = (value) => {
        if (value === null || value === undefined || value === 'Null' || value === 'null') {
            return <Badge style="secondary" size="b3">Null</Badge>;
        }
        const displayVal = typeof value === 'number' ? `${value}%` : value;
        return <Badge style="secondary" size="b3">{displayVal}</Badge>;
    };

    return (
        <div className={`tutors-tool-usage-table ${className}`} {...props}>
            <Table hover className="tutors-tool-usage-table__table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                onClick={() => col.sortable && handleSort(col.key)}
                                className={`tutors-tool-usage-table__th ${col.sortable ? 'tutors-tool-usage-table__th--sortable' : ''} ${sortColumn === col.key ? 'tutors-tool-usage-table__th--active' : ''}`}
                            >
                                <div className="tutors-tool-usage-table__th-content">
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
                            className={onRowClick ? 'tutors-tool-usage-table__row--clickable' : ''}
                        >
                            <td>
                                <div className="tutors-tool-usage-table__tutor-cell">
                                    <span className="body3-txt">{tutor.tutorName}</span>
                                </div>
                            </td>
                            <td>{renderBadge(tutor.recording)}</td>
                            <td>{renderBadge(tutor.reflection)}</td>
                            <td>{renderBadge(tutor.attendanceTracking)}</td>
                            <td>{renderBadge(tutor.goalChecking)}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

TutorsToolUsageTable.propTypes = {
    tutors: PropTypes.array,
    sortable: PropTypes.bool,
    sortColumn: PropTypes.string,
    sortDirection: PropTypes.string,
    onSort: PropTypes.func,
    onRowClick: PropTypes.func,
    className: PropTypes.string
};

export default TutorsToolUsageTable;
