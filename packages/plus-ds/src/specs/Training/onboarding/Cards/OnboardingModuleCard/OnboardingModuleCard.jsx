/**
 * OnboardingModuleCard Component
 * 
 * Card component showing onboarding module with image thumbnail, title, duration, badge, and status.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-122003
 */

import React from 'react';
import PropTypes from 'prop-types';
import StrategyBadge from '../../Elements/StrategyBadge/StrategyBadge';
import StatusIndicators from '../../Elements/StatusIndicators/StatusIndicators';
import './OnboardingModuleCard.scss';

const OnboardingModuleCard = ({
    title = 'Module Title',
    duration = '9 mins',
    variant = 'thumbnail',
    badgeType = 'other',
    stage = 'not started',
    description = 'Add description here',
    imageUrl = null,
    ctaSlot = null,
    onClick,
    className = '',
    ...props
}) => {
    return (
        <div 
            className={`onboarding-module-card onboarding-module-card--${variant} ${className}`}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            {...props}
        >
            <div className="onboarding-module-card__inner">
                {/* Header area - thumbnail or description */}
                <div className={`onboarding-module-card__header onboarding-module-card__header--${variant}`}>
                    {variant === 'description' ? (
                        <p className="onboarding-module-card__description-text body2-txt">
                            {description}
                        </p>
                    ) : (
                        <div className="onboarding-module-card__thumbnail">
                            <div className="onboarding-module-card__thumbnail-bg" />
                            {imageUrl && (
                                <img 
                                    src={imageUrl} 
                                    alt="" 
                                    className="onboarding-module-card__thumbnail-img"
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Content area */}
                <div className="onboarding-module-card__content">
                    {/* Duration and Title */}
                    <div className="onboarding-module-card__info">
                        {/* Tags (Duration) */}
                        <div className="onboarding-module-card__tags">
                            <span className="onboarding-module-card__duration body3-txt">
                                {duration}
                            </span>
                        </div>

                        {/* Title */}
                        <div className="onboarding-module-card__title-wrapper">
                            <h5 className="onboarding-module-card__title h5">
                                {title}
                            </h5>
                        </div>
                    </div>

                    {/* Badge, Status, and optional CTA slot */}
                    <div className="onboarding-module-card__footer">
                        <StrategyBadge type={badgeType} />
                        <StatusIndicators stage={stage} size="small" />
                        {ctaSlot && (
                            <div className="onboarding-module-card__footer-cta">
                                {ctaSlot}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

OnboardingModuleCard.propTypes = {
    /** Module title */
    title: PropTypes.string,
    /** Duration text */
    duration: PropTypes.string,
    /** Card variant: "thumbnail" or "description" */
    variant: PropTypes.oneOf(['thumbnail', 'description']),
    /** Badge type for strategy badge */
    badgeType: PropTypes.oneOf(['image', 'video', 'audio', 'document', 'book', 'website', 'other']),
    /** Status indicator stage */
    stage: PropTypes.oneOf(['not started', 'in progress', 'completed']),
    /** Description text (only for description variant) */
    description: PropTypes.string,
    /** Image URL for thumbnail */
    imageUrl: PropTypes.string,
    /** Optional CTA element rendered right-aligned in the footer row */
    ctaSlot: PropTypes.node,
    /** Click handler */
    onClick: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default OnboardingModuleCard;
