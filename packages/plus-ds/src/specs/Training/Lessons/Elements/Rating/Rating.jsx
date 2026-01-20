/**
 * Rating Component
 * 
 * Rating component with 5 rating singles (1-5).
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-177637
 */

import React from 'react';
import PropTypes from 'prop-types';
import RatingSingle from '../RatingSingle/RatingSingle';
import './Rating.scss';

const Rating = ({ rating = 'rest', onRatingChange, className = '', style }) => {
    const handleClick = (value) => {
        if (onRatingChange) {
            onRatingChange(value);
        }
    };

    const getNodeId = () => {
        if (rating === 'rest') return '63:177637';
        const ratingMap = { 1: '63:177643', 2: '63:177649', 3: '63:177655', 4: '63:177661', 5: '63:177667' };
        return ratingMap[rating] || '63:177637';
    };

    return (
        <div
            className={`training-rating ${className}`}
            style={style}
            data-node-id={getNodeId()}
        >
            {[1, 2, 3, 4, 5].map((val) => {
                const isSelected = rating !== 'rest' && parseInt(rating) === val;
                return (
                    <RatingSingle
                        key={val}
                        value={val}
                        status={isSelected ? 'selected' : 'rest'}
                        onClick={() => handleClick(val)}
                    />
                );
            })}
        </div>
    );
};

Rating.propTypes = {
    /** Selected rating: 'rest', 1, 2, 3, 4, or 5 */
    rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** Rating change handler (receives rating number) */
    onRatingChange: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Additional inline styles */
    style: PropTypes.object
};

export default Rating;
