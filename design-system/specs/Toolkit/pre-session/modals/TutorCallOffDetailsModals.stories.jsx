import React from 'react';
import Modal from '../../../../../packages/plus-ds/src/components/Modal';
import ButtonGroup from '../../../../../packages/plus-ds/src/components/ButtonGroup';
import Button from '../../../../../packages/plus-ds/src/components/Button';

import {
    CloseButton,
    WithdrawRequestButton,
    CancelButton,
    ConfirmWithdrawalButton,
    ViewUpdatedScheduleButton
} from '../elements/CTATutorViewButtons.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Modals/Tutor Call-Off Details',
    component: Modal,
    parameters: {
        layout: 'centered',
    },
};

/**
 * Pre-Review / Tutor Request Modal
 * Built using Design System components and semantic tokens
 */
export const PreReview_TutorRequest = () => (
    <Modal
        width={672} // Figma: col-12 = 672px
        showBottomButtons={false}
        onClose={() => { }}
        body={
            <div className="d-flex flex-column" style={{
                gap: 'var(--size-modal-gap-lg)',
                backgroundColor: 'var(--color-surface-container-high)',
                padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                borderRadius: 'var(--size-modal-radius-lg)'
            }}>

                {/* Step 1: Header */}
                <div className="d-flex justify-content-between align-items-center">
                    <h4 className="h4 m-0">Call-off Request Details</h4>
                    <i
                        className="fa-solid fa-xmark"
                        style={{
                            fontSize: 'var(--font-size-fa-h4-solid)',
                            color: 'var(--color-on-surface-variant)',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* Step 2: Tabs using ButtonGroup with tonal fill */}
                <ButtonGroup
                    style="primary"
                    fill="tonal"
                    className="w-100"
                    buttons={[
                        { text: 'Tutor request', active: true, style: 'primary' },
                        { text: 'Supervisor review', style: 'secondary' }
                    ]}
                />

                {/* Step 3: Body/Roster Container */}
                <div style={{
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: 'var(--size-modal-radius-md)',
                    padding: 'var(--size-modal-pad-y-md) var(--size-modal-pad-x-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-modal-gap-sm)'
                }}>
                    <FieldRow label="Tutor" value="Albus Dumbledore" />
                    <FieldRow label="School" value="Roosevelt High School" />
                    <FieldRow label="Time" value="Mon, Sep 16, 2025, 3:30 PM - 4:20 PM" />
                    <FieldRow label="Call-off Type" value="One-time" />
                    <FieldRow label="Supervisors contacted by the tutor" value="Supervisor A" />
                    <FieldRow
                        label="Submitted"
                        value={
                            <span className="d-inline-flex align-items-center">
                                <span
                                    className="body2-txt font-weight-semibold"
                                    style={{
                                        backgroundColor: 'var(--color-danger-state-08)',
                                        color: 'var(--color-danger-text)',
                                        borderRadius: 'var(--size-element-radius-full)',
                                        padding: '0 var(--size-element-pad-x-sm)',
                                        marginRight: 'var(--size-element-gap-sm)'
                                    }}
                                >
                                    Late
                                </span>
                                9/5/2025, 1:08:54 PM
                            </span>
                        }
                    />
                    <FieldRow label="Reason" value="Family Emergency" />
                    <FieldRow label="Additional Details" value="need to travel out of state immediately" />
                </div>

                {/* Step 4: Footer Buttons */}
                <div className="d-flex" style={{ gap: 'var(--size-modal-gap-md)' }}>
                    <CloseButton block className="flex-grow-1" />
                    <WithdrawRequestButton block className="flex-grow-1" />
                </div>
            </div>
        }
    />
);

/**
 * FieldRow Component
 * Displays a label-value pair using design system typography
 */
const FieldRow = ({ label, value }) => (
    <div className="d-flex justify-content-between align-items-baseline body2-txt">
        <span style={{ color: 'var(--color-on-surface)' }}>{label}:</span>
        <span style={{ color: 'var(--color-on-surface)', textAlign: 'right' }}>{value}</span>
    </div>
);

/**
 * Pre-Review / Withdraw Request Modal
 * Confirmation dialog for withdrawing a call-off request
 * Built using Design System components and semantic tokens
 */
export const PreReview_WithdrawRequest = () => (
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
                    <h4 className="h4 m-0">Call-off Request Details</h4>
                    <i
                        className="fa-solid fa-xmark"
                        style={{
                            fontSize: 'var(--font-size-fa-h4-solid)',
                            color: 'var(--color-on-surface-variant)',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* Warning Content */}
                <div className="d-flex flex-column align-items-center text-center" style={{
                    gap: 'var(--size-modal-gap-md)'
                }}>
                    {/* Warning Triangle Icon */}
                    <i
                        className="fa-solid fa-triangle-exclamation"
                        style={{
                            fontSize: 'var(--font-size-fa-huge-solid, 8rem)',
                            lineHeight: 1,
                            color: 'var(--color-warning)'
                        }}
                    />

                    {/* Confirmation Text */}
                    <h5 className="h5 m-0">Are you sure you want to withdraw this request?</h5>
                    <p className="body2-txt m-0" style={{ color: 'var(--color-on-surface)' }}>
                        This will cancel your call-off request and you will be expected to attend the session.
                    </p>
                </div>

                {/* Footer Buttons */}
                <div className="d-flex" style={{ gap: 'var(--size-modal-gap-md)' }}>
                    <CancelButton block className="flex-grow-1" />
                    <ConfirmWithdrawalButton block className="flex-grow-1" />
                </div>
            </div>
        }
    />
);

/**
 * Pre-Review / Request Withdrawn Modal
 * Success confirmation after withdrawing a call-off request
 * Built using Design System components and semantic tokens
 */
export const PreReview_RequestWithdrawn = () => (
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
                    <h4 className="h4 m-0">Call-off Request Details</h4>
                    <i
                        className="fa-solid fa-xmark"
                        style={{
                            fontSize: 'var(--font-size-fa-h4-solid)',
                            color: 'var(--color-on-surface-variant)',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* Success Content */}
                <div className="d-flex flex-column align-items-center text-center" style={{
                    gap: 'var(--size-modal-gap-md)'
                }}>
                    {/* Success Checkmark Icon */}
                    <i
                        className="fa-solid fa-circle-check"
                        style={{
                            fontSize: 'var(--font-size-fa-huge-solid, 8rem)',
                            lineHeight: 1,
                            color: 'var(--color-success)'
                        }}
                    />

                    {/* Success Text */}
                    <h5 className="h5 m-0">Request withdrawn</h5>
                    <p className="body2-txt m-0" style={{ color: 'var(--color-on-surface)' }}>
                        Your request has been withdrawn. The related sessions have been restored to your schedule and you are expected to attend.
                    </p>
                </div>

                {/* Footer Button */}
                <div className="d-flex">
                    <ViewUpdatedScheduleButton block fill="filled" />
                </div>
            </div>
        }
    />
);

/**
 * Post-Review / Supervisor Review Modal
 * Shows the supervisor's review of a call-off request with status badge
 * Built using Design System components and semantic tokens
 */
export const PostReview_SupervisorReview = () => (
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
                    <h4 className="h4 m-0">Call-off Request Details</h4>
                    <i
                        className="fa-solid fa-xmark"
                        style={{
                            fontSize: 'var(--font-size-fa-h4-solid)',
                            color: 'var(--color-on-surface-variant)',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* Tabs - Supervisor review is active */}
                <ButtonGroup
                    style="primary"
                    fill="tonal"
                    className="w-100"
                    buttons={[
                        { text: 'Tutor request', style: 'secondary' },
                        { text: 'Supervisor review', active: true, style: 'primary' }
                    ]}
                />

                {/* Supervisor Review Content */}
                <div style={{
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: 'var(--size-modal-radius-md)',
                    padding: 'var(--size-modal-pad-y-md) var(--size-modal-pad-x-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-modal-gap-sm)'
                }}>
                    <FieldRow
                        label="Status"
                        value={
                            <span
                                className="body2-txt"
                                style={{
                                    backgroundColor: 'var(--color-success-state-08)',
                                    color: 'var(--color-success-text)',
                                    borderRadius: 'var(--size-element-radius-full)',
                                    padding: '0 var(--size-element-pad-x-sm)'
                                }}
                            >
                                Approved
                            </span>
                        }
                    />
                    <FieldRow label="Reviewed by" value="Roosevelt High School" />
                    <FieldRow label="Reviewed at" value="Fri, Sep 16, 2025, 3:31 PM" />
                    <FieldRow label="Additional Details" value="need to travel out of state immediately" />
                </div>

                {/* Footer Button */}
                <div className="d-flex">
                    <CloseButton block />
                </div>
            </div>
        }
    />
);

/**
 * Post-Review / Tutor Request Modal
 * Shows the tutor's call-off request details after supervisor review
 * Built using Design System components and semantic tokens
 */
export const PostReview_TutorRequest = () => (
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
                    <h4 className="h4 m-0">Call-off Request Details</h4>
                    <i
                        className="fa-solid fa-xmark"
                        style={{
                            fontSize: 'var(--font-size-fa-h4-solid)',
                            color: 'var(--color-on-surface-variant)',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* Tabs - Tutor request is active */}
                <ButtonGroup
                    style="primary"
                    fill="tonal"
                    className="w-100"
                    buttons={[
                        { text: 'Tutor request', active: true, style: 'primary' },
                        { text: 'Supervisor review', style: 'secondary' }
                    ]}
                />

                {/* Tutor Request Content */}
                <div style={{
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: 'var(--size-modal-radius-md)',
                    padding: 'var(--size-modal-pad-y-md) var(--size-modal-pad-x-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-modal-gap-sm)'
                }}>
                    <FieldRow label="Tutor" value="Albus Dumbledore" />
                    <FieldRow label="School" value="Roosevelt High School" />
                    <FieldRow label="Time" value="Mon, Sep 16, 2025, 3:30 PM - 4:20 PM" />
                    <FieldRow label="Call-off Type" value="One-time" />
                    <FieldRow
                        label="Submitted"
                        value={
                            <span className="d-inline-flex align-items-center">
                                <span
                                    className="body2-txt font-weight-semibold"
                                    style={{
                                        backgroundColor: 'var(--color-danger-state-08)',
                                        color: 'var(--color-danger-text)',
                                        borderRadius: 'var(--size-element-radius-full)',
                                        padding: '0 var(--size-element-pad-x-sm)',
                                        marginRight: 'var(--size-element-gap-sm)'
                                    }}
                                >
                                    Late
                                </span>
                                9/5/2025, 1:08:54 PM
                            </span>
                        }
                    />
                    <FieldRow label="Reason" value="Family Emergency" />
                    <FieldRow label="Additional Details" value="need to travel out of state immediately" />
                </div>

                {/* Footer Button - Only Close, no Withdraw Request */}
                <div className="d-flex">
                    <CloseButton block />
                </div>
            </div>
        }
    />
);

// ============================================================================
// ALL STATES OVERVIEW
// ============================================================================

/**
 * State Label Component
 * Displays stage and tab information above each modal
 */
const StateLabel = ({ stage, tab }) => (
    <div style={{
        textAlign: 'center',
        marginBottom: 'var(--size-modal-gap-md)',
        padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)',
        backgroundColor: 'var(--color-primary-state-08)',
        borderRadius: 'var(--size-element-radius-md)'
    }}>
        <div className="h6" style={{ color: 'var(--color-primary-text)', marginBottom: '4px' }}>
            Stage: <strong>{stage}</strong>
        </div>
        <div className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
            Tab: <strong>{tab}</strong>
        </div>
    </div>
);

/**
 * Overview
 * Displays all modal states in a scrollable page with stage/tab labels
 */
export const Overview = () => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '48px',
        padding: '32px',
        maxWidth: '800px',
        margin: '0 auto'
    }}>
        <h2 className="h2" style={{ textAlign: 'center', marginBottom: '16px' }}>
            Tutor Call-Off Details Modal States
        </h2>

        {/* Pre-Review / Tutor Request */}
        <div>
            <StateLabel stage="Pre-Review" tab="Tutor Request" />
            <PreReview_TutorRequest />
        </div>

        {/* Pre-Review / Withdraw Request */}
        <div>
            <StateLabel stage="Pre-Review" tab="Withdraw Request" />
            <PreReview_WithdrawRequest />
        </div>

        {/* Pre-Review / Request Withdrawn */}
        <div>
            <StateLabel stage="Pre-Review" tab="Request Withdrawn" />
            <PreReview_RequestWithdrawn />
        </div>

        {/* Post-Review / Supervisor Review */}
        <div>
            <StateLabel stage="Post-Review" tab="Supervisor Review" />
            <PostReview_SupervisorReview />
        </div>

        {/* Post-Review / Tutor Request */}
        <div>
            <StateLabel stage="Post-Review" tab="Tutor Request" />
            <PostReview_TutorRequest />
        </div>
    </div>
);

Overview.parameters = {
    layout: 'fullscreen',
};
