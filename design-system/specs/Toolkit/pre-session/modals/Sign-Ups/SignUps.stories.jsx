import React from 'react';
import Modal from '../../../../../../packages/plus-ds/src/components/Modal';
import ButtonGroup from '../../../../../../packages/plus-ds/src/components/ButtonGroup';
import Button from '../../../../../../packages/plus-ds/src/components/Button';
import Badge from '../../../../../../packages/plus-ds/src/components/Badge';
import Alert from '../../../../../../packages/plus-ds/src/components/Alert';

// Import the reusable SessionInfoCard component
import { SessionInfoCard } from '../../cards/SessionInfoCard.stories';
// Import CTA button components from Tutor View
import {
    CloseButton,
    SignUpRecurringButton,
    BackButton
} from '../../elements/CTATutorViewButtons.stories';
// Import CTA Sign-Up Related buttons
import {
    ConfirmSignUpButton,
    CheckScheduleButton,
    SuccessButton
} from '../../elements/CTA Sign-Up Related Buttons';
// Import modal table components
import { SignInTableHeaderRowModal, SignInTableRowModal } from '../../tables/SignInTable.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Modals/Sign-Ups',
    component: Modal,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

/**
 * Recurring Session - Pre Sign-Up
 * Tab: Session info | State: Pre Sign-up for recurring session
 * Shows session details before signing up for a recurring session
 */
export const RecurringSession_PreSignUp = () => (
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
                    <h4 className="h4 m-0">Lincoln High School - Thursdays</h4>
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
                        <SignUpRecurringButton block />
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
 * - Warning Alert with confirmation message
 * - Modal table showing sessions to sign up for
 * - Back and Confirm sign-up buttons
 */
export const ConfirmSignUp = () => (
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
                    <h4 className="h4 m-0">Confirm All</h4>
                    <i
                        className="fa-solid fa-xmark"
                        style={{
                            fontSize: 'var(--font-size-fa-h4-solid)',
                            color: 'var(--color-on-surface-variant)',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* Alert and Table Container - with medium gap */}
                <div className="d-flex flex-column" style={{
                    gap: 'var(--size-modal-gap-md)'
                }}>
                    {/* Warning Alert */}
                    <Alert
                        style="warning"
                        dismissible={false}
                    >
                        You're signing up for the following sessions. Please confirm before continuing.
                    </Alert>

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
 * - Success Alert with confirmation message
 * - Table showing sessions added to schedule (Date & time, School & teacher, Tutor Count)
 * - "Check my schedule" button
 */
export const SuccessAll = () => (
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
                    <h4 className="h4 m-0">Sign-up success</h4>
                    <i
                        className="fa-solid fa-xmark"
                        style={{
                            fontSize: 'var(--font-size-fa-h4-solid)',
                            color: 'var(--color-on-surface-variant)',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* Alert and Table Container - with medium gap */}
                <div className="d-flex flex-column" style={{
                    gap: 'var(--size-modal-gap-md)'
                }}>
                    {/* Success Alert */}
                    <Alert
                        style="success"
                        dismissible={false}
                    >
                        The following sessions have been added to your schedule.
                    </Alert>

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
                                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                                    Date & time
                                </span>
                            </div>
                            <div style={{ padding: 'var(--size-table-cell-y) var(--size-table-cell-x)' }}>
                                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                                    School & teacher
                                </span>
                            </div>
                            <div style={{ padding: 'var(--size-table-cell-y) var(--size-table-cell-x)' }}>
                                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
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
                                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                                    Tue, Sep 9
                                </span>
                                <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                                    12:30 PM - 1:30 PM
                                </span>
                            </div>
                            <div style={{
                                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}>
                                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                                    Hogwarts
                                </span>
                                <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                                    Mr. Snape
                                </span>
                            </div>
                            <div style={{
                                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
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
