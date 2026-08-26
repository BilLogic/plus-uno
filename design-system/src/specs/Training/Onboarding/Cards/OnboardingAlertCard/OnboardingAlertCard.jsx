/**
 * OnboardingAlertCard Component
 * 
 * Alert card component with title, description, and close icon.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=542-50027
 */

import React from 'react';
import PropTypes from 'prop-types';
import './OnboardingAlertCard.scss';

const OnboardingAlertCard = ({
    title = "Don't forget to complete this module",
    description = "Make sure to finish the quiz on the Google Site and answer the reflection question at the bottom of this page to complete this onboarding module.",
    dismissible = true,
    onDismiss,
    /**
     * Heading level for the card's title.
     *
     * The card lands at two depths. On `OnboardingInnerPage` it sits under the
     * module blurb's `h2`, so it has to be an `h3` or axe reports a skip. In its
     * own stories each instance is introduced by an `<h6>` section label, and an
     * `h3` there makes the NEXT label a three-level jump — which is how this
     * regressed once already. Same shape as `OverviewCard`'s `titleAs` (#242);
     * the class carries the appearance, so the level never changes how it looks.
     */
    titleAs: TitleTag = 'h5',
    className = '',
    ...props
}) => {
    return (
        <div className={`onboarding-alert-card ${className}`} {...props}>
            <div className="onboarding-alert-card__alert">
                {/* Message section */}
                <div className="onboarding-alert-card__message">
                    <TitleTag className="onboarding-alert-card__title h5">
                        {title}
                    </TitleTag>
                    <div className="onboarding-alert-card__description">
                        <p className="onboarding-alert-card__description-text body1-txt">
                            {description}
                        </p>
                    </div>
                </div>

                {/* Close icon */}
                {dismissible && (
                    <button 
                        type="button"
                        className="onboarding-alert-card__close"
                        onClick={onDismiss}
                        aria-label="Dismiss alert"
                    >
                        <i className="fas fa-xmark" aria-hidden="true" />
                    </button>
                )}
            </div>
        </div>
    );
};

OnboardingAlertCard.propTypes = {
    /** Alert title */
    title: PropTypes.string,
    /** Alert description text */
    description: PropTypes.string,
    /** Whether the alert can be dismissed */
    dismissible: PropTypes.bool,
    titleAs: PropTypes.string,
    /** Callback when dismiss button is clicked */
    onDismiss: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default OnboardingAlertCard;
