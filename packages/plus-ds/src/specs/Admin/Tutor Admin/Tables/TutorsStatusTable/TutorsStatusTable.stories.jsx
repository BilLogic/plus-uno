/**
 * TutorsStatusTable Stories
 */

import React, { useState } from 'react';
import TutorsStatusTable from './TutorsStatusTable';

// Data representing the "Null" or "Status" view (Node 258-262388)
const statusTutors = [
    { id: 1, tutorName: 'Floyd Miles', signedUp: 'No', attendance: null, sessions: null, students: null, badge: null },
    { id: 2, tutorName: 'Floyd Miles', signedUp: 'No', attendance: null, sessions: null, students: null, badge: null },
    { id: 3, tutorName: 'Floyd Miles', signedUp: 'No', attendance: null, sessions: null, students: null, badge: null },
    { id: 4, tutorName: 'Floyd Miles', signedUp: 'No', attendance: null, sessions: null, students: null, badge: null },
];

export default {
    title: 'Specs/Admin/Tutor Admin/Tables/TutorsStatusTable',
    component: TutorsStatusTable,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Table displaying tutor status with a focus on 'Signed-Up' state and handling of empty/null metrics. Matches Figma Node 258-262388.`
            }
        }
    }
};

export const Overview = {
    render: () => (
        <div style={{ padding: '24px' }}>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Tutors Status Table</h6>
            <TutorsStatusTable
                tutors={statusTutors}
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
                <TutorsStatusTable
                    {...args}
                    sortColumn={sortColumn}
                    onSort={(col) => setSortColumn(col)}
                />
            </div>
        );
    },
    args: {
        sortable: true,
        tutors: statusTutors
    }
};
