/**
 * TutorTrainingProgressPage Stories
 */

import React from 'react';
import TutorTrainingProgressPage from './TutorTrainingProgressPage';
import ResponsiveFrame from '../../../../Universal/ResponsiveFrame';

export default {
    title: 'Specs/Admin/Tutor Admin/Pages/TutorTrainingProgressPage',
    component: TutorTrainingProgressPage,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: `
# TutorTrainingProgressPage

Full page layout for Tutor Training Progress section.

**Figma:** https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=367-146235

## Features
- Tab navigation (Tutor Performance, Status And Warnings, Tool Usage, Training Progress)
- Action buttons (Email Tutors, Export Reflection Data)
- Training Progress Overview section with view selector (By Tutor / By Lesson)
- Four overview cards:
  - Tutor Need (shows areas needing training)
  - Avg Completion Rate (pie chart)
  - Tutor Badge Completions (pie chart)
  - Onboarding Completion (pie chart)
- Training Progress Details table with search and pagination
- Export CSV functionality
- Tutor modal on row click
                `,
            },
        },
    },
    argTypes: {
        breakpoint: {
            control: { type: 'select' },
            options: ['md', 'lg', 'xl', 'xxl'],
            description: 'Responsive breakpoint',
            table: { category: 'Responsive' },
        },
        activeTab: {
            control: { type: 'select' },
            options: ['performance', 'statusWarnings', 'toolUsage', 'trainingProgress'],
            description: 'Active tab',
        },
        viewMode: {
            control: { type: 'select' },
            options: ['By Tutor', 'By Lesson'],
            description: 'View mode',
        },
        currentPage: {
            control: { type: 'number', min: 1, max: 20 },
            description: 'Current page number',
        },
        searchQuery: {
            control: 'text',
            description: 'Search query',
        },
        avgCompletionRate: {
            control: { type: 'number', min: 0, max: 100 },
            description: 'Average completion rate percentage',
        },
        tutorBadgeCompletions: {
            control: { type: 'number', min: 0, max: 100 },
            description: 'Tutor badge completions percentage',
        },
        onboardingCompletion: {
            control: { type: 'number', min: 0, max: 100 },
            description: 'Onboarding completion percentage',
        },
    },
    decorators: [
        (Story, context) => {
            const breakpoint = context.args.breakpoint || 'xxl';
            return (
                <ResponsiveFrame breakpoint={breakpoint}>
                    <Story />
                </ResponsiveFrame>
            );
        },
    ],
};

export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>TutorTrainingProgressPage</h2>
            <p className="body2-txt" style={{ marginBottom: '16px' }}>
                Full page layout for the Training Progress section with overview cards,
                view selector, and training details table.
            </p>
            <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                Figma Node: 367-146235
            </p>
        </div>
    ),
};

export const Interactive = {
    args: {
        breakpoint: 'xxl',
        activeTab: 'trainingProgress',
        viewMode: 'By Tutor',
        currentPage: 1,
        totalPages: 20,
        totalEntries: 200,
        modalOpen: false,
        modalTab: 'info',
        searchQuery: '',
        tutorNeedData: {
            advocacy: 5,
            categories: ['S', 'M', 'A', 'R', 'T']
        },
        avgCompletionRate: 20,
        tutorBadgeCompletions: 20,
        onboardingCompletion: 20,
        onPageChange: (page) => console.log('Page changed to:', page),
        onRowClick: (tutor) => console.log('Row clicked:', tutor),
        onTabChange: (tab) => console.log('Tab changed to:', tab),
        onModalChange: (open, tab) => console.log('Modal changed:', open, tab),
        onViewModeChange: (mode) => console.log('View mode changed to:', mode),
        onEmailTutors: () => console.log('Email Tutors clicked'),
        onExportData: () => console.log('Export Data clicked'),
        onExportCSV: () => console.log('Export CSV clicked'),
        onSearchChange: (query) => console.log('Search query:', query),
    },
};

export const WithModal = {
    args: {
        ...Interactive.args,
        modalOpen: true,
        modalTab: 'info',
    },
};
