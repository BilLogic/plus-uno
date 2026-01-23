/**
 * TutorToolUsagePage Stories
 */

import React from 'react';
import { linkTo } from '@storybook/addon-links';
import TutorToolUsagePage from './TutorToolUsagePage';
import ResponsiveFrame from '../../../../Universal/ResponsiveFrame';

export default {
    title: 'Specs/Admin/Tutor Admin/Pages/TutorToolUsagePage',
    component: TutorToolUsagePage,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: `
# TutorToolUsagePage

Full page layout for Tutor Tool Usage section.

**Figma:** https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-263367

## Features
- Tab navigation (Tutor Performance, Status And Warnings, Tool Usage, Training Progress)
- Action buttons (Email Tutors, Export Reflection Data)
- Tool Usage section with filters
- Recording Upload (Daily) - Bar chart
- Reflection Completion (Weekly) - Line chart
- Help Center Usage - Line chart
- Tool Usage Details table with search and pagination
- Export CSV functionality
- Tutor modal on row click
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
        activeTab: {
            control: { type: 'select' },
            options: ['performance', 'statusWarnings', 'toolUsage', 'trainingProgress'],
            description: 'Active tab',
        },
        currentPage: {
            control: { type: 'number', min: 1, max: 20 },
            description: 'Current page number',
        },
        searchQuery: {
            control: 'text',
            description: 'Search query',
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
            <h2 className="h2" style={{ marginBottom: '24px' }}>TutorToolUsagePage</h2>
            <p className="body2-txt" style={{ marginBottom: '16px' }}>
                Full page layout for the Tool Usage section with multiple usage charts and
                details table with search functionality.
            </p>
            <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                Figma Node: 258-263367
            </p>
        </div>
    ),
};

export const Overview = {
    render: () => (
        <TutorToolUsagePage
            breakpoint="xl"
            activeTab="toolUsage"
            currentPage={1}
            totalPages={20}
            totalEntries={200}
            selectedSchool="All Schools"
            selectedTutor="All Tutors"
            dateFrom="01/10/25"
            dateTo="02/10/25"
            modalOpen={false}
            searchQuery=""
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
            onExportCSV={() => console.log('Export CSV clicked')}
            onSearchChange={(query) => console.log('Search query:', query)}
        />
    ),
};

export const Interactive = {
    args: {
        breakpoint: 'xl',
        activeTab: 'toolUsage',
        currentPage: 1,
        totalPages: 20,
        totalEntries: 200,
        selectedSchool: 'All Schools',
        selectedTutor: 'All Tutors',
        dateFrom: '01/10/25',
        dateTo: '02/10/25',
        modalOpen: false,
        modalTab: 'info',
        searchQuery: '',
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
        onExportCSV: () => console.log('Export CSV clicked'),
        onSearchChange: (query) => console.log('Search query:', query),
    },
};


