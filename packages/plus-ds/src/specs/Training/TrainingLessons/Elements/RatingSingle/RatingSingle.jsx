/**
 * RatingSingle Component
 * 
 * Single rating button with rest and selected states.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-177673
 */

import React from 'react';
import PropTypes from 'prop-types';
import './RatingSingle.scss';

const RatingSingle = ({ value, status = 'rest', onClick, className = '', style }) => {
    const isSelected = status === 'selected';

    return (
        <div
            className={`rating-single rating-single--${status} ${className}`}
            style={style}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            } : undefined}
            data-node-id={isSelected ? '63:177677' : '63:177674'}
        >
            {/* Number text */}
            <div className="rating-single__number">
                {value}
            </div>

            {/* Radio button */}
            <div className={`rating-single__radio ${isSelected ? 'rating-single__radio--checked' : ''}`}>
                {isSelected && <div className="rating-single__radio-inner" />}
            </div>
        </div>
    );
};

RatingSingle.propTypes = {
    /** Rating value (1-5) */
    value: PropTypes.number.isRequired,
    /** Status: 'rest' or 'selected' */
    status: PropTypes.oneOf(['rest', 'selected']),
    /** Click handler */
    onClick: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Additional inline styles */
    style: PropTypes.object
};

export default RatingSingle;
