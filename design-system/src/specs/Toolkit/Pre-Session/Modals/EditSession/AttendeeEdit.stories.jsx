import React from 'react';
import Modal from '@/components/messaging/Modal';
import ButtonGroup from '@/components/forms-and-inputs/ButtonGroup';
import Button from '@/components/forms-and-inputs/Button';
import CountTag from '@/components/labels/CountTag';
import { RosterItem } from '@/specs/Toolkit/Pre-Session/Elements/EditingAttendanceRosterItems.stories';
import { CancelButton, SaveChangesButton } from '@/specs/Toolkit/Pre-Session/Elements/SupervisorManagementButtons.stories';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Pre-Session/Modals/Edit Session',
    component: Modal,
    parameters: {
        layout: 'centered',
    },
};

// ─── Roster Panel ─────────────────────────────────────────────

const RosterPanel = ({ title, addLabel, items }) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minWidth: 0,
            border: 'var(--border-default) solid var(--color-outline-variant)',
            borderRadius: 'var(--size-modal-radius-md)',
            overflow: 'hidden',
        }}
    >
        {/* Panel Header */}
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--size-modal-pad-y-md) var(--size-modal-pad-x-md)',
                borderBottom: 'var(--border-default) solid var(--color-outline-variant)',
            }}
        >
            <span
                className="h6"
                style={{ color: 'var(--ds-text)', margin: 0 }}
            >
                {title}
            </span>
            <Button
                text={addLabel}
                spacing="compact"
                iconBefore="user-plus"
            />
        </div>

        {/* Panel Body - Scrollable List */}
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                padding: 'var(--space-025) var(--pad-x-sm)',
                overflowY: 'auto',
                flex: 1,
            }}
        >
            {items.map((item, index) => (
                <RosterItem
                    key={index}
                    name={item.name}
                    isLead={item.isLead}
                    removeState={item.removeState}
                    isHovered={item.isHovered}
                />
            ))}
        </div>
    </div>
);

// ─── Modal Body ───────────────────────────────────────────────

const AttendeeEditModalBody = () => (
    <div
        className="d-flex flex-column"
        style={{
            gap: 'var(--size-modal-gap-lg)',
            backgroundColor: 'var(--ds-surface-container)',
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
                    color: 'var(--ds-icon-subtle)',
                    cursor: 'pointer',
                }}
            />
        </div>

        {/* Tab Navigation - ButtonGroup (Attendees active) */}
        <div style={{ display: 'flex', width: '100%' }}>
            <ButtonGroup
                className="w-100"
            >
                <Button
                    text="Session info"
                    shouldFitContainer
                />
                <Button
                    text="Attendees"
                    isSelected={true}
                    iconAfter={
                        <CountTag value={20} />
                    }
                    shouldFitContainer
                />
            </ButtonGroup>
        </div>

        {/* Two-Column Roster */}
        <div
            style={{
                display: 'flex',
                gap: 'var(--size-modal-gap-md)',
                width: '100%',
                height: '360px',
            }}
        >
            {/* Tutor Roster */}
            <RosterPanel
                title="Tutor Roster"
                addLabel="Add tutor"
                items={[
                    { name: 'Ben Green', isLead: true },
                    { name: 'Ben Green', isHovered: true, removeState: 'button' },
                    { name: 'Ben Green' },
                    { name: 'Ben Green' },
                    { name: 'Ben Green' },
                    { name: 'Ben Green' },
                ]}
            />

            {/* Student Roster */}
            <RosterPanel
                title="Student Roster"
                addLabel="Add Student"
                items={[
                    { name: 'Ben Green' },
                    { name: 'Ben Green' },
                    { name: 'Ben Green' },
                ]}
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
                <CancelButton shouldFitContainer />
            </div>
            <div style={{ flex: 1 }}>
                <SaveChangesButton shouldFitContainer />
            </div>
        </div>
    </div>
);

// ─── Story ────────────────────────────────────────────────────

/**
 * Attendee Edit
 * The "Edit session" modal on the Attendees tab for managing tutor and student rosters.
 *
 * Layout:
 * - Header: "Edit session" title + close icon
 * - Tab navigation: Session info (inactive) | Attendees (active, with count badge)
 * - Two-column roster: Tutor Roster (left) + Student Roster (right)
 *   - Each panel has a header with title + "Add" button
 *   - Scrollable list of RosterItems with lead badges and remove buttons
 * - Bottom: Cancel (outline) + Save Changes (filled) buttons
 *
 * Tokens:
 * - Modal padding: --size-modal-pad-y-lg / --size-modal-pad-x-lg
 * - Modal gap: --size-modal-gap-lg (between sections), --size-modal-gap-md (between panels)
 * - Modal radius: --size-modal-radius-lg (outer), --size-modal-radius-md (panels)
 * - Panel border: --color-outline-variant, --border-default
 * - Panel header padding: --size-modal-pad-y-md / --size-modal-pad-x-md
 * - Background: --color-surface-container-high
 * - Title: h4
 * - Panel title: h6
 * - Close icon: fa-xmark, --font-size-fa-h4-solid, --color-on-surface-variant
 */
export const Attendee_Edit = () => (
    <Modal
        renderAs="inline"
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={<AttendeeEditModalBody />}
    />
);
