/**
 * GroupInfoPage - Admin Group Admin Page
 * 
 * Full page layout for Group Info with groups table and pagination.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-263800
 */

import React, { useState } from 'react';
import GroupInfoPage from './GroupInfoPage';
import { linkTo } from '@storybook/addon-links';
import './GroupInfoPage.scss';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';


export default {
    title: 'Specs/Admin/Group Admin/Pages/GroupInfoPage',
    component: GroupInfoPage,
    tags: ['autodocs'],
    decorators: [
        (Story, context) => (
            <ResponsiveFrame breakpoint={context.args.breakpoint || 'xl'}>
                <Story />
            </ResponsiveFrame>
        ),
    ],

    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: `Full page layout for the Group Info section of Group Admin. Includes tab navigation (Group Info / Training Progress), title with Add Group button, groups table with pagination.

## Figma Reference
Node ID: 258-263800

## Features
- Tab navigation between Group Info and Training Progress
- Add Group button
- Groups table with expandable rows
- Pagination with entry count
`,
            },
        },
    },
    argTypes: {
        currentPage: {
            control: { type: 'number', min: 1, max: 20 },
            description: 'Current page for pagination',
            table: { category: 'Pagination' },
        },
        totalPages: {
            control: { type: 'number', min: 1, max: 100 },
            description: 'Total number of pages',
            table: { category: 'Pagination' },
        },
        totalEntries: {
            control: { type: 'number', min: 1, max: 1000 },
            description: 'Total number of entries',
            table: { category: 'Pagination' },
        },
        breakpoint: {
            control: { type: 'select' },
            options: ['md', 'lg', 'xl'],
            description: 'Responsive breakpoint',
            table: { category: 'Responsive' },
        },
    },
    args: {},
};

/**
 * Docs
 * Documentation for GroupInfoPage component
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>GroupInfoPage</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Description</h4>
                    <p className="body2-txt">
                        Full page layout for the Group Info section of Group Admin. Uses the PageLayout
                        shell with TopBar and Sidebar. Contains tab navigation for switching between
                        Group Info and Training Progress views, a title section with Add Group button,
                        the groups table, and pagination footer.
                    </p>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Props</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li><strong>groups</strong>: Array of group objects (id, name, size)</li>
                        <li><strong>currentPage</strong>: Current pagination page (default: 1)</li>
                        <li><strong>totalPages</strong>: Total number of pages (default: 20)</li>
                        <li><strong>totalEntries</strong>: Total number of entries (default: 200)</li>
                        <li><strong>onPageChange</strong>: Callback when page changes</li>
                        <li><strong>onTabChange</strong>: Callback when tab changes</li>
                        <li><strong>onAddGroup</strong>: Callback when Add Group is clicked</li>
                        <li><strong>onEditGroup</strong>: Callback when Edit is clicked</li>
                        <li><strong>onViewProgress</strong>: Callback when View Progress is clicked</li>
                    </ul>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Figma Reference</h4>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Node ID: 258-263800
                    </p>
                </section>
            </div>
        </div>
    ),
};

/**
 * Overview
 * Shows full page with default data matching Figma design
 */
export const Overview = {
    args: {
        breakpoint: 'xl'
    },
    render: (args) => (
        <GroupInfoPage
            groups={[
                { id: 1, name: 'Math Masters', size: 4 },
                { id: 2, name: 'Math Masters', size: 4 },
                { id: 3, name: 'Math Masters', size: 4 },
                { id: 4, name: 'Math Masters', size: 4 },
                { id: 5, name: 'Math Masters', size: 4 },
                { id: 6, name: 'Math Masters', size: 4 },
                { id: 7, name: 'Math Masters', size: 4 },
                { id: 8, name: 'Math Masters', size: 4 },
                { id: 9, name: 'Math Masters', size: 4 },
                { id: 10, name: 'Math Masters', size: 4 },
                { id: 11, name: 'Math Masters', size: 4 },
                { id: 12, name: 'Math Masters', size: 4 },
                { id: 13, name: 'Math Masters', size: 4 },
                { id: 14, name: 'Math Masters', size: 4 },
                { id: 15, name: 'Math Masters', size: 4 },
                { id: 16, name: 'Math Masters', size: 4 },
                { id: 17, name: 'Math Masters', size: 4 },
                { id: 18, name: 'Math Masters', size: 4 },
                { id: 19, name: 'Math Masters', size: 4 },
                { id: 20, name: 'Math Masters', size: 4 },
            ]}
            currentPage={1}
            totalPages={10}
            totalEntries={200}
            onPageChange={(page) => console.log('Page changed:', page)}
            onTabChange={(tab) => {
                console.log('Tab changed:', tab);
                const linkMap = {
                    'group-info': ['Specs/Admin/Group Admin/Pages/GroupInfoPage', 'Overview'],
                    'training-progress': ['Specs/Admin/Group Admin/Pages/GroupTrainingProgressPage', 'Overview']
                };
                if (linkMap[tab]) linkTo(linkMap[tab][0], linkMap[tab][1])();
            }}
            onAddGroup={() => console.log('Add Group clicked')}
            onEditGroup={(group) => console.log('Edit clicked:', group)}
            onViewProgress={(group) => console.log('View Progress clicked:', group)}
        />
    ),
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    render: (args) => {
        const [currentPage, setCurrentPage] = useState(args.currentPage);

        return (
            <GroupInfoPage
                groups={[
                    { id: 1, name: 'Science Explorers', size: 6 },
                    { id: 2, name: 'Reading Champions', size: 5 },
                    { id: 3, name: 'Writing Warriors', size: 3 },
                    { id: 4, name: 'History Buffs', size: 7 },
                    { id: 5, name: 'Art Appreciation', size: 4 },
                    { id: 6, name: 'Music Makers', size: 5 },
                    { id: 7, name: 'Coding Club', size: 8 },
                    { id: 8, name: 'Language Learners', size: 6 },
                    { id: 9, name: 'Study Group Alpha', size: 4 },
                    { id: 10, name: 'Debate Team', size: 5 },
                    { id: 11, name: 'Math Whizzes', size: 6 },
                    { id: 12, name: 'Geography Geeks', size: 5 },
                    { id: 13, name: 'Chess Club', size: 4 },
                    { id: 14, name: 'Robotics Team', size: 8 },
                    { id: 15, name: 'Drama Club', size: 10 },
                    { id: 16, name: 'Book Club', size: 5 },
                    { id: 17, name: 'Environment Club', size: 7 },
                    { id: 18, name: 'Photography', size: 4 },
                    { id: 19, name: 'Student Council', size: 12 },
                    { id: 20, name: 'Yearbook Committee', size: 6 },
                ]}
                currentPage={currentPage}
                totalPages={args.totalPages}
                totalEntries={args.totalEntries}
                onPageChange={(page) => {
                    setCurrentPage(page);
                    console.log('Page changed:', page);
                }}
                onTabChange={(tab) => {
                    console.log('Tab changed:', tab);
                    const linkMap = {
                        'group-info': ['Specs/Admin/Group Admin/Pages/GroupInfoPage', 'Interactive'],
                        'training-progress': ['Specs/Admin/Group Admin/Pages/GroupTrainingProgressPage', 'Interactive']
                    };
                    if (linkMap[tab]) linkTo(linkMap[tab][0], linkMap[tab][1])();
                }}
                onAddGroup={() => console.log('Add Group clicked')}
                onEditGroup={(group) => console.log('Edit clicked:', group)}
                onViewProgress={(group) => console.log('View Progress clicked:', group)}
            />
        );
    },
    args: {
        breakpoint: 'xl',
        currentPage: 1,
        totalPages: 10,
        totalEntries: 200,
    },
};
