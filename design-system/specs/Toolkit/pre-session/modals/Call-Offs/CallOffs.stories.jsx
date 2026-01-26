import React from 'react';
import Modal from '../../../../../../packages/plus-ds/src/components/Modal';
import Button from '../../../../../../packages/plus-ds/src/components/Button';
import Alert from '../../../../../../packages/plus-ds/src/components/Alert';

// Import the reusable ConfirmationAlert component
import { ConfirmationAlert } from '../../cards/CallOffAlerts.stories';
// Import CTA button components from Tutor View
import {
    BackButton,
    SubmitRequestButton,
    CloseButton
} from '../../elements/CTATutorViewButtons.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Modals/Call-Offs',
    component: Modal,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

/**
 * Call-Off Confirmation - Post Sign-Up
 * Shows confirmation after submitting a call-off request
 */
export const CallOff_Confirmation_PostSignUp = () => (
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
                    <h4 className="h4 m-0">Call-off Request</h4>
                    <i
                        className="fa-solid fa-xmark"
                        style={{
                            fontSize: 'var(--font-size-fa-h4-solid)',
                            color: 'var(--color-on-surface-variant)',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* Confirmation Alert */}
                <ConfirmationAlert
                    title="Call-off request submitted"
                    description="Your call-off request has been submitted successfully. You will receive a notification once a decision has been made."
                    type="success"
                />

                {/* Additional Information */}
                <div style={{
                    backgroundColor: 'var(--color-surface-container-low)',
                    borderRadius: 'var(--size-modal-radius-md)',
                    padding: 'var(--size-modal-pad-y-md) var(--size-modal-pad-x-md)',
                }}>
                    <div className="d-flex flex-column" style={{ gap: 'var(--size-element-gap-sm)' }}>
                        <div className="d-flex align-items-center" style={{ gap: 'var(--size-element-gap-sm)' }}>
                            <i
                                className="fa-solid fa-circle-info"
                                style={{
                                    fontSize: 'var(--font-size-fa-h6-solid)',
                                    color: 'var(--color-primary)'
                                }}
                            />
                            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                                What happens next?
                            </span>
                        </div>
                        <ul className="body2-txt mb-0" style={{ color: 'var(--color-on-surface-variant)', paddingLeft: '1.5rem' }}>
                            <li>Your supervisor will review the request</li>
                            <li>A replacement tutor will be assigned if approved</li>
                            <li>You'll receive an email notification with the decision</li>
                        </ul>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="d-flex" style={{ gap: 'var(--size-modal-gap-md)' }}>
                    <BackButton />
                    <div style={{ flex: 1 }}>
                        <CloseButton block />
                    </div>
                </div>
            </div>
        }
    />
);

/**
 * Auto-Excuse Confirmation - Post Sign-Up
 * Shows confirmation when call-off is automatically excused
 */
export const AutoExcuse_Confirmation_PostSignUp = () => (
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
                    <h4 className="h4 m-0">Call-off Request</h4>
                    <i
                        className="fa-solid fa-xmark"
                        style={{
                            fontSize: 'var(--font-size-fa-h4-solid)',
                            color: 'var(--color-on-surface-variant)',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* Confirmation Alert */}
                <ConfirmationAlert
                    title="Call-off automatically excused"
                    description="Your call-off request has been automatically excused due to the circumstances. No further action is needed."
                    type="success"
                />

                {/* Additional Information */}
                <div style={{
                    backgroundColor: 'var(--color-surface-container-low)',
                    borderRadius: 'var(--size-modal-radius-md)',
                    padding: 'var(--size-modal-pad-y-md) var(--size-modal-pad-x-md)',
                }}>
                    <div className="d-flex flex-column" style={{ gap: 'var(--size-element-gap-sm)' }}>
                        <div className="d-flex align-items-center" style={{ gap: 'var(--size-element-gap-sm)' }}>
                            <i
                                className="fa-solid fa-check-circle"
                                style={{
                                    fontSize: 'var(--font-size-fa-h6-solid)',
                                    color: 'var(--color-success)'
                                }}
                            />
                            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                                Auto-excused reasons
                            </span>
                        </div>
                        <ul className="body2-txt mb-0" style={{ color: 'var(--color-on-surface-variant)', paddingLeft: '1.5rem' }}>
                            <li>Emergency situations</li>
                            <li>Illness with documentation</li>
                            <li>System-wide cancellations</li>
                            <li>Approved leave periods</li>
                        </ul>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="d-flex" style={{ gap: 'var(--size-modal-gap-md)' }}>
                    <BackButton />
                    <div style={{ flex: 1 }}>
                        <CloseButton block />
                    </div>
                </div>
            </div>
        }
    />
);

/**
 * Auto-Approve Confirmation - Post Sign-Up
 * Shows confirmation when call-off is automatically approved
 */
export const AutoApprove_Confirmation_PostSignUp = () => (
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
                    <h4 className="h4 m-0">Call-off Request</h4>
                    <i
                        className="fa-solid fa-xmark"
                        style={{
                            fontSize: 'var(--font-size-fa-h4-solid)',
                            color: 'var(--color-on-surface-variant)',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* Confirmation Alert */}
                <ConfirmationAlert
                    title="Call-off automatically approved"
                    description="Your call-off request has been automatically approved. A replacement tutor will be assigned to your session."
                    type="success"
                />

                {/* Additional Information */}
                <div style={{
                    backgroundColor: 'var(--color-surface-container-low)',
                    borderRadius: 'var(--size-modal-radius-md)',
                    padding: 'var(--size-modal-pad-y-md) var(--size-modal-pad-x-md)',
                }}>
                    <div className="d-flex flex-column" style={{ gap: 'var(--size-element-gap-sm)' }}>
                        <div className="d-flex align-items-center" style={{ gap: 'var(--size-element-gap-sm)' }}>
                            <i
                                className="fa-solid fa-user-clock"
                                style={{
                                    fontSize: 'var(--font-size-fa-h6-solid)',
                                    color: 'var(--color-secondary)'
                                }}
                            />
                            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                                Replacement process
                            </span>
                        </div>
                        <ul className="body2-txt mb-0" style={{ color: 'var(--color-on-surface-variant)', paddingLeft: '1.5rem' }}>
                            <li>Available tutors will be notified immediately</li>
                            <li>First tutor to accept will be assigned</li>
                            <li>You'll receive confirmation when filled</li>
                            <li>Session details will be updated automatically</li>
                        </ul>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="d-flex" style={{ gap: 'var(--size-modal-gap-md)' }}>
                    <BackButton />
                    <div style={{ flex: 1 }}>
                        <CloseButton block />
                    </div>
                </div>
            </div>
        }
    />
);
