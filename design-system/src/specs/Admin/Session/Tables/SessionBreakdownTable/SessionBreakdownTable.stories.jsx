/**
 * SessionBreakdownTable - Admin Session Admin Table
 * 
 * Table for displaying session breakdown data in modal.
 * Shows Student Name, Student Status, Tutor Name, Tutor Type, Time Spent.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=987-127671
 */

import React, { useState, useMemo } from 'react';
import SessionBreakdownTable from './SessionBreakdownTable';
import './SessionBreakdownTable.scss';

// Generate sample data
const generateBreakdownData = (rowCount) => {
    const firstNames = ['Amanda', 'Ashley', 'Frank', 'Henry', 'Jose', 'Miles', 'Olga', 'Pete', 'Sam', 'Maria', 'David', 'Emma'];
    const lastNames = ['Novak', 'Brown', 'Bass', 'Hamm', 'Green', 'Hazel', 'Petra', 'Smith', 'Morales', 'Garcia', 'Wilson', 'Taylor'];
    const tutors = ['Ethan Cole', 'Martha Dunn', 'Sarah White', 'Mike Chen'];
    const tutorTypes = ['Lead', 'Regular'];

    const data = [];
    for (let i = 0; i < rowCount; i++) {
        data.push({
            id: i + 1,
            studentName: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
            studentStatus: 'Needs to set goals',
            tutorName: tutors[i % tutors.length],
            tutorType: i % 3 === 0 ? 'Lead' : 'Regular',
            timeSpent: Math.floor(Math.random() * 20) + 1,
        });
    }
    return data;
};

const defaultNineRows = [
    { id: 1, studentName: 'Amanda Novak', studentStatus: 'Needs to set goals', tutorName: 'Ethan Cole', tutorType: 'Lead', timeSpent: 11 },
    { id: 2, studentName: 'Ashley Brown', studentStatus: 'Needs to set goals', tutorName: 'Martha Dunn', tutorType: 'Regular', timeSpent: 8 },
    { id: 3, studentName: 'Frank Bass', studentStatus: 'Needs to set goals', tutorName: 'Martha Dunn', tutorType: 'Regular', timeSpent: 11 },
    { id: 4, studentName: 'Henry Hamm', studentStatus: 'Needs to set goals', tutorName: 'Martha Dunn', tutorType: 'Regular', timeSpent: 15 },
    { id: 5, studentName: 'Jose Green', studentStatus: 'Needs to set goals', tutorName: 'Ethan Cole', tutorType: 'Lead', timeSpent: 10 },
    { id: 6, studentName: 'Miles Hazel', studentStatus: 'Needs to set goals', tutorName: 'Ethan Cole', tutorType: 'Lead', timeSpent: 14 },
    { id: 7, studentName: 'Olga Petra', studentStatus: 'Needs to set goals', tutorName: 'Martha Dunn', tutorType: 'Regular', timeSpent: 3 },
    { id: 8, studentName: 'Pete Smith', studentStatus: 'Needs to set goals', tutorName: 'Martha Dunn', tutorType: 'Regular', timeSpent: 4 },
    { id: 9, studentName: 'Sam Morales', studentStatus: 'Needs to set goals', tutorName: 'Martha Dunn', tutorType: 'Regular', timeSpent: 11 },
];

export default {
    title: 'Specs/Admin/Session/Tables/Session Breakdown Table',
    component: SessionBreakdownTable,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Table component for displaying session breakdown data inside the Session Modal.

## Figma Reference
Node ID: 987-127671

## Features
- Sortable columns with visual indicators
- Student Status badge (info style)
- Tutor Type badge (Lead = info, Regular = secondary)
- Time Spent in minutes
`,
            },
        },
    },
    argTypes: {
        sortable: {
            control: 'boolean',
            description: 'Enable column sorting',
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
 * Overview - Shows table matching Figma design with 9 rows
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
            <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Session Breakdown Table</h6>
            <SessionBreakdownTable
                students={defaultNineRows}
                onSort={(column) => console.log('Sort by:', column)}
            />
        </div>
    ),
};

/**
 * Interactive - Interactive playground with controls
 */
export const Interactive = {
    render: (args) => {
        const [sortColumn, setSortColumn] = useState('tutorName');
        
        const tableData = useMemo(() => {
            return generateBreakdownData(args.rowCount);
        }, [args.rowCount]);

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>
                    Session Breakdown Table - Interactive ({args.rowCount} rows)
                </h6>
                <SessionBreakdownTable
                    students={tableData}
                    sortable={args.sortable}
                    sortColumn={sortColumn}
                    onSort={(column) => setSortColumn(column)}
                />
            </div>
        );
    },
    args: {
        sortable: true,
        rowCount: 9,
    },
};
