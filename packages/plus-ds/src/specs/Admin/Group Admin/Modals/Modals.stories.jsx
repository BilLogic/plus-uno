/**
 * Admin/Group Admin Specs - Modals Overview
 * 
 * Modal components for Group Admin.
 * Currently no custom modals defined.
 */

import React from 'react';

export default {
    title: 'Specs/Admin/Group Admin/Modals',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Modal components for Group Admin interface.

## Status

No custom modal components are currently defined for Group Admin.
Group Admin may use shared PLUS DS Modal components for functionality like:
- Add Group modal
- Edit Group modal
- Assign training modal
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
            <h2 className="h2" style={{ marginBottom: '24px' }}>Group Admin Modals</h2>
            <p className="body1-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                Modal components for Group Admin. Currently no custom modals are defined.
            </p>

            <div style={{
                padding: '16px',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: '8px'
            }}>
                <h4 className="h4" style={{ marginBottom: '8px' }}>Potential Modals</h4>
                <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Future modals may include:
                </p>
                <ul className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', paddingLeft: '24px', marginTop: '8px' }}>
                    <li>Add Group modal</li>
                    <li>Edit Group modal</li>
                    <li>Assign training modal</li>
                    <li>Delete confirmation modal</li>
                </ul>
            </div>
        </div>
    ),
};
