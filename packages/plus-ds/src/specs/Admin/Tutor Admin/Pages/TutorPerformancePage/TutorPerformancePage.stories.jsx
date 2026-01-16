/**
 * TutorPerformancePage - Tutor Admin Page
 * 
 * Full page layout for Tutor Performance.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-262669
 */

import React, { useState, useEffect } from 'react';
import { linkTo } from '@storybook/addon-links';
import TutorPerformancePage from './TutorPerformancePage';
import './TutorPerformancePage.scss';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';


const defaultTutors = [
    { id: 1, tutorName: 'Amelia Blue', signedUp: 'Yes', attendance: 92, sessions: 25, students: 18, badge: null },
    { id: 2, tutorName: 'Ava Silver', signedUp: 'Yes', attendance: 22, sessions: 34, students: 12, badge: null },
    { id: 3, tutorName: 'Elijah Orange', signedUp: 'Yes', attendance: 68, sessions: 22, students: 7, badge: null },
    { id: 4, tutorName: 'Ethan Black', signedUp: 'Yes', attendance: 49, sessions: 65, students: 5, badge: null },
    { id: 5, tutorName: 'Ethan Cole', signedUp: 'Yes', attendance: 90, sessions: 52, students: 21, badge: 'Lead' },
    { id: 6, tutorName: 'Floyd Miles', signedUp: 'No', attendance: null, sessions: null, students: 13, badge: null },
    { id: 7, tutorName: 'Hannah Brown', signedUp: 'Yes', attendance: 94, sessions: 54, students: 7, badge: null },
    { id: 8, tutorName: 'Henry Gold', signedUp: 'Yes', attendance: 92, sessions: 33, students: 10, badge: null },
    { id: 9, tutorName: 'Liam Brown', signedUp: 'Yes', attendance: 50, sessions: 3, students: 8, badge: null },
];

export default {
    title: 'Specs/Admin/Tutor Admin/Pages/TutorPerformancePage',
    component: TutorPerformancePage,
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
                component: `Full page layout for Tutor Performance. Includes tab navigation, action buttons, performance overview with charts and filters, and performance details table with pagination.

## Figma Reference
Node ID: 258-262669

## Features
- TopBar with breadcrumbs
- Sidebar navigation
- Tab navigation (Tutor Performance, Status And Warnings, Tool Usage, Training Progress)
- Email Tutors and Export Reflection Data buttons
- Performance Overview section with filters
- Two donut charts (Attendance, Sign-Up Rate)
- Performance Details table
- Pagination
- Tutor modal on row click
- Default 9 table rows
`,
            },
        },
    },
    argTypes: {
        selectedSchool: {
            control: 'select',
            options: ['All Schools', 'Hogwarts', 'Langley', 'Westfield', 'Oakwood'],
            description: 'Selected school filter',
            table: { category: 'Filters' },
        },
        selectedTutor: {
            control: 'select',
            options: ['All Tutors', 'Snape', 'McGonagall', 'Dumbledore', 'Hagrid'],
            description: 'Selected tutor filter',
            table: { category: 'Filters' },
        },
        activeTab: {
            control: 'select',
            options: ['performance', 'statusWarnings', 'toolUsage', 'trainingProgress'],
            description: 'Active page tab',
            table: { category: 'Navigation' },
        },
        modalOpen: {
            control: 'boolean',
            description: 'Whether the tutor modal is open',
            table: { category: 'Modal' },
        },
        modalTab: {
            control: 'radio',
            options: ['info', 'sessions'],
            description: 'Switch between the modal variant',
            table: { category: 'Modal' },
        },
        modalMode: {
            control: 'radio',
            options: ['edit', 'add'],
            description: 'Modal mode - edit existing tutor or add new tutor',
            table: { category: 'Modal' },
        },
        loading: {
            control: 'boolean',
            description: 'Show loading state for graphs',
            table: { category: 'State' },
        },
        rowCount: {
            control: { type: 'number', min: 1, max: 20 },
            description: 'Number of table rows to display',
            table: { category: 'Data' },
        },
        breakpoint: {
            control: 'select',
            options: ['md', 'lg', 'xl', 'xxl'],
            description: 'Responsive breakpoint',
            table: { category: 'Responsive' },
        },
    },
    args: {
        breakpoint: 'xl',
    },
};

/**
 * Docs
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>TutorPerformancePage</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Description</h4>
                    <p className="body2-txt">
                        Full page layout for the Tutor Performance section. Uses the PageLayout shell with
                        TopBar and Sidebar. Contains tab navigation, action buttons, an overview section with
                        filters and donut charts, and a performance details table with pagination. Default displays 9 rows.
                    </p>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Tabs</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li><strong>Tutor Performance</strong>: Performance metrics and details</li>
                        <li><strong>Status And Warnings</strong>: Tutor status and warnings</li>
                        <li><strong>Tool Usage</strong>: Tool usage statistics</li>
                        <li><strong>Training Progress</strong>: Training completion data</li>
                    </ul>
                </section>
            </div>
        </div>
    ),
};

/**
 * Overview
 */
export const Overview = {
    render: () => (
        <TutorPerformancePage
            tutors={defaultTutors}
            onPageChange={(page) => console.log('Page changed:', page)}
            onRowClick={(tutor) => console.log('Tutor clicked:', tutor)}
            onSchoolFilterChange={() => console.log('School filter clicked')}
            onTutorFilterChange={() => console.log('Tutor filter clicked')}
            onDateFilterChange={(type) => console.log('Date filter clicked:', type)}

            onTabChange={(key) => {
                const linkMap = {
                    performance: ['Specs/Admin/Tutor Admin/Pages/TutorPerformancePage', 'Overview'],
                    statusWarnings: ['Specs/Admin/Tutor Admin/Pages/TutorStatusWarningsPage', 'Overview'],
                    toolUsage: ['Specs/Admin/Tutor Admin/Pages/TutorToolUsagePage', 'Overview'],
                    trainingProgress: ['Specs/Admin/Tutor Admin/Pages/TutorTrainingProgressPage', 'Overview'],
                };
                if (linkMap[key]) linkTo(linkMap[key][0], linkMap[key][1])();
            }}
            onAddTutor={() => console.log('Add Tutor clicked')}
            onEmailTutors={() => console.log('Email Tutors clicked')}
            onExportData={() => console.log('Export Data clicked')}
        />
    ),
};

/**
 * Interactive
 */
export const Interactive = {
    render: (args) => {
        const [currentPage, setCurrentPage] = useState(1);
        const [modalOpen, setModalOpen] = useState(args.modalOpen);
        const [modalTab, setModalTab] = useState(args.modalTab);
        const [activeTab, setActiveTab] = useState(args.activeTab);
        const [loading, setLoading] = useState(args.loading);

        useEffect(() => {
            setModalOpen(args.modalOpen);
        }, [args.modalOpen]);

        useEffect(() => {
            setModalTab(args.modalTab);
        }, [args.modalTab]);

        useEffect(() => {
            setActiveTab(args.activeTab);
        }, [args.activeTab]);

        useEffect(() => {
            setLoading(args.loading);
        }, [args.loading]);

        return (
            <TutorPerformancePage
                tutors={defaultTutors.slice(0, args.rowCount)}
                loading={loading}
                selectedSchool={args.selectedSchool}
                selectedTutor={args.selectedTutor}
                currentPage={currentPage}
                activeTab={activeTab}
                modalOpen={modalOpen}
                modalTab={modalTab}
                modalMode={args.modalMode}
                onPageChange={setCurrentPage}
                onRowClick={(tutor) => {
                    console.log('Tutor clicked:', tutor);
                    setModalOpen(true);
                }}
                onSchoolFilterChange={() => console.log('School filter clicked')}
                onTutorFilterChange={() => console.log('Tutor filter clicked')}
                onDateFilterChange={(type) => console.log('Date filter clicked:', type)}
                onTabChange={(tab) => {
                    setActiveTab(tab);
                    console.log('Tab changed:', tab);
                    const linkMap = {
                        performance: ['Specs/Admin/Tutor Admin/Pages/TutorPerformancePage', 'Interactive'],
                        statusWarnings: ['Specs/Admin/Tutor Admin/Pages/TutorStatusWarningsPage', 'Interactive'],
                        toolUsage: ['Specs/Admin/Tutor Admin/Pages/TutorToolUsagePage', 'Interactive'],
                        trainingProgress: ['Specs/Admin/Tutor Admin/Pages/TutorTrainingProgressPage', 'Interactive'],
                    };
                    if (linkMap[tab]) linkTo(linkMap[tab][0], linkMap[tab][1])();
                }}
                onModalChange={(open, tab) => {
                    setModalOpen(open);
                    setModalTab(tab);
                    console.log('Modal changed:', open, tab);
                }}
                onAddTutor={() => console.log('Add Tutor clicked')}
                onEmailTutors={() => console.log('Email Tutors clicked')}
                onExportData={() => console.log('Export Data clicked')}
            />
        );
    },
    args: {
        selectedSchool: 'All Schools',
        selectedTutor: 'All Tutors',
        activeTab: 'performance',
        modalOpen: false,
        modalTab: "sessions",
        modalMode: 'edit',
        loading: false,
        rowCount: 9,
    },
};

/**
 * WithModalOpen
 */
export const WithModalOpen = {
    render: (args) => {
        const [modalOpen, setModalOpen] = useState(args.modalOpen);
        const [modalTab, setModalTab] = useState(args.modalTab);

        useEffect(() => {
            setModalOpen(args.modalOpen);
        }, [args.modalOpen]);

        useEffect(() => {
            setModalTab(args.modalTab);
        }, [args.modalTab]);

        return (
            <TutorPerformancePage
                tutors={defaultTutors}
                modalOpen={modalOpen}
                modalTab={modalTab}
                modalMode={args.modalMode}
                onModalChange={(open, tab) => {
                    setModalOpen(open);
                    setModalTab(tab);
                }}
            />
        );
    },
    args: {
        modalOpen: true,
        modalTab: 'info',
        modalMode: 'edit',
    },
};
