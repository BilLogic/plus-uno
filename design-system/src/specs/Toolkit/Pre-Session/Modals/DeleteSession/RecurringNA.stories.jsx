import React from 'react';
import Modal from '@/components/messaging/Modal';
import { ChoiceGroup } from '@/components';
import { DeleteModalSessionCard } from '@/specs/Toolkit/Pre-Session/Cards/DeleteModalSessionCard.stories';
import { dateRangeOption } from '@/specs/Toolkit/Pre-Session/Elements/DeleteSessionRadioSelection.stories';
import { CancelButton, ConfirmCancelButton } from '@/specs/Toolkit/Pre-Session/Elements/SupervisorManagementButtons.stories';

export default {
    tags: ['!dev', '!autodocs'],
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
            <ChoiceGroup
                name="delete-session"
                aria-label="Sessions to cancel"
                defaultValue="only-upcoming"
                style={{ padding: 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)' }}
                options={[
                    { id: 'delete-only-upcoming', value: 'only-upcoming', label: <OnlyUpcomingLabel /> },
                    { id: 'delete-all-recurring', value: 'all-recurring', label: 'All upcoming recurring sessions' },
                    { id: 'delete-all-at-school-date', value: 'all-at-school-date', label: <AllAtSchoolOnDateLabel /> },
                    dateRangeOption(),
                ]}
            />

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
        renderAs="inline"
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={<RecurringNAModalBody />}
    />
);
