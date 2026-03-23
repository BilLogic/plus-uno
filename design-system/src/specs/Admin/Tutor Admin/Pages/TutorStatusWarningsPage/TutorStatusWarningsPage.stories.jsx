/**
 * TutorStatusWarningsPage Stories
 */

import React from 'react';
import { linkTo } from '@storybook/addon-links';
import TutorStatusWarningsPage from './TutorStatusWarningsPage';
import ResponsiveFrame from '../../../../Universal/ResponsiveFrame';

export default {
    title: 'Specs/Admin/Tutor Admin/Pages/TutorStatusWarningsPage',
    component: TutorStatusWarningsPage,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: `
# TutorStatusWarningsPage

Full page layout for Tutor Status and Warnings section.

**Figma:** https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-263229

## Features
- Tab navigation (Tutor Performance, Status And Warnings, Tool Usage, Training Progress)
- Action buttons (Email Tutors, Export Reflection Data)
- Status Overview section with filters
- Status Distribution (Latest) - Pie chart
- Status Trend (Weekly) - Stacked bar chart
- Status Details table with pagination
- Tutor modal on row click
                `,
            },
        },
    },
    argTypes: {
        activeTab: {
            control: { type: 'select' },
            options: ['performance', 'statusWarnings', 'toolUsage', 'trainingProgress'],
            description: 'Active tab',
        },
        currentPage: {
            control: { type: 'number', min: 1, max: 20 },
            description: 'Current page number',
        },
        breakpoint: {
            control: { type: 'select' },
            options: ['md', 'lg', 'xl'],
            description: 'Responsive breakpoint',
            table: { category: 'Responsive' },
        },
    },
    decorators: [
        (Story, context) => {
            const breakpoint = context.args.breakpoint || 'xl';
            return (
                <ResponsiveFrame breakpoint={breakpoint}>
                    <Story />
                </ResponsiveFrame>
            );
        },
    ],
};

export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>TutorStatusWarningsPage</h2>
            <p className="body2-txt" style={{ marginBottom: '16px' }}>
                Full page layout for the Status and Warnings section with status distribution chart,
                trend graph, and status details table.
            </p>
            <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                Figma Node: 258-263229
            </p>
        </div>
    ),
};

export const Overview = {
    args: {
        breakpoint: 'xl'
    },
    render: (args) => (
        <TutorStatusWarningsPage
            activeTab="statusWarnings"
            currentPage={1}
            totalPages={10}
            totalEntries={200}
            selectedSchool="All Schools"
            selectedTutor="All Tutors"
            dateFrom="01/10/25"
            dateTo="02/10/25"
            onPageChange={(page) => console.log('Page changed to:', page)}
            onRowClick={(tutor) => console.log('Row clicked:', tutor)}
            onSchoolFilterChange={(school) => console.log('School filter:', school)}
            onTutorFilterChange={(tutor) => console.log('Tutor filter:', tutor)}
            onDateFilterChange={(type) => console.log('Date filter changed:', type)}

            onTabChange={(key) => {
                const linkMap = {
                    performance: ['Specs/Admin/Tutor Admin/Pages/TutorPerformancePage', 'Overview'],
                    statusWarnings: ['Specs/Admin/Tutor Admin/Pages/TutorStatusWarningsPage', 'Overview'],
                    toolUsage: ['Specs/Admin/Tutor Admin/Pages/TutorToolUsagePage', 'Overview'],
                    trainingProgress: ['Specs/Admin/Tutor Admin/Pages/TutorTrainingProgressPage', 'Overview'],
                };
                if (linkMap[key]) linkTo(linkMap[key][0], linkMap[key][1])();
            }}
            onModalChange={(open, tab) => console.log('Modal changed:', open, tab)}
            onAddTutor={() => console.log('Add Tutor clicked')}
            onEmailTutors={() => console.log('Email Tutors clicked')}
            onExportData={() => console.log('Export Data clicked')}
        />
    ),
};

export const Interactive = {
    args: {
        breakpoint: 'xl',
        activeTab: 'statusWarnings',
        currentPage: 1,
        totalPages: 10,
        totalEntries: 200,
        selectedSchool: 'All Schools',
        selectedTutor: 'All Tutors',
        dateFrom: '01/10/25',
        dateTo: '02/10/25',
        modalOpen: false,
        modalTab: 'info',
        statusDistribution: {
            onTrack: 170,
            checkInNeeded: 30,
            onWatch: 50,
            onTIP: 20,
            recommendedForTermination: 20,
            inactive: 10
        },
        onPageChange: (page) => console.log('Page changed to:', page),
        onRowClick: (tutor) => console.log('Row clicked:', tutor),
        onSchoolFilterChange: (school) => console.log('School filter:', school),
        onTutorFilterChange: (tutor) => console.log('Tutor filter:', tutor),
        onDateFilterChange: (type) => console.log('Date filter changed:', type),
        onTabChange: (key) => {
            console.log('Tab changed to:', key);
            const linkMap = {
                performance: ['Specs/Admin/Tutor Admin/Pages/TutorPerformancePage', 'Interactive'],
                statusWarnings: ['Specs/Admin/Tutor Admin/Pages/TutorStatusWarningsPage', 'Interactive'],
                toolUsage: ['Specs/Admin/Tutor Admin/Pages/TutorToolUsagePage', 'Interactive'],
                trainingProgress: ['Specs/Admin/Tutor Admin/Pages/TutorTrainingProgressPage', 'Interactive'],
            };
            if (linkMap[key]) linkTo(linkMap[key][0], linkMap[key][1])();
        },
        onModalChange: (open, tab) => console.log('Modal changed:', open, tab),
        onAddTutor: () => console.log('Add Tutor clicked'),
        onEmailTutors: () => console.log('Email Tutors clicked'),
        onExportData: () => console.log('Export Data clicked'),
    },
};


