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

const OnlyUpcomingLabel = () => (
    <span>
        Only the upcoming session on{' '}
        <strong style={{ textDecoration: 'underline', color: 'var(--color-primary)' }}>
            Tue, Sep 9
        </strong>
    </span>
);

const AllAtSchoolOnDateLabel = () => (
    <span>
        All sessions at{' '}
        <strong style={{ textDecoration: 'underline', color: 'var(--color-primary)' }}>
            Hogwarts
        </strong>{' '}
        on{' '}
        <strong style={{ textDecoration: 'underline', color: 'var(--color-primary)' }}>
            Tue, Sep 9
        </strong>
    </span>
);

// ─── Modal Body ───────────────────────────────────────────────

const RecurringNAModalBody = () => (
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
            <h4 className="h4 m-0">Cancel recurring sessions</h4>
            <i
                className="fa-solid fa-xmark"
                style={{
                    fontSize: 'var(--font-size-fa-h4-solid)',
                    color: 'var(--color-on-surface-variant)',
                    cursor: 'pointer',
                }}
            />
        </div>

        {/* Content: Card + Radio + Buttons */}
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
                date="Tuesdays"
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
                    id="delete-only-upcoming"
                    name="delete-session"
                    label={<OnlyUpcomingLabel />}
                    value="only-upcoming"
                    defaultChecked
                />
                <Radio
                    id="delete-all-recurring"
                    name="delete-session"
                    label="All upcoming recurring sessions"
                    value="all-recurring"
                />
                <Radio
                    id="delete-all-at-school-date"
                    name="delete-session"
                    label={<AllAtSchoolOnDateLabel />}
                    value="all-at-school-date"
                />
                <DeleteSessionRadioItem
                    selected={false}
                />
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
    </div>
);

// ─── Story ────────────────────────────────────────────────────

/**
 * Recurring NA
 * Delete session modal for cancelling recurring sessions with no date
 * dropdown expanded.
 *
 * Layout:
 * - Header: "Cancel recurring sessions" + close icon
 * - Delete Modal Session Card (Days, Time, School, Teacher)
 * - Radio options:
 *   1. Only the upcoming session on Tue, Sep 9 (selected)
 *   2. All upcoming recurring sessions
 *   3. All sessions at Hogwarts on Tue, Sep 9
 *   4. All sessions at Hogwarts during a specific date period (with date pickers)
 * - Bottom: Cancel (primary outline) + Confirm (danger outline)
 *
 * Tokens:
 * - Modal padding: --size-modal-pad-y-lg / --size-modal-pad-x-lg
 * - Modal gap: --size-modal-gap-lg (sections), --size-modal-gap-md (content)
 * - Modal radius: --size-modal-radius-lg
 * - Background: --color-surface-container-high
 * - Title: h4, --color-on-surface
 * - Close icon: fa-xmark, --font-size-fa-h4-solid, --color-on-surface-variant
 * - Links: --color-primary, bold underline
 */
export const Recurring_NA = () => (
    <Modal
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={<RecurringNAModalBody />}
    />
);
