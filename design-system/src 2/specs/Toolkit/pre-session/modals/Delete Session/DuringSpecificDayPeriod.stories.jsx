import React from 'react';
import Modal from '../../../../../components/Modal';
import Radio from '@/forms/Radio';
import { DeleteModalSessionCard } from '../../cards/DeleteModalSessionCard.stories';
import { DeleteSessionRadioItem } from '../../elements/DeleteSessionRadioSelection.stories';
import { CancelButton, ConfirmCancelButton } from '../../elements/SupervisorManagementButtons.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Modals/Delete Session',
    component: Modal,
    parameters: {
        layout: 'centered',
    },
};

// ─── Radio Labels ─────────────────────────────────────────────

const AllAtSchoolOnDateLabel = () => (
    <span>
        This and all sessions at{' '}
        <strong style={{ textDecoration: 'underline', color: 'var(--color-primary)' }}>
            Hogwarts
        </strong>{' '}
        on{' '}
        <strong style={{ textDecoration: 'underline', color: 'var(--color-primary)' }}>
            Tue, Sep 9
        </strong>
    </span>
);

const AllOtherLabel = () => (
    <span>
        This and all other sessions at{' '}
        <strong style={{ textDecoration: 'underline', color: 'var(--color-primary)' }}>
            Hogwarts
        </strong>
    </span>
);

// ─── Modal Body ───────────────────────────────────────────────

const DuringSpecificDayPeriodModalBody = () => (
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
            <h4 className="h4 m-0">Cancel session</h4>
            <i
                className="fa-solid fa-xmark"
                style={{
                    fontSize: 'var(--font-size-fa-h4-solid)',
                    color: 'var(--color-on-surface-variant)',
                    cursor: 'pointer',
                }}
            />
        </div>

        {/* Card + Radio Options */}
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-modal-gap-md)',
                width: '100%',
            }}
        >
            {/* Session Card */}
            <DeleteModalSessionCard
                date="Tue, Sep 9"
                time="12:30 – 1:30 PM"
                school="Hogwarts"
                teacher="Mr. Snape"
            />

            {/* Radio Options Section */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-section-gap-md)',
                    padding: 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)',
                }}
            >
                <Radio
                    id="delete-this-session"
                    name="delete-session"
                    label="This session"
                    value="this-session"
                />
                <Radio
                    id="delete-all-at-school-date"
                    name="delete-session"
                    label={<AllAtSchoolOnDateLabel />}
                    value="all-at-school-date"
                />
                <DeleteSessionRadioItem
                    selected={true}
                />
                <Radio
                    id="delete-all-other"
                    name="delete-session"
                    label={<AllOtherLabel />}
                    value="all-other"
                />
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
 * During Specific Day Period
 * Delete session modal with the "during a specific date period" radio
 * option selected, showing date pickers in closed/empty state.
 *
 * Layout:
 * - Header: "Cancel session" + close icon
 * - Delete Modal Session Card (Date, Time, School, Teacher)
 * - Radio options:
 *   1. This session
 *   2. This and all sessions at Hogwarts on Tue, Sep 9
 *   3. This and all sessions at Hogwarts during a specific date period (selected, date pickers shown)
 *   4. This and all other sessions at Hogwarts
 * - Bottom: Cancel (primary outline) + Confirm (danger outline)
 *
 * Tokens:
 * - Modal padding: --size-modal-pad-y-lg / --size-modal-pad-x-lg
 * - Modal gap: --size-modal-gap-lg (header/buttons), --size-modal-gap-md (card to radio)
 * - Section: --size-section-pad-y-md / --size-section-pad-x-md / --size-section-gap-md
 * - Modal radius: --size-modal-radius-lg
 * - Background: --color-surface-container-high
 * - Title: h4, --color-on-surface
 * - Close icon: fa-xmark, --font-size-fa-h4-solid, --color-on-surface-variant
 * - Links: --color-primary, bold underline
 */
export const During_Specific_Day_Period = () => (
    <Modal
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={<DuringSpecificDayPeriodModalBody />}
    />
);
