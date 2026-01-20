/**
 * TutorSessionsTable Stories
 */

import React, { useState } from 'react';
import TutorSessionsTable from './TutorSessionsTable';

const defaultSessions = [
    { id: 1, day: 'Mon (10/25/23)', shift: '3:00 PM - 4:00 PM', school: 'Lincoln High' },
    { id: 2, day: 'Wed (10/27/23)', shift: '3:00 PM - 4:00 PM', school: 'Lincoln High' },
    { id: 3, day: 'Fri (10/29/23)', shift: '3:00 PM - 4:00 PM', school: 'Lincoln High' },
    { id: 4, day: 'Mon (11/01/23)', shift: '3:00 PM - 4:00 PM', school: 'Washington Mid' },
    { id: 5, day: 'Wed (11/03/23)', shift: '3:00 PM - 4:00 PM', school: 'Washington Mid' },
];

export default {
    title: 'Specs/Admin/Tutor Admin/Tables/TutorSessionsTable',
    component: TutorSessionsTable,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Table component for displaying tutor session assignments.`
            }
        }
    }
};

export const Overview = {
    render: () => (
        <div style={{ padding: '24px' }}>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Tutor Sessions Table</h6>
            <TutorSessionsTable
                sessions={defaultSessions}
                onSort={(col) => console.log('Sort:', col)}
            />
        </div>
    )
};

export const Interactive = {
    render: (args) => {
        const [sortColumn, setSortColumn] = useState('day');
        return (
            <div style={{ padding: '24px' }}>
                <TutorSessionsTable
                    {...args}
                    sortColumn={sortColumn}
                    onSort={(col) => setSortColumn(col)}
                />
            </div>
        );
    },
    args: {
        sortable: true,
        sessions: defaultSessions
    }
};
