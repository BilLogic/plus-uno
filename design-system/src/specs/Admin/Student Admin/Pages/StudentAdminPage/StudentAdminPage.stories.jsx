/**
 * StudentAdminPage - Admin Student Admin Page
 * 
 * Full page layout for Student Admin with overview charts and students table.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=1006-258597
 */

import React, { useState, useMemo, useEffect } from 'react';
import StudentAdminPage from './StudentAdminPage';
import './StudentAdminPage.scss';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';


// Generate sample data
const generateStudentData = (rowCount) => {
    const firstNames = ['Jose', 'Chris', 'Irene', 'Jacqueline', 'Jerome', 'Joy', 'Ksenia', 'Lesley', 'Manny', 'Maria', 'David', 'Emma'];
    const lastNames = ['Dolus', 'Hudson', 'White', 'Traine', 'Brown', 'Jones', 'Gato', 'Mora', 'Smith', 'Garcia', 'Wilson', 'Taylor'];
    const teachers = ['Jose Mura', 'Ruth Perez', 'Erin Hunter', 'Katie Strong', 'Tisha Bryan', 'Aaron Zhang'];
    const schools = ['Langley', 'Westfield', 'Oakwood', 'Riverside'];

    const data = [];
    for (let i = 0; i < rowCount; i++) {
        data.push({
            id: i + 1,
            name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
            school: schools[i % schools.length],
            teacher: teachers[i % teachers.length],
            status: 'Needs to set goals',
        });
    }
    return data;
};

// Default 9 rows data
const defaultNineRows = generateStudentData(9);

export default {
    title: 'Specs/Admin/Student Admin/Pages/StudentAdminPage',
    component: StudentAdminPage,
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
                component: `Full page layout for the Student Admin section. Includes header with school and date filters, overview charts section (Needs Distribution, Attendance, Engagement), and student details table with pagination.

## Figma Reference
Node ID: 1006-258597

## Features
- TopBar with breadcrumbs
- Sidebar navigation
- Student Overview section with filters
- Three stacked bar charts
- Student Details section with Add Student button
- Students table with View goals action
- Pagination
- Student modal on row click (with Info/Sessions variants)
- Default 9 table rows
`,
            },
        },
    },
    argTypes: {
        selectedSchool: {
            control: 'select',
            options: ['All Schools', 'Langley', 'Westfield', 'Oakwood', 'Riverside'],
            description: 'Selected school filter',
            table: { category: 'Filters' },
        },
        rowCount: {
            control: { type: 'number', min: 1, max: 50 },
            description: 'Number of table rows to display',
            table: { category: 'Data' },
        },
        modalOpen: {
            control: 'boolean',
            description: 'Whether the student modal is open',
            table: { category: 'Modal' },
        },
        modalVariant: {
            control: 'radio',
            options: ['info', 'sessions'],
            description: 'Modal variant (Info or Sessions tab)',
            table: { category: 'Modal' },
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
 * Documentation for StudentAdminPage component
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>StudentAdminPage</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Description</h4>
                    <p className="body2-txt">
                        Full page layout for the Student Admin section. Uses the PageLayout shell with
                        TopBar and Sidebar. Contains an overview section with filters and charts,
                        and a student details section with table and pagination. Default displays 9 rows.
                    </p>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Props</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li><strong>students</strong>: Array of student objects</li>
                        <li><strong>needsData</strong>: Data for Needs Distribution chart</li>
                        <li><strong>attendanceData</strong>: Data for Attendance chart</li>
                        <li><strong>engagementData</strong>: Data for Engagement chart</li>
                        <li><strong>currentPage</strong>: Current page number (default: 1)</li>
                        <li><strong>totalPages</strong>: Total number of pages (default: 20)</li>
                        <li><strong>totalEntries</strong>: Total entries count (default: 200)</li>
                        <li><strong>selectedSchool</strong>: Selected school filter</li>
                        <li><strong>modalOpen</strong>: Whether modal is open</li>
                        <li><strong>modalVariant</strong>: Modal variant ('info' or 'sessions')</li>
                    </ul>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Modal Controls</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li><strong>modalOpen</strong>: Show/hide the student modal</li>
                        <li><strong>modalVariant</strong>: Switch between Info and Sessions tabs</li>
                    </ul>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Figma Reference</h4>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Node ID: 1006-258597
                    </p>
                </section>
            </div>
        </div>
    ),
};

/**
 * Overview
 * Shows full page with 9 rows matching Figma design
 */
export const Overview = {
    args: {
        breakpoint: 'xl'
    },
    render: (args) => (
        <StudentAdminPage
            students={defaultNineRows}
            onPageChange={(page) => console.log('Page changed:', page)}
            onAddStudent={() => console.log('Add Student clicked')}
            onViewGoals={(student) => console.log('View goals clicked:', student)}
            onStudentClick={(student) => console.log('Student clicked:', student)}
            onSchoolFilterChange={() => console.log('School filter clicked')}
            onDateFilterChange={(type) => console.log('Date filter clicked:', type)}
        />
    ),
};

/**
 * Interactive
 * Interactive playground with controls including row count, modal show/hide, and modal variant
 */
export const Interactive = {
    render: (args) => {
        const [currentPage, setCurrentPage] = useState(1);
        const [modalOpen, setModalOpen] = useState(args.modalOpen);
        const [modalVariant, setModalVariant] = useState(args.modalVariant);

        const tableData = useMemo(() => {
            return generateStudentData(args.rowCount);
        }, [args.rowCount]);

        // Sync with args
        useEffect(() => {
            setModalOpen(args.modalOpen);
        }, [args.modalOpen]);

        useEffect(() => {
            setModalVariant(args.modalVariant);
        }, [args.modalVariant]);

        return (
            <StudentAdminPage
                students={tableData}
                selectedSchool={args.selectedSchool}
                currentPage={currentPage}
                modalOpen={modalOpen}
                modalVariant={modalVariant}
                onPageChange={setCurrentPage}
                onAddStudent={() => console.log('Add Student clicked')}
                onViewGoals={(student) => console.log('View goals clicked:', student)}
                onStudentClick={(student) => {
                    console.log('Student clicked:', student);
                    setModalOpen(true);
                }}
                onSchoolFilterChange={() => console.log('School filter clicked')}
                onDateFilterChange={(type) => console.log('Date filter clicked:', type)}
                onModalChange={(open, variant) => {
                    setModalOpen(open);
                    console.log('Modal changed:', { open, variant });
                }}
            />
        );
    },
    args: {
        breakpoint: 'xl',
        selectedSchool: 'All Schools',
        rowCount: 20,
        modalOpen: false,
        modalVariant: 'info',
    },
};

/**
 * WithModalOpen
 * Shows page with modal open (Info variant)
 */
export const WithModalInfoVariant = {
    args: {
        breakpoint: 'xl'
    },
    render: (args) => {
        const [modalOpen, setModalOpen] = useState(true);

        return (
            <StudentAdminPage
                students={defaultNineRows}
                modalOpen={modalOpen}
                modalVariant="info"
                onStudentClick={() => setModalOpen(true)}
                onModalChange={(open) => setModalOpen(open)}
            />
        );
    },
};

/**
 * WithModalSessionsVariant
 * Shows page with modal open (Sessions variant)
 */
export const WithModalSessionsVariant = {
    args: {
        breakpoint: 'xl'
    },
    render: (args) => {
        const [modalOpen, setModalOpen] = useState(true);

        return (
            <StudentAdminPage
                students={defaultNineRows}
                modalOpen={modalOpen}
                modalVariant="sessions"
                onStudentClick={() => setModalOpen(true)}
                onModalChange={(open) => setModalOpen(open)}
            />
        );
    },
};
