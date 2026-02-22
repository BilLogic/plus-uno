import React from 'react';
import Modal from '../../../../components/Modal';
import Button from '../../../../components/Button';

export default {
    title: 'Specs/Toolkit/In-Session/Modals',
    component: Modal,
    parameters: {
        layout: 'centered',
    },
};

/**
 * Pop-up that appears immediately when a tutor is ready to launch Zoom.
 * If the user is a lead tutor or supervisor, clicking "Launch Zoom"
 * transitions this modal into the "Zoom is Opening" modal.
 */
export const StartingZoomSession = () => (
    <Modal
        width={332}
        showBottomButtons={false}
        onClose={() => {}}
        body={
            <div
                className="d-flex flex-column"
                style={{
                    gap: 'var(--size-modal-gap-sm)',
                    backgroundColor: 'var(--color-surface-container-high)',
                    padding: 'var(--size-modal-pad-y-sm) var(--size-modal-pad-x-sm)',
                    borderRadius: 'var(--size-modal-radius-md)',
                }}
            >
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center">
                    <span className="h5" style={{ margin: 0, color: 'var(--color-on-surface)' }}>
                        Ready to Start Zoom Session?
                    </span>
                    <i
                        className="fa-solid fa-xmark"
                        style={{
                            fontSize: 'var(--font-size-fa-h3-solid)',
                            color: 'var(--color-on-surface-variant)',
                            cursor: 'pointer',
                        }}
                    />
                </div>

                {/* Divider */}
                <div
                    style={{
                        height: '1px',
                        width: '100%',
                        backgroundColor: 'var(--color-outline)',
                        opacity: 0.1,
                    }}
                />

                {/* Body */}
                <span className="body3-txt" style={{ color: 'var(--color-on-surface)' }}>
                    Click below to launch Zoom and connect with your student.
                </span>

                {/* Divider */}
                <div
                    style={{
                        height: '1px',
                        width: '100%',
                        backgroundColor: 'var(--color-outline)',
                        opacity: 0.1,
                    }}
                />

                {/* Launch Zoom Button */}
                <Button
                    text="Launch Zoom"
                    style="primary"
                    fill="filled"
                    size="small"
                    leadingVisual="video"
                    block
                    onClick={() => {}}
                />
            </div>
        }
    />
);
