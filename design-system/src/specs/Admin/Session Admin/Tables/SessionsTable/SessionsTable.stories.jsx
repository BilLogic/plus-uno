/**
 * SessionsTable - Admin Session Admin Table
 * 
 * Table for displaying session data with metrics.
 * Metrics use color-coded badges: ≥80% green, 50-79% yellow, <50% red.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=987-127618
 */

import React, { useState, useMemo } from 'react';
import SessionsTable from './SessionsTable';
import './SessionsTable.scss';

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
    title: 'Specs/Admin/Session Admin/Tables/SessionsTable',
    component: SessionsTable,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Table component for displaying session data with metrics. Each metric column uses color-coded badges based on thresholds:

- **≥80%** → Green (Success)
- **50-79%** → Yellow (Warning)  
- **<50%** → Red (Danger)

## Figma Reference
Node ID: 987-127618

## Features
- Sortable columns with visual indicators
- Color-coded metric badges
- Hover states for rows
- Clickable rows for drill-down
- Default 9 rows of sample data
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
        hover: {
            control: 'boolean',
            description: 'Enable row hover effect',
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
 * Docs - Documentation for SessionsTable component
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>SessionsTable</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Description</h4>
                    <p className="body2-txt">
                        Table component for displaying session data with metrics. Shows Day (Date), Shift, School, 
                        Teacher, and four metric columns with color-coded badges.
                    </p>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Metric Color Thresholds</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li><strong>≥80%</strong>: Green (Success)</li>
                        <li><strong>50-79%</strong>: Yellow (Warning)</li>
                        <li><strong>&lt;50%</strong>: Red (Danger)</li>
                    </ul>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Figma Reference</h4>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Node ID: 987-127618
                    </p>
                </section>
            </div>
        </div>
    ),
};

/**
 * Overview - Shows table matching Figma design with 9 rows
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
            <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Sessions Table</h6>
            <SessionsTable
                sessions={defaultNineRows}
                onRowClick={(session) => console.log('Row clicked:', session)}
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
        const [sortColumn, setSortColumn] = useState('date');
        
        const tableData = useMemo(() => {
            return generateSessionData(args.rowCount);
        }, [args.rowCount]);

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>
                    Sessions Table - Interactive ({args.rowCount} rows)
                </h6>
                <SessionsTable
                    sessions={tableData}
                    sortable={args.sortable}
                    sortColumn={sortColumn}
                    hover={args.hover}
                    onRowClick={(session) => console.log('Row clicked:', session)}
                    onSort={(column) => setSortColumn(column)}
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
