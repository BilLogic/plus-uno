import React from 'react';
import PropTypes from 'prop-types';
import PatternCard from '@/patterns/PatternCard';
import Button from '@/components/forms-and-inputs/Button';
import './TrainingProgressCard.scss';

/**
 * TrainingProgressCard component for Home page
 * Displays training progress with SMART competency bars
 */
const TrainingProgressCard = ({
    id,
    spacing = 'default', // 'default' or 'compact'
    title = 'Training Progress',
    completed = 6,
    total = 10,
    onContinueClick,
    competencies = {
        'S': 10, // Social-Emotional
        'M': 15, // Mastering Content
        'A': 20, // Advocacy
        'R': 25, // Relationships
        'T': 30  // Technology Tools
    },
    // For compact spacing: breakdown showing completed/total for each competency
    competencyBreakdown = {
        'S': { completed: 6, total: 9 },
        'M': { completed: 2, total: 8 },
        'A': { completed: 5, total: 7 },
        'R': { completed: 3, total: 8 },
        'T': { completed: 7, total: 9 }
    },
    className = '',
    style
}) => {
    const progressPercentage = (completed / total) * 100;

    const competencyColors = {
        'S': {
            bg: 'var(--color-social-emotional)',
            text: 'var(--color-social-emotional-text)',
            container: 'var(--color-social-emotional-container)'
        },
        'M': {
            bg: 'var(--color-mastering-content-container)',
            text: 'var(--color-mastering-content-text)',
            container: 'var(--color-mastering-content-container)'
        },
        'A': {
            bg: 'var(--color-advocacy-container)',
            text: 'var(--color-advocacy-text)',
            container: 'var(--color-advocacy-container)'
        },
        'R': {
            bg: 'var(--color-relationship-container)',
            text: 'var(--color-relationship-text)',
            container: 'var(--color-relationship-container)'
        },
        'T': {
            bg: 'var(--color-technology-tools-container)',
            text: 'var(--color-technology-tools-text)',
            container: 'var(--color-technology-tools-container)'
        }
    };

    const renderCompetencyBar = (letter, value) => {
        const colors = competencyColors[letter];
        const maxValue = 72; // Max height in pixels
        const barHeight = (value / 100) * maxValue;
        const barWidth = 6;

        return (
            <div key={letter} className="plus-training-progress-competency">
                <div className="plus-training-progress-bar-container">
                    <div 
                        className="plus-training-progress-bar-bg"
                        style={{ height: `${maxValue}px`, width: `${barWidth}px` }}
                    />
                    <div
                        className="plus-training-progress-bar-fill"
                        style={{
                            height: `${barHeight}px`,
                            width: `${barWidth}px`,
                            backgroundColor: colors.bg,
                            marginTop: `${maxValue - barHeight}px`
                        }}
                    />
                </div>
                <span 
                    className="plus-training-progress-competency-label body3-txt"
                    style={{ color: colors.text }}
                >
                    {letter}
                </span>
            </div>
        );
    };

    const cardClasses = [
        'plus-training-progress-card',
        `plus-training-progress-card-${spacing}`,
        className
    ].filter(Boolean).join(' ');

    const cardStyle = {
        backgroundImage: `linear-gradient(90deg, var(--ds-background-smart-social-emotional) 0%, var(--ds-background-smart-social-emotional) 100%), linear-gradient(90deg, var(--ds-surface-raised) 0%, var(--ds-surface-raised) 100%)`,
        ...style
    };

    return (
        <PatternCard
            id={id}
            className={cardClasses}
            style={cardStyle}
            padding="md"
            gap={spacing === 'compact' ? 'sm' : 'md'}
        >
            <div className="plus-training-progress-content">
                {/* Title with info icon */}
                <div className="plus-training-progress-title">
                    <h5 className="plus-training-progress-title-text">{title}</h5>
                    <i className="fas fa-circle-info" aria-hidden="true"></i>
                </div>

                {/* Main content */}
                <div className="plus-training-progress-main">
                    {spacing === 'compact' ? (
                        <>
                            {/* Competency bars on left for compact spacing */}
                            <div className="plus-training-progress-competencies">
                                {Object.entries(competencies).map(([letter, value]) =>
                                    renderCompetencyBar(letter, value)
                                )}
                            </div>
                            {/* Breakdown list on right for compact spacing */}
                            <div className="plus-training-progress-breakdown">
                                {Object.entries(competencyBreakdown).map(([letter, breakdown]) => {
                                    const colors = competencyColors[letter];
                                    return (
                                        <div key={letter} className="plus-training-progress-breakdown-item">
                                            <div 
                                                className="plus-training-progress-breakdown-dot"
                                                style={{ backgroundColor: colors.container }}
                                            />
                                            <span className="body3-txt">
                                                {breakdown.completed}/{breakdown.total}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Text content for default spacing */}
                            <div className="plus-training-progress-text">
                                {/* A count is not a section. `.plus-training-progress-value`
                                    carries the whole appearance, so the tag stays out of the
                                    outline. */}
                                <p className="plus-training-progress-value">
                                    {completed} / {total}
                                </p>
                                <p className="body3-txt plus-training-progress-label">
                                    Lessons completed
                                </p>
                                <Button
                                    text="Continue Training"
                                    spacing="compact"
                                    onClick={onContinueClick}
                                />
                            </div>

                            {/* Competency bars on right for default spacing */}
                            <div className="plus-training-progress-competencies">
                                {Object.entries(competencies).map(([letter, value]) =>
                                    renderCompetencyBar(letter, value)
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </PatternCard>
    );
};

TrainingProgressCard.propTypes = {
    id: PropTypes.string,
    spacing: PropTypes.oneOf(['default', 'compact']),
    title: PropTypes.string,
    completed: PropTypes.number,
    total: PropTypes.number,
    onContinueClick: PropTypes.func,
    competencies: PropTypes.shape({
        'S': PropTypes.number,
        'M': PropTypes.number,
        'A': PropTypes.number,
        'R': PropTypes.number,
        'T': PropTypes.number
    }),
    competencyBreakdown: PropTypes.shape({
        'S': PropTypes.shape({ completed: PropTypes.number, total: PropTypes.number }),
        'M': PropTypes.shape({ completed: PropTypes.number, total: PropTypes.number }),
        'A': PropTypes.shape({ completed: PropTypes.number, total: PropTypes.number }),
        'R': PropTypes.shape({ completed: PropTypes.number, total: PropTypes.number }),
        'T': PropTypes.shape({ completed: PropTypes.number, total: PropTypes.number })
    }),
    className: PropTypes.string,
    style: PropTypes.object
};

export default TrainingProgressCard;

