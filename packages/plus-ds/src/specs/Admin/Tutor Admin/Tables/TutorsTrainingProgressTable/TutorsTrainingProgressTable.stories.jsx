/**
 * TutorsTrainingProgressTable Stories
 */

import React, { useState } from 'react';
import TutorsTrainingProgressTable from './TutorsTrainingProgressTable';

const defaultTutors = [
    {
        id: 1,
        tutorName: 'Ben Green',
        email: 'dummy@gmail.com',
        completion: { value: 8, total: 18, percentage: 44 },
        accuracy: 30,
        badgeClaimed: 'N/A',
        timeSpent: 328
    },
    {
        id: 2,
        tutorName: 'Albert Flores',
        email: 'albert@gmail.com',
        completion: { value: 18, total: 18, percentage: 100 },
        accuracy: 95,
        badgeClaimed: 'Badge 1',
        timeSpent: 520
    },
    {
        id: 3,
        tutorName: 'Cody Fisher',
        email: 'cody@gmail.com',
        completion: { value: 0, total: 18, percentage: 0 },
        accuracy: 0,
        badgeClaimed: 'N/A',
        timeSpent: 0
    }
];

export default {
    title: 'Specs/Admin/Tutor Admin/Tables/TutorsTrainingProgressTable',
    component: TutorsTrainingProgressTable,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Table component for training progress. Includes Donut charts for completion/accuracy and user avatar details.`
            }
        }
    }
};

export const Overview = {
    render: () => (
        <div style={{ padding: '24px' }}>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Tutors Training Progress Table</h6>
            <TutorsTrainingProgressTable
                tutors={defaultTutors}
                onViewProgress={(tutor) => console.log('View Progress:', tutor)}
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
                <TutorsTrainingProgressTable
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
