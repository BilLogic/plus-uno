import React from 'react';
import PropTypes from 'prop-types';

/**
 * Rating Component
 * Rating component with 5 rating singles (1-5) showing different selected states.
 * Matches legacy design-system/specs/Training/Lessons/Elements/Rating.js
 */
const Rating = ({ rating = "rest", onRatingChange }) => {
    // Styling constants from legacy
    const containerStyle = {
        display: 'flex',
        gap: 'var(--size-section-gap-md)', // space-600 / 32px
        alignItems: 'flex-start',
        padding: '0 var(--size-element-pad-x-md)', // space-300 / 16px
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
 * Sub-component: RatingSingle
 * Logic derived from legacy createRatingSingle calls
 */
const RatingSingle = ({ value, status, onClick }) => {
    // Styles for the single rating item (circle with number)
    // Legacy mapping:
    // status=rest: border-neutral-tertiary (??), bg-transparent, text-primary
    // status=selected: bg-primary, text-white

    // Using standard Bootstrap/plus classes where possible, or inline to match exact legacy flex gaps
    // The legacy code used `createRatingSingle` which isnt shown but implied specific styling.
    // We will approximate with standard PLUS tokens.

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
        fontFamily: 'var(--font-family-body)',
        fontWeight: 'bold'
    };

    const statusStyles = {
        rest: {
            backgroundColor: 'transparent',
            borderColor: '#DEE2E6', // gray-300 approx
            color: 'var(--color-primary-text)'
        },
        selected: {
            backgroundColor: 'var(--color-primary)',
            borderColor: 'var(--color-primary)',
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
