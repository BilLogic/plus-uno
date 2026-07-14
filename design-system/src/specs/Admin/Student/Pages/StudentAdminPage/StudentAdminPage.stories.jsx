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
    title: 'Specs/Admin/Student/Pages/Student Admin Page',
    component: StudentAdminPage,
    tags: ['!dev', '!autodocs'],
    decorators: [
        (Story, context) => (
            <ResponsiveFrame breakpoint={(context.globals?.plusBreakpoint || context.args.breakpoint || 'native') || 'native'}>
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
 * Overview
 * Shows full page with 9 rows matching Figma design
 */
export const Overview = {
    args: {
        breakpoint: 'native'
    },
    render: (args) => (
        <StudentAdminPage
            students={defaultNineRows}
            containModal
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
                containModal
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
        breakpoint: 'native',
        selectedSchool: 'All Schools',
        rowCount: 20,
        modalOpen: false,
        modalVariant: 'info',
    },
};

/**
 * WithModalInfoVariant
 * Shows page with modal open (Info variant). The modal is contained inside the page
 * frame (never over the docs page); use the `modalOpen` control to toggle it.
 */
export const WithModalInfoVariant = {
    args: {
        breakpoint: 'native',
        modalOpen: true,
    },
    render: (args) => {
        const [modalOpen, setModalOpen] = useState(args.modalOpen);

        // Sync with the modalOpen control
        useEffect(() => {
            setModalOpen(args.modalOpen);
        }, [args.modalOpen]);

        return (
            <StudentAdminPage
                students={defaultNineRows}
                modalOpen={modalOpen}
                modalVariant="info"
                containModal
                onStudentClick={() => setModalOpen(true)}
                onModalChange={(open) => setModalOpen(open)}
            />
        );
    },
};

/**
 * WithModalSessionsVariant
 * Shows page with modal open (Sessions variant). The modal is contained inside the page
 * frame (never over the docs page); use the `modalOpen` control to toggle it.
 */
export const WithModalSessionsVariant = {
    args: {
        breakpoint: 'native',
        modalOpen: true,
    },
    render: (args) => {
        const [modalOpen, setModalOpen] = useState(args.modalOpen);

        // Sync with the modalOpen control
        useEffect(() => {
            setModalOpen(args.modalOpen);
        }, [args.modalOpen]);

        return (
            <StudentAdminPage
                students={defaultNineRows}
                modalOpen={modalOpen}
                modalVariant="sessions"
                containModal
                onStudentClick={() => setModalOpen(true)}
                onModalChange={(open) => setModalOpen(open)}
            />
        );
    },
};
