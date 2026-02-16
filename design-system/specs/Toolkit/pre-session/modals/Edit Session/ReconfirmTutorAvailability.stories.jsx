import React from 'react';
import Modal from '../../../../../../packages/plus-ds/src/components/Modal';
import Checkbox from '../../../../../../packages/plus-ds/src/forms/Checkbox';
import { CancelButton, ConfirmButton } from '../../elements/SupervisorManagementButtons.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Modals/Edit Session',
    component: Modal,
    parameters: {
        layout: 'centered',
    },
};

// ─── Modal Body ───────────────────────────────────────────────

const ReconfirmTutorAvailabilityModalBody = () => (
    <div
        className="d-flex flex-column"
        style={{
            gap: 'var(--size-modal-gap-lg)',
            backgroundColor: 'var(--color-surface-container-high)',
            padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
            borderRadius: 'var(--size-modal-radius-lg)',
        }}
    >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center">
            <h4 className="h4 m-0">Edit session</h4>
            <i
                className="fa-solid fa-xmark"
                style={{
                    fontSize: 'var(--font-size-fa-h4-solid)',
                    color: 'var(--color-on-surface-variant)',
                    cursor: 'pointer',
                }}
            />
        </div>

        {/* Confirmation Content */}
        <div
            className="d-flex flex-column align-items-center text-center"
            style={{ gap: 'var(--size-modal-gap-md)' }}
        >
            {/* Icon */}
            <i
                className="fa-solid fa-user-check"
                style={{
                    fontSize: 'var(--font-size-fa-huge-solid, 8rem)',
                    lineHeight: 1,
                    color: 'var(--color-warning)',
                }}
            />

            {/* Title */}
            <div
                className="d-flex flex-column align-items-center"
                style={{
                    padding: '0 var(--size-spacing-space-600)',
                    gap: 'var(--size-modal-gap-md)',
                }}
            >
                <h4 className="h4 m-0" style={{ color: 'var(--color-on-surface)', textAlign: 'center' }}>
                    Would you like to ask tutors to confirm their availability?
                </h4>
            </div>

            {/* Checkbox - centered */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    width: '100%',
                }}
            >
                <Checkbox
                    id="reconfirm-availability"
                    name="reconfirm-availability"
                    label="I want tutors to reconfirm their availabilities for this session."
                    style={{ width: 'auto' }}
                />
            </div>
        </div>

        {/* Bottom Buttons */}
        <div
            style={{
                display: 'flex',
                gap: 'var(--size-modal-gap-md)',
                alignItems: 'center',
                justifyContent: 'flex-end',
                width: '100%',
            }}
        >
            <div style={{ flex: 1 }}>
                <CancelButton block />
            </div>
            <div style={{ flex: 1 }}>
                <ConfirmButton block />
            </div>
        </div>
    </div>
);

// ─── Story ────────────────────────────────────────────────────

/**
 * Reconfirm Tutor Availability
 * Modal asking the supervisor if they want tutors to reconfirm their availability
 * after editing a session.
 *
 * Layout:
 * - Header: "Edit session" title + close icon
 * - Illustration: Two person icons with checkmark in warning color
 * - Question: "Would you like to ask tutors to confirm their availability?"
 * - Checkbox: "I want tutors to reconfirm their availabilities for this session."
 * - Bottom: Cancel (outline) + Confirm (filled) buttons
 *
 * Tokens:
 * - Modal padding: --size-modal-pad-y-lg / --size-modal-pad-x-lg
 * - Modal gap: --size-modal-gap-lg (between sections), --size-modal-gap-md (content)
 * - Modal radius: --size-modal-radius-lg
 * - Background: --color-surface-container-high
 * - Icon color: --color-warning
 * - Title: h4, --color-on-surface
 * - Close icon: fa-xmark, --font-size-fa-h4-solid, --color-on-surface-variant
 */
export const Reconfirm_Tutor_Availability = () => (
    <Modal
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={<ReconfirmTutorAvailabilityModalBody />}
    />
);
