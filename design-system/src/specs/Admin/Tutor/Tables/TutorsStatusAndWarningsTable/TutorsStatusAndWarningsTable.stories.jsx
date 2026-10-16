/**
 * TutorsStatusAndWarningsTable Stories
 * 
 * Displays tutor status and warnings information
 */

import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import TutorsStatusAndWarningsTable from './TutorsStatusAndWarningsTable';

export default {
    title: 'Specs/Admin/Tutor/Tables/Tutors Status And Warnings Table',
    tags: ['!dev', '!autodocs'],
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

/** "Check-In Needed" carries the info colour role on its field; other statuses are neutral. */
Interactive.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [first] = canvas.getAllByRole('combobox', { name: 'Status for Floyd Miles' });
    const toned = () => first.closest('.status-select').classList.contains('status-select--info');

    await expect(toned()).toBe(true);
    await userEvent.click(first);
    await userEvent.click(await within(document.body).findByRole('option', { name: 'On Track' }));
    await expect(first).toHaveTextContent('On Track');
    await expect(toned()).toBe(false);
};

/**
 * Empty State
 */
export const EmptyState = {
    args: {
        tutors: [],
    },
};
