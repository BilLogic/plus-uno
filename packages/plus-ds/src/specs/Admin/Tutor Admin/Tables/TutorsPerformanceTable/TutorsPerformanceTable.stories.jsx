/**
 * TutorsPerformanceTable - Tutor Admin Table
 * 
 * Table for displaying tutor performance data.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-262435
 */

import React, { useState, useMemo } from 'react';
import TutorsPerformanceTable from './TutorsPerformanceTable';
import './TutorsPerformanceTable.scss';

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
    title: 'Specs/Admin/Tutor Admin/Tables/TutorsPerformanceTable',
    component: TutorsPerformanceTable,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Table component for displaying tutor performance metrics.

## Figma Reference
Node ID: 258-262435

## Features
- Sortable columns with visual indicators
- Color-coded attendance badges (≥80% green, 50-79% yellow, <50% red)
- Signed-Up status badges
- Lead tutor badge
- Default 9 rows
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
 * Docs
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>TutorsPerformanceTable</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Description</h4>
                    <p className="body2-txt">
                        Table component for displaying tutor performance data with color-coded metrics.
                    </p>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Color Thresholds</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li><strong>≥80%</strong>: Green (Success)</li>
                        <li><strong>50-79%</strong>: Yellow (Warning)</li>
                        <li><strong>&lt;50%</strong>: Red (Danger)</li>
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
        <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
            <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Tutors Performance Table</h6>
            <TutorsPerformanceTable
                tutors={defaultTutors}
                onRowClick={(tutor) => console.log('Tutor clicked:', tutor)}
                onSort={(column) => console.log('Sort by:', column)}
            />
        </div>
    ),
};

/**
 * Interactive
 */
export const Interactive = {
    render: (args) => {
        const [sortColumn, setSortColumn] = useState('tutorName');

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>
                    Tutors Performance Table - Interactive ({args.rowCount} rows)
                </h6>
                <TutorsPerformanceTable
                    tutors={defaultTutors.slice(0, args.rowCount)}
                    sortable={args.sortable}
                    sortColumn={sortColumn}
                    onRowClick={(tutor) => console.log('Tutor clicked:', tutor)}
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
