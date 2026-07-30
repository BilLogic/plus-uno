import React, { useState } from 'react';
import SessionInfo from './SessionInfo';

const SAMPLE_STUDENTS = [
    { id: 'kiera', name: 'Kiera Wintervale' },
    { id: 'baxter', name: 'Baxter Ellington' },
    { id: 'milo', name: 'Milo Thorne' },
];

export default {
    title: 'Specs/Toolkit/Post-Session/Pages/Session Info',
    component: SessionInfo,
    parameters: {
        layout: 'padded',
    },
    tags: ['!dev', '!autodocs'],
};

/**
 * Pre-filled Session Information matching Figma Session Info (date + session selected).
 */
export const Default = {
    render: () => {
        const [selectedStudentIds, setSelectedStudentIds] = useState(
            SAMPLE_STUDENTS.map((student) => student.id),
        );
        return (
            <div style={{ maxWidth: 720, width: '100%' }}>
                <SessionInfo
                    initialData={{
                        date: '2025-07-29',
                        sessionOption: 'session-1',
                    }}
                    availableStudents={SAMPLE_STUDENTS}
                    selectedStudentIds={selectedStudentIds}
                    onStudentSelectionChange={setSelectedStudentIds}
                />
            </div>
        );
    },
};

/**
 * Empty Session Information — date/session required before uploads/students.
 */
export const Empty = {
    render: () => (
        <div style={{ maxWidth: 720, width: '100%' }}>
            <SessionInfo
                initialData={{}}
                availableStudents={SAMPLE_STUDENTS}
                selectedStudentIds={[]}
            />
        </div>
    ),
};

/**
 * Cancellation branch — session did not happen (reasons + description).
 */
export const Cancellation = {
    name: 'Cancellation',
    render: () => (
        <div style={{ maxWidth: 720, width: '100%' }}>
            <SessionInfo
                initialData={{
                    date: '2025-07-29',
                    sessionOption: 'session-1',
                    didNotHappen: true,
                }}
                availableStudents={SAMPLE_STUDENTS}
                selectedStudentIds={[]}
            />
        </div>
    ),
};
