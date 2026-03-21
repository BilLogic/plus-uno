/**
 * Training/Onboarding Specs - Modals Overview
 * 
 * Modal components for onboarding.
 * 
 * Components:
 * - ModuleCompletionModal: Modal showing module completion with CTA to return to overview
 * - StrategyContentPromptModal: Modal with reflection question form
 */

import React from 'react';

export default {
    title: 'Specs/Training/Onboarding/Modals',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Modal components for Training Onboarding interface.

## Available Modals

| Modal | Description | Figma Node |
|-------|-------------|------------|
| ModuleCompletionModal | Completion popup with message and return button | 74-122005 |
| StrategyContentPromptModal | Reflection question form with textarea and submit | 74-121977 |
`
            },
        },
    },
};

/**
 * Overview
 * Shows available modal components
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Training Onboarding Modals</h2>
            <p className="body1-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                Modal components for Training Onboarding. Navigate to individual modals for detailed documentation.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>ModuleCompletionModal</h4>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Modal displayed when user completes an onboarding module. Shows congratulations message and button to return to onboarding overview.
                    </p>
                    <p className="body3-txt" style={{ marginTop: '8px', color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 74-122005
                    </p>
                </div>

                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>StrategyContentPromptModal</h4>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Modal for collecting user reflection responses. Contains instructions, required question, textarea input, and submit button.
                    </p>
                    <p className="body3-txt" style={{ marginTop: '8px', color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 74-121977
                    </p>
                </div>
            </div>
        </div>
    )
};
