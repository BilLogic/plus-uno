/**
 * GroupsTable - Admin Group Admin Table
 * 
 * Table showing group details with columns: Group Name, Group Size, Action.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=322-155598
 */

import React, { useState } from 'react';
import GroupsTable from './GroupsTable';
import './GroupsTable.scss';

export default {
    title: 'Specs/Admin/Group Admin/Tables/GroupsTable',
    component: GroupsTable,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Table component for displaying group information. Shows group name with expand/collapse functionality, group size badge, and action buttons (Edit, View Progress).

## Figma Reference
Node ID: 322-155598

## Features
- Expandable group rows
- Sortable columns (Group Name, Group Size)
- Action buttons for Edit and View Progress
- Hover states for rows
- Info badge showing group size
`,
            },
        },
    },
    argTypes: {
        sortable: {
            control: 'boolean',
            description: 'Enable sortable columns',
            table: { category: 'Behavior' },
        },
        hover: {
            control: 'boolean',
            description: 'Enable row hover effects',
            table: { category: 'Behavior' },
        },
    },
};

/**
 * Docs
 * Documentation for GroupsTable component
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>GroupsTable</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Description</h4>
                    <p className="body2-txt">
                        Table component for displaying group information in the Group Admin section.
                        Each row shows a group name (with expand/collapse), group size as an info badge,
                        and action buttons for Edit and View Progress operations.
                    </p>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Props</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li><strong>groups</strong>: Array of group objects (id, name, size)</li>
                        <li><strong>sortable</strong>: Enable sortable columns (default: true)</li>
                        <li><strong>hover</strong>: Enable row hover effects (default: true)</li>
                        <li><strong>onEditClick</strong>: Callback when Edit button is clicked</li>
                        <li><strong>onViewProgressClick</strong>: Callback when View Progress is clicked</li>
                        <li><strong>onExpandClick</strong>: Callback when expand/collapse is clicked</li>
                    </ul>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Figma Reference</h4>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Node ID: 322-155598
                    </p>
                </section>
            </div>
        </div>
    ),
};

/**
 * Overview
 * Shows table with multiple rows matching Figma design
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md, 24px)' }}>
            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Groups Table</h6>
                <GroupsTable
                    groups={[
                        { id: 1, name: 'Math Masters', size: 4 },
                        { id: 2, name: 'Science Explorers', size: 6 },
                        { id: 3, name: 'Reading Champions', size: 5 },
                        { id: 4, name: 'Writing Warriors', size: 3 },
                        { id: 5, name: 'History Buffs', size: 7 },
                        { id: 6, name: 'Art Appreciation', size: 4 },
                        { id: 7, name: 'Music Makers', size: 5 },
                        { id: 8, name: 'Coding Club', size: 8 },
                        { id: 9, name: 'Language Learners', size: 6 },
                        { id: 10, name: 'Study Group Alpha', size: 4 },
                    ]}
                    onEditClick={(group) => console.log('Edit clicked:', group)}
                    onViewProgressClick={(group) => console.log('View Progress clicked:', group)}
                />
            </section>
        </div>
    ),
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    render: (args) => {
        const [groups] = useState([
            { id: 1, name: 'Math Masters', size: 4 },
            { id: 2, name: 'Science Explorers', size: 6 },
            { id: 3, name: 'Reading Champions', size: 5 },
            { id: 4, name: 'Writing Warriors', size: 3 },
            { id: 5, name: 'History Buffs', size: 7 },
        ]);

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Groups Table - Interactive</h6>
                <GroupsTable
                    groups={groups}
                    sortable={args.sortable}
                    hover={args.hover}
                    onEditClick={(group) => console.log('Edit clicked:', group)}
                    onViewProgressClick={(group) => console.log('View Progress clicked:', group)}
                    onExpandClick={(groupId) => console.log('Expand clicked:', groupId)}
                />
            </div>
        );
    },
    args: {
        sortable: true,
        hover: true,
    },
};
