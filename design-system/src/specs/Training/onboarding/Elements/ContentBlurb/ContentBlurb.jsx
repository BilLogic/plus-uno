/**
 * ContentBlurb Component
 * 
 * Content card with title, description, duration, and action button.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121991
 */

import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Button';
import StrategyBadge from '../StrategyBadge/StrategyBadge';
import './ContentBlurb.scss';

const ContentBlurb = ({
    title = 'Competence-building Narratives',
    description = 'Description',
    duration = '9 mins',
    estimatedTime,
    badgeType = 'image',
    buttonText = 'Open onboarding module in a new tab',
    onButtonClick,
    className = '',
    ...props
}) => {
    // Support both duration formats
    const displayDuration = estimatedTime || duration;

    return (
        <div className={`content-blurb ${className}`} {...props}>
            {/* Tags section */}
            <div className="content-blurb__tags">
                <StrategyBadge type={badgeType} />
                <span className="content-blurb__bullet">•</span>
                <span className="content-blurb__duration">{displayDuration}</span>
            </div>

            {/* Title */}
            <h4 className="content-blurb__title h4">{title}</h4>

            {/* Description */}
            <p className="content-blurb__description">{description}</p>

            {/* Estimated Time (optional explicit display) */}
            {estimatedTime && (
                <p className="content-blurb__time">Estimated Time: {estimatedTime}</p>
            )}

            {/* Action Button */}
            <Button
                text={buttonText}
                style="primary"
                fill="outline"
                size="medium"
                trailingVisual="up-right-from-square"
                onClick={onButtonClick}
                className="content-blurb__button"
            />
        </div>
    );
};

ContentBlurb.propTypes = {
    /** Content title */
    title: PropTypes.string,
    /** Content description */
    description: PropTypes.string,
    /** Duration text (short format) */
    duration: PropTypes.string,
    /** Estimated time (explicit format like "9 minutes") */
    estimatedTime: PropTypes.string,
    /** Badge type for strategy badge */
    badgeType: PropTypes.oneOf(['image', 'video', 'audio', 'document', 'book', 'website', 'other']),
    /** Button text */
    buttonText: PropTypes.string,
    /** Button click handler */
    onButtonClick: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default ContentBlurb;
