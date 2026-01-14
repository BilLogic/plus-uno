/**
 * SessionAdminPage - Admin Session Admin Page
 * 
 * Full page layout for Session Admin with tabs, overview charts, and sessions table.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=987-128734
 */

import React, { useState, useMemo, useEffect } from 'react';
import SessionAdminPage from './SessionAdminPage';
import './SessionAdminPage.scss';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';


// Generate sample data
const generateSessionData = (rowCount) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const schools = ['Hogwarts', 'Langley', 'Westfield', 'Oakwood'];
    const teachers = ['Snape', 'McGonagall', 'Dumbledore', 'Hagrid'];

    const data = [];
    for (let i = 0; i < rowCount; i++) {
        const dayIndex = i % 5;
        const month = Math.floor(i / 20) + 1;
        const day = (i % 20) + 1;
        data.push({
            id: i + 1,
            date: `${days[dayIndex]} (${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/25)`,
            shift: '2:25 PM - 3:15 PM',
            school: schools[i % schools.length],
            teacher: teachers[i % teachers.length],
            attendedStudents: Math.floor(Math.random() * 100),
            engagedStudent: Math.floor(Math.random() * 100),
            attendedTutors: Math.floor(Math.random() * 100),
            completedCheckIn: Math.floor(Math.random() * 100),
        });
    }
    return data;
};

const defaultNineRows = [
    { id: 1, date: 'Mon (01/06/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 85, engagedStudent: 92, attendedTutors: 100, completedCheckIn: 88 },
    { id: 2, date: 'Tue (01/07/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 78, engagedStudent: 85, attendedTutors: 95, completedCheckIn: 82 },
    { id: 3, date: 'Wed (01/08/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 45, engagedStudent: 52, attendedTutors: 88, completedCheckIn: 48 },
    { id: 4, date: 'Thu (01/09/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 8, engagedStudent: 8, attendedTutors: 8, completedCheckIn: 8 },
    { id: 5, date: 'Fri (01/10/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 92, engagedStudent: 95, attendedTutors: 100, completedCheckIn: 90 },
    { id: 6, date: 'Mon (01/13/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 65, engagedStudent: 70, attendedTutors: 85, completedCheckIn: 68 },
    { id: 7, date: 'Tue (01/14/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 35, engagedStudent: 40, attendedTutors: 75, completedCheckIn: 38 },
    { id: 8, date: 'Wed (01/15/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 88, engagedStudent: 90, attendedTutors: 98, completedCheckIn: 85 },
    { id: 9, date: 'Thu (01/16/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 55, engagedStudent: 60, attendedTutors: 82, completedCheckIn: 58 },
];

export default {
    title: 'Specs/Admin/Session Admin/Pages/SessionAdminPage',
    component: SessionAdminPage,
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
                component: `Full page layout for the Session Admin section. Includes header with tabs, school/tutor/date filters, overview charts section (5 donut charts), and session details table with pagination.

## Figma Reference
Node ID: 987-128734

## Features
- TopBar with breadcrumbs
- Sidebar navigation
- Tab navigation (Warnings, Current Tutors, Incoming Tutors, Details)
- Session Overview section with filters
- Five donut charts (Time Allocation, Attendance, Engagement, Tutor Attendance, Check-in)
- Session Details section with table
- Pagination
- Session breakdown modal on row click
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
            options: ['warnings', 'currentTutors', 'incomingTutors', 'details'],
            description: 'Active tab',
            table: { category: 'Navigation' },
        },
        rowCount: {
            control: { type: 'number', min: 1, max: 20 },
            description: 'Number of table rows to display',
            table: { category: 'Data' },
        },
        modalOpen: {
            control: 'boolean',
            description: 'Whether the session modal is open',
            table: { category: 'Modal' },
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
 * Docs - Documentation for SessionAdminPage component
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>SessionAdminPage</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Description</h4>
                    <p className="body2-txt">
                        Full page layout for the Session Admin section. Uses the PageLayout shell with
                        TopBar and Sidebar. Contains tab navigation, an overview section with filters and
                        donut charts, and a session details section with table and pagination. Default displays 9 rows.
                    </p>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Tabs</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li><strong>Warnings</strong>: Session warnings</li>
                        <li><strong>Current Tutors</strong>: Currently active tutors</li>
                        <li><strong>Incoming Tutors</strong>: Upcoming tutors</li>
                        <li><strong>Details</strong>: Session details (default)</li>
                    </ul>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Modal Controls</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li><strong>modalOpen</strong>: Show/hide the session breakdown modal</li>
                        <li>Click a table row to open the modal</li>
                    </ul>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Figma Reference</h4>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Node ID: 987-128734
                    </p>
                </section>
            </div>
        </div>
    ),
};

/**
 * Overview - Shows full page with 9 rows matching Figma design
 */
export const Overview = {
    render: () => (
        <SessionAdminPage
            sessions={defaultNineRows}
            onPageChange={(page) => console.log('Page changed:', page)}
            onRowClick={(session) => console.log('Session clicked:', session)}
            onSchoolFilterChange={() => console.log('School filter clicked')}
            onTutorFilterChange={() => console.log('Tutor filter clicked')}
            onDateFilterChange={(type) => console.log('Date filter clicked:', type)}
            onTabChange={(tab) => console.log('Tab changed:', tab)}
        />
    ),
};

/**
 * Interactive - Interactive playground with controls including row count, modal show/hide
 */
export const Interactive = {
    render: (args) => {
        const [currentPage, setCurrentPage] = useState(1);
        const [modalOpen, setModalOpen] = useState(args.modalOpen);
        const [activeTab, setActiveTab] = useState(args.activeTab);

        const tableData = useMemo(() => {
            return generateSessionData(args.rowCount);
        }, [args.rowCount]);

        useEffect(() => {
            setModalOpen(args.modalOpen);
        }, [args.modalOpen]);

        useEffect(() => {
            setActiveTab(args.activeTab);
        }, [args.activeTab]);

        return (
            <SessionAdminPage
                sessions={tableData}
                selectedSchool={args.selectedSchool}
                selectedTutor={args.selectedTutor}
                currentPage={currentPage}
                activeTab={activeTab}
                modalOpen={modalOpen}
                onPageChange={setCurrentPage}
                onRowClick={(session) => {
                    console.log('Session clicked:', session);
                    setModalOpen(true);
                }}
                onSchoolFilterChange={() => console.log('School filter clicked')}
                onTutorFilterChange={() => console.log('Tutor filter clicked')}
                onDateFilterChange={(type) => console.log('Date filter clicked:', type)}
                onTabChange={(tab) => {
                    setActiveTab(tab);
                    console.log('Tab changed:', tab);
                }}
                onModalChange={(open) => {
                    setModalOpen(open);
                    console.log('Modal changed:', open);
                }}
            />
        );
    },
    args: {
        selectedSchool: 'All Schools',
        selectedTutor: 'All Tutors',
        activeTab: 'warnings',
        rowCount: 9,
        modalOpen: false,
    },
};

/**
 * WithModalOpen - Shows page with modal open
 */
export const WithModalOpen = {
    render: () => {
        const [modalOpen, setModalOpen] = useState(true);

        return (
            <SessionAdminPage
                sessions={defaultNineRows}
                modalOpen={modalOpen}
                onRowClick={() => setModalOpen(true)}
                onModalChange={(open) => setModalOpen(open)}
            />
        );
    },
};
