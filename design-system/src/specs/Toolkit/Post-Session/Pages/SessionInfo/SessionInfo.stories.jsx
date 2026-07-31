import React, { useState } from 'react';
import SessionInfo from './SessionInfo';
import {
    BreakpointPreview,
    ReflectionPageShell,
} from '@/specs/Toolkit/Post-Session/Pages/pageShell';

const SAMPLE_STUDENTS = [
    { id: 'kiera', name: 'Kiera Wintervale' },
    { id: 'baxter', name: 'Baxter Ellington' },
    { id: 'milo', name: 'Milo Thorne' },
];

/**
 * @param {object} formProps
 */
function renderShell(formProps) {
    return (
        <BreakpointPreview>
            <ReflectionPageShell
                activeTab="session-information"
                completedSections={{}}
                id="session-info-page-story"
            >
                {({ openDiscard, openSaved }) => (
                    <SessionInfo
                        {...formProps}
                        onCancel={openDiscard}
                        onSaveAndExit={openSaved}
                    />
                )}
            </ReflectionPageShell>
        </BreakpointPreview>
    );
}

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
        return renderShell({
            initialData: {
                date: '2025-07-29',
                sessionOption: 'session-1',
            },
            availableStudents: SAMPLE_STUDENTS,
            selectedStudentIds,
            onStudentSelectionChange: setSelectedStudentIds,
        });
    },
};

/**
 * Empty Session Information — date/session required before uploads/students.
 */
export const Empty = {
    render: () => renderShell({
        initialData: {},
        availableStudents: SAMPLE_STUDENTS,
        selectedStudentIds: [],
    }),
};

/**
 * Cancellation branch — session did not happen (reasons + description).
 */
export const Cancellation = {
    name: 'Cancellation',
    render: () => renderShell({
        initialData: {
            date: '2025-07-29',
            sessionOption: 'session-1',
            didNotHappen: true,
        },
        availableStudents: SAMPLE_STUDENTS,
        selectedStudentIds: [],
    }),
};
