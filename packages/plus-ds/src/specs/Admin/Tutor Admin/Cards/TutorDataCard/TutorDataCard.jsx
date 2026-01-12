/**
 * TutorDataCard Component
 *
 * Data card with donut chart for displaying tutor metrics.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-262197
 */

import React from 'react';
import PropTypes from 'prop-types';
import './TutorDataCard.scss';

const TutorDataCard = ({
    title = 'Card Title',
    tooltip,
    percentage = 0,
    subtitle = 'ABC',
    legend = [],
    loading = false,
    className = '',
    ...props
}) => {
    const safePercentage = Number.isFinite(percentage) ? Math.max(0, Math.min(100, percentage)) : 0;

    // Calculate stroke dash for donut
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference * (1 - safePercentage / 100);

    return (
        <div className={`tutor-data-card ${loading ? 'tutor-data-card--loading' : ''} ${className}`} {...props}>
            {/* Header */}
            <div className="tutor-data-card__header">
                <h4 className="h4 tutor-data-card__title">{title}</h4>
                {tooltip && (
                    <button
                        className="tutor-data-card__info-btn"
                        aria-label="Info"
                        title={tooltip}
                        type="button"
                    >
                        <i className="fas fa-circle-info" />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="tutor-data-card__content">
                {loading ? (
                    <div className="tutor-data-card__loading">
                        <div className="tutor-data-card__spinner">
                            <i className="fas fa-spinner fa-spin" />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Donut Chart */}
                        <div className="tutor-data-card__chart">
                            <svg viewBox="0 0 180 180" className="tutor-data-card__svg" aria-hidden="true">
                                {/* Background circle */}
                                <circle
                                    cx="90"
                                    cy="90"
                                    r={radius}
                                    fill="none"
                                    stroke="var(--color-surface-container-highest, #e2e2e5)"
                                    strokeWidth="16"
                                />
                                {/* Progress circle */}
                                <circle
                                    cx="90"
                                    cy="90"
                                    r={radius}
                                    fill="none"
                                    stroke="var(--color-primary-container, #61b5cf)"
                                    strokeWidth="16"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    transform="rotate(-90 90 90)"
                                />
                            </svg>
                            <div className="tutor-data-card__center">
                                <span className="tutor-data-card__percentage">{safePercentage}%</span>
                                <span className="tutor-data-card__subtitle body1-txt">{subtitle}</span>
                            </div>
                        </div>

                        {/* Legend */}
                        {legend.length > 0 && (
                            <div className="tutor-data-card__legend" aria-label="Legend">
                                {legend.map((item, index) => (
                                    <div key={index} className="tutor-data-card__legend-item">
                                        <span
                                            className="tutor-data-card__legend-color"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="body3-txt">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

TutorDataCard.propTypes = {
    /** Card title */
    title: PropTypes.string,
    /** Tooltip text for info icon */
    tooltip: PropTypes.string,
    /** Percentage value (0-100) */
    percentage: PropTypes.number,
    /** Subtitle text in center of chart */
    subtitle: PropTypes.string,
    /** Legend items array */
    legend: PropTypes.arrayOf(
        PropTypes.shape({
            color: PropTypes.string,
            label: PropTypes.string,
        })
    ),
    /** Loading state */
    loading: PropTypes.bool,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default TutorDataCard;

