/**
 * TutorModal Stories
 */

import React, { useState } from 'react';
import TutorModal from './TutorModal';

// Mock Data
const mockTutor = {
    id: 1,
    name: 'Amelia Blue',
    preferredName: 'Amy',
    email: 'amelia@example.com',
    schools: ['School A', 'School B'],
    students: ['Student 1', 'Student 2'],
    isLead: true,
};

const mockSessions = [
    { id: 1, day: 'Monday (01/31/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
    { id: 2, day: 'Friday (01/28/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
    { id: 3, day: 'Thursday (01/27/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
    { id: 4, day: 'Wednesday (01/26/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
    { id: 5, day: 'Tuesday (01/25/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
];

export default {
    title: 'Specs/Admin/Tutor Admin/Modals/TutorModal',
    component: TutorModal,
    parameters: {
        docs: {
            description: {
                component: `Modal for editing existing tutors or adding new ones. Supports tabs and different form layouts.`
            }
        }
    },
    argTypes: {
        mode: {
            control: { type: 'select' },
            options: ['edit', 'add'],
        },
    }
};

export const EditTutor = {
    render: (args) => {
        const [show, setShow] = useState(true);
        return (
            <>
                <button onClick={() => setShow(true)}>Open Edit Modal</button>
                <TutorModal
                    {...args}
                    show={show}
                    onHide={() => setShow(false)}
                    tutor={mockTutor}
                    sessions={mockSessions}
                />
            </>
        );
    },
    args: {
        mode: 'edit',
        initialTab: 'info',
    }
};

export const EditTutorSessions = {
    render: (args) => {
        const [show, setShow] = useState(true);
        return (
            <>
                <button onClick={() => setShow(true)}>Open Sessions Modal</button>
                <TutorModal
                    {...args}
                    show={show}
                    onHide={() => setShow(false)}
                    tutor={mockTutor}
                    sessions={mockSessions}
                />
            </>
        );
    },
    args: {
        mode: 'edit',
        initialTab: 'sessions',
    }
};

export const AddNewTutor = {
    render: (args) => {
        const [show, setShow] = useState(true);
        return (
            <>
                <button onClick={() => setShow(true)}>Open Add Modal</button>
                <TutorModal
                    {...args}
                    show={show}
                    onHide={() => setShow(false)}
                    tutor={{}} // Empty for add
                />
            </>
        );
    },
    args: {
        mode: 'add',
        initialTab: 'individual',
    }
};
