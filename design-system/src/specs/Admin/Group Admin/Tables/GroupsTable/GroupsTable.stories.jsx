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
    tags: ['!dev', '!autodocs'],
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
