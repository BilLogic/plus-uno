/**
 * Admin/Group Admin Specs - Elements Overview
 * 
 * Element components for Group Admin.
 * Currently no custom elements defined - uses shared PLUS DS components.
 */

import React from 'react';

export default {
    title: 'Specs/Admin/Group Admin/Elements',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Element components for Group Admin interface.

## Shared Components Used

Group Admin uses the following shared PLUS DS components:
- **Button**: For actions (Edit, View Progress, Assign, Add Group)
- **Badge**: For displaying group size as info badge
- **StaticBadgeSmart**: For SMART competency badges
- **NavTabs**: For tab navigation between Group Info and Training Progress

See the individual component documentation for more details.
`
            },
        },
    },
};

/**
 * Overview
 * Shows available element components
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Group Admin Elements</h2>
            <p className="body1-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                Group Admin uses shared PLUS DS components. No custom elements are currently defined for this spec.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>Shared Components Used</h4>
                    <ul className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', paddingLeft: '24px', margin: 0 }}>
                        <li><strong>Button</strong>: Action buttons (Edit, View Progress, Assign, Add Group)</li>
                        <li><strong>Badge</strong>: Info badge for displaying group size</li>
                        <li><strong>StaticBadgeSmart</strong>: SMART competency area badges</li>
                        <li><strong>NavTabs</strong>: Tab navigation component</li>
                        <li><strong>Pagination</strong>: Page navigation component</li>
                    </ul>
                </div>
            </div>
        </div>
    ),
};
