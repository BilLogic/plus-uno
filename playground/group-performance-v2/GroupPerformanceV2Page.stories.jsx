/**
 * GroupPerformanceV2Page Stories - Prototype
 * High-fidelity prototype for Group Performance v2 with pie chart, bar chart, dropdown, and 20-row table
 */

import React from 'react';
import GroupPerformanceV2Page from './GroupPerformanceV2Page';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';

// Sample data for 20 groups (matching wireframe requirement)
const sampleGroups = [
    { id: 1, groupName: 'Morning Cohort A', signedUp: 'Yes', attendance: 92, sessions: 45, students: 28, badge: 'Lead' },
    { id: 2, groupName: 'Afternoon Cohort B', signedUp: 'Yes', attendance: 85, sessions: 42, students: 25, badge: null },
    { id: 3, groupName: 'Evening Cohort C', signedUp: 'Yes', attendance: 78, sessions: 38, students: 22, badge: null },
    { id: 4, groupName: 'Weekend Cohort D', signedUp: 'Yes', attendance: 88, sessions: 40, students: 26, badge: null },
    { id: 5, groupName: 'Advanced Math Group', signedUp: 'Yes', attendance: 94, sessions: 48, students: 30, badge: 'Lead' },
    { id: 6, groupName: 'Beginning Reading', signedUp: 'Yes', attendance: 81, sessions: 36, students: 20, badge: null },
    { id: 7, groupName: 'Science Explorers', signedUp: 'No', attendance: null, sessions: null, students: 18, badge: null },
    { id: 8, groupName: 'Writing Workshop', signedUp: 'Yes', attendance: 89, sessions: 44, students: 27, badge: null },
    { id: 9, groupName: 'Creative Arts Studio', signedUp: 'Yes', attendance: 76, sessions: 32, students: 19, badge: null },
    { id: 10, groupName: 'STEM Innovators', signedUp: 'Yes', attendance: 91, sessions: 46, students: 29, badge: 'Lead' },
    { id: 11, groupName: 'Language Learners', signedUp: 'Yes', attendance: 83, sessions: 39, students: 24, badge: null },
    { id: 12, groupName: 'History Buffs', signedUp: 'Yes', attendance: 72, sessions: 34, students: 21, badge: null },
    { id: 13, groupName: 'Music Makers', signedUp: 'Yes', attendance: 87, sessions: 41, students: 23, badge: null },
    { id: 14, groupName: 'Drama Club', signedUp: 'No', attendance: null, sessions: null, students: 17, badge: null },
    { id: 15, groupName: 'Chess Champions', signedUp: 'Yes', attendance: 95, sessions: 50, students: 15, badge: 'Lead' },
    { id: 16, groupName: 'Debate Society', signedUp: 'Yes', attendance: 79, sessions: 37, students: 16, badge: null },
    { id: 17, groupName: 'Environmental Club', signedUp: 'Yes', attendance: 84, sessions: 43, students: 22, badge: null },
    { id: 18, groupName: 'Coding Academy', signedUp: 'Yes', attendance: 90, sessions: 47, students: 28, badge: null },
    { id: 19, groupName: 'Photography Guild', signedUp: 'Yes', attendance: 68, sessions: 30, students: 14, badge: null },
    { id: 20, groupName: 'Book Club', signedUp: 'Yes', attendance: 86, sessions: 35, students: 20, badge: null },
];

export default {
    title: 'Playground/Ashley/Group Performance v2',
    component: GroupPerformanceV2Page,
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
                component: `High-fidelity prototype for Group Performance v2 page in Group Admin section.

## Overview
Full page layout matching wireframe specifications with:
- Tab navigation (Group Info / Training Progress / Performance / Reports)
- Action buttons (Email Groups, Export Data)
- Two side-by-side charts: Group Attendance (Pie) and Session Distribution (Bar)
- Performance Details section with "All Groups" Dropdown button
- Full table with 20 rows following TutorsPerformanceTable pattern
- Pagination footer

## Based On
- **Wireframe**: Provided wireframe showing sidebar, tabs, charts, dropdown filter, and table
- **Reference Patterns**: 
  - TutorPerformancePage (page layout)
  - TutorsPerformanceTable (table styling with badges)
- **Design System**: PLUS components and tokens

## Features
- Responsive breakpoint testing (md, lg, xl)
- Interactive charts with realistic data
- 20 clickable table rows with color-coded attendance badges
- "All Groups" Dropdown button filter
- White card backgrounds per design system
- Exact spacing from wireframe using PLUS tokens

## Table Features
- Group Name column with optional Lead badge
- Signed-Up column with Yes/No badges
- % Attendance with color-coded badges (green ≥80%, yellow 50-79%, red <50%)
- Sessions count badges
- Students count badges
- Null handling for groups not signed up

## Spacing Tokens Used
- Page padding: \`var(--size-section-pad-y-lg, 24px)\`
- Section gaps: \`var(--size-section-gap-lg, 24px)\`
- Element gaps: \`var(--size-element-gap-md, 16px)\`
- Table cell padding: \`var(--table-cell-y, 8px) var(--table-cell-x, 10px)\`
`,
            },
        },
    },
    argTypes: {
        breakpoint: {
            control: { type: 'select' },
            options: ['md', 'lg', 'xl'],
            description: 'Responsive breakpoint',
            table: { category: 'Responsive' },
        },
        attendancePercentage: {
            control: { type: 'range', min: 0, max: 100, step: 1 },
            description: 'Attendance percentage for pie chart',
            table: { category: 'Chart Data' },
        },
        loading: {
            control: 'boolean',
            description: 'Loading state for charts',
            table: { category: 'State' },
        },
        activeTab: {
            control: { type: 'select' },
            options: ['groupInfo', 'trainingProgress', 'performance', 'reports'],
            description: 'Active tab',
            table: { category: 'Navigation' },
        },
        selectedGroup: {
            control: { type: 'select' },
            options: ['All Groups', 'Morning Cohorts', 'Afternoon Cohorts', 'Evening Cohorts', 'Weekend Cohorts'],
            description: 'Selected group filter',
            table: { category: 'Filters' },
        },
        currentPage: {
            control: { type: 'number', min: 1 },
            description: 'Current page number',
            table: { category: 'Pagination' },
        },
        totalPages: {
            control: { type: 'number', min: 1 },
            description: 'Total pages',
            table: { category: 'Pagination' },
        },
        totalEntries: {
            control: { type: 'number', min: 1 },
            description: 'Total entries',
            table: { category: 'Pagination' },
        },
    },
};

/**
 * Default View
 * Shows the complete Group Performance v2 page with 20 table rows
 */
export const Default = {
    args: {
        breakpoint: 'xl',
        groups: sampleGroups,
        attendancePercentage: 87,
        loading: false,
        currentPage: 1,
        totalPages: 10,
        totalEntries: 200,
        selectedGroup: 'All Groups',
        activeTab: 'performance',
        onPageChange: (page) => console.log('Page changed:', page),
        onRowClick: (group) => console.log('Row clicked:', group),
        onGroupFilterChange: (group) => console.log('Group filter:', group),
        onTabChange: (tab) => console.log('Tab changed:', tab),
        onEmailGroups: () => console.log('Email groups clicked'),
        onExportData: () => console.log('Export data clicked'),
    },
};

/**
 * Loading State
 * Shows charts in loading state
 */
export const Loading = {
    args: {
        ...Default.args,
        loading: true,
    },
};

/**
 * With Filter Applied
 * Shows page with Morning Cohorts filter selected
 */
export const WithFilter = {
    args: {
        ...Default.args,
        selectedGroup: 'Morning Cohorts',
    },
};

/**
 * Group Info Tab
 * Shows page with Group Info tab active
 */
export const GroupInfoTab = {
    args: {
        ...Default.args,
        activeTab: 'groupInfo',
    },
};

/**
 * Tablet Breakpoint (lg)
 * Shows responsive layout at 1024px
 */
export const TabletView = {
    args: {
        ...Default.args,
        breakpoint: 'lg',
    },
};

/**
 * Mobile Breakpoint (md)
 * Shows responsive layout at 768px
 */
export const MobileView = {
    args: {
        ...Default.args,
        breakpoint: 'md',
    },
};

/**
 * High Attendance
 * Shows page with 95% attendance in pie chart
 */
export const HighAttendance = {
    args: {
        ...Default.args,
        attendancePercentage: 95,
    },
};

/**
 * Low Attendance
 * Shows page with 45% attendance in pie chart
 */
export const LowAttendance = {
    args: {
        ...Default.args,
        attendancePercentage: 45,
    },
};

/**
 * Page 2
 * Shows second page of pagination
 */
export const Page2 = {
    args: {
        ...Default.args,
        currentPage: 2,
    },
};
