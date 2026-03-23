/**
 * Admin/Group Admin Specs - Pages Overview
 * 
 * Page components for Group Admin.
 * 
 * Components:
 * - GroupInfoPage: Full page with groups table and pagination
 * - GroupTrainingProgressPage: Full page with overview cards and training progress table
 */

import React from 'react';

export default {
    title: 'Specs/Admin/Group Admin/Pages',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Page components for Group Admin interface.

## Available Pages

| Page | Description | Figma Node |
|------|-------------|------------|
| GroupInfoPage | Full page with groups table, tab navigation, and pagination | 258-263800 |
| GroupTrainingProgressPage | Full page with overview cards and hierarchical training progress table | 531-62962 |
`
            },
        },
    },
};

/**
 * Overview
 * Shows available page components
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Group Admin Pages</h2>
            <p className="body1-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                Page components for Group Admin. Navigate to individual pages for detailed documentation.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>GroupInfoPage</h4>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Full page layout for the Group Info section. Uses PageLayout shell with TopBar 
                        and Sidebar. Contains tab navigation (Group Info / Training Progress), title 
                        section with Add Group button, groups table, and pagination footer.
                    </p>
                    <p className="body3-txt" style={{ marginTop: '8px', color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 258-263800
                    </p>
                </div>

                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>GroupTrainingProgressPage</h4>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Full page layout for the Group Training Progress section. Uses PageLayout shell 
                        with TopBar and Sidebar. Contains tab navigation, title section with group 
                        filter dropdown, overview cards (Student Need, Completion Rate, Avg Accuracy, 
                        Avg Time Spent), and hierarchical training progress table.
                    </p>
                    <p className="body3-txt" style={{ marginTop: '8px', color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 531-62962
                    </p>
                </div>
            </div>
        </div>
    ),
};
