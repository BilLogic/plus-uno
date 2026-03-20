import React from 'react';
import Modal from '../../../../components/Modal';
import Button from '../../../../components/Button';
import ButtonGroup from '../../../../components/ButtonGroup';
import Badge from '../../../../components/Badge';
import MATHiaGoalStatusBanner from '../elements/MATHiaGoalStatusBanner';
import { AttendanceDropdown } from '../elements/AttendanceDropdown';
import { SessionInfoCard } from '../cards/SessionInfoCard.stories';
import { LeadBadge, CountBadge } from '../elements/badges/TutorBadges';
import { SessionAttendeeListItem } from '../../pre-session/elements/Session Attendee List Items/SessionAttendeeListItems.stories';

export default {
    title: 'Specs/Toolkit/In-Session/Modals/In-Session Pop-up Modal',
    component: Modal,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

const ModalHeader = () => (
    <div
        className="d-flex flex-column"
        style={{ gap: 'var(--size-spacing-space-050)' }}
    >
        <div className="d-flex justify-content-between align-items-center">
            <span className="h4" style={{ margin: 0, color: 'var(--color-on-surface)' }}>
                Track Attendance
            </span>
            <i
                className="fa-solid fa-xmark"
                style={{
                    fontSize: 'var(--font-size-fa-h4-solid)',
                    lineHeight: 'var(--font-line-height-fa-h4-solid)',
                    color: 'var(--color-on-surface-variant)',
                    cursor: 'pointer',
                }}
            />
        </div>
        <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
            Mark which tutors and students are present for today's session.
        </span>
    </div>
);

const TabButtonGroup = () => (
    <ButtonGroup fill="tonal" className="w-100">
        <Button
            text="Attendance"
            active={true}
            style="primary"
            fill="tonal"
            block
            trailingVisual={<Badge text="20" style="secondary" size="b3" />}
        />
        <Button text="Assignment" style="secondary" fill="tonal" block />
        <Button text="Session Info" style="secondary" fill="tonal" block />
    </ButtonGroup>
);

const AttendeeRow = ({ name, initialStatus = 'unknown' }) => (
    <div
        className="d-flex align-items-center"
        style={{
            gap: 'var(--size-element-gap-sm)',
            padding: 'var(--size-element-pad-y-lg) 0',
            borderRadius: 'var(--size-element-radius-md)',
        }}
    >
        <span
            className="body2-txt font-weight-light"
            style={{
                flex: 1,
                color: 'var(--color-on-surface)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            }}
        >
            {name}
        </span>
        <AttendanceDropdown initialStatus={initialStatus} />
    </div>
);

/**
 * Attendance Loading Lead
 *
 * The loading state of the Track Attendance pop-up modal for Lead Tutors.
 * The rosters are hidden while data loads, with a loading animation centered.
 */
export const AttendanceLoadingLead = () => (
    <Modal
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={
            <div
                className="d-flex flex-column"
                style={{
                    gap: 'var(--size-modal-gap-lg)',
                    backgroundColor: 'var(--color-surface-container-high)',
                    border: 'var(--size-element-border) solid var(--color-outline-variant)',
                    padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                    borderRadius: 'var(--size-modal-radius-lg)',
                    height: '584px',
                }}
            >
                <ModalHeader />

                {/* Body */}
                <div
                    className="d-flex flex-column"
                    style={{ flex: '1 0 0', minHeight: 0, gap: 'var(--size-modal-gap-md)' }}
                >
                    <MATHiaGoalStatusBanner type="modal" sessionType="goal-setting" dismissable={false} />
                    <TabButtonGroup />

                    {/* Roster Area - Loading State */}
                    <div
                        className="d-flex"
                        style={{
                            flex: '1 0 0',
                            minHeight: 0,
                            gap: 'var(--size-spacing-spacer-1)',
                            position: 'relative',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {/* Tutor Roster (hidden) */}
                        <div
                            className="d-flex flex-column"
                            style={{
                                flex: '1 0 0', height: '100%', opacity: 0,
                                border: 'var(--size-element-border) solid var(--color-outline-variant)',
                                borderRadius: 'var(--size-element-radius-lg)',
                                padding: 'var(--size-spacing-space-200) var(--size-spacing-space-300)',
                                gap: 'var(--size-spacing-space-200)',
                            }}
                        >
                            <div className="d-flex align-items-center" style={{ gap: 'var(--size-spacing-space-150)' }}>
                                <span className="h6" style={{ flex: 1, margin: 0, color: 'var(--color-on-surface)' }}>Tutor Roster</span>
                                <Button text="Add tutor" style="primary" fill="outline" size="small" leadingVisual="user-plus" />
                            </div>
                        </div>

                        {/* Student Roster (hidden) */}
                        <div
                            className="d-flex flex-column"
                            style={{
                                flex: '1 0 0', height: '100%', opacity: 0,
                                border: 'var(--size-element-border) solid var(--color-outline-variant)',
                                borderRadius: 'var(--size-element-radius-lg)',
                                padding: 'var(--size-spacing-space-200) var(--size-spacing-space-300)',
                                gap: 'var(--size-spacing-space-200)',
                            }}
                        >
                            <div className="d-flex align-items-center" style={{ gap: 'var(--size-spacing-space-150)' }}>
                                <span className="h6" style={{ flex: 1, margin: 0, color: 'var(--color-on-surface)' }}>Student Roster</span>
                                <Button text="Add Student" style="primary" fill="outline" size="small" leadingVisual="user-plus" />
                            </div>
                        </div>

                        {/* Loading Animation */}
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '52px', height: '52px' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: '53.85%', bottom: '53.85%', backgroundColor: 'var(--color-on-surface-variant)', borderRadius: '1px' }} />
                            <div style={{ position: 'absolute', top: '53.85%', left: 0, right: '53.85%', bottom: 0, backgroundColor: 'var(--color-on-surface-variant)', borderRadius: '1px' }} />
                            <div style={{ position: 'absolute', top: '53.85%', left: '53.85%', right: 0, bottom: 0, backgroundColor: 'var(--color-on-surface-variant)', borderRadius: '1px' }} />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="d-flex align-items-center justify-content-end" style={{ gap: 'var(--size-modal-gap-sm)', borderBottom: 'var(--size-element-border) solid var(--color-surface-container-highest)' }}>
                    <Button text="Close" style="primary" fill="outline" size="medium" onClick={() => {}} />
                    <Button text="Update Attendance" style="primary" fill="filled" size="medium" onClick={() => {}} />
                </div>
            </div>
        }
    />
);

/**
 * Attendance Initial Lead
 *
 * The initial/loaded state of the Track Attendance pop-up modal for Lead Tutors.
 * Shows tutor and student rosters side by side with attendance dropdowns defaulting to "Select".
 * Lead tutors can update tutor attendance but not student attendance.
 */
export const AttendanceInitialLead = () => (
    <Modal
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={
            <div
                className="d-flex flex-column"
                style={{
                    gap: 'var(--size-modal-gap-lg)',
                    backgroundColor: 'var(--color-surface-container-high)',
                    border: 'var(--size-element-border) solid var(--color-outline-variant)',
                    padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                    borderRadius: 'var(--size-modal-radius-lg)',
                    height: '584px',
                }}
            >
                <ModalHeader />

                {/* Body */}
                <div
                    className="d-flex flex-column"
                    style={{ flex: '1 0 0', minHeight: 0, gap: 'var(--size-modal-gap-sm)' }}
                >
                    <MATHiaGoalStatusBanner type="modal" sessionType="goal-setting" dismissable={false} />
                    <TabButtonGroup />

                    {/* Roster Area - Loaded */}
                    <div
                        className="d-flex"
                        style={{
                            flex: '1 0 0',
                            minHeight: 0,
                            gap: 'var(--size-modal-gap-sm)',
                        }}
                    >
                        {/* Tutor Roster */}
                        <div
                            className="d-flex flex-column"
                            style={{
                                flex: '1 0 0',
                                height: '100%',
                                border: 'var(--size-element-border) solid var(--color-outline-variant)',
                                borderRadius: 'var(--size-element-radius-lg)',
                                padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                                gap: 'var(--size-card-gap-sm)',
                            }}
                        >
                            <div className="d-flex align-items-center" style={{ gap: 'var(--size-spacing-space-150)' }}>
                                <span className="h6" style={{ flex: 1, margin: 0, color: 'var(--color-on-surface)' }}>
                                    Tutor Roster
                                </span>
                                <Button text="Add tutor" style="primary" fill="outline" size="small" leadingVisual="user-plus" />
                            </div>
                            <div className="d-flex flex-column" style={{ flex: '1 0 0', minHeight: 0 }}>
                                <AttendeeRow name="Savannah Nguyen" />
                                <AttendeeRow name="Maya Thompson" />
                                <AttendeeRow name="Chloe Johnson" />
                                <AttendeeRow name="Ella Martinez" />
                            </div>
                        </div>

                        {/* Student Roster */}
                        <div
                            className="d-flex flex-column"
                            style={{
                                flex: '1 0 0',
                                height: '100%',
                                border: 'var(--size-element-border) solid var(--color-outline-variant)',
                                borderRadius: 'var(--size-element-radius-lg)',
                                padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                                gap: 'var(--size-card-gap-sm)',
                                overflow: 'auto',
                            }}
                        >
                            <div className="d-flex align-items-center" style={{ gap: 'var(--size-spacing-space-150)' }}>
                                <span className="h6" style={{ flex: 1, margin: 0, color: 'var(--color-on-surface)' }}>
                                    Student Roster
                                </span>
                                <Button text="Add Student" style="primary" fill="outline" size="small" leadingVisual="user-plus" />
                            </div>
                            <div className="d-flex flex-column" style={{ flex: '1 0 0', minHeight: 0 }}>
                                <AttendeeRow name="Lila Chen" />
                                <AttendeeRow name="Marcus Lee" />
                                <AttendeeRow name="Ava Patel" />
                                <AttendeeRow name="Ethan Kim" />
                                <AttendeeRow name="Sophie Zhang" />
                                <AttendeeRow name="Noah Kim" />
                                <AttendeeRow name="Isabella Roy" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="d-flex align-items-center justify-content-end" style={{ gap: 'var(--size-modal-gap-sm)' }}>
                    <Button text="Close" style="primary" fill="outline" size="medium" onClick={() => {}} />
                    <Button text="Continue" style="primary" fill="filled" size="medium" onClick={() => {}} />
                </div>
            </div>
        }
    />
);

/**
 * Attendance Loaded Lead
 *
 * The loaded state of the Track Attendance pop-up modal for Lead Tutors.
 * All attendees have been marked as "Joined" (present).
 */
export const AttendanceLoadedLead = () => (
    <Modal
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={
            <div
                className="d-flex flex-column"
                style={{
                    gap: 'var(--size-modal-gap-lg)',
                    backgroundColor: 'var(--color-surface-container-high)',
                    border: 'var(--size-element-border) solid var(--color-outline-variant)',
                    padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                    borderRadius: 'var(--size-modal-radius-lg)',
                    height: '584px',
                }}
            >
                <ModalHeader />

                {/* Body */}
                <div
                    className="d-flex flex-column"
                    style={{ flex: '1 0 0', minHeight: 0, gap: 'var(--size-modal-gap-sm)' }}
                >
                    <MATHiaGoalStatusBanner type="modal" sessionType="goal-setting" dismissable={false} />
                    <TabButtonGroup />

                    {/* Roster Area - All Joined */}
                    <div
                        className="d-flex"
                        style={{
                            flex: '1 0 0',
                            minHeight: 0,
                            gap: 'var(--size-modal-gap-sm)',
                        }}
                    >
                        {/* Tutor Roster */}
                        <div
                            className="d-flex flex-column"
                            style={{
                                flex: '1 0 0',
                                height: '100%',
                                border: 'var(--size-element-border) solid var(--color-outline-variant)',
                                borderRadius: 'var(--size-element-radius-lg)',
                                padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                                gap: 'var(--size-card-gap-sm)',
                            }}
                        >
                            <div className="d-flex align-items-center" style={{ gap: 'var(--size-spacing-space-150)' }}>
                                <span className="h6" style={{ flex: 1, margin: 0, color: 'var(--color-on-surface)' }}>
                                    Tutor Roster
                                </span>
                                <Button text="Add tutor" style="primary" fill="outline" size="small" leadingVisual="user-plus" />
                            </div>
                            <div className="d-flex flex-column" style={{ flex: '1 0 0', minHeight: 0 }}>
                                <AttendeeRow name="Savannah Nguyen" initialStatus="present" />
                                <AttendeeRow name="Maya Thompson" initialStatus="present" />
                                <AttendeeRow name="Chloe Johnson" initialStatus="present" />
                                <AttendeeRow name="Ella Martinez" initialStatus="present" />
                            </div>
                        </div>

                        {/* Student Roster */}
                        <div
                            className="d-flex flex-column"
                            style={{
                                flex: '1 0 0',
                                height: '100%',
                                border: 'var(--size-element-border) solid var(--color-outline-variant)',
                                borderRadius: 'var(--size-element-radius-lg)',
                                padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                                gap: 'var(--size-card-gap-sm)',
                                overflow: 'auto',
                            }}
                        >
                            <div className="d-flex align-items-center" style={{ gap: 'var(--size-spacing-space-150)' }}>
                                <span className="h6" style={{ flex: 1, margin: 0, color: 'var(--color-on-surface)' }}>
                                    Student Roster
                                </span>
                                <Button text="Add Student" style="primary" fill="outline" size="small" leadingVisual="user-plus" />
                            </div>
                            <div className="d-flex flex-column" style={{ flex: '1 0 0', minHeight: 0 }}>
                                <AttendeeRow name="Lila Chen" initialStatus="present" />
                                <AttendeeRow name="Marcus Lee" initialStatus="present" />
                                <AttendeeRow name="Ava Patel" initialStatus="present" />
                                <AttendeeRow name="Ethan Kim" initialStatus="present" />
                                <AttendeeRow name="Sophie Zhang" initialStatus="present" />
                                <AttendeeRow name="Noah Kim" initialStatus="present" />
                                <AttendeeRow name="Isabella Roy" initialStatus="present" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="d-flex align-items-center justify-content-end" style={{ gap: 'var(--size-modal-gap-sm)' }}>
                    <Button text="Close" style="primary" fill="outline" size="medium" onClick={() => {}} />
                    <Button text="Continue" style="primary" fill="filled" size="medium" onClick={() => {}} />
                </div>
            </div>
        }
    />
);

const AssignmentModalHeader = () => (
    <div
        className="d-flex flex-column"
        style={{ gap: 'var(--size-element-gap-xs)' }}
    >
        <div className="d-flex justify-content-between align-items-center">
            <span className="h4" style={{ margin: 0, color: 'var(--color-on-surface)' }}>
                Manage Assignment
            </span>
            <i
                className="fa-solid fa-xmark"
                style={{
                    fontSize: 'var(--font-size-fa-h4-solid)',
                    lineHeight: 'var(--font-line-height-fa-h4-solid)',
                    color: 'var(--color-on-surface-variant)',
                    cursor: 'pointer',
                }}
            />
        </div>
        <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
            Review and adjust how students are paired with tutors for optimal learning.
        </span>
    </div>
);

const AssignmentTabButtonGroup = () => (
    <ButtonGroup fill="tonal" className="w-100">
        <Button
            text="Attendance"
            style="secondary"
            fill="tonal"
            block
            trailingVisual={<Badge text="20" style="secondary" size="b3" />}
        />
        <Button text="Assignment" active={true} style="primary" fill="tonal" block />
        <Button text="Session Info" style="secondary" fill="tonal" block />
    </ButtonGroup>
);

/**
 * Assignment Loading Lead
 *
 * The loading state of the Manage Assignment pop-up modal for Lead Tutors (Assignment tab active).
 * Content is loading with a spinner animation while a scrollbar placeholder is visible.
 */
export const AssignmentLoadingLead = () => (
    <Modal
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={
            <div
                className="d-flex flex-column"
                style={{
                    gap: 'var(--size-modal-gap-lg)',
                    backgroundColor: 'var(--color-surface-container-high)',
                    border: 'var(--size-element-border) solid var(--color-outline-variant)',
                    padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                    borderRadius: 'var(--size-modal-radius-lg)',
                    height: '584px',
                }}
            >
                <AssignmentModalHeader />

                {/* Body */}
                <div
                    className="d-flex flex-column"
                    style={{ flex: '1 0 0', minHeight: 0, gap: 'var(--size-modal-gap-md)' }}
                >
                    <MATHiaGoalStatusBanner type="modal" sessionType="goal-setting" dismissable={false} />
                    <AssignmentTabButtonGroup />

                    {/* Assignment Content Area - Loading */}
                    <div
                        className="d-flex"
                        style={{
                            flex: '1 0 0',
                            minHeight: 0,
                            position: 'relative',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Loading Animation */}
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '52px', height: '52px' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: '53.85%', bottom: '53.85%', backgroundColor: 'var(--color-on-surface-variant)', borderRadius: '1px' }} />
                            <div style={{ position: 'absolute', top: '53.85%', left: 0, right: '53.85%', bottom: 0, backgroundColor: 'var(--color-on-surface-variant)', borderRadius: '1px' }} />
                            <div style={{ position: 'absolute', top: '53.85%', left: '53.85%', right: 0, bottom: 0, backgroundColor: 'var(--color-on-surface-variant)', borderRadius: '1px' }} />
                        </div>

                        {/* Scrollbar */}
                        <div
                            className="d-flex flex-column align-items-center"
                            style={{
                                position: 'absolute',
                                top: 0,
                                right: '4px',
                                bottom: 0,
                                backgroundColor: 'var(--color-surface-container-highest)',
                            }}
                        >
                            <div className="d-flex align-items-center justify-content-center" style={{ flexShrink: 0 }}>
                                <i className="fa-solid fa-caret-up" style={{ fontSize: 'var(--font-size-fa-b3-solid)', color: 'var(--color-outline)' }} />
                            </div>
                            <div className="d-flex" style={{ flex: '1 0 0', minHeight: 0, justifyContent: 'center', padding: '0 1px', width: '100%' }}>
                                <div style={{ flex: '1 0 0', height: '30px', backgroundColor: 'var(--color-outline-variant)', borderRadius: '1px' }} />
                            </div>
                            <div className="d-flex align-items-center justify-content-center" style={{ flexShrink: 0 }}>
                                <i className="fa-solid fa-caret-down" style={{ fontSize: 'var(--font-size-fa-b3-solid)', color: 'var(--color-outline)' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="d-flex align-items-center justify-content-end" style={{ gap: 'var(--size-modal-gap-sm)' }}>
                    <Button text="Close" style="primary" fill="outline" size="medium" onClick={() => {}} />
                    <Button text="Update Assignments" style="primary" fill="filled" size="medium" onClick={() => {}} />
                </div>
            </div>
        }
    />
);

const AssignmentStudentRow = ({ name }) => (
    <div
        className="d-flex align-items-center"
        style={{
            gap: 'var(--size-element-gap-sm)',
            padding: 'var(--size-element-pad-y-lg) 0',
            borderRadius: 'var(--size-element-radius-md)',
        }}
    >
        <span
            className="body2-txt font-weight-light"
            style={{ flex: 1, color: 'var(--color-on-surface)', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
            {name}
        </span>
        <Badge text="Joined" style="success" size="b3" trailingVisual={<i className="fa-solid fa-caret-down" style={{ fontSize: 'var(--font-size-fa-b3-solid)', color: 'var(--color-success-text)' }} />} />
    </div>
);

const AssignmentCard = ({ tutorName, studentCount, students }) => (
    <div
        className="d-flex flex-column"
        style={{
            border: 'var(--size-element-border) solid var(--color-outline-variant)',
            borderRadius: '8px',
            padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
            gap: 'var(--size-card-gap-sm)',
            minWidth: 0,
        }}
    >
        {/* Tutor Header */}
        <div
            className="d-flex align-items-center"
            style={{
                gap: 'var(--size-element-gap-sm)',
                padding: 'var(--size-element-pad-y-lg) 0',
                borderRadius: 'var(--size-element-radius-md)',
            }}
        >
            <span
                className="body2-txt font-weight-semibold"
                style={{ flex: 1, color: 'var(--color-on-surface)', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
                {tutorName}
            </span>
            <Badge
                style="info"
                size="b3"
                leadingVisual={<i className="fa-solid fa-user-group" style={{ fontSize: 'var(--font-size-fa-b3-solid)', color: 'var(--color-secondary-text)' }} />}
                text={String(studentCount)}
            />
        </div>
        {/* Student List */}
        {students.map((name) => (
            <AssignmentStudentRow key={name} name={name} />
        ))}
    </div>
);

/**
 * Assignment Loaded Lead
 *
 * The loaded state of the Manage Assignment pop-up modal for Lead Tutors.
 * Shows assignment cards in a 2-column grid, each card showing a tutor
 * with their assigned students and attendance status.
 */
export const AssignmentLoadedLead = () => (
    <Modal
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={
            <div
                className="d-flex flex-column"
                style={{
                    gap: 'var(--size-modal-gap-lg)',
                    backgroundColor: 'var(--color-surface-container-high)',
                    border: 'var(--size-element-border) solid var(--color-outline-variant)',
                    padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                    borderRadius: 'var(--size-modal-radius-lg)',
                    height: '584px',
                }}
            >
                <AssignmentModalHeader />

                {/* Body */}
                <div
                    className="d-flex flex-column"
                    style={{ flex: '1 0 0', minHeight: 0, gap: 'var(--size-modal-gap-md)' }}
                >
                    <MATHiaGoalStatusBanner type="modal" sessionType="goal-setting" dismissable={false} />
                    <AssignmentTabButtonGroup />

                    {/* Assignment Cards Grid */}
                    <div
                        style={{
                            flex: '1 0 0',
                            minHeight: 0,
                            overflow: 'auto',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 'var(--size-modal-gap-sm)',
                            alignContent: 'start',
                        }}
                    >
                        <AssignmentCard
                            tutorName="Savannah Nguyen"
                            studentCount={4}
                            students={['Lila Chen', 'Marcus Lee', 'Ava Patel', 'Ethan Kim']}
                        />
                        <AssignmentCard
                            tutorName="Maya Thompson"
                            studentCount={4}
                            students={['Sophie Zhang', 'Noah Kim', 'Isabella Roy', 'Liam Park']}
                        />
                        <AssignmentCard
                            tutorName="Chloe Johnson"
                            studentCount={4}
                            students={[]}
                        />
                        <AssignmentCard
                            tutorName="Ella Martinez"
                            studentCount={4}
                            students={[]}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="d-flex align-items-center justify-content-end" style={{ gap: 'var(--size-modal-gap-sm)' }}>
                    <Button text="Edit assignment" style="primary" fill="outline" size="medium" onClick={() => {}} />
                    <Button text="Looks good" style="primary" fill="filled" size="medium" onClick={() => {}} />
                </div>
            </div>
        }
    />
);

const SessionInfoModalHeader = () => (
    <div className="d-flex justify-content-between align-items-center">
        <span className="h4" style={{ margin: 0, color: 'var(--color-on-surface)' }}>
            Lincoln High School - 8/14/2025
        </span>
        <i
            className="fa-solid fa-xmark"
            style={{
                fontSize: 'var(--font-size-fa-h4-solid)',
                lineHeight: 'var(--font-line-height-fa-h4-solid)',
                color: 'var(--color-on-surface-variant)',
                cursor: 'pointer',
            }}
        />
    </div>
);

const SessionInfoTabButtonGroup = () => (
    <ButtonGroup fill="tonal" className="w-100">
        <Button
            text="Attendance"
            style="secondary"
            fill="tonal"
            block
            trailingVisual={<Badge text="20" style="secondary" size="b3" />}
        />
        <Button text="Assignment" style="secondary" fill="tonal" block />
        <Button text="Session Info" active={true} style="primary" fill="tonal" block />
    </ButtonGroup>
);

/**
 * Session Info Loading Lead
 *
 * The loading state of the Session Info tab in the pop-up modal for Lead Tutors.
 * Displays the school name and date as the title, with a loading animation
 * while session information is being fetched.
 */
export const SessionInfoLoadingLead = () => (
    <Modal
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={
            <div
                className="d-flex flex-column"
                style={{
                    gap: 'var(--size-modal-gap-lg)',
                    backgroundColor: 'var(--color-surface-container-high)',
                    border: 'var(--size-element-border) solid var(--color-outline-variant)',
                    padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                    borderRadius: 'var(--size-modal-radius-lg)',
                    height: '584px',
                }}
            >
                <SessionInfoModalHeader />

                {/* Body */}
                <div
                    className="d-flex flex-column"
                    style={{ flex: '1 0 0', minHeight: 0, gap: 'var(--size-modal-gap-md)' }}
                >
                    <MATHiaGoalStatusBanner type="modal" sessionType="goal-setting" dismissable={false} />
                    <SessionInfoTabButtonGroup />

                    {/* Content Area - Loading */}
                    <div
                        className="d-flex"
                        style={{
                            flex: '1 0 0',
                            minHeight: 0,
                            position: 'relative',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Loading Animation */}
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '52px', height: '52px' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: '53.85%', bottom: '53.85%', backgroundColor: 'var(--color-on-surface-variant)', borderRadius: '1px' }} />
                            <div style={{ position: 'absolute', top: '53.85%', left: 0, right: '53.85%', bottom: 0, backgroundColor: 'var(--color-on-surface-variant)', borderRadius: '1px' }} />
                            <div style={{ position: 'absolute', top: '53.85%', left: '53.85%', right: 0, bottom: 0, backgroundColor: 'var(--color-on-surface-variant)', borderRadius: '1px' }} />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="d-flex align-items-center justify-content-end" style={{ gap: 'var(--size-modal-gap-sm)' }}>
                    <Button text="Close" style="primary" fill="outline" size="medium" onClick={() => {}} />
                    <Button text="Continue" style="primary" fill="filled" size="medium" onClick={() => {}} />
                </div>
            </div>
        }
    />
);

/**
 * Session Info Loaded Lead
 *
 * The loaded state of the Session Info tab in the pop-up modal for Lead Tutors.
 * Displays session details in a 2-column grid using SessionInfoCard components.
 */
export const SessionInfoLoadedLead = () => (
    <Modal
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={
            <div
                className="d-flex flex-column"
                style={{
                    gap: 'var(--size-modal-gap-lg)',
                    backgroundColor: 'var(--color-surface-container-high)',
                    border: 'var(--size-element-border) solid var(--color-outline-variant)',
                    padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                    borderRadius: 'var(--size-modal-radius-lg)',
                }}
            >
                <SessionInfoModalHeader />

                {/* Body */}
                <div
                    className="d-flex flex-column"
                    style={{ gap: 'var(--size-modal-gap-sm)' }}
                >
                    <MATHiaGoalStatusBanner type="modal" sessionType="goal-setting" dismissable={false} />
                    <SessionInfoTabButtonGroup />

                    {/* Session Info Grid */}
                    <div
                        style={{
                            border: 'var(--size-element-border) solid var(--color-outline-variant)',
                            borderRadius: 'var(--size-modal-radius-md)',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 'var(--size-element-gap-sm)',
                            overflow: 'hidden',
                        }}
                    >
                        <SessionInfoCard
                            icon="fa-regular fa-clock"
                            title="Time"
                            content="1:30 PM – 2:20 PM (Thursday)"
                        />
                        <SessionInfoCard
                            icon="fa-solid fa-graduation-cap"
                            title="Teacher"
                            content="Mr. Snape"
                        />
                        <SessionInfoCard
                            icon="fa-solid fa-person"
                            title="Tutor Count"
                            content="5/5 (Leads: 1/1)"
                        />
                        <SessionInfoCard
                            icon="fa-solid fa-graduation-cap"
                            title="Student Count"
                            content="25"
                        />
                        <SessionInfoCard
                            icon="fa-solid fa-video"
                            title="Session Link"
                            content="{zoom url}"
                            contentLink="#"
                            showCopyButton={true}
                        />
                        <SessionInfoCard
                            icon="fa-solid fa-key"
                            title="Session Passcode"
                            content="123 456 789"
                            showCopyButton={true}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="d-flex align-items-center justify-content-end" style={{ gap: 'var(--size-modal-gap-sm)' }}>
                    <Button text="Close" style="primary" fill="outline" size="medium" onClick={() => {}} />
                    <Button text="Close" style="primary" fill="filled" size="medium" onClick={() => {}} />
                </div>
            </div>
        }
    />
);

/**
 * Session Info Loaded Regular
 *
 * The loaded state of the Session Info tab in the pop-up modal for Regular Tutors.
 * Has two tabs (Session Info, Attendees) instead of three.
 * Displays session details in a 2-column grid using SessionInfoCard components.
 */
const RegularTabButtonGroup = () => (
    <ButtonGroup fill="tonal" className="w-100">
        <Button text="Session info" active={true} style="primary" fill="tonal" block />
        <Button
            text="Attendees"
            style="secondary"
            fill="tonal"
            block
            trailingVisual={<Badge text="20" style="secondary" size="b3" />}
        />
    </ButtonGroup>
);

export const SessionInfoLoadedRegular = () => (
    <Modal
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={
            <div
                className="d-flex flex-column"
                style={{
                    gap: 'var(--size-modal-gap-lg)',
                    backgroundColor: 'var(--color-surface-container-high)',
                    border: 'var(--size-element-border) solid var(--color-outline-variant)',
                    padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                    borderRadius: 'var(--size-modal-radius-lg)',
                }}
            >
                <SessionInfoModalHeader />

                {/* Body */}
                <div
                    className="d-flex flex-column"
                    style={{ gap: 'var(--size-modal-gap-sm)' }}
                >
                    <MATHiaGoalStatusBanner type="modal" sessionType="goal-setting" dismissable={false} />
                    <RegularTabButtonGroup />

                    {/* Session Info Grid */}
                    <div
                        style={{
                            border: 'var(--size-element-border) solid var(--color-outline-variant)',
                            borderRadius: 'var(--size-modal-radius-md)',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 'var(--size-element-gap-sm)',
                            overflow: 'hidden',
                        }}
                    >
                        <SessionInfoCard
                            icon="fa-regular fa-clock"
                            title="Time"
                            content="1:30 PM – 2:20 PM (Thursday)"
                        />
                        <SessionInfoCard
                            icon="fa-solid fa-graduation-cap"
                            title="Teacher"
                            content="Mr. Snape"
                        />
                        <SessionInfoCard
                            icon="fa-solid fa-person"
                            title="Tutor Count"
                            content="5/5 (Leads: 1/1)"
                        />
                        <SessionInfoCard
                            icon="fa-solid fa-graduation-cap"
                            title="Student Count"
                            content="25"
                        />
                        <SessionInfoCard
                            icon="fa-solid fa-video"
                            title="Session Link"
                            content="{zoom url}"
                            contentLink="#"
                            showCopyButton={true}
                        />
                        <SessionInfoCard
                            icon="fa-solid fa-key"
                            title="Session Passcode"
                            content="123 456 789"
                            showCopyButton={true}
                        />
                    </div>
                </div>
            </div>
        }
    />
);

/**
 * Attendance Loaded Regular
 *
 * The loaded Attendees tab in the pop-up modal for Regular Tutors.
 * Shows tutor and student rosters as simple name lists.
 * Lead tutors are indicated with a "Lead" badge.
 */
const RegularAttendeeTabButtonGroup = () => (
    <ButtonGroup fill="tonal" className="w-100">
        <Button text="Session info" style="secondary" fill="tonal" block />
        <Button
            text="Attendees"
            active={true}
            style="primary"
            fill="tonal"
            block
            trailingVisual={<Badge text="20" style="secondary" size="b3" />}
        />
    </ButtonGroup>
);

const RosterHeader = ({ title, count, showInfo = false }) => (
    <div className="d-flex align-items-center" style={{ gap: 'var(--size-element-gap-sm)' }}>
        <span className="h6" style={{ margin: 0, color: 'var(--color-on-surface)' }}>
            {title}
        </span>
        {showInfo && (
            <i
                className="fa-solid fa-circle-info"
                style={{
                    fontSize: 'var(--font-size-fa-b3-solid)',
                    lineHeight: 'var(--font-line-height-fa-b3-solid)',
                    color: 'var(--color-on-surface-variant)',
                }}
            />
        )}
        <div style={{ flex: 1 }} />
        <CountBadge count={count} />
    </div>
);

export const AttendanceLoadedRegular = () => (
    <Modal
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={
            <div
                className="d-flex flex-column"
                style={{
                    gap: 'var(--size-modal-gap-lg)',
                    backgroundColor: 'var(--color-surface-container-high)',
                    border: 'var(--size-element-border) solid var(--color-outline-variant)',
                    padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                    borderRadius: 'var(--size-modal-radius-lg)',
                }}
            >
                <SessionInfoModalHeader />

                {/* Body */}
                <div
                    className="d-flex flex-column"
                    style={{ gap: 'var(--size-modal-gap-sm)' }}
                >
                    <MATHiaGoalStatusBanner type="modal" sessionType="goal-setting" dismissable={false} />
                    <RegularAttendeeTabButtonGroup />

                    {/* Roster Area */}
                    <div
                        className="d-flex"
                        style={{ gap: 'var(--size-modal-gap-sm)', marginTop: 'var(--size-modal-gap-sm)' }}
                    >
                        {/* Tutor Roster */}
                        <div
                            className="d-flex flex-column"
                            style={{
                                flex: '1 0 0',
                                border: 'var(--size-element-border) solid var(--color-outline-variant)',
                                borderRadius: 'var(--size-element-radius-lg)',
                                padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                                gap: 'var(--size-card-gap-sm)',
                            }}
                        >
                            <RosterHeader title="Tutor Roster" count="4" showInfo={true} />
                            <div className="d-flex flex-column">
                                <SessionAttendeeListItem name="Ava Patel" userType="tutor" leadTutor={true} showAttendanceControl={false} />
                                <SessionAttendeeListItem name="Savannah Nguyen" userType="tutor" leadTutor={true} showAttendanceControl={false} />
                                <SessionAttendeeListItem name="Marcus Lee" userType="tutor" showAttendanceControl={false} />
                                <SessionAttendeeListItem name="Lila Chen" userType="tutor" showAttendanceControl={false} />
                            </div>
                        </div>

                        {/* Student Roster */}
                        <div
                            className="d-flex flex-column"
                            style={{
                                flex: '1 0 0',
                                border: 'var(--size-element-border) solid var(--color-outline-variant)',
                                borderRadius: 'var(--size-element-radius-lg)',
                                padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                                gap: 'var(--size-card-gap-sm)',
                            }}
                        >
                            <RosterHeader title="Student Roster" count="4" />
                            <div className="d-flex flex-column">
                                <SessionAttendeeListItem name="Ethan Kim" userType="student" showAttendanceControl={false} />
                                <SessionAttendeeListItem name="Maya Thompson" userType="student" showAttendanceControl={false} />
                                <SessionAttendeeListItem name="Sophie Zhang" userType="student" showAttendanceControl={false} />
                                <SessionAttendeeListItem name="Noah Kim" userType="student" showAttendanceControl={false} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        }
    />
);
