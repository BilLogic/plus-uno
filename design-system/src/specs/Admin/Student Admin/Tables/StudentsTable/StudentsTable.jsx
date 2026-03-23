/**
 * StudentsTable Component
 * 
 * Table showing student details with columns: Student, School, Teacher, Latest Status, Action
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=999-108965
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'react-bootstrap';
import Button from '../../../../../components/Button/Button';
import Badge from '../../../../../components/Badge/Badge';
import './StudentsTable.scss';

const StudentsTable = ({
    students = [],
    sortable = true,
    hover = true,
    onViewGoalsClick,
    onStudentClick,
    className = '',
    ...props
}) => {
    const headers = [
        { text: 'Student', sortable, active: true },
        { text: 'School', sortable },
        { text: 'Teacher', sortable },
        { text: 'Latest Status', sortable },
        { text: 'Action', sortable: false },
    ];

    // Default 9 rows data matching Figma design
    const defaultStudents = [
        { id: 1, name: 'Jose Dolus', school: 'Langley', teacher: 'Jose Mura', status: 'Needs to set goals' },
        { id: 2, name: 'Chris Hudson', school: 'Langley', teacher: 'Ruth Perez', status: 'Needs to set goals' },
        { id: 3, name: 'Irene White', school: 'Langley', teacher: 'Ruth Perez', status: 'Needs to set goals' },
        { id: 4, name: 'Jacqueline Traine', school: 'Langley', teacher: 'Erin Hunter', status: 'Needs to set goals' },
        { id: 5, name: 'Jerome Brown', school: 'Langley', teacher: 'Katie Strong', status: 'Needs to set goals' },
        { id: 6, name: 'Jose Darrell', school: 'Langley', teacher: 'Tisha Bryan', status: 'Needs to set goals' },
        { id: 7, name: 'Joy Jones', school: 'Langley', teacher: 'Aaron Zhang', status: 'Needs to set goals' },
        { id: 8, name: 'Ksenia Gato', school: 'Langley', teacher: 'Ruth Perez', status: 'Needs to set goals' },
        { id: 9, name: 'Lesley Mora', school: 'Langley', teacher: 'Tisha Bryan', status: 'Needs to set goals' },
    ];

    const displayStudents = students.length > 0 ? students : defaultStudents;

    const handleViewGoalsClick = (student, e) => {
        e.stopPropagation();
        if (onViewGoalsClick) {
            onViewGoalsClick(student);
        }
    };

    const handleStudentClick = (student) => {
        if (onStudentClick) {
            onStudentClick(student);
        }
    };

    return (
        <div className={`students-table-wrapper ${className}`} {...props}>
            <Table className="students-table">
                <thead>
                    <tr className="students-table__header">
                        {headers.map((header, index) => (
                            <th
                                key={index}
                                className="students-table__header-cell"
                            >
                                <div className="students-table__header-content">
                                    <span
                                        className="body3-txt"
                                        style={{
                                            color: header.active
                                                ? 'var(--color-secondary-text)'
                                                : 'var(--color-on-surface)',
                                            fontWeight: 400
                                        }}
                                    >
                                        {header.text}
                                    </span>
                                    {header.sortable && (
                                        <i
                                            className="fas fa-arrow-up"
                                            style={{
                                                fontSize: '10px',
                                                color: header.active
                                                    ? 'var(--color-secondary)'
                                                    : 'var(--color-outline-variant)',
                                                lineHeight: '2'
                                            }}
                                        />
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {displayStudents.map((student, rowIndex) => (
                        <tr
                            key={student.id || rowIndex}
                            className={`students-table__row ${hover ? 'students-table__row--hover' : ''}`}
                            onClick={() => handleStudentClick(student)}
                            style={{ cursor: onStudentClick ? 'pointer' : 'default' }}
                        >
                            {/* Student Name column */}
                            <td className="students-table__cell students-table__cell--name">
                                <span
                                    className="body3-txt"
                                    style={{
                                        fontWeight: 400,
                                        color: 'var(--color-on-surface)'
                                    }}
                                >
                                    {student.name}
                                </span>
                            </td>

                            {/* School column */}
                            <td className="students-table__cell students-table__cell--school">
                                <span
                                    className="body3-txt"
                                    style={{
                                        fontWeight: 300,
                                        color: 'var(--color-on-surface)'
                                    }}
                                >
                                    {student.school}
                                </span>
                            </td>

                            {/* Teacher column */}
                            <td className="students-table__cell students-table__cell--teacher">
                                <span
                                    className="body3-txt"
                                    style={{
                                        fontWeight: 300,
                                        color: 'var(--color-on-surface)'
                                    }}
                                >
                                    {student.teacher}
                                </span>
                            </td>

                            {/* Latest Status column */}
                            <td className="students-table__cell students-table__cell--status">
                                <Badge
                                    style="info"
                                    size="b3"
                                    className="students-table__status-badge"
                                >
                                    {student.status}
                                </Badge>
                            </td>

                            {/* Action column */}
                            <td className="students-table__cell students-table__cell--action">
                                <Button
                                    text="View goals"
                                    style="primary"
                                    fill="text"
                                    size="small"
                                    onClick={(e) => handleViewGoalsClick(student, e)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

StudentsTable.propTypes = {
    /** Array of student objects */
    students: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        school: PropTypes.string,
        teacher: PropTypes.string,
        status: PropTypes.string,
    })),
    /** Enable sortable columns */
    sortable: PropTypes.bool,
    /** Enable row hover effects */
    hover: PropTypes.bool,
    /** Callback when View goals button is clicked */
    onViewGoalsClick: PropTypes.func,
    /** Callback when a student row is clicked */
    onStudentClick: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default StudentsTable;
