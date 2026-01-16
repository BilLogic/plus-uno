/**
 * TutorSessionsTable Component
 * 
 * Table displaying tutor session details: Day/Date, Shift time, and School.
 * Matches Figma: node-id=1013-81141
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'react-bootstrap';
import Badge from '../../../../../components/Badge/Badge';
import './TutorSessionsTable.scss';

const TutorSessionsTable = ({
    sessions = [],
    sortable = true,
    sortColumn = 'day',
    sortDirection = 'asc',
    onSort,
    onRowClick,
    className = '',
    ...props
}) => {
    const columns = [
        { key: 'day', label: 'Day (Date)', sortable: true },
        { key: 'shift', label: 'Shift (ET)', sortable: true },
        { key: 'school', label: 'School', sortable: true },
    ];

    const defaultSessions = [
        { id: 1, day: 'Mon (10/25/23)', shift: '3:00 PM - 4:00 PM', school: 'Lincoln High' },
        { id: 2, day: 'Wed (10/27/23)', shift: '3:00 PM - 4:00 PM', school: 'Lincoln High' },
        { id: 3, day: 'Fri (10/29/23)', shift: '3:00 PM - 4:00 PM', school: 'Lincoln High' },
        { id: 4, day: 'Mon (11/01/23)', shift: '3:00 PM - 4:00 PM', school: 'Washington Mid' },
        { id: 5, day: 'Wed (11/03/23)', shift: '3:00 PM - 4:00 PM', school: 'Washington Mid' },
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
                className={`fas fa-arrow-up tutor-sessions-table__sort-icon ${isActive ? 'tutor-sessions-table__sort-icon--active' : ''}`}
            />
        );
    };

    return (
        <div className={`tutor-sessions-table ${className}`} {...props}>
            <Table hover className="tutor-sessions-table__table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                onClick={() => col.sortable && handleSort(col.key)}
                                className={`tutor-sessions-table__th ${col.sortable ? 'tutor-sessions-table__th--sortable' : ''} ${sortColumn === col.key ? 'tutor-sessions-table__th--active' : ''}`}
                            >
                                <div className="tutor-sessions-table__th-content">
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
                            className={onRowClick ? 'tutor-sessions-table__row--clickable' : ''}
                        >
                            <td>
                                <span className="body3-txt">{session.day}</span>
                            </td>
                            <td>
                                <span className="body3-txt">{session.shift}</span>
                            </td>
                            <td>
                                <Badge style="secondary" size="b3">{session.school}</Badge>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

TutorSessionsTable.propTypes = {
    sessions: PropTypes.array,
    sortable: PropTypes.bool,
    sortColumn: PropTypes.string,
    sortDirection: PropTypes.string,
    onSort: PropTypes.func,
    onRowClick: PropTypes.func,
    className: PropTypes.string
};

export default TutorSessionsTable;
