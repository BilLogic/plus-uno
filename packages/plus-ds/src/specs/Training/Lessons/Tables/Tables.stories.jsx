/**
 * Training/Lessons Specs - Tables Overview
 * 
 * Table components for lessons.
 * 
 * Components:
 * - LessonsTable: Table showing lessons with expandable rows, status, competency, duration, actions
 */

import React from 'react';

export default {
    title: 'Specs/Training/Lessons/Tables',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Table components for Training Lessons interface.

## Available Tables

| Table | Description | Figma Node |
|-------|-------------|------------|
| LessonsTable | Table showing lessons with expandable rows, status icons/badges, competency badges, duration, actions | 63-178095 |
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
            <h2 className="h2" style={{ marginBottom: '24px' }}>Training Lessons Tables</h2>
            <p className="body1-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                Table components for Training Lessons. Navigate to individual tables for detailed documentation.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>LessonsTable</h4>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Table showing lessons with expandable rows (showing description when expanded), status icons or badges,
                        competency area badges, duration, and action buttons/links (Continue/Start/Review). Supports both icon-based
                        and pill-based status display modes.
                    </p>
                    <p className="body3-txt" style={{ marginTop: '8px', color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 63-178095
                    </p>
                </div>
            </div>
        </div>
    )
};
