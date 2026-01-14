/**
 * Admin/GroupAdmin Specs
 * 
 * Components for group administration.
 */

import React from 'react';

export default {
    title: 'Specs/Admin/Group Admin',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Admin components for managing groups of students/tutors.',
            },
        },
    },
};

/**
 * Overview
 */
export const Overview = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
        <h2 className="h2" style={{ marginBottom: '24px' }}>Group Admin Components</h2>
        <p className="body1-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
            Group Admin interfaces are built using shared <strong>Universal Components</strong> to ensure consistency across the application.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
                padding: '16px',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: '8px'
            }}>
                <h4 className="h4" style={{ marginBottom: '8px' }}>Universal Components</h4>
                <p className="body2-txt" style={{ marginBottom: '12px' }}>
                    We have refactored the Group Admin components to use the Universal Design System specs:
                </p>
                <ul className="body2-txt" style={{ paddingLeft: '24px', margin: 0 }}>
                    <li style={{ marginBottom: '8px' }}>
                        <strong>Overview Cards</strong>: Replaced custom implementations with <code style={{ fontSize: '0.9em' }}>Universal/Cards/OverviewCard</code>.
                        See <a href="/?path=/docs/specs-universal-cards-overviewcard--docs" style={{ color: 'var(--color-primary)' }}>Universal Cards</a>.
                    </li>
                    <li>
                        <strong>Tables</strong>: Standardized table styles. See <a href="/?path=/docs/specs-universal-tables--docs" style={{ color: 'var(--color-primary)' }}>Universal Tables</a>.
                    </li>
                </ul>
            </div>

            <div style={{
                padding: '16px',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: '8px'
            }}>
                <h4 className="h4" style={{ marginBottom: '8px' }}>Pages</h4>
                <p className="body2-txt">
                    Full page implementations:
                </p>
                <ul className="body2-txt" style={{ paddingLeft: '24px', margin: '8px 0 0' }}>
                    <li><strong>GroupTrainingProgressPage</strong>: Uses Universal OverviewCards (SMART & Metric types)</li>
                    <li><strong>GroupInfoPage</strong>: Detailed group information</li>
                </ul>
            </div>
        </div>
    </div>
);
