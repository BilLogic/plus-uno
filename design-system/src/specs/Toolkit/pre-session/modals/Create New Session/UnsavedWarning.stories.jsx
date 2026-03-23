import React from 'react';
import Modal from '../../../../../components/Modal';
import { CancelButton, ConfirmCancelButton } from '../../elements/SupervisorManagementButtons.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Modals/Create New Session',
    component: Modal,
    parameters: {
        layout: 'centered',
    },
};

// ─── Modal Body ───────────────────────────────────────────────

const UnsavedWarningModalBody = () => (
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
            <h4 className="h4 m-0">Unsaved changes</h4>
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
            {/* Danger Icon */}
            <i
                className="fa-solid fa-circle-exclamation"
                style={{
                    fontSize: 'var(--font-size-fa-huge-solid, 8rem)',
                    lineHeight: 1,
                    color: 'var(--color-danger)',
                }}
            />

            {/* Title & Description */}
            <div
                className="d-flex flex-column align-items-center"
                style={{ 
                    padding: '0 var(--size-spacing-space-600)',
                    gap: 'var(--size-modal-gap-md)',
                }}
            >
                <h4 className="h4 m-0" style={{ color: 'var(--color-on-surface)' }}>
                    Are you sure you want to leave?
                </h4>
                <p
                    className="body2-txt m-0"
                    style={{
                        color: 'var(--color-on-surface)',
                        fontWeight: 300,
                    }}
                >
                    Your created session will not be saved.
                </p>
            </div>
        </div>

        {/* Bottom Buttons */}
        <div
            style={{
                display: 'flex',
                gap: 'var(--size-modal-gap-md)',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
            }}
        >
            <div style={{ flex: 1 }}>
                <CancelButton block />
            </div>
            <div style={{ flex: 1 }}>
                <ConfirmCancelButton block />
            </div>
        </div>
    </div>
);

// ─── Story ────────────────────────────────────────────────────

/**
 * Unsaved Warning
 * Warning modal shown when user tries to leave the "Create new session"
 * form with unsaved changes.
 *
 * Layout:
 * - Header: "Unsaved changes" + close icon
 * - Body: Danger circle-exclamation icon, title, description
 * - Buttons: Cancel (primary outline) + Confirm (danger outline)
 *
 * Tokens:
 * - Modal padding: --size-modal-pad-y-lg / --size-modal-pad-x-lg
 * - Modal gap: --size-modal-gap-lg (header/buttons), --size-modal-gap-md (content)
 * - Modal radius: --size-modal-radius-lg
 * - Background: --color-surface-container-high
 * - Icon: fa-circle-exclamation, --color-danger
 * - Title: h4, --color-on-surface
 * - Description: body2-txt, --color-on-surface
 * - Confirm button: danger outline
 */
export const Unsaved_Warning = () => (
    <Modal
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={<UnsavedWarningModalBody />}
    />
);
