/**
 * SessionOverviewSection - Admin Session Admin Section
 * 
 * Section displaying 5 donut charts for session metrics.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=987-127692
 */

import React from 'react';
import SessionOverviewSection from './SessionOverviewSection';
import './SessionOverviewSection.scss';

export default {
    title: 'Specs/Admin/Session/Sections/Session Overview Section',
    component: SessionOverviewSection,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Section component displaying 5 donut charts for session metrics overview.

## Figma Reference
Node ID: 987-127692

## Charts
1. **Time Allocation by Student Needs** - Pink donut showing motivation needs distribution
2. **Student Attendance** - Green donut showing attendance rate
3. **Student Engagement** - Green donut showing engagement rate
4. **Tutor Attendance** - Green donut showing tutor attendance
5. **Check-in Completion** - Green donut showing check-in completion rate

## Features
- Horizontally scrollable on narrow viewports
- Info tooltips for each chart
- Color-coded legends
`,
            },
        },
    },
    argTypes: {
        timeAllocation: {
            control: { type: 'range', min: 0, max: 100 },
            description: 'Time Allocation percentage',
            table: { category: 'Data' },
        },
        studentAttendance: {
            control: { type: 'range', min: 0, max: 100 },
            description: 'Student Attendance percentage',
            table: { category: 'Data' },
        },
        studentEngagement: {
            control: { type: 'range', min: 0, max: 100 },
            description: 'Student Engagement percentage',
            table: { category: 'Data' },
        },
        tutorAttendance: {
            control: { type: 'range', min: 0, max: 100 },
            description: 'Tutor Attendance percentage',
            table: { category: 'Data' },
        },
        checkInCompletion: {
            control: { type: 'range', min: 0, max: 100 },
            description: 'Check-in Completion percentage',
            table: { category: 'Data' },
        },
    },
};

/**
 * Overview - Shows section matching Figma design
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', backgroundColor: 'var(--color-surface-container, #f5f5f5)' }}>
            <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Session Overview Charts</h6>
            <SessionOverviewSection
                timeAllocation={60}
                studentAttendance={99}
                studentEngagement={99}
                tutorAttendance={99}
                checkInCompletion={99}
            />
        </div>
    ),
};

/**
 * Interactive - Interactive playground with controls
 */
export const Interactive = {
    render: (args) => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', backgroundColor: 'var(--color-surface-container, #f5f5f5)' }}>
            <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>
                Session Overview Charts - Interactive
            </h6>
            <SessionOverviewSection
                timeAllocation={args.timeAllocation}
                studentAttendance={args.studentAttendance}
                studentEngagement={args.studentEngagement}
                tutorAttendance={args.tutorAttendance}
                checkInCompletion={args.checkInCompletion}
            />
        </div>
    ),
    args: {
        timeAllocation: 60,
        studentAttendance: 99,
        studentEngagement: 99,
        tutorAttendance: 99,
        checkInCompletion: 99,
    },
};
