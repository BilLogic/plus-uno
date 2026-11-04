import React from 'react';
import Modal from '@/components/messaging/Modal';
import ButtonGroup from '@/components/forms-and-inputs/ButtonGroup';
import Button from '@/components/forms-and-inputs/Button';
import CountTag from '@/components/labels/CountTag';
import SectionMessage from '@/components/messaging/SectionMessage';

// Import the reusable SessionInfoCard component
import { SessionInfoCard } from '@/specs/Toolkit/Pre-Session/Cards/SessionInfoCard.stories';
// Import CTA button components from Tutor View
import {
    CloseButton,
    SignUpRecurringButton,
    BackButton
} from '@/specs/Toolkit/Pre-Session/Elements/CTATutorViewButtons.stories';
// Import CTA Sign-Up Related buttons
import {
    ConfirmSignUpButton,
    CheckScheduleButton,
    SuccessButton
} from '@/specs/Toolkit/Pre-Session/Elements/CtaSignUpRelatedButtons';
// Import modal table components
import { SignInTableHeaderRowModal, SignInTableRowModal } from '@/specs/Toolkit/Pre-Session/Tables/SignInTable.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Modals/Sign-Ups',
    component: Modal,
    parameters: {
        layout: 'centered',
    },
    tags: ['!dev', '!autodocs'],
};

/**
 * Recurring Session - Pre Sign-Up
 * Tab: Session info | State: Pre Sign-up for recurring session
 * Shows session details before signing up for a recurring session
 */
export const RecurringSession_PreSignUp = () => (
    <Modal
        renderAs="inline"
        width={672}
        showBottomButtons={false}
        onClose={() => { }}
        body={
            <div className="d-flex flex-column" style={{
                gap: 'var(--size-modal-gap-lg)',
                backgroundColor: 'var(--ds-surface-container)',
                padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                borderRadius: 'var(--size-modal-radius-lg)'
            }}>

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center">
                    <h4 className="h4 m-0">Lincoln High School - Thursdays</h4>
                    <i
                        className="fa-solid fa-xmark"
                        style={{
                            fontSize: 'var(--font-size-fa-h4-solid)',
                            color: 'var(--ds-icon-subtle)',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* Tabs using ButtonGroup */}
                <div style={{ display: 'flex', width: '100%' }}>
                    <ButtonGroup
                        className="w-100"
                    >
                        <Button
                            text="Session info"
                            isSelected={true}
                            shouldFitContainer
                        />
                        <Button
                            text="Attendees"
                            iconAfter={
                                <CountTag value={20} />
                            }
                            shouldFitContainer
                        />
                    </ButtonGroup>
                </div>

                {/* Body Content - Info Grid using SessionInfoCard */}
                <div style={{
                    border: 'var(--border-default) solid var(--color-outline-variant)',
                    borderRadius: 'var(--size-modal-radius-md)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--stack-md)',
                    overflow: 'hidden',
                }}>
                    {/* Row 1 */}
                    <SessionInfoCard
                        icon="fa-solid fa-circle-info"
                        title="Type"
                        content="Recurring (Thursdays)"
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
                        content="Available after sign-up"
                        showCopyButton={true}
                    />
                    <SessionInfoCard
                        icon="fa-solid fa-key"
                        title="Session Passcode"
                        content="Available after sign-up"
                    />
                </div>

                {/* Footer Buttons - using CTA Tutor View components */}
                <div className="d-flex" style={{ gap: 'var(--size-modal-gap-md)' }}>
                    <CloseButton />
                    <div style={{ flex: 1 }}>
                        <SignUpRecurringButton shouldFitContainer />
                    </div>
                </div>
            </div>
        }
    />
);

/**
 * Confirm Sign-up Modal
 * Shows confirmation before signing up for sessions
 * Features:
 * - Warning SectionMessage with confirmation message
 * - Modal table showing sessions to sign up for
 * - Back and Confirm sign-up buttons
 */
export const ConfirmSignUp = () => (
    <Modal
        renderAs="inline"
        width={672}
        showBottomButtons={false}
        onClose={() => { }}
        body={
            <div className="d-flex flex-column" style={{
                gap: 'var(--size-modal-gap-lg)',
                backgroundColor: 'var(--ds-surface-container)',
                padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                borderRadius: 'var(--size-modal-radius-lg)'
            }}>

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center">
                    <h4 className="h4 m-0">Confirm All</h4>
                    <i
                        className="fa-solid fa-xmark"
                        style={{
                            fontSize: 'var(--font-size-fa-h4-solid)',
                            color: 'var(--ds-icon-subtle)',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* SectionMessage and Table Container - with medium gap */}
                <div className="d-flex flex-column" style={{
                    gap: 'var(--size-modal-gap-md)'
                }}>
                    {/* Warning message */}
                    <SectionMessage
                        appearance="warning"
                        dismissible={false}
                    >
                        You're signing up for the following sessions. Please confirm before continuing.
                    </SectionMessage>

                    {/* Sessions Table */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <SignInTableHeaderRowModal showTeacher={true} />
                        <SignInTableRowModal
                            day="Mondays"
                            timeRange="1:00 PM - 1:50 PM"
                            school="Hogwarts"
                            teacher="Mr. Snape"
                            tutorCount="1/5"
                            studentCount="25"
                            interactive={false}
                        />
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="d-flex" style={{ gap: 'var(--size-modal-gap-md)' }}>
                    <BackButton />
                    <div style={{ flex: 1 }}>
                        <ConfirmSignUpButton />
                    </div>
                </div>
            </div>
        }
    />
);

/**
 * Success All Modal
 * Shows success confirmation after signing up for sessions
 * Features:
 * - Success SectionMessage with confirmation message
 * - Table showing sessions added to schedule (Date & time, School & teacher, Tutor Count)
 * - "Check my schedule" button
 */
export const SuccessAll = () => (
    <Modal
        renderAs="inline"
        width={672}
        showBottomButtons={false}
        onClose={() => { }}
        body={
            <div className="d-flex flex-column" style={{
                gap: 'var(--size-modal-gap-lg)',
                backgroundColor: 'var(--ds-surface-container)',
                padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                borderRadius: 'var(--size-modal-radius-lg)'
            }}>

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center">
                    <h4 className="h4 m-0">Sign-up success</h4>
                    <i
                        className="fa-solid fa-xmark"
                        style={{
                            fontSize: 'var(--font-size-fa-h4-solid)',
                            color: 'var(--ds-icon-subtle)',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* SectionMessage and Table Container - with medium gap */}
                <div className="d-flex flex-column" style={{
                    gap: 'var(--size-modal-gap-md)'
                }}>
                    {/* Success message */}
                    <SectionMessage
                        appearance="success"
                        dismissible={false}
                    >
                        The following sessions have been added to your schedule.
                    </SectionMessage>

                    {/* Sessions Table */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Table Header */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 2fr 1fr',
                                width: '100%',
                                borderRadius: 'var(--size-table-radius-md)'
                            }}
                        >
                            <div style={{ padding: 'var(--size-table-cell-y) var(--size-table-cell-x)' }}>
                                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--ds-text)' }}>
                                    Date & time
                                </span>
                            </div>
                            <div style={{ padding: 'var(--size-table-cell-y) var(--size-table-cell-x)' }}>
                                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--ds-text)' }}>
                                    School & teacher
                                </span>
                            </div>
                            <div style={{ padding: 'var(--size-table-cell-y) var(--size-table-cell-x)' }}>
                                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--ds-text)' }}>
                                    Tutor Count
                                </span>
                            </div>
                        </div>

                        {/* Table Row */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 2fr 1fr',
                                width: '100%',
                                borderRadius: 'var(--size-table-radius-md)'
                            }}
                        >
                            <div style={{
                                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}>
                                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--ds-text)' }}>
                                    Tue, Sep 9
                                </span>
                                <span className="body2-txt" style={{ color: 'var(--ds-text)' }}>
                                    12:30 PM - 1:30 PM
                                </span>
                            </div>
                            <div style={{
                                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}>
                                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--ds-text)' }}>
                                    Hogwarts
                                </span>
                                <span className="body2-txt" style={{ color: 'var(--ds-text)' }}>
                                    Mr. Snape
                                </span>
                            </div>
                            <div style={{
                                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <span className="body2-txt" style={{ color: 'var(--ds-text)' }}>
                                    1/5
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Button */}
                <div className="d-flex" style={{ width: '100%' }}>
                    <CheckScheduleButton />
                </div>
            </div>
        }
    />
);
