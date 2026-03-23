/**
 * Training/Onboarding Specs - Cards Overview
 * 
 * Card components for onboarding.
 * 
 * Components:
 * - OnboardingModuleCard: Card showing module with thumbnail, title, duration, badge, status
 * - OnboardingAlertCard: Alert card with title, description, and close icon
 */

import React from 'react';

export default {
    title: 'Specs/Training/Onboarding/Cards',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Card components for Training Onboarding interface.

## Available Cards

| Card | Description | Figma Node |
|------|-------------|------------|
| OnboardingModuleCard | Module card with thumbnail/description, title, duration, badge, status | 74-122003 |
| OnboardingAlertCard | Alert card with title, description, and dismiss button | 542-50027 |
`
            },
        },
    },
};

/**
 * Overview
 * Shows available card components
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Training Onboarding Cards</h2>
            <p className="body1-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                Card components for Training Onboarding. Navigate to individual cards for detailed documentation.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>OnboardingModuleCard</h4>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Card component showing module with thumbnail or description area, title, duration, strategy badge, and status indicator. Has two variants: thumbnail and description.
                    </p>
                    <p className="body3-txt" style={{ marginTop: '8px', color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 74-122003
                    </p>
                </div>

                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>OnboardingAlertCard</h4>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Alert card for important reminders with title, description text, and optional dismiss button. Uses primary color scheme.
                    </p>
                    <p className="body3-txt" style={{ marginTop: '8px', color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 542-50027
                    </p>
                </div>
            </div>
        </div>
    )
};
