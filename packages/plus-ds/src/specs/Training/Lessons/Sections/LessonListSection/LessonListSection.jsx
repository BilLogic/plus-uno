/**
 * LessonListSection Component
 * 
 * "My Students" section displaying a table of students with status and focus areas.
 * Pixel-perfect implementation matching Figma node 686-296266.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'react-bootstrap';
import Button from '@/components/Button';
import { StaticBadgeSmart } from '@/components/StaticBadgeSmart';
import './LessonListSection.scss';

const LessonListSection = ({
    title = 'My Students',
    students = [],
    onViewAll,
    className = '',
    style,
    ...props
}) => {
    // Default student data matching Figma if none provided
    const displayStudents = students.length > 0 ? students : [
        { id: 1, name: 'Hermione Granger', status: 'Needs Motivation', focusArea: null },
        { id: 2, name: 'Ron Weasley', status: 'Needs Motivation', focusArea: null },
        { id: 3, name: 'Harry Potter', status: 'Needs Motivation', focusArea: null },
        { id: 4, name: 'Luna Lovegood', status: 'Needs Motivation', focusArea: 'relationships' },
        { id: 5, name: 'Draco Malfoy', status: 'Needs Motivation', focusArea: 'advocacy' }
    ];

    const SortIcon = () => (
        <i className="fa-solid fa-arrow-up-long lesson-list-section__sort-icon" aria-hidden="true" />
    );

    return (
        <section className={`lesson-list-section ${className}`} style={style} {...props}>
            <div className="lesson-list-section__card">
                <div className="lesson-list-section__header">
                    <h4 className="lesson-list-section__title h4">
                        {title}
                    </h4>
                    {onViewAll && (
                        <Button
                            text="View All"
                            style="primary"
                            fill="text"
                            size="small"
                            onClick={onViewAll}
                            className="lesson-list-section__view-all"
                        />
                    )}
                </div>

                <div className="lesson-list-section__table-container">
                    <Table className="lesson-list-section__table" hover={false}>
                        <thead>
                            <tr>
                                <th className="lesson-list-section__th">
                                    <div className="lesson-list-section__th-content">
                                        Name
                                        <SortIcon />
                                    </div>
                                </th>
                                <th className="lesson-list-section__th">
                                    <div className="lesson-list-section__th-content">
                                        Status
                                        <SortIcon />
                                    </div>
                                </th>
                                <th className="lesson-list-section__th">
                                    <div className="lesson-list-section__th-content">
                                        Focus Area
                                        <SortIcon />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayStudents.map((student) => (
                                <tr key={student.id} className="lesson-list-section__row">
                                    <td className="lesson-list-section__td lesson-list-section__td--name">
                                        <span className="body2-txt font-weight-medium">
                                            {student.name}
                                        </span>
                                    </td>
                                    <td className="lesson-list-section__td lesson-list-section__td--status">
                                        <span className="body2-txt lesson-list-section__status-text">
                                            {student.status}
                                        </span>
                                    </td>
                                    <td className="lesson-list-section__td lesson-list-section__td--focus">
                                        {student.focusArea ? (
                                            <StaticBadgeSmart type={student.focusArea} size="b3" />
                                        ) : (
                                            <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                                                —
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            </div>
        </section>
    );
};

LessonListSection.propTypes = {
    title: PropTypes.string,
    students: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        status: PropTypes.string,
        focusArea: PropTypes.string
    })),
    onViewAll: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default LessonListSection;
