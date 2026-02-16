import React from 'react';
import Modal from '../../../../../components/Modal';
import Radio from '../../../../../forms/Radio';
import { DeleteModalSessionCard } from '../../cards/DeleteModalSessionCard.stories';
import { CancelButton, ConfirmButton } from '../../elements/SupervisorManagementButtons.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Modals/Edit Session',
    component: Modal,
    parameters: {
        layout: 'centered',
    },
};

// ─── Modal Body ───────────────────────────────────────────────

const SessionTypeModalBody = () => (
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

        {/* Session Card */}
        <DeleteModalSessionCard
            date="Tue, Sep 9"
            time="12:30 – 1:30 PM"
            school="Hogwarts"
            teacher="Mr. Snape"
        />

        {/* Radio Options */}
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-modal-gap-md)',
            }}
        >
            <Radio
                id="session-type-this-only"
                name="session-type"
                label="This session only"
                value="this-only"
                defaultChecked
            />
            <Radio
                id="session-type-recurring-date"
                name="session-type"
                label="All recurring sessions  during a specific date period"
                value="recurring-date"
            />
            <Radio
                id="session-type-all-recurring"
                name="session-type"
                label="All recurring sessions"
                value="all-recurring"
            />
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
 * Session Type
 * The "Edit session" modal for selecting the session edit scope.
 * Displays a session card with details and radio options for:
 * - This session only
 * - All recurring sessions during a specific date period
 * - All recurring sessions
 *
 * Layout:
 * - Header: "Edit session" title + close icon
 * - Delete Modal Session Card (Date, Time, School, Teacher)
 * - Radio buttons (3 options, first selected by default)
 * - Bottom: Cancel (outline) + Confirm (filled) buttons
 *
 * Tokens:
 * - Modal padding: --size-modal-pad-y-lg / --size-modal-pad-x-lg
 * - Modal gap: --size-modal-gap-lg (between sections), --size-modal-gap-md (between radio options)
 * - Modal radius: --size-modal-radius-lg
 * - Background: --color-surface-container-high
 * - Title: h4
 * - Close icon: fa-xmark, --font-size-fa-h4-solid, --color-on-surface-variant
 */
export const Session_Type = () => (
    <Modal
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={<SessionTypeModalBody />}
    />
);
