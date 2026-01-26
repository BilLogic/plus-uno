import React from 'react';
import Modal from '../../../../../../packages/plus-ds/src/components/Modal';
import ButtonGroup from '../../../../../../packages/plus-ds/src/components/ButtonGroup';
import Button from '../../../../../../packages/plus-ds/src/components/Button';
import Badge from '../../../../../../packages/plus-ds/src/components/Badge';
import Alert from '../../../../../../packages/plus-ds/src/components/Alert';
import Checkbox from '../../../../../../packages/plus-ds/src/forms/Checkbox';

// Import the reusable SessionInfoCard component
import { SessionInfoCard } from '../../cards/SessionInfoCard.stories';
// Import the reused AttendanceRosterRow component
import { AttendanceRosterRow } from '../../elements/PopupModalAttendanceRoster.stories';
// Import the reusable ConfirmationAlert component
import { ConfirmationAlert } from '../../cards/CallOffAlerts.stories';
// Import CTA button components from Tutor View
import {
    RequestCallOffButton,
    JoinSessionButton,
    BackButton,
    SubmitRequestButton,
    SeeSessionsFillInButton,
    SeeSessionsSignUpButton,
    ViewUpdatedScheduleButton,
    SignUpRecurringButton,
    FillInButton,
    CloseButton
} from '../../elements/CTATutorViewButtons.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Modals/Session Details (All User)',
    component: Modal,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

/**
 * Session Info - Post Sign-Up
 * Tab: Session info | State: Post Sign-up
 * Shows session details after a tutor has signed up
 */
export const SessionInfo_PostSignUp = () => (
    <Modal
        width={672}
        showBottomButtons={false}
        onClose={() => { }}
        body={
            <div className="d-flex flex-column" style={{
                gap: 'var(--size-modal-gap-lg)',
                backgroundColor: 'var(--color-surface-container-high)',
                padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                borderRadius: 'var(--size-modal-radius-lg)'
            }}>

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center">
                    <h4 className="h4 m-0">Lincoln High School - 8/14/2025</h4>
                    <i
                        className="fa-solid fa-xmark"
                        style={{
                            fontSize: 'var(--font-size-fa-h4-solid)',
                            color: 'var(--color-on-surface-variant)',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* Tabs using ButtonGroup */}
                <div style={{ display: 'flex', width: '100%' }}>
                    <ButtonGroup
                        fill="tonal"
                        className="w-100"
                    >
                        <Button
                            text="Session info"
                            active={true}
                            style="primary"
                            fill="tonal"
                            block
                        />
                        <Button
                            text="Attendees"
                            trailingVisual={
                                <Badge text="20" style="secondary" size="b3" />
                            }
                            style="secondary"
                            fill="tonal"
                            block
                        />
                    </ButtonGroup>
                </div>

                {/* Body Content - Info Grid using SessionInfoCard */}
                <div style={{
                    border: 'var(--size-element-border) solid var(--color-outline-variant)',
                    borderRadius: 'var(--size-modal-radius-md)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--size-element-gap-sm)',
                    overflow: 'hidden',
                }}>
                    {/* Row 1 */}
                    <SessionInfoCard
                        icon="fa-regular fa-clock"
                        title="Time"
                        content="1:30 PM - 2:20 PM (Thursday)"
                    />
                    <SessionInfoCard
                        icon="fa-solid fa-graduation-cap"
                        title="Teacher"
                        content="Mr. Snape"
                    />

                    {/* Row 2 */}
                    <SessionInfoCard
                        icon="fa-solid fa-person"
                        title="Tutor Count"
                        content="5/5 (Leads: 1/1)"
                    />
                    <SessionInfoCard
                        icon="fa-solid fa-users"
                        title="Student Count"
                        content="25"
                    />

                    {/* Row 3 */}
                    <SessionInfoCard
                        icon="fa-solid fa-video"
                        title="Session Link"
                        content="Zoom"
                        contentLink="https://zoom.us"
                    />
                    <SessionInfoCard
                        icon="fa-solid fa-key"
                        title="Session Passcode"
                        content="123 456 789"
                        showCopyButton={true}
                    />
                </div>

                {/* Footer Buttons - using CTA Tutor View components */}
                <div className="d-flex" style={{ gap: 'var(--size-modal-gap-md)' }}>
                    <RequestCallOffButton />
                    <JoinSessionButton block />
                </div>
            </div>
        }
    />
);

/**
 * Session Attendees (Post Sign-Up / Fill-in)
 * Tab: Attendees | State: Post Sign-up or Fill-in
 * Shows tutor and student rosters with attendance actions
 */
export const SessionAttendees_PostSignUp_FillIn = () => (
    <Modal
        width={800}
        showBottomButtons={false}
        onClose={() => { }}
        body={
            <div className="d-flex flex-column" style={{
                gap: 'var(--size-modal-gap-lg)',
                backgroundColor: 'var(--color-surface-container-high)',
                padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                borderRadius: 'var(--size-modal-radius-lg)'
            }}>

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center">
                    <h4 className="h4 m-0">Lincoln High School - 8/14/2025</h4>
                    <i
                        className="fa-solid fa-xmark"
                        style={{
                            fontSize: 'var(--font-size-fa-h4-solid)',
                            color: 'var(--color-on-surface-variant)',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', width: '100%' }}>
                    <ButtonGroup
                        fill="tonal"
                        className="w-100"
                    >
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

                {/* Roster Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--size-modal-gap-md)',
                    height: '350px'
                }}>
                    {/* Tutor Roster Panel */}
                    <div style={{
                        border: 'var(--size-element-border) solid var(--color-outline-variant)',
                        borderRadius: 'var(--size-element-radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        {/* Panel Header */}
                        <div className="d-flex justify-content-between align-items-center" style={{
                            padding: 'var(--size-modal-pad-y-md) var(--size-modal-pad-x-md)',
                        }}>
                            <span className="h6 m-0">Tutor Roster</span>
                            <Badge text="4" style="info" size="b3" leadingVisual={<i className="fa-solid fa-users" />} />
                        </div>
                        {/* Panel Body - Content + Scrollbar */}
                        <div className="d-flex" style={{ flex: 1, overflow: 'hidden' }}>
                            {/* Panel Content - Reusing AttendanceRosterRow with Lead badge */}
                            <div style={{ overflowY: 'auto', flex: 1, padding: '0 var(--size-modal-pad-x-md)', gap: 'var(--size-modal-gap-md)', display: 'flex', flexDirection: 'column' }}>
                                {/* Tutor Row - Lead */}
                                <div className="d-flex justify-content-between align-items-center w-100" style={{
                                    padding: 'var(--size-element-pad-y-lg) 0',
                                    gap: 'var(--size-element-gap-sm)',
                                }}>
                                    <span className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface)' }}>Ben Green</span>
                                    <Badge text="Lead" style="info" size="b3" />
                                </div>
                                {/* Other Tutors */}
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="d-flex align-items-center w-100" style={{
                                        padding: 'var(--size-element-pad-y-lg) 0',
                                        gap: 'var(--size-element-gap-sm)',
                                    }}>
                                        <span className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface)' }}>Ben Green</span>
                                    </div>
                                ))}
                            </div>
                            {/* Scrollbar from Design System */}
                            <div className="plus-modal-scrollbar">
                                <div className="plus-modal-scrollbar-track">
                                    <div className="plus-modal-scrollbar-bar" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Student Roster Panel */}
                    <div style={{
                        border: 'var(--size-element-border) solid var(--color-outline-variant)',
                        borderRadius: 'var(--size-element-radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        {/* Panel Header */}
                        <div className="d-flex justify-content-between align-items-center" style={{
                            padding: 'var(--size-modal-pad-y-md) var(--size-modal-pad-x-md)',
                        }}>
                            <span className="h6 m-0">Student Roster</span>
                            <Badge text="4" style="info" size="b3" leadingVisual={<i className="fa-solid fa-users" />} />
                        </div>
                        {/* Panel Body - Content + Scrollbar */}
                        <div className="d-flex" style={{ flex: 1, overflow: 'hidden' }}>
                            {/* Panel Content - Reusing AttendanceRosterRow */}
                            <div style={{ overflowY: 'auto', flex: 1, padding: '0 var(--size-modal-pad-x-md)', gap: 'var(--size-modal-gap-md)', display: 'flex', flexDirection: 'column' }}>
                                <AttendanceRosterRow name="Ben Green" state="unknown" />
                                <AttendanceRosterRow name="Ben Green" state="unknown" />
                                <AttendanceRosterRow name="Ben Green" state="unknown" />
                                <AttendanceRosterRow name="Ben Green" state="unknown" />
                                <AttendanceRosterRow name="Ben Green" state="unknown" />
                                <AttendanceRosterRow name="Ben Green" state="unknown" />
                                <AttendanceRosterRow name="Ben Green" state="unknown" showDropdown={true} />
                            </div>
                            {/* Scrollbar from Design System */}
                            <div className="plus-modal-scrollbar">
                                <div className="plus-modal-scrollbar-track">
                                    <div className="plus-modal-scrollbar-bar" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="d-flex justify-content-between align-items-center" style={{ gap: 'var(--size-modal-gap-md)' }}>
                    <RequestCallOffButton />
                    <div style={{ flex: 1 }}>
                        <JoinSessionButton block />
                    </div>
                </div>
            </div>
        }
    />
);


/**
 * One Time Session - Pre Fill-in
 * Tab: Session info | State: Pre Fill-in for one-time session
 * Shows session details before filling in for a one-time session
 */
export const OneTimeSession_PreFillIn = () => (
    <Modal
        width={672}
        showBottomButtons={false}
        onClose={() => { }}
        body={
            <div className="d-flex flex-column" style={{
                gap: 'var(--size-modal-gap-lg)',
                backgroundColor: 'var(--color-surface-container-high)',
                padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                borderRadius: 'var(--size-modal-radius-lg)'
            }}>

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center">
                    <h4 className="h4 m-0">Lincoln High School - 8/14/2025</h4>
                    <i
                        className="fa-solid fa-xmark"
                        style={{
                            fontSize: 'var(--font-size-fa-h4-solid)',
                            color: 'var(--color-on-surface-variant)',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* Tabs using ButtonGroup */}
                <div style={{ display: 'flex', width: '100%' }}>
                    <ButtonGroup
                        fill="tonal"
                        className="w-100"
                    >
                        <Button
                            text="Session info"
                            active={true}
                            style="primary"
                            fill="tonal"
                            block
                        />
                        <Button
                            text="Attendees"
                            trailingVisual={
                                <Badge text="20" style="secondary" size="b3" />
                            }
                            style="secondary"
                            fill="tonal"
                            block
                        />
                    </ButtonGroup>
                </div>

                {/* Body Content - Info Grid using SessionInfoCard */}
                <div style={{
                    border: 'var(--size-element-border) solid var(--color-outline-variant)',
                    borderRadius: 'var(--size-modal-radius-md)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--size-element-gap-sm)',
                    overflow: 'hidden',
                }}>
                    {/* Row 1 */}
                    <SessionInfoCard
                        icon="fa-solid fa-circle-info"
                        title="Type"
                        content="One-time (8/14/2025)"
                    />
                    <SessionInfoCard
                        icon="fa-regular fa-clock"
                        title="Time"
                        content="1:30 PM - 2:20 PM"
                    />

                    {/* Row 2 */}
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

                    {/* Row 3 */}
                    <SessionInfoCard
                        icon="fa-solid fa-video"
                        title="Session Link"
                        content="Zoom"
                        contentLink="https://zoom.us"
                        showCopyButton={true}
                    />
                    <SessionInfoCard
                        icon="fa-solid fa-key"
                        title="Session Passcode"
                        content="123 456 789"
                        showCopyButton={true}
                    />
                </div>

                {/* Footer Buttons - using CTA Tutor View components */}
                <div className="d-flex" style={{ gap: 'var(--size-modal-gap-md)' }}>
                    <CloseButton />
                    <div style={{ flex: 1 }}>
                        <FillInButton block />
                    </div>
                </div>
            </div>
        }
    />
);

/**
 * Fill-In Review Choices Modal
 * Shows a confirmation modal for reviewing fill-in session selections
 * Uses:
 * - Alert component (warning style, non-dismissable)
 * - Fill-In Schedule table structure (simplified, no checkboxes)
 * - Badge component for "No lead" indicators
 */
export const FillIn_ReviewChoices = () => {
    // Sample data for fill-in sessions
    const fillInSessions = [
        { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', leadCount: '0/1', hasNoLead: true },
        { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', leadCount: '0/1', hasNoLead: true },
    ];

    // Simplified Table Row for modal (no checkbox)
    const FillInTableRow = ({ date, timeRange, school, teacher, tutorCount, leadCount, hasNoLead }) => (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                width: '100%',
                borderRadius: 'var(--size-table-radius-md)',
            }}
        >
            {/* Date & Time Cell */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 'var(--size-table-cell-gap)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    {date}
                </span>
                <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                    {timeRange}
                </span>
            </div>

            {/* School & Teacher Cell */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 'var(--size-table-cell-gap)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    {school}
                </span>
                <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                    {teacher}
                </span>
            </div>

            {/* Tutor Capacity Cell */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    gap: 'var(--size-table-cell-gap)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                }}
            >
                <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                    {tutorCount} (Leads: {leadCount})
                </span>
                {hasNoLead && (
                    <Badge
                        text="No lead"
                        style="warning"
                        size="b3"
                    />
                )}
            </div>
        </div>
    );

    // Table Header Row
    const FillInTableHeader = () => (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                width: '100%',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--size-table-cell-gap)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-secondary-text)' }}>
                    Date & time
                </span>
                <i
                    className="fa-solid fa-arrow-up"
                    style={{
                        fontSize: 'var(--font-size-fa-b1-solid)',
                        color: 'var(--color-on-surface)',
                    }}
                />
            </div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--size-table-cell-gap)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-secondary-text)' }}>
                    School & teacher
                </span>
                <i
                    className="fa-solid fa-arrow-up"
                    style={{
                        fontSize: 'var(--font-size-fa-b1-solid)',
                        color: 'var(--color-outline-variant)',
                    }}
                />
            </div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-secondary-text)' }}>
                    Tutor Capacity
                </span>
            </div>
        </div>
    );

    return (
        <Modal
            width={672}
            showBottomButtons={false}
            onClose={() => { }}
            body={
                <div className="d-flex flex-column" style={{
                    gap: 'var(--size-modal-gap-lg)',
                    backgroundColor: 'var(--color-surface-container-high)',
                    padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                    borderRadius: 'var(--size-modal-radius-lg)'
                }}>

                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="h4 m-0">Review your fill-in choices</h4>
                        <i
                            className="fa-solid fa-xmark"
                            style={{
                                fontSize: 'var(--font-size-fa-h4-solid)',
                                color: 'var(--color-on-surface-variant)',
                                cursor: 'pointer'
                            }}
                        />
                    </div>

                    {/* Warning Alert + Fill-In Schedule Table */}
                    <div className="d-flex flex-column" style={{ gap: 'var(--size-modal-gap-md)' }}>
                        <Alert style="warning" dismissable={false}>
                            You are filling in for <strong>{fillInSessions.length} sessions</strong>. The following sessions will be added to your schedule.
                        </Alert>

                        {/* Fill-In Schedule Table */}
                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                            <FillInTableHeader />
                            {fillInSessions.map((session, index) => (
                                <FillInTableRow
                                    key={index}
                                    date={session.date}
                                    timeRange={session.timeRange}
                                    school={session.school}
                                    teacher={session.teacher}
                                    tutorCount={session.tutorCount}
                                    leadCount={session.leadCount}
                                    hasNoLead={session.hasNoLead}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Footer Buttons - using CTA Tutor View components */}
                    <div className="d-flex" style={{ gap: 'var(--size-modal-gap-md)' }}>
                        <BackButton />
                        <div style={{ flex: 1 }}>
                            <Button
                                text="Confirm & complete fill-in"
                                style="primary"
                                fill="filled"
                                block
                            />
                        </div>
                    </div>
                </div>
            }
        />
    );
};


/**
 * Unregister - Post Sign-Up
 * Shows confirmation dialog to unregister from recurring sessions
 * Features:
 * - Warning Alert with checkbox confirmation
 * - "I understand..." checkbox text with required asterisk
 * - Back and Submit Request buttons (Submit disabled until checkbox is checked)
 */
export const Unregister_PostSignUp = () => {
    const [isChecked, setIsChecked] = React.useState(false);

    return (
        <Modal
            width={672}
            showBottomButtons={false}
            onClose={() => { }}
            body={
                <div className="d-flex flex-column" style={{
                    gap: 'var(--size-modal-gap-lg)',
                    backgroundColor: 'var(--color-surface-container-high)',
                    padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                    borderRadius: 'var(--size-modal-radius-lg)'
                }}>

                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="h4 m-0">Unregister from recurring sessions</h4>
                        <i
                            className="fa-solid fa-xmark"
                            style={{
                                fontSize: 'var(--font-size-fa-h4-solid)',
                                color: 'var(--color-on-surface-variant)',
                                cursor: 'pointer'
                            }}
                        />
                    </div>

                    {/* Warning Confirmation - reuses CallOffAlerts component */}
                    <ConfirmationAlert
                        checked={isChecked}
                        onChange={(e) => setIsChecked(e.target.checked)}
                        label="I understand that upon submitting this request, I will be removed from all upcoming sessions in this recurring series."
                        showHelper={false}
                    />

                    {/* Footer Buttons - using CTA Tutor View components */}
                    <div className="d-flex" style={{ gap: 'var(--size-modal-gap-md)' }}>
                        <BackButton />
                        <div style={{ flex: 1 }}>
                            <SubmitRequestButton disabled={!isChecked} block />
                        </div>
                    </div>
                </div>
            }
        />
    );
};
