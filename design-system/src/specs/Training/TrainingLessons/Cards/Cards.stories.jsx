/**
 * Training/Lessons Specs - Cards Overview
 * 
 * Card components for lessons.
 * 
 * Components:
 * - AlertForSupervisors: Alert card for supervisors about AI features
 */

import React from 'react';

export default {
    title: 'Specs/Training/TrainingLessons/Cards',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Card components for Training Lessons interface.

## Available Cards

| Card | Description | Figma Node |
|------|-------------|------------|
| AlertForSupervisors | Alert card for supervisors about AI features (enabled/disabled states) | TBD |
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
            <h2 className="h2" style={{ marginBottom: '24px' }}>Training Lessons Cards</h2>
            <p className="body1-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                Card components for Training Lessons. Navigate to individual cards for detailed documentation.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>AlertForSupervisors</h4>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Alert card for supervisors about AI features. Supports enabled and disabled states.
                    </p>
                </div>
            </div>
        </div>
    )
};
