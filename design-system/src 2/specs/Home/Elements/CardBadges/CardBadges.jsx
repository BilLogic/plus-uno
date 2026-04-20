import React from 'react';
import PropTypes from 'prop-types';
import './CardBadges.scss';

/**
 * CardBadges Component
 * Displays a badge showing percentage change with increase/decrease states
 */
export const CardBadges = ({
    state = 'increase',
    percentage = 0,
    text = 'since last week',
    className = '',
    id
}) => {
    const isIncrease = state === 'increase';
    const iconName = isIncrease ? 'arrow-up' : 'arrow-down';
    const sign = isIncrease ? '+' : '-';
    const displayPercentage = Math.abs(percentage);

    return (
        <div 
            id={id}
            className={`plus-card-badge plus-card-badge--${state} ${className}`}
        >
            <div className="plus-card-badge-inner">
                <div className="plus-card-badge-content">
                    <div className="plus-card-badge-icon">
                        <i className={`fa-solid fa-${iconName}`} aria-hidden="true"></i>
                    </div>
                    <span className="plus-card-badge-text body2-txt font-weight-semibold">
                        {sign}{displayPercentage}% {text}
                    </span>
                </div>
            </div>
        </div>
    );
};

CardBadges.propTypes = {
    /** Badge state - increase or decrease */
    state: PropTypes.oneOf(['increase', 'decrease']),
    /** Percentage value to display */
    percentage: PropTypes.number,
    /** Text to display after percentage */
    text: PropTypes.string,
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Element ID */
    id: PropTypes.string
};

export default CardBadges;

