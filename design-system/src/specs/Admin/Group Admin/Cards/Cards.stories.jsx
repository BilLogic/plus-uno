/**
 * Admin/Group Admin Specs - Cards Overview
 * 
 * Card components for Group Admin.
 * Currently uses overview cards defined inline in GroupTrainingProgressPage.
 */

import React from 'react';

export default {
    title: 'Specs/Admin/Group Admin/Cards',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Card components for Group Admin interface.

## Overview Cards

The Group Training Progress page uses overview cards to display key metrics:
- **Student Need Card**: Shows SMART bar visualization with highest need area
- **Completion Rate Card**: Displays percentage of completed lessons
- **Avg Accuracy Rate Card**: Shows average accuracy on completed lessons
- **Avg Time Spent Card**: Displays average time spent on training

These cards are currently implemented inline within the GroupTrainingProgressPage component.
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
            <h2 className="h2" style={{ marginBottom: '24px' }}>Group Admin Cards</h2>
            <p className="body1-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                Card components used in Group Admin pages.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>Overview Cards (Training Progress)</h4>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        The Group Training Progress page displays four overview cards:
                    </p>
                    <ul className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', paddingLeft: '24px', marginTop: '8px' }}>
                        <li><strong>Student Need</strong>: SMART bar visualization showing highest need area</li>
                        <li><strong>Completion Rate</strong>: Percentage of completed lessons</li>
                        <li><strong>Avg Accuracy Rate</strong>: Average accuracy on training lessons</li>
                        <li><strong>Avg Time Spent</strong>: Average time spent on training</li>
                    </ul>
                    <p className="body3-txt" style={{ marginTop: '12px', color: 'var(--color-on-surface-variant)' }}>
                        See GroupTrainingProgressPage for full implementation.
                    </p>
                </div>
            </div>
        </div>
    ),
};
