/**
 * Admin/Group Admin Specs - Sections Overview
 * 
 * Section components for Group Admin.
 * Currently no custom sections defined - uses shared PageLayout.
 */

import React from 'react';

export default {
    title: 'Specs/Admin/Group Admin/Sections',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Section components for Group Admin interface.

## Shared Components Used

Group Admin uses the following shared layout components:
- **PageLayout**: Main page shell with sidebar and topbar
- **TopBar**: Header with breadcrumbs and user info
- **Sidebar**: Navigation sidebar with admin menu items

See the Universal spec for detailed documentation of these shared components.
`
            },
        },
    },
};

/**
 * Overview
 * Shows available section components
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Group Admin Sections</h2>
            <p className="body1-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                Group Admin uses shared PLUS DS layout components. No custom sections are currently defined for this spec.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>Shared Layout Components Used</h4>
                    <ul className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', paddingLeft: '24px', margin: 0 }}>
                        <li><strong>PageLayout</strong>: Main page shell with responsive sidebar</li>
                        <li><strong>TopBar</strong>: Header with breadcrumbs and user avatar</li>
                        <li><strong>Sidebar</strong>: Navigation with Training, Toolkit, and Admin sections</li>
                    </ul>
                    <p className="body3-txt" style={{ marginTop: '12px', color: 'var(--color-on-surface-variant)' }}>
                        See Specs/Universal for detailed documentation.
                    </p>
                </div>
            </div>
        </div>
    ),
};
