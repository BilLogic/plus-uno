import React from 'react';
import Modal from '../../../../../../packages/plus-ds/src/components/Modal';

// Import CTA button components from Tutor View
import {
    SeeSessionsFillInButton,
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
 * Call-off Confirmation Modal
 * Shows confirmation after submitting a call-off request
 * 
 * Components used:
 * - Modal (plus-ds)
 * - SeeSessionsFillInButton (CTATutorViewButtons)
 * - ViewUpdatedScheduleButton (CTATutorViewButtons)
 * 
 * Semantic tokens used:
 * - Modal spacing: --size-modal-gap-lg, --size-modal-gap-md
 * - Modal padding: --size-modal-pad-y-lg, --size-modal-pad-x-lg
 * - Modal radius: --size-modal-radius-lg
 * - Background: --color-surface-container-high
 * - Icon color: --color-warning (clock icon)
 * - Typography: h4, h5, body2-txt
 */
export const CallOff_Confirmation = () => (
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
                    {/* Clock Icon - using same size as withdraw request modal */}
                    <i
                        className="fa-solid fa-clock"
                        style={{
                            fontSize: 'var(--font-size-fa-huge-solid, 8rem)',
                            lineHeight: 1,
                            color: 'var(--color-warning)'
                        }}
                    />

                    {/* Title */}
                    <h5 className="h5 m-0" style={{ color: 'var(--color-on-surface)' }}>
                        Request submitted
                    </h5>

                    {/* Description */}
                    <p className="body2-txt m-0" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Your request is under supervisor review. You'll be notified once processed. Until then, the absence may count against you.
                    </p>
                </div>

                {/* Footer Buttons - using tutor view components */}
                <div className="d-flex" style={{ gap: 'var(--size-modal-gap-md)' }}>
                    <SeeSessionsFillInButton block />
                    <ViewUpdatedScheduleButton block fill="filled" />
                </div>
            </div>
        }
    />
);
