/**
 * TrainingOnboardingClickthrough.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Hi-Fi Clickthrough: Overview → Inner Page → Complete → Back
 *
 * Full stateful interaction flow:
 *   1. Student lands on Onboarding Overview (list view, Day 1 fresh start)
 *   2. Student clicks "Welcome to PLUS" → navigates to the Inner Page
 *   3. Inner page shows module content + thumbnail image + reflection form
 *   4. Student submits reflection → ModuleCompletionModal appears
 *   5. "Back to Onboarding Overview":
 *        - Module 1 → stage: 'completed'
 *        - Module 2 → stage: 'in progress'  (unlocked, hero updates to "Continue")
 *   6. Overview refreshes showing lesson 1 complete, lesson 2 active
 *   7. Student can continue clicking into lesson 2, and so on
 *
 * Uses specs:
 *   - TrainingOnboardingHiFi (overview page)
 *   - OnboardingInnerPage (specs/Training/onboarding/Pages/OnboardingInnerPage)
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import TrainingOnboardingHiFi, { DEFAULT_MODULES } from './TrainingOnboardingHiFi';
import OnboardingInnerPage from '@/specs/Training/onboarding/Pages/OnboardingInnerPage/OnboardingInnerPage';

// Day-1 fresh start: all modules not started so "Welcome to PLUS" is the active first step
const INITIAL_MODULES = DEFAULT_MODULES.map((m) => ({ ...m, stage: 'not started' }));

const TrainingOnboardingClickthrough = ({
    userName = 'Ashley Xu',
    defaultView = 'list',
    welcomeCardVariant = 'default', // 'default' | 'soft-gradient' (prototyping)
}) => {
    const [modules, setModules] = useState(INITIAL_MODULES);
    const [currentPage, setCurrentPage] = useState('overview'); // 'overview' | 'inner'
    const [activeModule, setActiveModule] = useState(null);

    const handleModuleCta = (module) => {
        setActiveModule(module);
        setCurrentPage('inner');
    };

    // Called when student clicks "Back to Onboarding Overview" in the completion modal.
    // Marks the just-completed module as 'completed' and advances the next module to 'in progress'.
    const handleBackToOverview = () => {
        if (activeModule) {
            setModules((prev) => {
                const idx = prev.findIndex((m) => m.id === activeModule.id);
                return prev.map((m, i) => {
                    if (i === idx) return { ...m, stage: 'completed' };
                    if (i === idx + 1) return { ...m, stage: 'in progress' };
                    return m;
                });
            });
        }
        setCurrentPage('overview');
        setActiveModule(null);
    };

    if (currentPage === 'inner' && activeModule) {
        return (
            <OnboardingInnerPage
                userName={userName}
                moduleTitle={activeModule.title}
                moduleDescription={activeModule.description}
                moduleDuration={`Estimated Time: ${activeModule.duration}`}
                badgeType={activeModule.badgeType || 'image'}
                imageUrl={activeModule.imageUrl}
                showAlert={true}
                showCompletionModal={false}
                onBackToOverview={handleBackToOverview}
            />
        );
    }

    return (
        <TrainingOnboardingHiFi
            userName={userName}
            defaultView={defaultView}
            modules={modules}
            onModuleCta={handleModuleCta}
            welcomeCardVariant={welcomeCardVariant}
        />
    );
};

TrainingOnboardingClickthrough.propTypes = {
    /** User's display name */
    userName: PropTypes.string,
    /** Initial view mode for the overview page */
    defaultView: PropTypes.oneOf(['list', 'card']),
    /** 'default' | 'soft-gradient' for prototyping */
    welcomeCardVariant: PropTypes.oneOf(['default', 'soft-gradient']),
};

export default TrainingOnboardingClickthrough;
