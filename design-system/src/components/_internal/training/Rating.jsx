import React from 'react';
import PropTypes from 'prop-types';

/**
 * Rating Component
 * Rating component with 5 rating singles (1-5) showing different selected states.
 */
const Rating = ({ rating = "rest", onRatingChange }) => {
    const containerStyle = {
        display: 'flex',
        gap: 'var(--section-stack-md)',
        alignItems: 'flex-start',
        padding: '0 var(--pad-x-md)', // space-300 / 16px
    };

    const handleClick = (value) => {
        if (onRatingChange) {
            onRatingChange(value);
        }
    };

    return (
        <div className="plus-rating" style={containerStyle}>
            {[1, 2, 3, 4, 5].map((val) => {
                const isSelected = rating !== "rest" && parseInt(rating) === val;
                return (
                    <RatingSingle
                        key={val}
                        value={val}
                        status={isSelected ? "selected" : "rest"}
                        onClick={() => handleClick(val)}
                    />
                );
            })}
        </div>
    );
};

Rating.propTypes = {
    rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onRatingChange: PropTypes.func
};

/**
 * Sub-component: RatingSingle, one numbered circle.
 */
const RatingSingle = ({ value, status, onClick }) => {
    // At rest a bordered circle; selected, the brand fill with inverse text.

    const baseStyle = {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        border: '1px solid',
        transition: 'all 0.2s ease',
        fontFamily: 'var(--type-family-body)',
        fontWeight: 'var(--type-weight-semibold)'
    };

    const statusStyles = {
        rest: {
            backgroundColor: 'transparent',
            borderColor: '#DEE2E6', // gray-300 approx
            color: 'var(--ds-text-brand)'
        },
        selected: {
            backgroundColor: 'var(--ds-background-brand-bold)',
            borderColor: 'var(--ds-border-brand)',
            color: 'white'
        }
    };

    const currentStyle = {
        ...baseStyle,
        ...statusStyles[status]
    };

    return (
        <div
            onClick={onClick}
            style={currentStyle}
            className={`rating-single rating-single-${status}`}
        >
            {value}
        </div>
    );
};

RatingSingle.propTypes = {
    value: PropTypes.number.isRequired,
    status: PropTypes.oneOf(['rest', 'selected']),
    onClick: PropTypes.func
};

export default Rating;
