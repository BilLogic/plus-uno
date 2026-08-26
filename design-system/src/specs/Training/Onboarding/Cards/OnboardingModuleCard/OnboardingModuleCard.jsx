/**
 * OnboardingModuleCard Component
 * 
 * Card component showing onboarding module with image thumbnail, title, duration, badge, and status.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-122003
 */

import React from 'react';
import PropTypes from 'prop-types';
import StrategyBadge from '@/specs/Training/Onboarding/Elements/StrategyBadge/StrategyBadge';
import StatusIndicators from '@/specs/Training/Onboarding/Elements/StatusIndicators/StatusIndicators';
import './OnboardingModuleCard.scss';

const OnboardingModuleCard = ({
    title = 'Module Title',
    duration = '9 mins',
    variant = 'thumbnail',
    badgeType = 'other',
    stage = 'not started',
    description = 'Add description here',
    imageUrl = null,
    onClick,
    /**
     * Heading level for the card's title.
     *
     * The card lands at two depths. On `OnboardingOverviewPage` it sits under a
     * "Featured Modules" / "All Modules" `h2`, so it has to be an `h3` or axe
     * reports a skip. In its own stories each grid is introduced by an `<h6>`
     * section label, and an `h3` there makes the NEXT label a three-level jump —
     * which is how this regressed once already. Same shape as `OverviewCard`'s
     * `titleAs` (#242); the class carries the appearance, so the level never
     * changes how it looks.
     */
    titleAs: TitleTag = 'h5',
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
                            <TitleTag className="onboarding-module-card__title h5">
                                {title}
                            </TitleTag>
                        </div>
                    </div>

                    {/* Badge and Status */}
                    <div className="onboarding-module-card__footer">
                        <StrategyBadge type={badgeType} />
                        <StatusIndicators stage={stage} size="small" />
                    </div>
                </div>
            </div>
        </div>
    );
};

OnboardingModuleCard.propTypes = {
    /** Module title */
    title: PropTypes.string,
    /** Heading level for the title — see the note on the prop. */
    titleAs: PropTypes.string,
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
    /** Click handler */
    onClick: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default OnboardingModuleCard;
