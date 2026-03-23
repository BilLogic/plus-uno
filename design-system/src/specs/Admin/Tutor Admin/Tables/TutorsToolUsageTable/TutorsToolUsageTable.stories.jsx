/**
 * TutorsToolUsageTable Stories
 */

import React, { useState } from 'react';
import TutorsToolUsageTable from './TutorsToolUsageTable';

const defaultTutors = [
    { id: 1, tutorName: 'Floyd Miles', recording: null, reflection: null, attendanceTracking: 20, goalChecking: null },
    { id: 2, tutorName: 'Arlene McCoy', recording: null, reflection: null, attendanceTracking: 20, goalChecking: null },
    { id: 3, tutorName: 'Theresa Webb', recording: null, reflection: null, attendanceTracking: 20, goalChecking: null },
    { id: 4, tutorName: 'Courtney Henry', recording: null, reflection: null, attendanceTracking: 20, goalChecking: null },
    { id: 5, tutorName: 'Albert Flores', recording: null, reflection: null, attendanceTracking: 20, goalChecking: null },
];

export default {
    title: 'Specs/Admin/Tutor Admin/Tables/TutorsToolUsageTable',
    component: TutorsToolUsageTable,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Table component for tool usage stats (Recording, Reflection, etc.). Values are displayed as badges, with 'Null' for missing data.`
            }
        }
    }
};

export const Overview = {
    render: () => (
        <div style={{ padding: '24px' }}>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Tutors Tool Usage Table</h6>
            <TutorsToolUsageTable
                tutors={defaultTutors}
                onSort={(col) => console.log('Sort:', col)}
            />
        </div>
    )
};

export const Interactive = {
    render: (args) => {
        const [sortColumn, setSortColumn] = useState('tutorName');
        return (
            <div style={{ padding: '24px' }}>
                <TutorsToolUsageTable
                    {...args}
                    sortColumn={sortColumn}
                    onSort={(col) => setSortColumn(col)}
                />
            </div>
        );
    },
    args: {
        sortable: true,
        tutors: defaultTutors
    }
};
