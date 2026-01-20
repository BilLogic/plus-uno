/**
 * LessonCard Component
 * 
 * Lesson card with thumbnail, tags, title, status, and action buttons.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-177597
 */

import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Button';
import { StaticBadgeSmart } from '@/components/StaticBadgeSmart';
import AiIndicator from '../../Elements/AiIndicator/AiIndicator';
import './LessonCard.scss';

// Status icon mapping
const statusIconMap = {
    'not-started': { icon: 'square-plus', color: 'var(--color-warning)' },
    'in-progress': { icon: 'spinner', color: 'var(--color-warning)' },
    'completed': { icon: 'circle-check', color: 'var(--color-success)' },
    'assigned': { icon: 'square-plus', color: 'var(--color-info)' }
};

const LessonCard = ({
    lessonTitle = 'Lesson Title',
    lessonDescription = 'Lesson Description',
    competencyArea = 'mastering-content',
    duration = '12 mins',
    status = 'not-started',
    showAiIndicator = true,
    state = 'default',
    onContinue,
    onClick,
    className = '',
    ...props
}) => {
    const statusConfig = statusIconMap[status] || statusIconMap['not-started'];
    const isHover = state === 'hover';

    return (
        <div 
            className={`lesson-card lesson-card--${state} ${className}`}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            {...props}
        >
            <div className="lesson-card__inner">
                {/* Thumbnail */}
                <div className={`lesson-card__thumbnail ${isHover ? 'lesson-card__thumbnail--hover' : ''}`}>
                    <div className="lesson-card__thumbnail-bg" />
                    <p className="lesson-card__thumbnail-text body2-txt">
                        {lessonDescription}
                    </p>
                </div>

                {/* Content */}
                <div className="lesson-card__content">
                    {/* Tags and Title */}
                    <div className="lesson-card__info">
                        {/* Tags row */}
                        <div className="lesson-card__tags">
                            <StaticBadgeSmart type={competencyArea} size="b3" />
                            <span className="lesson-card__tags-separator">•</span>
                            <span className="lesson-card__duration body3-txt">
                                {duration}
                            </span>
                        </div>

                        {/* Title */}
                        <h5 className="lesson-card__title h5">
                            {lessonTitle}
                        </h5>
                    </div>

                    {/* Divider */}
                    <div className="lesson-card__divider" />

                    {/* Buttons */}
                    <div className="lesson-card__actions">
                        <Button
                            text="Continue"
                            style="primary"
                            fill="filled"
                            size="medium"
                            onClick={(e) => {
                                e.stopPropagation();
                                onContinue && onContinue();
                            }}
                        />
                        
                        {/* Status and AI Indicator */}
                        <div className="lesson-card__indicators">
                            {/* Status Indicator */}
                            <button
                                type="button"
                                className="lesson-card__status-button"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <i 
                                    className={`fas fa-${statusConfig.icon} lesson-card__status-icon`}
                                    style={{ color: statusConfig.color }}
                                    aria-hidden="true"
                                />
                            </button>

                            {/* AI Indicator */}
                            {showAiIndicator && (
                                <AiIndicator 
                                    onClick={(e) => e.stopPropagation()}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

LessonCard.propTypes = {
    /** Lesson title */
    lessonTitle: PropTypes.string,
    /** Lesson description for thumbnail */
    lessonDescription: PropTypes.string,
    /** SMART competency area */
    competencyArea: PropTypes.oneOf([
        'socio-emotional',
        'mastering-content',
        'advocacy',
        'relationships',
        'technology-tools'
    ]),
    /** Lesson duration */
    duration: PropTypes.string,
    /** Lesson status */
    status: PropTypes.oneOf(['not-started', 'in-progress', 'completed', 'assigned']),
    /** Whether to show AI indicator */
    showAiIndicator: PropTypes.bool,
    /** Card state */
    state: PropTypes.oneOf(['default', 'hover']),
    /** Continue button click handler */
    onContinue: PropTypes.func,
    /** Card click handler */
    onClick: PropTypes.func,
    /** Additional CSS class */
    className: PropTypes.string,
};

export default LessonCard;
