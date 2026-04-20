/**
 * Training/Onboarding Specs - Tables Overview
 * 
 * Table components for onboarding.
 * 
 * Components:
 * - OnboardingModulesTable: Table showing onboarding modules with progress and actions
 */

import React from 'react';

export default {
    title: 'Specs/Training/Onboarding/Tables',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Table components for Training Onboarding interface.

## Available Tables

| Table | Description | Figma Node |
|-------|-------------|------------|
| OnboardingModulesTable | Table showing modules with thumbnail, duration, progress, actions | 74-121873 |
`
            },
        },
    },
};

/**
 * Overview
 * Shows available table components
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Training Onboarding Tables</h2>
            <p className="body1-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                Table components for Training Onboarding. Navigate to individual tables for detailed documentation.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>OnboardingModulesTable</h4>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Table showing onboarding modules with thumbnail, title, duration, progress status indicator, and action buttons (Get Started/Continue/Review).
                    </p>
                    <p className="body3-txt" style={{ marginTop: '8px', color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 74-121873
                    </p>
                </div>
            </div>
        </div>
    )
};
