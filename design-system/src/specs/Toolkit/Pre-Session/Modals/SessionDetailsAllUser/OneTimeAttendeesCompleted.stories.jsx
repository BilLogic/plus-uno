import React from 'react';
import ButtonGroup from '@/components/forms-and-inputs/ButtonGroup';
import Button from '@/components/forms-and-inputs/Button';
import StatusTag from '@/components/labels/StatusTag';
import CountTag from '@/components/labels/CountTag';

// Import CTA button components from Tutor View
import {
    RequestCallOffButton,
    JoinSessionButton,
} from '@/specs/Toolkit/Pre-Session/Elements/CTATutorViewButtons.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Modals/Session Details (All User)',
    parameters: {
        layout: 'centered',
    },
    tags: ['!dev', '!autodocs'],
};

// ─── Sub-components ──────────────────────────────────────────────

/**
 * Attendee Row
 * A single student row inside a tutor panel showing name and attendance badge
 *
 * Tokens:
 * - Padding: --pad-y-lg 0
 * - Gap: --stack-md
 * - Name: body2-txt font-weight-light, --color-on-surface
 * - Joined badge: success style
 * - Did not join badge: danger style
 */
const AttendeeRow = ({ name, status = 'joined' }) => (
    <div
        className="d-flex justify-content-between align-items-center w-100"
        style={{
            padding: 'var(--pad-y-lg) 0',
            gap: 'var(--stack-md)',
        }}
    >
        <span
            className="body2-txt font-weight-light"
            style={{ color: 'var(--ds-text)' }}
        >
            {name}
        </span>
        <StatusTag appearance={status === 'joined' ? 'success' : 'danger'}>{status === 'joined' ? 'Joined' : 'Did not join'}</StatusTag>
    </div>
);

/**
 * Tutor Panel
 * A panel showing a tutor's name, student count, and their assigned students
 *
 * Tokens:
 * - Border: --border-default solid --color-outline-variant
 * - Border radius: --radius-md
 * - Header padding: --size-modal-pad-y-md --size-modal-pad-x-md
 * - Header name: body2-txt font-weight-semibold, --color-on-surface
 * - Student count badge: info style, b3 size, users icon
 * - Content padding: 0 --size-modal-pad-x-md
 */
const TutorPanel = ({ tutorName, studentCount, students = [] }) => (
    <div
        style={{
            border: 'var(--border-default) solid var(--color-outline-variant)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}
    >
        {/* Panel Header */}
        <div
            className="d-flex justify-content-between align-items-center"
            style={{
                padding: 'var(--size-modal-pad-y-md) var(--size-modal-pad-x-md)',
            }}
        >
            <span
                className="body2-txt font-weight-semibold"
                style={{ color: 'var(--ds-text)' }}
            >
                {tutorName}
            </span>
            <StatusTag appearance="info" leadingVisual={<i className="fa-solid fa-users" />}>{String(studentCount)}</StatusTag>
        </div>

        {/* Panel Content - Student Rows */}
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '0 var(--size-modal-pad-x-md)',
            }}
        >
            {students.map((student, index) => (
                <AttendeeRow
                    key={index}
                    name={student.name}
                    status={student.status}
                />
            ))}
        </div>
    </div>
);

// ─── Sample Data ─────────────────────────────────────────────────

const tutorPanels = [
    {
        tutorName: 'Savannah Nguyen',
        studentCount: 4,
        students: [
            { name: 'Lila Chen', status: 'joined' },
            { name: 'Marcus Lee', status: 'joined' },
            { name: 'Ava Patel', status: 'joined' },
            { name: 'Ethan Kim', status: 'joined' },
        ],
    },
    {
        tutorName: 'Maya Thompson',
        studentCount: 4,
        students: [
            { name: 'Sophie Zhang', status: 'joined' },
            { name: 'Noah Kim', status: 'joined' },
            { name: 'Isabella Roy', status: 'joined' },
            { name: 'Liam Park', status: 'did-not-join' },
        ],
    },
];

// ─── Stories ─────────────────────────────────────────────────────

/**
 * One-Time Attendees Completed
 * Shows the Attendees tab of a completed one-time session with tutor panels
 * containing student attendance status
 */
export const OneTimeAttendeesCompleted = () => (
    <div
        className="d-flex flex-column"
        style={{
            width: 672,
            gap: 'var(--size-modal-gap-lg)',
            backgroundColor: 'var(--ds-surface-container)',
            padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
            borderRadius: 'var(--size-modal-radius-lg)',
        }}
    >
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center">
                    <h4 className="h4 m-0">Lincoln High School - 8/14/2025</h4>
                    <i
                        className="fa-solid fa-xmark"
                        style={{
                            fontSize: 'var(--font-size-fa-h4-solid)',
                            color: 'var(--ds-icon-subtle)',
                            cursor: 'pointer',
                        }}
                    />
                </div>

                {/* Tabs using ButtonGroup */}
                <div style={{ display: 'flex', width: '100%' }}>
                    <ButtonGroup className="w-100">
                        <Button
                            text="Session info"
                            shouldFitContainer
                        />
                        <Button
                            text="Attendees"
                            isSelected={true}
                            iconAfter={
                                <CountTag value={20} />
                            }
                            shouldFitContainer
                        />
                    </ButtonGroup>
                </div>

                {/* Tutor Panels Grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 'var(--size-modal-gap-md)',
                    }}
                >
                    {tutorPanels.map((panel, index) => (
                        <TutorPanel
                            key={index}
                            tutorName={panel.tutorName}
                            studentCount={panel.studentCount}
                            students={panel.students}
                        />
                    ))}
                </div>

                {/* Footer Buttons */}
                <div
                    className="d-flex justify-content-between align-items-center"
                    style={{ gap: 'var(--size-modal-gap-md)' }}
                >
                    <RequestCallOffButton />
                    <div style={{ flex: 1 }}>
                        <JoinSessionButton shouldFitContainer />
                    </div>
        </div>
    </div>
);
