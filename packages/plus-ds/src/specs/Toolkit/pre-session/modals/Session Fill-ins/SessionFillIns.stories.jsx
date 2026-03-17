import React from 'react';
import Modal from '../../../../../components/Modal';
import ButtonGroup from '../../../../../components/ButtonGroup';
import Button from '../../../../../components/Button';
import Badge from '../../../../../components/Badge';
import Alert from '../../../../../components/Alert';
import Checkbox from '../../../../../forms/Checkbox';
import Pagination from '../../../../../components/Pagination';

import { SessionInfoCard } from '../../cards/SessionInfoCard.stories';
import { CloseButton, FillInButton } from '../../elements/CTATutorViewButtons.stories';
import {
    BackButton,
    CopyRecruitmentMessageButton,
    CheckScheduleButton,
} from '../../elements/CTA Sign-Up Related Buttons/index.jsx';
import { TableRow, TableHeaderRow } from '../../tables/FillInSchedule.stories';
import { TableHeaderRow as MySessionsTableHeaderRow, TableRow as MySessionsTableRow } from '../../tables/MySessions.stories';
import { FillInsTableHeaderRow, FillInsTableRow } from '../../tables/FillInTable.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Modals/Session Fill-ins',
    component: Modal,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

// --- State 1: Fill In (Empty State) ---
/**
 * Fill In (Empty State)
 * Empty state when there are no fill-in sessions available.
 * Reuses: Alert (warning, dismissable), Button (primary outline + leading refresh icon),
 * info icon, close icon, hourglass icon, body typography tokens.
 */
export const FillIn_EmptyState = () => (
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
                    padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                    borderRadius: 'var(--size-modal-radius-lg)',
                }}
            >
                {/* Header: Session Fill-ins + info icon + close — title-to-icon gap per Figma: element/gap-md */}
                <div className="d-flex align-items-center" style={{ gap: 'var(--size-element-gap-md)' }}>
                    <h4 className="h4 m-0">Session Fill-ins</h4>
                    <div className="d-flex align-items-center ms-auto" style={{ gap: 'var(--size-element-gap-sm)' }}>
                        <i
                            className="fa-solid fa-circle-info"
                            style={{
                                fontSize: 'var(--font-size-fa-h4-solid)',
                                color: 'var(--color-on-surface-variant)',
                            }}
                            aria-hidden
                        />
                        <i
                            className="fa-solid fa-xmark"
                            style={{
                                fontSize: 'var(--font-size-fa-h4-solid)',
                                color: 'var(--color-on-surface-variant)',
                                cursor: 'pointer',
                            }}
                            aria-hidden
                            role="button"
                        />
                    </div>
                </div>
                {/* One-time Fill-ins banner (design system Alert, Figma copy) */}
                <Alert style="warning" dismissable>
                    <strong>One-time Fill-ins:</strong> Help cover specific sessions that need additional tutors.
                    These are individual sessions, not recurring commitments.
                </Alert>
                {/* Empty state: hourglass + primary message + secondary message */}
                <div
                    className="d-flex flex-column align-items-center justify-content-center"
                    style={{ gap: 'var(--size-modal-gap-md)', padding: 'var(--size-modal-pad-y-lg) 0' }}
                >
                    <i
                        className="fa-solid fa-hourglass-half"
                        style={{ fontSize: '3rem', color: 'var(--color-on-surface-variant)' }}
                        aria-hidden
                    />
                    <span className="body1-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                        No fill-ins needed now.
                    </span>
                    <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Check back later for urgent coverage requests.
                    </span>
                </div>
                {/* Refresh Page button (design system Button, primary outline + leading refresh icon) */}
                <div className="d-flex" style={{ width: '100%' }}>
                    <Button
                        text="Refresh Page"
                        style="primary"
                        fill="outline"
                        block
                        leadingVisual={<i className="fa-solid fa-arrows-rotate" aria-hidden />}
                    />
                </div>
            </div>
        }
    />
);
FillIn_EmptyState.storyName = 'Fill In (Empty State)';

// --- State 2: Fill In (list of available sessions) ---
const fillInListSessions = Array.from({ length: 5 }, () => ({
    date: 'Tue, Sep 9',
    timeRange: '12:30 PM - 1:30 PM',
    school: 'Hogwarts',
    teacher: 'Mr. Snape',
    tutorCount: '1/5',
    leadCount: '0/1',
    hasNoLead: false,
    checked: false,
}));

/**
 * Fill In
 * List of available sessions: table with checkboxes, pagination, Close / Copy recruit message / Continue (0 selected).
 * Reuses: Alert (One-time Fill-ins), TableRow/TableHeaderRow, Pagination, CloseButton, CopyRecruitmentMessageButton.
 */
export const FillIn = () => (
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
                    padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                    borderRadius: 'var(--size-modal-radius-lg)',
                }}
            >
                {/* Header: Session Fill-ins + info icon + close — title-to-icon gap per Figma: element/gap-md */}
                <div className="d-flex align-items-center" style={{ gap: 'var(--size-element-gap-md)' }}>
                    <h4 className="h4 m-0">Session Fill-ins</h4>
                    <div className="d-flex align-items-center ms-auto" style={{ gap: 'var(--size-element-gap-sm)' }}>
                        <i
                            className="fa-solid fa-circle-info"
                            style={{
                                fontSize: 'var(--font-size-fa-h4-solid)',
                                color: 'var(--color-on-surface-variant)',
                            }}
                            aria-hidden
                        />
                        <i
                            className="fa-solid fa-xmark"
                            style={{
                                fontSize: 'var(--font-size-fa-h4-solid)',
                                color: 'var(--color-on-surface-variant)',
                                cursor: 'pointer',
                            }}
                            aria-hidden
                            role="button"
                        />
                    </div>
                </div>
                {/* One-time Fill-ins banner (design system Alert, Figma copy) */}
                <Alert style="warning" dismissable>
                    <strong>One-time Fill-ins:</strong> Help cover specific sessions that need additional tutors.
                    These are individual sessions, not recurring commitments.
                </Alert>
                {/* Table: Date & time, School & teacher, Tutor Count + checkboxes (design system TableRow/TableHeaderRow) */}
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <TableHeaderRow />
                    {fillInListSessions.map((s, i) => (
                        <TableRow
                            key={i}
                            date={s.date}
                            timeRange={s.timeRange}
                            school={s.school}
                            teacher={s.teacher}
                            tutorCount={s.tutorCount}
                            leadCount={s.leadCount}
                            hasNoLead={s.hasNoLead}
                            checked={s.checked}
                            interactive={true}
                        />
                    ))}
                </div>
                {/* Pagination: "Showing 1 to 5 of 36 entries" + design system Pagination */}
                <div
                    className="d-flex justify-content-between align-items-center"
                    style={{ flexWrap: 'wrap', gap: 'var(--size-element-gap-sm)' }}
                >
                    <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Showing 1 to 5 of 36 entries
                    </span>
                    <Pagination
                        currentPage={1}
                        totalPages={10}
                        onPageChange={() => {}}
                        type="icon"
                        size="default"
                    />
                </div>
                {/* Footer: Close, Copy recruit message, Continue (0 selected) disabled (design system Button/CloseButton/CopyRecruitmentMessageButton) */}
                <div className="d-flex" style={{ gap: 'var(--size-modal-gap-md)' }}>
                    <CloseButton />
                    <CopyRecruitmentMessageButton />
                    <Button text="Continue (0 selected)" style="primary" fill="filled" disabled block />
                </div>
            </div>
        }
    />
);
FillIn.storyName = 'Fill In';

// --- State 3: Consent Form ---
const consentFormItems = [
    { title: 'Background Check Consent', description: 'Consent for background check verification.' },
    { title: 'Attendance Policy', description: "Agree to follow PLUS's 'three strikes' attendance policy." },
    { title: 'General Policies', description: 'Acknowledge CMU HR and PLUS general policies.' },
    { title: 'Job Duties Acknowledgement', description: 'Agree to fulfill all tutor responsibilities during shifts.' },
    { title: 'Photo Release', description: 'Consent to use of your likeness in PLUS and CMU materials.' },
    { title: 'Tutor Consent Form', description: 'Consent to session recording and research participation.' },
    { title: 'Tutor Reflection Form Agreement', description: 'Agree to complete reflection form after each tutoring shift.' },
];

/**
 * Consent Form
 * Review and acknowledge consent forms before completing sign-up.
 * Reuses: Checkbox, BackButton, Button, info icon, close icon; each item has title*, external link icon, description.
 */
export const ConsentForm = () => (
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
                    padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                    borderRadius: 'var(--size-modal-radius-lg)',
                }}
            >
                {/* Header: Session Fill-ins + info icon + close — title-to-icon gap per Figma: element/gap-md */}
                <div className="d-flex align-items-center" style={{ gap: 'var(--size-element-gap-md)' }}>
                    <h4 className="h4 m-0">Session Fill-ins</h4>
                    <div className="d-flex align-items-center ms-auto" style={{ gap: 'var(--size-element-gap-sm)' }}>
                        <i
                            className="fa-solid fa-circle-info"
                            style={{
                                fontSize: 'var(--font-size-fa-h4-solid)',
                                color: 'var(--color-on-surface-variant)',
                            }}
                            aria-hidden
                        />
                        <i
                            className="fa-solid fa-xmark"
                            style={{
                                fontSize: 'var(--font-size-fa-h4-solid)',
                                color: 'var(--color-on-surface-variant)',
                                cursor: 'pointer',
                            }}
                            aria-hidden
                            role="button"
                        />
                    </div>
                </div>
                <p className="body1-txt m-0" style={{ color: 'var(--color-on-surface)' }}>
                    Please review and acknowledge the following forms before completing your sign-up.
                </p>
                {/* Consent items: card per item with checkbox, title* + external link icon, description (design system Checkbox) */}
                <div className="d-flex flex-column" style={{ gap: 'var(--size-element-gap-sm)' }}>
                    {consentFormItems.map((item, i) => (
                        <div
                            key={i}
                            className="d-flex align-items-start"
                            style={{
                                gap: 'var(--size-element-gap-sm)',
                                padding: 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)',
                                backgroundColor: 'var(--color-surface-container)',
                                borderRadius: 'var(--size-modal-radius-md)',
                                border: 'var(--size-element-border) solid var(--color-outline-variant)',
                            }}
                        >
                            <div style={{ flexShrink: 0, paddingTop: '2px' }}>
                                <Checkbox checked={i < 2} onChange={() => {}} size="small" />
                            </div>
                            <div className="d-flex flex-column" style={{ gap: 'var(--size-table-cell-gap)', flex: 1, minWidth: 0 }}>
                                <div className="d-flex align-items-center" style={{ gap: 'var(--size-element-gap-xs)' }}>
                                    <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                                        {item.title}
                                    </span>
                                    <span style={{ color: 'var(--color-danger)', flexShrink: 0 }}>*</span>
                                    <i
                                        className="fa-solid fa-arrow-up-right-from-square"
                                        style={{
                                            fontSize: 'var(--font-size-fa-b1-solid)',
                                            color: 'var(--color-primary)',
                                            cursor: 'pointer',
                                        }}
                                        aria-hidden
                                        role="button"
                                    />
                                </div>
                                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                                    {item.description}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Footer: Back + Confirm & continue (design system BackButton, Button) */}
                <div className="d-flex" style={{ gap: 'var(--size-modal-gap-md)' }}>
                    <BackButton />
                    <div style={{ flex: 1 }}>
                        <Button text="Confirm & continue" style="primary" fill="filled" block />
                    </div>
                </div>
            </div>
        }
    />
);
ConsentForm.storyName = 'Consent Form';

// --- State 4: Session Details (Lincoln High School - session detail) ---
/**
 * Session Details
 * Single session detail with Session info / Attendees tabs and Fill-in CTA.
 * Reuses: pre-session/cards/SessionInfoCard, ButtonGroup, Badge, CloseButton, FillInButton; gear + close icons.
 */
export const SessionDetails = () => (
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
                    padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                    borderRadius: 'var(--size-modal-radius-lg)',
                }}
            >
                {/* Header: Lincoln High School - 8/14/2025 + gear + close (design system icons) */}
                <div className="d-flex justify-content-between align-items-center">
                    <h4 className="h4 m-0">Lincoln High School - 8/14/2025</h4>
                    <div className="d-flex align-items-center" style={{ gap: 'var(--size-element-gap-sm)' }}>
                        <i
                            className="fa-solid fa-gear"
                            style={{
                                fontSize: 'var(--font-size-fa-h4-solid)',
                                color: 'var(--color-on-surface-variant)',
                            }}
                            aria-hidden
                        />
                        <i
                            className="fa-solid fa-xmark"
                            style={{
                                fontSize: 'var(--font-size-fa-h4-solid)',
                                color: 'var(--color-on-surface-variant)',
                                cursor: 'pointer',
                            }}
                            aria-hidden
                            role="button"
                        />
                    </div>
                </div>
                {/* Tabs: Session info (active) | Attendees (20) (design system ButtonGroup, Badge) */}
                <div style={{ display: 'flex', width: '100%' }}>
                    <ButtonGroup fill="tonal" className="w-100">
                        <Button text="Session info" active={true} style="primary" fill="tonal" block />
                        <Button
                            text="Attendees"
                            trailingVisual={<Badge text="20" style="secondary" size="b3" />}
                            style="secondary"
                            fill="tonal"
                            block
                        />
                    </ButtonGroup>
                </div>
                {/* Session info grid (pre-session/cards/SessionInfoCard) */}
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
                        content="1:30 PM - 2:20 PM (Thursday)"
                    />
                    <SessionInfoCard icon="fa-solid fa-graduation-cap" title="Teacher" content="Mr. Snape" />
                    <SessionInfoCard
                        icon="fa-solid fa-person"
                        title="Tutor Count"
                        content="5/5 (Leads: 1/1)"
                    />
                    <SessionInfoCard icon="fa-solid fa-users" title="Student Count" content="25" />
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
                {/* Footer: Close + Fill in for this session (design system CloseButton, FillInButton) */}
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
SessionDetails.storyName = 'Session Details';

// --- State 5: Confirmation ---
const cellStyle = {
    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
};

/**
 * Confirmation
 * Confirm fill-in step: warning alert, session list (pre-session/tables/Fill Ins), Back + Confirm fill-in.
 * Reuses: Alert, BackButton, Button, close icon; pre-session/tables/Fill Ins (FillInsTableHeaderRow, FillInsTableRow).
 */
export const Confirmation = () => {
    const confirmationSessions = [
        { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5' },
    ];
    return (
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
                        padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                        borderRadius: 'var(--size-modal-radius-lg)',
                    }}
                >
                    {/* Header: Confirm Fill-in + close (design system close icon) */}
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="h4 m-0">Confirm Fill-in</h4>
                        <i
                            className="fa-solid fa-xmark"
                            style={{
                                fontSize: 'var(--font-size-fa-h4-solid)',
                                color: 'var(--color-on-surface-variant)',
                                cursor: 'pointer',
                            }}
                            aria-hidden
                            role="button"
                        />
                    </div>
                    <div className="d-flex flex-column" style={{ gap: 'var(--size-modal-gap-md)' }}>
                        {/* Warning alert (design system Alert) */}
                        <Alert style="warning" dismissable={false}>
                            You're filling in for the following session(s). Please confirm before continuing.
                        </Alert>
                        {/* Session table: pre-session/tables/Fill Ins */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <FillInsTableHeaderRow />
                            {confirmationSessions.map((s, i) => (
                                <FillInsTableRow
                                    key={i}
                                    date={s.date}
                                    timeRange={s.timeRange}
                                    school={s.school}
                                    teacher={s.teacher}
                                    tutorCount={s.tutorCount}
                                />
                            ))}
                        </div>
                    </div>
                    {/* Footer: Back + Confirm fill-in (design system BackButton, Button) */}
                    <div className="d-flex" style={{ gap: 'var(--size-modal-gap-md)' }}>
                        <BackButton />
                        <div style={{ flex: 1 }}>
                            <Button text="Confirm fill-in" style="primary" fill="filled" block />
                        </div>
                    </div>
                </div>
            }
        />
    );
};
Confirmation.storyName = 'Confirmation';

// --- State 6: Success ---
/** Success table: Table / my sessions (Figma 2279-148185, 2279-148186) — Date & time (ET) | School & teacher | Status | Actions */
const successSessions = [
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'In progress' },
];

/**
 * Success
 * Fill-in success state: success alert, table (Table / my sessions: Date & time, School & teacher, Status, Actions), Check my schedule.
 * Reuses: Alert (success), CheckScheduleButton; TableHeaderRow + TableRow from MySessions.stories (Figma 2279-148185, 2279-148186).
 */
export const Success = () => (
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
                    padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                    borderRadius: 'var(--size-modal-radius-lg)',
                }}
            >
                {/* Header: Fill-in success + close (design system close icon) */}
                <div className="d-flex justify-content-between align-items-center">
                    <h4 className="h4 m-0">Fill-in success</h4>
                    <i
                        className="fa-solid fa-xmark"
                        style={{
                            fontSize: 'var(--font-size-fa-h4-solid)',
                            color: 'var(--color-on-surface-variant)',
                            cursor: 'pointer',
                        }}
                        aria-hidden
                        role="button"
                    />
                </div>
                <div className="d-flex flex-column" style={{ gap: 'var(--size-modal-gap-md)' }}>
                    {/* Success alert (design system Alert) */}
                    <Alert style="success" dismissable={false}>
                        The following session(s) have been added to your schedule.
                    </Alert>
                    {/* Table: Table / my sessions — Date & time (ET) | School & teacher | Status | Actions (Figma 2279-148185, 2279-148186) */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <MySessionsTableHeaderRow />
                        {successSessions.map((session, index) => (
                            <MySessionsTableRow
                                key={index}
                                date={session.date}
                                timeRange={session.timeRange}
                                school={session.school}
                                teacher={session.teacher}
                                status={session.status}
                                interactive={false}
                            />
                        ))}
                    </div>
                </div>
                {/* Check my schedule (design system CheckScheduleButton) */}
                <div className="d-flex" style={{ width: '100%' }}>
                    <CheckScheduleButton />
                </div>
            </div>
        }
    />
);
Success.storyName = 'Success';
