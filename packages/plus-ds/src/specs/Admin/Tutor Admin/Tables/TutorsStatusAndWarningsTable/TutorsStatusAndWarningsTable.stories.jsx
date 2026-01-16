/**
 * TutorsStatusAndWarningsTable Stories
 * 
 * Displays tutor status and warnings information
 */

import React from 'react';
import TutorsStatusAndWarningsTable from './TutorsStatusAndWarningsTable';

export default {
    title: 'Specs/Admin/Tutor Admin/Tables/TutorsStatusAndWarningsTable',
    component: TutorsStatusAndWarningsTable,
    parameters: {
        layout: 'padded',
    },
    argTypes: {
        tutors: {
            control: 'object',
            description: 'Array of tutor status objects',
        },
    },
};

const defaultTutors = [
    {
        id: 1,
        tutorName: 'Floyd Miles',
        status: 'Check-In Needed',
        totalWarnings: 16,
        micOff: 4,
        camOff: 4,
        absence: 4,
        lateCallOff: 4
    },
    {
        id: 2,
        tutorName: 'Floyd Miles',
        status: 'Check-In Needed',
        totalWarnings: 16,
        micOff: 4,
        camOff: 4,
        absence: 4,
        lateCallOff: 4
    },
    {
        id: 3,
        tutorName: 'Floyd Miles',
        status: 'Check-In Needed',
        totalWarnings: 16,
        micOff: 4,
        camOff: 4,
        absence: 4,
        lateCallOff: 4
    },
    {
        id: 4,
        tutorName: 'Floyd Miles',
        status: 'On Track',
        totalWarnings: 0,
        micOff: 0,
        camOff: 0,
        absence: 0,
        lateCallOff: 0
    },
    {
        id: 5,
        tutorName: 'Floyd Miles',
        status: 'On Watch',
        totalWarnings: 8,
        micOff: 2,
        camOff: 2,
        absence: 2,
        lateCallOff: 2
    },
];

/**
 * Default
 */
export const Default = {
    args: {
        tutors: defaultTutors,
    },
};

/**
 * Interactive
 */
export const Interactive = {
    render: (args) => (
        <TutorsStatusAndWarningsTable
            {...args}
            onRowClick={(tutor) => console.log('Row clicked:', tutor)}
            onStatusChange={(id, status) => console.log('Status changed:', id, status)}
        />
    ),
    args: {
        tutors: defaultTutors,
    },
};

/**
 * Empty State
 */
export const EmptyState = {
    args: {
        tutors: [],
    },
};
