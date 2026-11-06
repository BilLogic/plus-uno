import React from 'react';
import Modal from '@/components/messaging/Modal';
import ButtonGroup from '@/components/forms-and-inputs/ButtonGroup';
import Button from '@/components/forms-and-inputs/Button';
import CountTag from '@/components/labels/CountTag';
import SectionMessage from '@/components/messaging/SectionMessage';
import Checkbox from '@/components/forms-and-inputs/Checkbox';
import Pagination from '@/components/navigation/Pagination';

import { SessionInfoCard } from '@/specs/Toolkit/Pre-Session/Cards/SessionInfoCard.stories';
import { CloseButton, FillInButton } from '@/specs/Toolkit/Pre-Session/Elements/CTATutorViewButtons.stories';
import {
    BackButton,
    CopyRecruitmentMessageButton,
    CheckScheduleButton,
} from '@/specs/Toolkit/Pre-Session/Elements/CtaSignUpRelatedButtons/index.jsx';
import { TableRow, TableHeaderRow } from '@/specs/Toolkit/Pre-Session/Tables/FillInSchedule.stories';
import { TableHeaderRow as MySessionsTableHeaderRow, TableRow as MySessionsTableRow } from '@/specs/Toolkit/Pre-Session/Tables/MySessions.stories';
import { FillInTableHeaderRow, FillInTableRow } from '@/specs/Toolkit/Pre-Session/Tables/FillInTable.stories';
import { iconClass } from '../../../../../lib/icon';

export default {
    title: 'Specs/Toolkit/Pre-Session/Modals/Session Fill-ins',
    component: Modal,
    parameters: {
        layout: 'centered',
    },
    tags: ['!dev', '!autodocs'],
};

// --- State 1: Fill In (Empty State) ---
/**
 * Fill In (Empty State)
 * Empty state when there are no fill-in sessions available.
 * Reuses: SectionMessage (warning, dismissible), Button (primary outline + leading refresh icon),
 * info icon, close icon, hourglass icon, body typography tokens.
 */
export const FillIn_EmptyState = () => (
    <Modal
        renderAs="inline"
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={
            <div
                className="d-flex flex-column"
                style={{
                    gap: 'var(--size-modal-gap-lg)',
                    backgroundColor: 'var(--ds-surface-container)',
                    padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                    borderRadius: 'var(--size-modal-radius-lg)',
                }}
            >
                {/* Header: Session Fill-ins + info icon + close — title-to-icon gap per Figma: element/gap-md */}
                <div className="d-flex align-items-center" style={{ gap: 'var(--space-0625)' }}>
                    <h4 className="h4 m-0">Session Fill-ins</h4>
                    <div className="d-flex align-items-center ms-auto" style={{ gap: 'var(--stack-md)' }}>
                        <i
                            className={iconClass('circle-info')}
                            style={{
                                fontSize: 'var(--font-size-fa-h4-solid)',
                                color: 'var(--ds-icon-subtle)',
                            }}
                            aria-hidden
                        />
                        <i
                            className="fa-solid fa-xmark"
                            style={{
                                fontSize: 'var(--font-size-fa-h4-solid)',
                                color: 'var(--ds-icon-subtle)',
                                cursor: 'pointer',
                            }}
                            aria-hidden
                            role="button"
                        />
                    </div>
                </div>
                {/* One-time Fill-ins banner (design system SectionMessage, Figma copy) */}
                <SectionMessage appearance="warning" dismissible>
                    <strong>One-time Fill-ins:</strong> Help cover specific sessions that need additional tutors.
                    These are individual sessions, not recurring commitments.
                </SectionMessage>
                {/* Empty state: hourglass + primary message + secondary message */}
                <div
                    className="d-flex flex-column align-items-center justify-content-center"
                    style={{ gap: 'var(--size-modal-gap-md)', padding: 'var(--size-modal-pad-y-lg) 0' }}
                >
                    <i
                        className={iconClass('hourglass-half')}
                        style={{ fontSize: '3rem', color: 'var(--ds-icon-subtle)' }}
                        aria-hidden
                    />
                    <span className="body1-txt font-weight-semibold" style={{ color: 'var(--ds-icon)' }}>
                        No fill-ins needed now.
                    </span>
                    <span className="body2-txt" style={{ color: 'var(--ds-icon-subtle)' }}>
                        Check back later for urgent coverage requests.
                    </span>
                </div>
                {/* Refresh Page button (design system Button, primary outline + leading refresh icon) */}
                <div className="d-flex" style={{ width: '100%' }}>
                    <Button
                        text="Refresh Page"
                        shouldFitContainer
                        iconBefore={<i className={iconClass('arrows-rotate')} aria-hidden />}
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
 * Reuses: SectionMessage (One-time Fill-ins), TableRow/TableHeaderRow, Pagination, CloseButton, CopyRecruitmentMessageButton.
 */
export const FillIn = () => (
    <Modal
        renderAs="inline"
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={
            <div
                className="d-flex flex-column"
                style={{
                    gap: 'var(--size-modal-gap-lg)',
                    backgroundColor: 'var(--ds-surface-container)',
                    padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                    borderRadius: 'var(--size-modal-radius-lg)',
                }}
            >
                {/* Header: Session Fill-ins + info icon + close — title-to-icon gap per Figma: element/gap-md */}
                <div className="d-flex align-items-center" style={{ gap: 'var(--space-0625)' }}>
                    <h4 className="h4 m-0">Session Fill-ins</h4>
                    <div className="d-flex align-items-center ms-auto" style={{ gap: 'var(--stack-md)' }}>
                        <i
                            className={iconClass('circle-info')}
                            style={{
                                fontSize: 'var(--font-size-fa-h4-solid)',
                                color: 'var(--ds-icon-subtle)',
                            }}
                            aria-hidden
                        />
                        <i
                            className="fa-solid fa-xmark"
                            style={{
                                fontSize: 'var(--font-size-fa-h4-solid)',
                                color: 'var(--ds-icon-subtle)',
                                cursor: 'pointer',
                            }}
                            aria-hidden
                            role="button"
                        />
                    </div>
                </div>
                {/* One-time Fill-ins banner (design system SectionMessage, Figma copy) */}
                <SectionMessage appearance="warning" dismissible>
                    <strong>One-time Fill-ins:</strong> Help cover specific sessions that need additional tutors.
                    These are individual sessions, not recurring commitments.
                </SectionMessage>
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
                    style={{ flexWrap: 'wrap', gap: 'var(--stack-md)' }}
                >
                    <span className="body2-txt" style={{ color: 'var(--ds-text-subtle)' }}>
                        Showing 1 to 5 of 36 entries
                    </span>
                    <Pagination
                        currentPage={1}
                        totalPages={10}
                        onPageChange={() => {}}
                        navigator="icon"
                        spacing="default"
                    />
                </div>
                {/* Footer: Close, Copy recruit message, Continue (0 selected) disabled (design system Button/CloseButton/CopyRecruitmentMessageButton) */}
                <div className="d-flex" style={{ gap: 'var(--size-modal-gap-md)' }}>
                    <CloseButton />
                    <CopyRecruitmentMessageButton />
                    <Button text="Continue (0 selected)" appearance="primary" isDisabled shouldFitContainer />
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
    { title: 'Job Duties Acknowledgment', description: 'Agree to fulfill all tutor responsibilities during shifts.' },
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
        renderAs="inline"
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={
            <div
                className="d-flex flex-column"
                style={{
                    gap: 'var(--size-modal-gap-lg)',
                    backgroundColor: 'var(--ds-surface-container)',
                    padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                    borderRadius: 'var(--size-modal-radius-lg)',
                }}
            >
                {/* Header: Session Fill-ins + info icon + close — title-to-icon gap per Figma: element/gap-md */}
                <div className="d-flex align-items-center" style={{ gap: 'var(--space-0625)' }}>
                    <h4 className="h4 m-0">Session Fill-ins</h4>
                    <div className="d-flex align-items-center ms-auto" style={{ gap: 'var(--stack-md)' }}>
                        <i
                            className={iconClass('circle-info')}
                            style={{
                                fontSize: 'var(--font-size-fa-h4-solid)',
                                color: 'var(--ds-icon-subtle)',
                            }}
                            aria-hidden
                        />
                        <i
                            className="fa-solid fa-xmark"
                            style={{
                                fontSize: 'var(--font-size-fa-h4-solid)',
                                color: 'var(--ds-icon-subtle)',
                                cursor: 'pointer',
                            }}
                            aria-hidden
                            role="button"
                        />
                    </div>
                </div>
                <p className="body1-txt m-0" style={{ color: 'var(--ds-text)' }}>
                    Please review and acknowledge the following forms before completing your sign-up.
                </p>
                {/* Consent items: card per item with checkbox, title* + external link icon, description (design system Checkbox) */}
                <div className="d-flex flex-column" style={{ gap: 'var(--stack-md)' }}>
                    {consentFormItems.map((item, i) => (
                        <div
                            key={i}
                            className="d-flex align-items-start"
                            style={{
                                gap: 'var(--stack-md)',
                                padding: 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)',
                                backgroundColor: 'var(--ds-surface-container)',
                                borderRadius: 'var(--size-modal-radius-md)',
                                border: 'var(--border-default) solid var(--color-outline-variant)',
                            }}
                        >
                            <div style={{ flexShrink: 0, paddingTop: '2px' }}>
                                {/*
                                  * The consent title is laid out beside the
                                  * checkbox with its own link icon, so it cannot
                                  * be the checkbox's `label` without moving it.
                                  * `aria-label` carries the same text (#213).
                                  */}
                                <Checkbox
                                    isChecked={i < 2}
                                    onChange={() => {}}
                                    aria-label={`I acknowledge ${item.title}`}/>
                            </div>
                            <div className="d-flex flex-column" style={{ gap: 'var(--size-table-cell-gap)', flex: 1, minWidth: 0 }}>
                                <div className="d-flex align-items-center" style={{ gap: 'var(--stack-sm)' }}>
                                    <span className="body2-txt font-weight-semibold" style={{ color: 'var(--ds-text)' }}>
                                        {item.title}
                                    </span>
                                    <span style={{ color: 'var(--color-danger)', flexShrink: 0 }}>*</span>
                                    <i
                                        className={iconClass('arrow-up-right-from-square')}
                                        style={{
                                            fontSize: 'var(--font-size-fa-body1-solid)',
                                            color: 'var(--color-primary)',
                                            cursor: 'pointer',
                                        }}
                                        aria-hidden
                                        role="button"
                                    />
                                </div>
                                <span className="body2-txt" style={{ color: 'var(--ds-text-subtle)' }}>
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
                        <Button text="Confirm & continue" appearance="primary" shouldFitContainer />
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
 * Reuses: pre-session/cards/SessionInfoCard, ButtonGroup, CountTag, CloseButton, FillInButton; gear + close icons.
 */
export const SessionDetails = () => (
    <Modal
        renderAs="inline"
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={
            <div
                className="d-flex flex-column"
                style={{
                    gap: 'var(--size-modal-gap-lg)',
                    backgroundColor: 'var(--ds-surface-container)',
                    padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                    borderRadius: 'var(--size-modal-radius-lg)',
                }}
            >
                {/* Header: Lincoln High School - 8/14/2025 + gear + close (design system icons) */}
                <div className="d-flex justify-content-between align-items-center">
                    <h4 className="h4 m-0">Lincoln High School - 8/14/2025</h4>
                    <div className="d-flex align-items-center" style={{ gap: 'var(--stack-md)' }}>
                        <i
                            className={iconClass('gear')}
                            style={{
                                fontSize: 'var(--font-size-fa-h4-solid)',
                                color: 'var(--ds-icon-subtle)',
                            }}
                            aria-hidden
                        />
                        <i
                            className="fa-solid fa-xmark"
                            style={{
                                fontSize: 'var(--font-size-fa-h4-solid)',
                                color: 'var(--ds-icon-subtle)',
                                cursor: 'pointer',
                            }}
                            aria-hidden
                            role="button"
                        />
                    </div>
                </div>
                {/* Tabs: Session info (active) | Attendees (20) (design system ButtonGroup, Count tag) */}
                <div style={{ display: 'flex', width: '100%' }}>
                    <ButtonGroup className="w-100">
                        <Button text="Session info" isSelected={true} shouldFitContainer />
                        <Button
                            text="Attendees"
                            iconAfter={<CountTag value={20} />}
                            shouldFitContainer
                        />
                    </ButtonGroup>
                </div>
                {/* Session info grid (pre-session/cards/SessionInfoCard) */}
                <div
                    style={{
                        border: 'var(--border-default) solid var(--color-outline-variant)',
                        borderRadius: 'var(--size-modal-radius-md)',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 'var(--stack-md)',
                        overflow: 'hidden',
                    }}
                >
                    <SessionInfoCard
                        icon="fa-regular fa-clock"
                        title="Time"
                        content="1:30 PM - 2:20 PM (Thursday)"
                    />
                    <SessionInfoCard icon={iconClass('graduation-cap')} title="Teacher" content="Mr. Snape" />
                    <SessionInfoCard
                        icon={iconClass('person')}
                        title="Tutor Count"
                        content="5/5 (Leads: 1/1)"
                    />
                    <SessionInfoCard icon={iconClass('users')} title="Student Count" content="25" />
                    <SessionInfoCard
                        icon={iconClass('video')}
                        title="Session Link"
                        content="Zoom"
                        contentLink="https://zoom.us"
                        showCopyButton={true}
                    />
                    <SessionInfoCard
                        icon={iconClass('key')}
                        title="Session Passcode"
                        content="123 456 789"
                        showCopyButton={true}
                    />
                </div>
                {/* Footer: Close + Fill in for this session (design system CloseButton, FillInButton) */}
                <div className="d-flex" style={{ gap: 'var(--size-modal-gap-md)' }}>
                    <CloseButton />
                    <div style={{ flex: 1 }}>
                        <FillInButton shouldFitContainer />
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
 * Reuses: SectionMessage, BackButton, Button, close icon; pre-session/tables/Fill Ins (FillInTableHeaderRow, FillInTableRow).
 */
export const Confirmation = () => {
    const confirmationSessions = [
        { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5' },
    ];
    return (
        <Modal
            renderAs="inline"
            width={672}
            showBottomButtons={false}
            onClose={() => {}}
            body={
                <div
                    className="d-flex flex-column"
                    style={{
                        gap: 'var(--size-modal-gap-lg)',
                        backgroundColor: 'var(--ds-surface-container)',
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
                                color: 'var(--ds-icon-subtle)',
                                cursor: 'pointer',
                            }}
                            aria-hidden
                            role="button"
                        />
                    </div>
                    <div className="d-flex flex-column" style={{ gap: 'var(--size-modal-gap-md)' }}>
                        {/* Warning message (design system SectionMessage) */}
                        <SectionMessage appearance="warning" dismissible={false}>
                            You're filling in for the following session(s). Please confirm before continuing.
                        </SectionMessage>
                        {/* Session table: pre-session/tables/Fill Ins */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <FillInTableHeaderRow />
                            {confirmationSessions.map((s, i) => (
                                <FillInTableRow
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
                            <Button text="Confirm fill-in" appearance="primary" shouldFitContainer />
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
 * Reuses: SectionMessage (success), CheckScheduleButton; TableHeaderRow + TableRow from MySessions.stories (Figma 2279-148185, 2279-148186).
 */
export const Success = () => (
    <Modal
        renderAs="inline"
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={
            <div
                className="d-flex flex-column"
                style={{
                    gap: 'var(--size-modal-gap-lg)',
                    backgroundColor: 'var(--ds-surface-container)',
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
                            color: 'var(--ds-icon-subtle)',
                            cursor: 'pointer',
                        }}
                        aria-hidden
                        role="button"
                    />
                </div>
                <div className="d-flex flex-column" style={{ gap: 'var(--size-modal-gap-md)' }}>
                    {/* Success message (design system SectionMessage) */}
                    <SectionMessage appearance="success" dismissible={false}>
                        The following session(s) have been added to your schedule.
                    </SectionMessage>
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
