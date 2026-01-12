/**
 * Training/Lessons Specs - Cards Overview
 * 
 * Card components for lessons.
 * 
 * Components:
 * - LessonCard: Lesson card with thumbnail, tags, title, status, action buttons
 * - AlertForSupervisors: Alert card for supervisors about AI features
 */

import React from 'react';

export default {
    title: 'Specs/Training/Lessons/Cards',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Card components for Training Lessons interface.

## Available Cards

| Card | Description | Figma Node |
|------|-------------|------------|
| LessonCard | Lesson card with thumbnail, competency badge, duration, title, status indicator, AI indicator, Continue button | 63-177597 |
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
                    <h4 className="h4" style={{ marginBottom: '8px' }}>LessonCard</h4>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Lesson card with thumbnail (or description text), competency area badge, duration, title,
                        status indicator, optional AI indicator, and Continue button. Supports default and hover states.
                    </p>
                    <p className="body3-txt" style={{ marginTop: '8px', color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 63-177597
                    </p>
                </div>

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
