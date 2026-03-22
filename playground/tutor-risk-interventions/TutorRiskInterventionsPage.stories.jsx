/**
 * TutorRiskInterventionsPage Stories
 * 
 * High-fidelity prototype for Tutor Risk & Interventions page under Tutor Admin.
 * Based on wireframe with: tabs, summary stats, dual charts, 3 filter dropdowns, and table with 20 rows.
 */

import React from 'react';
import TutorRiskInterventionsPage from './TutorRiskInterventionsPage';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';
import './TutorRiskInterventionsPage.scss';

export default {
    title: 'Playground/Ashley/Tutor Risk & Interventions',
    component: TutorRiskInterventionsPage,
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
                component: `
# Tutor Risk & Interventions Page

High-fidelity prototype for monitoring tutor risk levels and managing interventions under Tutor Admin section.

## Wireframe Reference

The layout follows the provided hand-drawn wireframe:

\`\`\`
┌────────────────────────────────────────────────┐
│  XXXX (Tabs - 4 tabs)                          │
├──────────────┬─────────────────────────────────┤
│  Stat Card   │  Stat Card                      │
│  (At Risk)   │  (Interventions)                │
├──────────────┴┬────────────────────────────────┤
│  📈 Line Chart│  📊 Bar Chart                  │
│  Risk Trends  │  Interventions by Type         │
├───────────────┴────────────────────────────────┤
│  XXX Title   [Group ▼] [Risk Level ▼] [Date ▼] │
├────────────────────────────────────────────────┤
│  Table (20 rows)                               │
│  ────────────────────────────────────────────  │
│  Row 1 - Tutor risk data                       │
│  Row 2                                         │
│  ...                                           │
│  Row 20                                        │
└────────────────────────────────────────────────┘
\`\`\`

## Reference Patterns

This prototype is built using PLUS design system components:
- **TutorDataCard**: Card styling (white background, 12px radius, 24px padding)
- **TutorsPerformanceTable**: Table styling (transparent backgrounds, hover states)
- **TutorCompliance2Page**: Overall page layout structure
- **ExportSearchFilterBar**: Filter dropdown pattern

## Features

### Tab Navigation
- Tutor Performance
- Status And Warnings
- Risk & Interventions (active)
- Training Progress

### Summary Stats
- **Tutors At Risk**: Count of tutors flagged as at-risk
- **Active Interventions**: Count of ongoing interventions

### Chart Cards
- **Risk & Intervention Trends**: Line chart showing at-risk tutors vs active interventions over time
- **Interventions by Type**: Stacked bar chart showing intervention distribution by risk level

### Filter Controls (3 Dropdowns)
- **Group Dropdown**: Filter by school/group
- **Risk Level Dropdown**: Filter by High/Medium/Low risk
- **Date Range Dropdown**: Filter by time period

### Data Table (20 rows)
- Tutor Name, Group, Risk Level, Risk Score
- Intervention Type, Intervention Date, Status
- Color-coded badges for risk levels and statuses
- Clickable rows for drill-down
- Pagination support
                `,
            },
        },
    },
    argTypes: {
        breakpoint: {
            control: { type: 'select' },
            options: ['md', 'lg', 'xl'],
            description: 'Responsive breakpoint (md: 768px, lg: 1024px, xl: 1440px)',
            table: { category: 'Responsive' },
        },
        activeTab: {
            control: 'select',
            options: ['performance', 'statusWarnings', 'riskInterventions', 'trainingProgress'],
            description: 'Active tab in navigation',
        },
        totalAtRisk: {
            control: { type: 'number', min: 0, max: 100 },
            description: 'Total tutors at risk',
        },
        totalInterventions: {
            control: { type: 'number', min: 0, max: 100 },
            description: 'Total active interventions',
        },
        selectedGroup: {
            control: 'select',
            options: ['All Groups', 'Lincoln Elementary', 'Washington Middle', 'Jefferson High'],
            description: 'Selected group filter',
        },
        selectedRiskLevel: {
            control: 'select',
            options: ['All Risk Levels', 'High', 'Medium', 'Low'],
            description: 'Selected risk level filter',
        },
        selectedDateRange: {
            control: 'select',
            options: ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'This Year'],
            description: 'Selected date range filter',
        },
        currentPage: {
            control: { type: 'number', min: 1, max: 10 },
            description: 'Current page number',
        },
        totalPages: {
            control: { type: 'number', min: 1, max: 10 },
            description: 'Total number of pages',
        },
    },
};

/**
 * Default Story - Shows the Tutor Risk & Interventions page with 20 rows
 * Matches the wireframe layout exactly
 */
export const Default = {
    args: {
        breakpoint: 'xl',
        activeTab: 'riskInterventions',
        totalAtRisk: 12,
        totalInterventions: 28,
        selectedGroup: 'All Groups',
        selectedRiskLevel: 'All Risk Levels',
        selectedDateRange: 'Last 30 Days',
        currentPage: 1,
        totalPages: 1,
        totalEntries: 20,
        onTabChange: (tab) => console.log('Tab changed:', tab),
        onRowClick: (tutor) => console.log('Row clicked:', tutor),
        onPageChange: (page) => console.log('Page changed:', page),
        onGroupChange: (group) => console.log('Group changed:', group),
        onRiskLevelChange: (level) => console.log('Risk level changed:', level),
        onDateRangeChange: (range) => console.log('Date range changed:', range),
    },
};

/**
 * High Risk Focus
 * Shows page filtered to high-risk tutors only
 */
export const HighRiskFocus = {
    args: {
        ...Default.args,
        selectedRiskLevel: 'High',
        totalAtRisk: 8,
        totalInterventions: 18,
        tutors: [
            { id: 1, name: 'Amelia Blue', group: 'Lincoln Elementary', riskLevel: 'High', riskScore: 85, interventionType: 'Performance Review', interventionDate: 'Jan 15, 2026', status: 'In Progress' },
            { id: 2, name: 'Daniel Black', group: 'Washington Middle', riskLevel: 'High', riskScore: 91, interventionType: 'Immediate Review', interventionDate: 'Jan 10, 2026', status: 'In Progress' },
            { id: 3, name: 'Benjamin Green', group: 'Jefferson High', riskLevel: 'High', riskScore: 78, interventionType: 'Training Required', interventionDate: 'Jan 12, 2026', status: 'Completed' },
            { id: 4, name: 'Fiona Gray', group: 'Washington Middle', riskLevel: 'High', riskScore: 82, interventionType: 'Performance Plan', interventionDate: 'Jan 08, 2026', status: 'In Progress' },
            { id: 5, name: 'Isaac Miller', group: 'Washington Middle', riskLevel: 'High', riskScore: 88, interventionType: 'Supervisor Meeting', interventionDate: 'Jan 11, 2026', status: 'In Progress' },
            { id: 6, name: 'Lily Chen', group: 'Washington Middle', riskLevel: 'High', riskScore: 79, interventionType: 'Urgent Coaching', interventionDate: 'Jan 09, 2026', status: 'Completed' },
            { id: 7, name: 'Nora Evans', group: 'Lincoln Elementary', riskLevel: 'High', riskScore: 86, interventionType: 'Intervention Plan', interventionDate: 'Jan 07, 2026', status: 'In Progress' },
            { id: 8, name: 'Quinn Taylor', group: 'Lincoln Elementary', riskLevel: 'High', riskScore: 92, interventionType: 'Critical Review', interventionDate: 'Jan 06, 2026', status: 'In Progress' },
        ],
        totalEntries: 8,
        totalPages: 1,
    },
    parameters: {
        docs: {
            description: {
                story: 'Shows only high-risk tutors requiring immediate attention.',
            },
        },
    },
};

/**
 * Lincoln Elementary Group
 * Shows page filtered to Lincoln Elementary school
 */
export const LincolnElementaryGroup = {
    args: {
        ...Default.args,
        selectedGroup: 'Lincoln Elementary',
        totalAtRisk: 4,
        totalInterventions: 10,
        tutors: [
            { id: 1, name: 'Amelia Blue', group: 'Lincoln Elementary', riskLevel: 'High', riskScore: 85, interventionType: 'Performance Review', interventionDate: 'Jan 15, 2026', status: 'In Progress' },
            { id: 2, name: 'Charlotte Rose', group: 'Lincoln Elementary', riskLevel: 'Low', riskScore: 32, interventionType: 'Check-in Call', interventionDate: 'Jan 20, 2026', status: 'Scheduled' },
            { id: 3, name: 'Ethan Cole', group: 'Lincoln Elementary', riskLevel: 'Low', riskScore: 28, interventionType: 'Observation', interventionDate: 'Jan 25, 2026', status: 'Scheduled' },
            { id: 4, name: 'Hannah Brown', group: 'Lincoln Elementary', riskLevel: 'Low', riskScore: 22, interventionType: 'Monthly Check-in', interventionDate: 'Jan 28, 2026', status: 'Scheduled' },
            { id: 5, name: 'Kevin Lee', group: 'Lincoln Elementary', riskLevel: 'Low', riskScore: 35, interventionType: 'Peer Collaboration', interventionDate: 'Jan 26, 2026', status: 'Scheduled' },
            { id: 6, name: 'Nora Evans', group: 'Lincoln Elementary', riskLevel: 'High', riskScore: 86, interventionType: 'Intervention Plan', interventionDate: 'Jan 07, 2026', status: 'In Progress' },
            { id: 7, name: 'Quinn Taylor', group: 'Lincoln Elementary', riskLevel: 'High', riskScore: 92, interventionType: 'Critical Review', interventionDate: 'Jan 06, 2026', status: 'In Progress' },
        ],
        totalEntries: 7,
        totalPages: 1,
    },
    parameters: {
        docs: {
            description: {
                story: 'Shows tutors from Lincoln Elementary school group.',
            },
        },
    },
};

/**
 * Improving Scenario
 * Shows positive trend with decreasing risk
 */
export const ImprovingScenario = {
    args: {
        ...Default.args,
        totalAtRisk: 5,
        totalInterventions: 15,
        riskTrendData: [
            { label: 'Week 1', values: [18, 30] },
            { label: 'Week 2', values: [15, 28] },
            { label: 'Week 3', values: [12, 25] },
            { label: 'Week 4', values: [10, 22] },
            { label: 'Week 5', values: [7, 18] },
            { label: 'Week 6', values: [5, 15] },
        ],
        interventionDistributionData: [
            { label: 'Review', values: [2, 3, 5] },
            { label: 'Coaching', values: [1, 2, 4] },
            { label: 'Training', values: [1, 2, 3] },
            { label: 'Support', values: [1, 1, 2] },
        ],
    },
    parameters: {
        docs: {
            description: {
                story: 'Positive scenario showing declining risk levels and successful interventions.',
            },
        },
    },
};

/**
 * Critical Situation
 * Shows concerning trend with increasing risk
 */
export const CriticalSituation = {
    args: {
        ...Default.args,
        totalAtRisk: 25,
        totalInterventions: 42,
        riskTrendData: [
            { label: 'Week 1', values: [10, 15] },
            { label: 'Week 2', values: [14, 20] },
            { label: 'Week 3', values: [18, 28] },
            { label: 'Week 4', values: [20, 32] },
            { label: 'Week 5', values: [23, 38] },
            { label: 'Week 6', values: [25, 42] },
        ],
        interventionDistributionData: [
            { label: 'Review', values: [12, 5, 1] },
            { label: 'Coaching', values: [10, 4, 1] },
            { label: 'Training', values: [8, 3, 1] },
            { label: 'Support', values: [6, 2, 1] },
        ],
    },
    parameters: {
        docs: {
            description: {
                story: 'Concerning scenario showing increasing risk levels requiring immediate action.',
            },
        },
    },
};

/**
 * Completed Interventions
 * Shows page filtered to completed interventions
 */
export const CompletedInterventions = {
    args: {
        ...Default.args,
        totalAtRisk: 3,
        totalInterventions: 8,
        tutors: [
            { id: 1, name: 'Benjamin Green', group: 'Jefferson High', riskLevel: 'High', riskScore: 78, interventionType: 'Training Required', interventionDate: 'Jan 12, 2026', status: 'Completed' },
            { id: 2, name: 'Gabriel Stone', group: 'Jefferson High', riskLevel: 'Medium', riskScore: 48, interventionType: 'Training Session', interventionDate: 'Jan 19, 2026', status: 'Completed' },
            { id: 3, name: 'Lily Chen', group: 'Washington Middle', riskLevel: 'High', riskScore: 79, interventionType: 'Urgent Coaching', interventionDate: 'Jan 09, 2026', status: 'Completed' },
            { id: 4, name: 'Penelope Adams', group: 'Jefferson High', riskLevel: 'Medium', riskScore: 61, interventionType: 'Skills Workshop', interventionDate: 'Jan 17, 2026', status: 'Completed' },
        ],
        totalEntries: 4,
        totalPages: 1,
    },
    parameters: {
        docs: {
            description: {
                story: 'Shows tutors with completed interventions.',
            },
        },
    },
};

/**
 * Tablet View
 * Responsive layout at medium breakpoint (768px)
 */
export const TabletView = {
    args: {
        ...Default.args,
        breakpoint: 'md',
    },
    parameters: {
        docs: {
            description: {
                story: 'Responsive view at tablet breakpoint (768px) - charts and stats stack vertically.',
            },
        },
    },
};

/**
 * Laptop View
 * Responsive layout at large breakpoint (1024px)
 */
export const LaptopView = {
    args: {
        ...Default.args,
        breakpoint: 'lg',
    },
    parameters: {
        docs: {
            description: {
                story: 'Responsive view at laptop breakpoint (1024px).',
            },
        },
    },
};

/**
 * Page 2 View
 * Shows pagination in action with page 2 selected
 */
export const Page2 = {
    args: {
        ...Default.args,
        currentPage: 2,
        tutors: [
            { id: 21, name: 'Samuel Martinez', group: 'Lincoln Elementary', riskLevel: 'Medium', riskScore: 54, interventionType: 'Coaching Session', interventionDate: 'Jan 27, 2026', status: 'Scheduled' },
            { id: 22, name: 'Tara Nelson', group: 'Washington Middle', riskLevel: 'Low', riskScore: 30, interventionType: 'Check-in Call', interventionDate: 'Jan 30, 2026', status: 'Scheduled' },
            { id: 23, name: 'Uma Patel', group: 'Jefferson High', riskLevel: 'High', riskScore: 81, interventionType: 'Performance Plan', interventionDate: 'Jan 05, 2026', status: 'In Progress' },
            { id: 24, name: 'Victor Lee', group: 'Lincoln Elementary', riskLevel: 'Medium', riskScore: 50, interventionType: 'Resource Support', interventionDate: 'Jan 22, 2026', status: 'Scheduled' },
            { id: 25, name: 'Wendy Clark', group: 'Washington Middle', riskLevel: 'Low', riskScore: 28, interventionType: 'Observation', interventionDate: 'Jan 31, 2026', status: 'Scheduled' },
            { id: 26, name: 'Xavier Young', group: 'Jefferson High', riskLevel: 'High', riskScore: 87, interventionType: 'Supervisor Meeting', interventionDate: 'Jan 04, 2026', status: 'Completed' },
            { id: 27, name: 'Yolanda Sanchez', group: 'Lincoln Elementary', riskLevel: 'Medium', riskScore: 56, interventionType: 'Progress Review', interventionDate: 'Jan 24, 2026', status: 'Scheduled' },
            { id: 28, name: 'Zachary Turner', group: 'Washington Middle', riskLevel: 'Low', riskScore: 33, interventionType: 'Monthly Check-in', interventionDate: 'Feb 01, 2026', status: 'Scheduled' },
            { id: 29, name: 'Alice Walker', group: 'Jefferson High', riskLevel: 'High', riskScore: 84, interventionType: 'Critical Review', interventionDate: 'Jan 03, 2026', status: 'In Progress' },
            { id: 30, name: 'Brian Harris', group: 'Lincoln Elementary', riskLevel: 'Medium', riskScore: 49, interventionType: 'Training Session', interventionDate: 'Jan 23, 2026', status: 'Completed' },
        ],
    },
    parameters: {
        docs: {
            description: {
                story: 'Shows page 2 of the risk data table.',
            },
        },
    },
};
