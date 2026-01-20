/**
 * LessonsTable Component
 * 
 * Data table for displaying lessons with expandable rows.
 * Matches Figma design exactly: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-178095
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import Progress from '@/components/Progress';
import { StaticBadgeSmart } from '@/components/StaticBadgeSmart';
import AiIndicator from '../../Elements/AiIndicator/AiIndicator';
import './LessonsTable.scss';

// Status icon mapping
const statusIconMap = {
    'not-started': { icon: 'square-plus', size: 'small' },
    'in-progress': { icon: 'spinner', size: 'large' },
    'started': { icon: 'spinner', size: 'large' },
    'complete': { icon: 'circle-check', size: 'large' },
    'completed': { icon: 'circle-check', size: 'large' },
    'assigned': { icon: 'square-plus', size: 'small' }
};

// Status badge style mapping
const statusBadgeMap = {
    'completed': 'success',
    'complete': 'success',
    'in-progress': 'warning',
    'not-started': 'secondary',
    'assigned': 'info'
};

// Status label mapping
const statusLabelMap = {
    'completed': 'Completed',
    'complete': 'Completed',
    'in-progress': 'In Progress',
    'not-started': 'Not Started',
    'assigned': 'Assigned'
};

/**
 * Table Header Row
 */
const LessonsTableHeader = ({ showProgress = false }) => (
    <div className="lessons-table__header">
        <div className="lessons-table__cell lessons-table__cell--header lessons-table__cell--lesson">
            <span className="lessons-table__header-text">Lesson</span>
        </div>
        <div className="lessons-table__cell lessons-table__cell--header lessons-table__cell--competency">
            <span className="lessons-table__header-text">Competency</span>
        </div>
        <div className="lessons-table__cell lessons-table__cell--header lessons-table__cell--status lessons-table__cell--center">
            <span className="lessons-table__header-text">Status</span>
        </div>
        <div className="lessons-table__cell lessons-table__cell--header lessons-table__cell--duration">
            <span className="lessons-table__header-text">Duration</span>
        </div>
        {showProgress && (
            <div className="lessons-table__cell lessons-table__cell--header lessons-table__cell--progress">
                <span className="lessons-table__header-text">Progress</span>
            </div>
        )}
        <div className="lessons-table__cell lessons-table__cell--header lessons-table__cell--actions">
            <span className="lessons-table__header-text">Action</span>
        </div>
    </div>
);

LessonsTableHeader.propTypes = {
    showProgress: PropTypes.bool
};

/**
 * Table Item Row
 */
const LessonsTableItem = ({
    lesson,
    expanded,
    onToggle,
    onContinue,
    onActionClick,
    state = 'default',
    showProgress = false,
    usePills = false
}) => {
    const statusConfig = statusIconMap[lesson.status] || statusIconMap['not-started'];
    const statusBadgeStyle = statusBadgeMap[lesson.status] || 'secondary';
    const statusLabel = statusLabelMap[lesson.status] || lesson.status;
    const isCompleted = lesson.status === 'completed' || lesson.status === 'complete';
    
    const rowClasses = [
        'lessons-table__row',
        `lessons-table__row--${state}`,
        expanded ? 'lessons-table__row--expanded' : ''
    ].filter(Boolean).join(' ');

    const handleActionClick = (e) => {
        e.preventDefault();
        if (onActionClick) {
            onActionClick(lesson);
        } else if (onContinue) {
            onContinue(lesson);
        }
    };

    return (
        <div className={rowClasses}>
            {/* Main Row */}
            <div className={`lessons-table__row-main ${showProgress ? 'lessons-table__row-main--with-progress' : ''}`}>
                {/* Column 1-3: Toggle + Title + AI Indicator */}
                <div className="lessons-table__cell lessons-table__cell--lesson">
                    {lesson.description ? (
                        <button 
                            type="button" 
                            className="lessons-table__toggle"
                            onClick={onToggle}
                            aria-expanded={expanded}
                            aria-label={expanded ? 'Collapse row' : 'Expand row'}
                        >
                            <i className={`fas fa-chevron-${expanded ? 'down' : 'right'}`} />
                        </button>
                    ) : null}
                    <p className="lessons-table__title">{lesson.title}</p>
                    {lesson.showAiIndicator && (
                        <AiIndicator />
                    )}
                </div>
                
                {/* Column 4-5: Competency Area Badge */}
                <div className="lessons-table__cell lessons-table__cell--competency">
                    {lesson.competencyArea ? (
                        <StaticBadgeSmart type={lesson.competencyArea} size="b3" />
                    ) : (
                        <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                            {lesson.competency || 'N/A'}
                        </span>
                    )}
                </div>
                
                {/* Column 6: Status */}
                <div className="lessons-table__cell lessons-table__cell--status">
                    {usePills ? (
                        <Badge 
                            text={statusLabel} 
                            style={statusBadgeStyle} 
                            size="b3" 
                        />
                    ) : (
                        <div className="lessons-table__status-container">
                            <button type="button" className="lessons-table__status-button">
                                <span className="lessons-table__status-icon-wrapper">
                                    <i className={`fas fa-${statusConfig.icon} lessons-table__status-icon lessons-table__status-icon--${statusConfig.size}`} />
                                </span>
                            </button>
                        </div>
                    )}
                </div>
                
                {/* Column 7-8: Duration */}
                <div className="lessons-table__cell lessons-table__cell--duration">
                    <p className="lessons-table__duration">{lesson.duration}</p>
                </div>
                
                {/* Column: Progress (if enabled) */}
                {showProgress && (
                    <div className="lessons-table__cell lessons-table__cell--progress">
                        <div style={{ width: '100px' }}>
                            <Progress 
                                value={lesson.progress || 0} 
                                size="small" 
                                style="primary" 
                            />
                        </div>
                    </div>
                )}
                
                {/* Column: Action */}
                <div className="lessons-table__cell lessons-table__cell--actions">
                    {usePills ? (
                        <a 
                            href="#" 
                            className="body2-txt" 
                            style={{ 
                                color: 'var(--color-primary)',
                                textDecoration: 'none'
                            }}
                            onClick={handleActionClick}
                        >
                            {isCompleted ? 'Review' : 'Start'}
                        </a>
                    ) : (
                        <Button 
                            text="Continue" 
                            style="primary" 
                            fill="filled" 
                            size="small"
                            onClick={() => onContinue && onContinue(lesson)}
                        />
                    )}
                </div>
            </div>
            
            {/* Expanded Description Row */}
            {expanded && lesson.description && (
                <div className="lessons-table__row-expanded">
                    <p className="lessons-table__description">{lesson.description}</p>
                </div>
            )}
        </div>
    );
};

LessonsTableItem.propTypes = {
    lesson: PropTypes.object.isRequired,
    expanded: PropTypes.bool,
    onToggle: PropTypes.func,
    onContinue: PropTypes.func,
    onActionClick: PropTypes.func,
    state: PropTypes.oneOf(['default', 'hover', 'pressed', 'focus', 'disable']),
    showProgress: PropTypes.bool,
    usePills: PropTypes.bool
};

/**
 * Main LessonsTable Component
 */
const LessonsTable = ({
    lessons = [],
    onLessonContinue,
    onLessonAction,
    onLessonClick,
    className = '',
    style,
    showProgress = false,
    usePills = false
}) => {
    const [expandedRows, setExpandedRows] = useState(new Set());

    const toggleRow = (lessonId) => {
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

    const tableClasses = [
        'lessons-table',
        showProgress ? 'lessons-table--with-progress' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={tableClasses} style={style}>
            <LessonsTableHeader showProgress={showProgress} />
            {lessons.map((lesson, index) => (
                <LessonsTableItem
                    key={lesson.id || index}
                    lesson={lesson}
                    expanded={expandedRows.has(lesson.id || index)}
                    onToggle={() => toggleRow(lesson.id || index)}
                    onContinue={onLessonContinue}
                    onActionClick={onLessonAction}
                    showProgress={showProgress}
                    usePills={usePills}
                />
            ))}
        </div>
    );
};

LessonsTable.propTypes = {
    /** Array of lesson objects */
    lessons: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
        competencyArea: PropTypes.oneOf([
            'socio-emotional',
            'mastering-content',
            'advocacy',
            'relationships',
            'technology-tools'
        ]),
        competency: PropTypes.string,
        status: PropTypes.oneOf(['not-started', 'in-progress', 'started', 'complete', 'completed', 'assigned']),
        duration: PropTypes.string,
        progress: PropTypes.number,
        showAiIndicator: PropTypes.bool
    })),
    /** Callback when Continue button is clicked */
    onLessonContinue: PropTypes.func,
    /** Callback when action link is clicked (for overview page mode) */
    onLessonAction: PropTypes.func,
    /** Callback when lesson row is clicked */
    onLessonClick: PropTypes.func,
    /** Show progress column */
    showProgress: PropTypes.bool,
    /** Use status pills instead of icons */
    usePills: PropTypes.bool,
    /** Additional CSS class */
    className: PropTypes.string,
    /** Inline styles */
    style: PropTypes.object
};

export default LessonsTable;
