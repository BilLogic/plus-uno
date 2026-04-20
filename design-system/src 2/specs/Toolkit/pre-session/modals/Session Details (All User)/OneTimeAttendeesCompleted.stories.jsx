import React from 'react';
import ButtonGroup from '../../../../../components/ButtonGroup';
import Button from '../../../../../components/Button';
import Badge from '../../../../../components/Badge';

// Import CTA button components from Tutor View
import {
    RequestCallOffButton,
    JoinSessionButton,
} from '../../elements/CTATutorViewButtons.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Modals/Session Details (All User)',
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

// ─── Sub-components ──────────────────────────────────────────────

/**
 * Attendee Row
 * A single student row inside a tutor panel showing name and attendance badge
 *
 * Tokens:
 * - Padding: --size-element-pad-y-lg 0
 * - Gap: --size-element-gap-sm
 * - Name: body2-txt font-weight-light, --color-on-surface
 * - Joined badge: success style
 * - Did not join badge: danger style
 */
const AttendeeRow = ({ name, status = 'joined' }) => (
    <div
        className="d-flex justify-content-between align-items-center w-100"
        style={{
            padding: 'var(--size-element-pad-y-lg) 0',
            gap: 'var(--size-element-gap-sm)',
        }}
    >
        <span
            className="body2-txt font-weight-light"
            style={{ color: 'var(--color-on-surface)' }}
        >
            {name}
        </span>
        <Badge
            text={status === 'joined' ? 'Joined' : 'Did not join'}
            style={status === 'joined' ? 'success' : 'danger'}
            size="b3"
        />
    </div>
);

/**
 * Tutor Panel
 * A panel showing a tutor's name, student count, and their assigned students
 *
 * Tokens:
 * - Border: --size-element-border solid --color-outline-variant
 * - Border radius: --size-element-radius-md
 * - Header padding: --size-modal-pad-y-md --size-modal-pad-x-md
 * - Header name: body2-txt font-weight-semibold, --color-on-surface
 * - Student count badge: info style, b3 size, users icon
 * - Content padding: 0 --size-modal-pad-x-md
 */
const TutorPanel = ({ tutorName, studentCount, students = [] }) => (
    <div
        style={{
            border: 'var(--size-element-border) solid var(--color-outline-variant)',
            borderRadius: 'var(--size-element-radius-md)',
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
                style={{ color: 'var(--color-on-surface)' }}
            >
                {tutorName}
            </span>
            <Badge
                text={String(studentCount)}
                style="info"
                size="b3"
                leadingVisual={<i className="fa-solid fa-users" />}
            />
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
            backgroundColor: 'var(--color-surface-container-high)',
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
                            color: 'var(--color-on-surface-variant)',
                            cursor: 'pointer',
                        }}
                    />
                </div>

                {/* Tabs using ButtonGroup */}
                <div style={{ display: 'flex', width: '100%' }}>
                    <ButtonGroup fill="tonal" className="w-100">
                        <Button
                            text="Session info"
                            style="secondary"
                            fill="tonal"
                            block
                        />
                        <Button
                            text="Attendees"
                            active={true}
                            trailingVisual={
                                <Badge text="20" style="secondary" size="b3" />
                            }
                            style="primary"
                            fill="tonal"
                            block
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
                        <JoinSessionButton block />
                    </div>
        </div>
    </div>
);
