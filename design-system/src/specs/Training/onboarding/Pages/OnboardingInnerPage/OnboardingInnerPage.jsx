/**
 * OnboardingInnerPage Component
 * 
 * Full page layout for individual onboarding module with content, alert, iframe, and reflection form.
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121860
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '../../../../Universal/Pages';
import ContentBlurb from '../../Elements/ContentBlurb/ContentBlurb';
import OnboardingAlertCard from '../../Cards/OnboardingAlertCard/OnboardingAlertCard';
import StrategyContentPromptModal from '../../Modals/StrategyContentPromptModal/StrategyContentPromptModal';
import ModuleCompletionModal from '../../Modals/ModuleCompletionModal/ModuleCompletionModal';
import './OnboardingInnerPage.scss';

const OnboardingInnerPage = ({
    moduleTitle = 'Welcome to PLUS',
    moduleDescription = 'Description',
    moduleDuration = '9 minutes',
    badgeType = 'image',
    showAlert = true,
    alertTitle = "Don't forget to complete this module",
    alertDescription = "Make sure to finish the quiz on the Google Site and answer the reflection question at the bottom of this page to complete this onboarding module.",
    showCompletionModal = false,
    reflectionQuestion = "What's one specific action you plan to take in your next session based on what you learned in this module?",
    iframeUrl = '',
    userName = 'Ashley Xu',
    onModuleComplete,
    onBackToOverview,
}) => {
    const [isAlertVisible, setIsAlertVisible] = useState(showAlert);
    const [isModalVisible, setIsModalVisible] = useState(showCompletionModal);
    const [reflectionValue, setReflectionValue] = useState('');

    const handleReflectionSubmit = (value) => {
        setReflectionValue(value);
        setIsModalVisible(true);
        if (onModuleComplete) {
            onModuleComplete({ reflectionValue: value });
        }
    };

    const handleModalClose = () => {
        setIsModalVisible(false);
    };

    const handleBackToOverview = () => {
        setIsModalVisible(false);
        if (onBackToOverview) {
            onBackToOverview();
        }
    };

    const topBarConfig = {
        breadcrumbs: [
            { text: 'Home', href: '#' },
            { text: 'Onboarding', href: '#' },
            { text: moduleTitle }
        ],
        user: {
            name: userName,
            counter: true,
            counterValue: 2
        }
    };

    const sidebarConfig = {
        user: 'tutor',
        activeTab: 'onboarding',
    };

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="onboarding-inner-page"
        >
            <div className="onboarding-inner-page">
                {/* Resource Description Section */}
                <section className="onboarding-inner-page__description-section">
                    <ContentBlurb
                        title={moduleTitle}
                        description={moduleDescription}
                        estimatedTime={moduleDuration}
                        badgeType={badgeType}
                        buttonText="Open onboarding module in a new tab"
                        onButtonClick={() => {
                            if (iframeUrl) {
                                window.open(iframeUrl, '_blank');
                            }
                        }}
                    />

                    {/* Illustration placeholder */}
                    <div className="onboarding-inner-page__illustration">
                        <div className="onboarding-inner-page__illustration-placeholder" />
                    </div>
                </section>

                {/* Alert Section */}
                {isAlertVisible && (
                    <section className="onboarding-inner-page__alert-section">
                        <OnboardingAlertCard
                            title={alertTitle}
                            description={alertDescription}
                            dismissible={true}
                            onDismiss={() => setIsAlertVisible(false)}
                        />
                    </section>
                )}

                {/* PDF/Iframe Section */}
                <section className="onboarding-inner-page__iframe-section">
                    {iframeUrl ? (
                        <iframe
                            src={iframeUrl}
                            title="Module Content"
                            className="onboarding-inner-page__iframe"
                            frameBorder="0"
                            allowFullScreen
                        />
                    ) : (
                        <div className="onboarding-inner-page__iframe-placeholder">
                            <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                                Module content will be embedded here (Google Sites iframe)
                            </p>
                        </div>
                    )}
                </section>

                {/* Reflection Question Section */}
                <section className="onboarding-inner-page__reflection-section">
                    <StrategyContentPromptModal
                        show={true}
                        instructionsTitle="Instructions"
                        instructionsText="Take a moment to reflect on what you learned in this module. Your response helps us understand your perspective and ensures you're ready to apply this in your sessions. Please answer the question below to complete the module."
                        questionLabel="Question 1"
                        questionText={reflectionQuestion}
                        placeholder="Type in your response here ..."
                        buttonText="Submit"
                        required={true}
                        value={reflectionValue}
                        onChange={setReflectionValue}
                        onSubmit={handleReflectionSubmit}
                    />
                </section>
            </div>

            {/* Completion Modal Overlay */}
            {isModalVisible && (
                <div className="onboarding-inner-page__scrim">
                    <ModuleCompletionModal
                        show={true}
                        title="Module Completed!"
                        message="You've completed this onboarding module. You can revisit it anytime, or continue with the rest of your onboarding."
                        buttonText="Back to Onboarding Overview"
                        onClose={handleModalClose}
                        onContinue={handleBackToOverview}
                    />
                </div>
            )}
        </PageLayout>
    );
};

OnboardingInnerPage.propTypes = {
    /** Module title */
    moduleTitle: PropTypes.string,
    /** Module description */
    moduleDescription: PropTypes.string,
    /** Module duration */
    moduleDuration: PropTypes.string,
    /** Badge type for content blurb */
    badgeType: PropTypes.oneOf(['image', 'video', 'audio', 'document', 'book', 'website', 'other']),
    /** Whether to show alert */
    showAlert: PropTypes.bool,
    /** Alert title */
    alertTitle: PropTypes.string,
    /** Alert description */
    alertDescription: PropTypes.string,
    /** Whether to show completion modal */
    showCompletionModal: PropTypes.bool,
    /** Reflection question text */
    reflectionQuestion: PropTypes.string,
    /** URL for iframe content */
    iframeUrl: PropTypes.string,
    /** Callback when module is completed */
    onModuleComplete: PropTypes.func,
    /** Callback when returning to overview */
    onBackToOverview: PropTypes.func,
};

export default OnboardingInnerPage;
