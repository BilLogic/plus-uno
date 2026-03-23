/**
 * ModuleCompletionModal Component
 * 
 * Modal showing module completion popup with title, message, and action button.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-122005
 */

import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Button';
import './ModuleCompletionModal.scss';

const ModuleCompletionModal = ({
    title = 'Module Completed!',
    message = "You've completed this onboarding module. You can revisit it anytime, or continue with the rest of your onboarding.",
    buttonText = 'Back to Onboarding Overview',
    show = true,
    onClose,
    onContinue,
    className = '',
    ...props
}) => {
    if (!show) return null;

    return (
        <div className={`module-completion-modal ${className}`} {...props}>
            {/* Header section */}
            <div className="module-completion-modal__header">
                <div className="module-completion-modal__header-content">
                    <div className="module-completion-modal__title-container">
                        <h4 className="module-completion-modal__title h4">
                            {title}
                        </h4>
                    </div>
                    <button 
                        type="button"
                        className="module-completion-modal__close"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <i className="fas fa-xmark" aria-hidden="true" />
                    </button>
                </div>
            </div>

            {/* Message section */}
            <div className="module-completion-modal__message">
                <p className="module-completion-modal__message-text body1-txt">
                    {message}
                </p>
            </div>

            {/* Button section */}
            <div className="module-completion-modal__footer">
                <div className="module-completion-modal__button-container">
                    <Button
                        text={buttonText}
                        style="primary"
                        fill="filled"
                        size="medium"
                        leadingVisual="arrow-right-from-bracket"
                        onClick={onContinue}
                        block
                    />
                </div>
            </div>
        </div>
    );
};

ModuleCompletionModal.propTypes = {
    /** Modal title */
    title: PropTypes.string,
    /** Message text */
    message: PropTypes.string,
    /** Button text */
    buttonText: PropTypes.string,
    /** Whether modal is visible */
    show: PropTypes.bool,
    /** Callback when close button is clicked */
    onClose: PropTypes.func,
    /** Callback when continue button is clicked */
    onContinue: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default ModuleCompletionModal;
