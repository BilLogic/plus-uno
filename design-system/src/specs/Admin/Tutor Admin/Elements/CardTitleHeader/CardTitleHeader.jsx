/**
 * CardTitleHeader Component
 * 
 * Simple header element with title text and optional info icon.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-262205
 */

import React from 'react';
import PropTypes from 'prop-types';
import './CardTitleHeader.scss';

const CardTitleHeader = ({
    title = 'Card Title',
    tooltip,
    showInfoIcon = true,
    className = '',
    ...props
}) => {
    return (
        <div className={`card-title-header ${className}`} {...props}>
            <h4 className="h4 card-title-header__title">{title}</h4>
            {showInfoIcon && tooltip && (
                <button
                    className="card-title-header__info-btn"
                    aria-label="Info"
                    title={tooltip}
                    type="button"
                >
                    <i className="fas fa-circle-info" />
                </button>
            )}
        </div>
    );
};

CardTitleHeader.propTypes = {
    /** Title text */
    title: PropTypes.string,
    /** Tooltip text for info icon */
    tooltip: PropTypes.string,
    /** Whether to show info icon */
    showInfoIcon: PropTypes.bool,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default CardTitleHeader;
