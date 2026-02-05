/**
 * LessonsTable Component
 * 
 * Data table for displaying lessons with expandable rows.
 * Matches Figma design: node-id=63-178095
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Table } from 'react-bootstrap';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import Progress from '@/components/Progress';
import { StaticBadgeSmart } from '@/components/StaticBadgeSmart';
import AiIndicator from '../../Elements/AiIndicator/AiIndicator';
import StatusIndicators from '../../../onboarding/Elements/StatusIndicators/StatusIndicators';
import './LessonsTable.scss';

const LessonsTable = ({
    lessons = [],
    onLessonContinue,
    onLessonAction,
    onLessonClick,
    className = '',
    style,
    showProgress = false,
    usePills = false,
    sortable = true,
    headless = false
}) => {
    const [expandedRows, setExpandedRows] = useState(() => {
        const initial = new Set();
        lessons.forEach((l, i) => {
            if (l.expanded) initial.add(l.id || i);
        });
        return initial;
    });

    const toggleRow = (lessonId, e) => {
        e?.stopPropagation();
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(lessonId)) {
                next.delete(lessonId);
            } else {
                next.add(lessonId);
            }
            return next;
        });
    };

    const headers = [
        { key: 'lesson', text: 'Lesson', width: '35%' },
        { key: 'competency', text: 'Competency Area', width: '20%' },
        { key: 'status', text: 'Status', width: '15%', align: 'center' },
        { key: 'duration', text: 'Duration', width: '15%' },
        ...(showProgress ? [{ key: 'progress', text: 'Progress', width: '15%' }] : []),
        { key: 'action', text: 'Actions', width: '15%' }
    ];

    const getStatusContent = (lesson) => {
        const { status } = lesson;

        if (usePills) {
            let badgeStyle = 'secondary';
            if (['completed', 'complete'].includes(status)) badgeStyle = 'success';
            else if (status === 'in-progress') badgeStyle = 'warning';
            else if (status === 'assigned') badgeStyle = 'info';

            const label = status === 'in-progress' ? 'In Progress' :
                status === 'not-started' ? 'Not Started' :
                    status.charAt(0).toUpperCase() + status.slice(1);

            return <Badge text={label} style={badgeStyle} size="b3" />;
        }

        // Map lesson status to StatusIndicators stage
        let stage = 'not started';
        if (['completed', 'complete'].includes(status)) {
            stage = 'completed';
        } else if (['in-progress', 'started'].includes(status)) {
            stage = 'in progress';
        }

        return (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <StatusIndicators stage={stage} size="medium" />
            </div>
        );
    };

    return (
        <div className={`lessons-table-wrapper ${className}`} style={style}>
            <Table className="lessons-table">
                <colgroup>
                    {headers.map((header) => (
                        <col key={header.key} style={{ width: header.width }} />
                    ))}
                </colgroup>
                {!headless && (
                    <thead>
                        <tr className="lessons-table__header">
                            {headers.map((header) => (
                                <th
                                    key={header.key}
                                    className={`lessons-table__header-cell ${header.align ? `lessons-table__header-cell--${header.align}` : ''}`}
                                    style={{ width: header.width }}
                                >
                                    <div className="lessons-table__header-content">
                                        <span className="body3-txt" style={{ color: 'var(--color-on-surface)' }}>
                                            {header.text}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                )}
                {lessons.map((lesson, index) => {
                    const lessonId = lesson.id || index;
                    const isExpanded = expandedRows.has(lessonId);
                    const isCompleted = ['completed', 'complete'].includes(lesson.status);
                    const groupStateClass = lesson.state ? `lessons-table__group--${lesson.state}` : '';

                    return (
                        <tbody
                            key={lessonId}
                            className={`lessons-table__group ${groupStateClass}`}
                        >
                            <tr
                                className={`lessons-table__row ${isExpanded ? 'lessons-table__row--expanded' : ''}`}
                                onClick={() => !['disabled', 'disable'].includes(lesson.state) && onLessonClick && onLessonClick(lesson)}
                            >
                                {/* Lesson Column */}
                                <td className="lessons-table__cell lessons-table__cell--lesson">
                                    <div className="lessons-table__lesson-wrapper">
                                        {lesson.description && (
                                            <button
                                                type="button"
                                                className="lessons-table__toggle"
                                                onClick={(e) => toggleRow(lessonId, e)}
                                            >
                                                <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'}`} />
                                            </button>
                                        )}
                                        <span className="body3-txt font-weight-semibold lesson-title">
                                            {lesson.title}
                                        </span>
                                        {lesson.showAiIndicator && <AiIndicator />}
                                    </div>
                                </td>

                                {/* Competency Column */}
                                <td className="lessons-table__cell">
                                    {lesson.competencyArea ? (
                                        <StaticBadgeSmart type={lesson.competencyArea} size="b3" />
                                    ) : (
                                        <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                                            {lesson.competency || 'N/A'}
                                        </span>
                                    )}
                                </td>

                                {/* Status Column */}
                                <td className="lessons-table__cell lessons-table__cell--center">
                                    {getStatusContent(lesson)}
                                </td>

                                {/* Duration Column */}
                                <td className="lessons-table__cell">
                                    <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                                        {lesson.duration}
                                    </span>
                                </td>

                                {/* Progress Column (Optional) */}
                                {showProgress && (
                                    <td className="lessons-table__cell">
                                        <div style={{ width: '100px' }}>
                                            <Progress value={lesson.progress || 0} size="small" />
                                        </div>
                                    </td>
                                )}

                                {/* Action Column */}
                                <td className="lessons-table__cell">
                                    {usePills ? (
                                        <button
                                            className="lessons-table__action-link"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onLessonAction?.(lesson);
                                            }}
                                        >
                                            {isCompleted ? 'Review' : 'Start'}
                                        </button>
                                    ) : (
                                        <Button
                                            text={
                                                ['completed', 'complete'].includes(lesson.status) ? 'Review' :
                                                    ['in-progress', 'started'].includes(lesson.status) ? 'Continue' :
                                                        'Start'
                                            }
                                            style="primary"
                                            fill="filled"
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onLessonContinue?.(lesson);
                                            }}
                                        />
                                    )}
                                </td>
                            </tr>

                            {/* Expanded Row */}
                            {
                                isExpanded && lesson.description && (
                                    <tr className="lessons-table__row-expanded-content">
                                        <td colSpan={headers.length} className="lessons-table__cell--expanded">
                                            <div className="lessons-table__description">
                                                <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                                                    {lesson.description}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            }
                        </tbody>
                    );
                })}
            </Table>
        </div >
    );
};

LessonsTable.propTypes = {
    lessons: PropTypes.arrayOf(PropTypes.object),
    onLessonContinue: PropTypes.func,
    onLessonAction: PropTypes.func,
    onLessonClick: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
    showProgress: PropTypes.bool,
    usePills: PropTypes.bool,
    sortable: PropTypes.bool
};

export default LessonsTable;
