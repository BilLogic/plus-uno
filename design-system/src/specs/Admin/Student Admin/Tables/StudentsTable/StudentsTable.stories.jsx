/**
 * StudentsTable - Admin Student Admin Table
 * 
 * Table showing student details with columns: Student, School, Teacher, Latest Status, Action.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=999-108965
 */

import React, { useMemo } from 'react';
import StudentsTable from './StudentsTable';
import './StudentsTable.scss';

// Generate sample data
const generateStudentData = (rowCount) => {
    const firstNames = ['Jose', 'Chris', 'Irene', 'Jacqueline', 'Jerome', 'Joy', 'Ksenia', 'Lesley', 'Manny', 'Maria', 'David', 'Emma'];
    const lastNames = ['Dolus', 'Hudson', 'White', 'Traine', 'Brown', 'Jones', 'Gato', 'Mora', 'Smith', 'Garcia', 'Wilson', 'Taylor'];
    const teachers = ['Jose Mura', 'Ruth Perez', 'Erin Hunter', 'Katie Strong', 'Tisha Bryan', 'Aaron Zhang'];
    const statuses = ['Needs to set goals', 'On track', 'Behind schedule', 'Completed'];
    const schools = ['Langley', 'Westfield', 'Oakwood', 'Riverside'];

    const data = [];
    for (let i = 0; i < rowCount; i++) {
        data.push({
            id: i + 1,
            name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
            school: schools[i % schools.length],
            teacher: teachers[i % teachers.length],
            status: statuses[0], // Default to "Needs to set goals" per Figma
        });
    }
    return data;
};

// Default 9 rows data
const defaultNineRows = generateStudentData(9);

export default {
    title: 'Specs/Admin/Student Admin/Tables/StudentsTable',
    component: StudentsTable,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Table component for displaying student information. Shows student name, school, teacher, latest status badge, and action button to view goals.

## Figma Reference
Node ID: 999-108965

## Features
- Sortable columns (Student, School, Teacher, Latest Status)
- Info badge showing student status
- Action button to view goals
- Hover states for rows
- Default 9 rows
`,
            },
        },
    },
    argTypes: {
        sortable: {
            control: 'boolean',
            description: 'Enable sortable columns',
            table: { category: 'Behavior' },
        },
        hover: {
            control: 'boolean',
            description: 'Enable row hover effects',
            table: { category: 'Behavior' },
        },
        rowCount: {
            control: { type: 'number', min: 1, max: 20 },
            description: 'Number of table rows to display',
            table: { category: 'Data' },
        },
    },
};

/**
 * Docs
 * Documentation for StudentsTable component
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>StudentsTable</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Description</h4>
                    <p className="body2-txt">
                        Table component for displaying student information in the Student Admin section.
                        Each row shows a student name, school, teacher, status badge (e.g., "Needs to set goals"),
                        and an action button to view student goals. Default displays 9 rows.
                    </p>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Props</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li><strong>students</strong>: Array of student objects (id, name, school, teacher, status)</li>
                        <li><strong>sortable</strong>: Enable sortable columns (default: true)</li>
                        <li><strong>hover</strong>: Enable row hover effects (default: true)</li>
                        <li><strong>onViewGoalsClick</strong>: Callback when View goals button is clicked</li>
                        <li><strong>onStudentClick</strong>: Callback when a student row is clicked</li>
                    </ul>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Figma Reference</h4>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Node ID: 999-108965
                    </p>
                </section>
            </div>
        </div>
    ),
};

/**
 * Overview
 * Shows table with 9 rows matching Figma design
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md, 24px)' }}>
            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Students Table (9 rows)</h6>
                <StudentsTable
                    students={defaultNineRows}
                    onViewGoalsClick={(student) => console.log('View goals clicked:', student)}
                    onStudentClick={(student) => console.log('Student clicked:', student)}
                />
            </section>
        </div>
    ),
};

/**
 * Interactive
 * Interactive playground with controls including row count
 */
export const Interactive = {
    render: (args) => {
        const tableData = useMemo(() => {
            return generateStudentData(args.rowCount);
        }, [args.rowCount]);

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>
                    Students Table - Interactive ({args.rowCount} rows)
                </h6>
                <StudentsTable
                    students={tableData}
                    sortable={args.sortable}
                    hover={args.hover}
                    onViewGoalsClick={(student) => console.log('View goals clicked:', student)}
                    onStudentClick={(student) => console.log('Student clicked:', student)}
                />
            </div>
        );
    },
    args: {
        sortable: true,
        hover: true,
        rowCount: 9,
    },
};
