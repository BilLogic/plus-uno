import React from 'react';
import Modal from '../../../../../../packages/plus-ds/src/components/Modal';

// Import CTA button components from Tutor View
import {
    SeeSessionsSignUpButton,
    ViewUpdatedScheduleButton
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
 * Auto-Approve Confirmation Modal
 * Shows confirmation when a call-off request has been automatically approved
 * 
 * Components used:
 * - Modal (plus-ds)
 * - SeeSessionsSignUpButton (CTATutorViewButtons)
 * - ViewUpdatedScheduleButton (CTATutorViewButtons)
 * 
 * Semantic tokens used:
 * - Modal spacing: --size-modal-gap-lg, --size-modal-gap-md
 * - Modal padding: --size-modal-pad-y-lg, --size-modal-pad-x-lg
 * - Modal radius: --size-modal-radius-lg
 * - Background: --color-surface-container-high
 * - Icon color: --color-success (checkmark icon)
 * - Typography: h4, h5, body2-txt
 */
export const AutoApprove_Confirmation = () => (
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

                {/* Confirmation Content */}
                <div className="d-flex flex-column align-items-center text-center" style={{ gap: 'var(--size-modal-gap-md)' }}>
                    {/* Success Checkmark Icon - using same size as other confirmation modals */}
                    <i
                        className="fa-solid fa-circle-check"
                        style={{
                            fontSize: 'var(--font-size-fa-huge-solid, 8rem)',
                            lineHeight: 1,
                            color: 'var(--color-success)'
                        }}
                    />

                    {/* Title */}
                    <h5 className="h5 m-0" style={{ color: 'var(--color-on-surface)' }}>
                        Call-off approved
                    </h5>

                    {/* Description */}
                    <p className="body2-txt m-0" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Your request has been approved. The related sessions have been removed from your schedule and you are no longer expected to attend.
                    </p>
                </div>

                {/* Footer Buttons - using tutor view components */}
                <div className="d-flex" style={{ gap: 'var(--size-modal-gap-md)' }}>
                    <SeeSessionsSignUpButton block />
                    <ViewUpdatedScheduleButton block fill="filled" />
                </div>
            </div>
        }
    />
);
