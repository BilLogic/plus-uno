import React from 'react';
import PropTypes from 'prop-types';
import TutorChartsElement from '../../Elements/TutorChartsElement/TutorChartsElement';
import './TutorDataCard.scss';

const TutorDataCard = ({
    title = 'Card Title',
    tooltip,
    percentage = 0,
    subtitle = 'ABC',
    legend = [],
    loading = false,
    className = '',
    children,
    ...props
}) => {
    const safePercentage = Number.isFinite(percentage) ? Math.max(0, Math.min(100, percentage)) : 0;

    return (
        <div className={`tutor-data-card ${className}`} {...props}>
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
                ) : children ? (
                    children
                ) : (
                    <TutorChartsElement
                        variant="Pie"
                        data={{ percentage: safePercentage, label: subtitle }}
                        legend={legend.length > 0 ? legend : [
                            { color: 'var(--color-primary-container, #61b5cf)', label: subtitle },
                            { color: 'var(--color-surface-container-highest, #e2e2e5)', label: 'Remaining' }
                        ]}
                        className="tutor-data-card__chart-wrapper"
                    />
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
    /** Child content (replaces default chart) */
    children: PropTypes.node,
};

export default TutorDataCard;

