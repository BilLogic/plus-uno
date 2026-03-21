/**
 * Training/Onboarding Specs - Pages Overview
 * 
 * Page components for onboarding.
 * 
 * Components:
 * - OnboardingOverviewPage: Full page with featured modules carousel and all modules table
 * - OnboardingInnerPage: Individual module page with content, alert, iframe, reflection form
 */

import React from 'react';

export default {
    title: 'Specs/Training/Onboarding/Pages',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Page components for Training Onboarding interface.

## Available Pages

| Page | Description | Figma Node |
|------|-------------|------------|
| OnboardingOverviewPage | Overview with featured modules carousel and all modules table | 74-121828 |
| OnboardingInnerPage | Individual module page with content, alert, iframe, reflection form | 74-121860 |
`
            },
        },
    },
};

/**
 * Overview
 * Shows available page components
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Training Onboarding Pages</h2>
            <p className="body1-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                Page components for Training Onboarding. Navigate to individual pages for detailed documentation.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>OnboardingOverviewPage</h4>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Full page layout for Onboarding Overview. Contains Featured Modules section with horizontal 
                        carousel and navigation arrows, and All Modules section with sortable table. Uses PageLayout 
                        shell with TopBar, Sidebar, and main content area.
                    </p>
                    <p className="body3-txt" style={{ marginTop: '8px', color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 74-121828
                    </p>
                </div>

                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>OnboardingInnerPage</h4>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Full page layout for individual onboarding module. Contains ContentBlurb with module info, 
                        dismissible OnboardingAlertCard, iframe placeholder for Google Sites content, 
                        StrategyContentPromptModal for reflection question, and ModuleCompletionModal overlay 
                        upon submission.
                    </p>
                    <p className="body3-txt" style={{ marginTop: '8px', color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 74-121860
                    </p>
                </div>
            </div>
        </div>
    )
};
