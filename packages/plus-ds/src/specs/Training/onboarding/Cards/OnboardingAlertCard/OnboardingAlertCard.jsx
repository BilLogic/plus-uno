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
    className = '',
    ...props
}) => {
    return (
        <div className={`onboarding-alert-card ${className}`} {...props}>
            <div className="onboarding-alert-card__alert">
                {/* Message section */}
                <div className="onboarding-alert-card__message">
                    <h5 className="onboarding-alert-card__title h5">
                        {title}
                    </h5>
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
    /** Callback when dismiss button is clicked */
    onDismiss: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default OnboardingAlertCard;
