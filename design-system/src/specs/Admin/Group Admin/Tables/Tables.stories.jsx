/**
 * Admin/Group Admin Specs - Tables Overview
 * 
 * Table components for Group Admin.
 * 
 * Components:
 * - GroupsTable: Table showing group details with columns: Group Name, Group Size, Action
 * - GroupTrainingProgressTable: Table showing training progress by competency with circular indicators
 */

import React from 'react';

export default {
    title: 'Specs/Admin/Group Admin/Tables',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Table components for Group Admin interface.

## Available Tables

| Table | Description | Figma Node |
|-------|-------------|------------|
| GroupsTable | Table showing group details with name, size badge, and actions | 322-155598 |
| GroupTrainingProgressTable | Hierarchical table showing training progress by competency area | 1107-269190 |
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
            <h2 className="h2" style={{ marginBottom: '24px' }}>Group Admin Tables</h2>
            <p className="body1-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                Table components for Group Admin. Navigate to individual tables for detailed documentation.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>GroupsTable</h4>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Table showing group details with columns for Group Name (with expand/collapse), 
                        Group Size (info badge), and Action buttons (Edit, View Progress). Supports 
                        sortable columns and row hover states.
                    </p>
                    <p className="body3-txt" style={{ marginTop: '8px', color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 322-155598
                    </p>
                </div>

                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>GroupTrainingProgressTable</h4>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Hierarchical table showing training progress by SMART competency area. 
                        Features 3 levels of nesting (competency → lesson → sub-lesson), circular 
                        progress indicators for Completion, Accuracy, and Rating metrics, and 
                        Assign action buttons.
                    </p>
                    <p className="body3-txt" style={{ marginTop: '8px', color: 'var(--color-on-surface-variant)' }}>
                        Figma Node: 1107-269190
                    </p>
                </div>
            </div>
        </div>
    ),
};
