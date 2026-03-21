import React from 'react';
import Modal from '../../../../../components/Modal';
import ButtonGroup from '../../../../../components/ButtonGroup';
import Button from '../../../../../components/Button';
import Badge from '../../../../../components/Badge';
import { AttendanceRosterRow } from '../../elements/PopupModalAttendanceRoster.stories';
import { AvailableButton, UnavailableButton } from '../../elements/CTATutorsButton.stories';
import { One_Time_Session } from '../../cards/TutorViewSessionManagement.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Modals/Confirm Session Availability',
    component: Modal,
    parameters: {
        layout: 'centered',
    },
};

// ─── Modal Body ───────────────────────────────────────────────

const AttendeesOneTimeSessionModalBody = () => (
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
            <h4 className="h4 m-0">Lincoln High School - 8/14/2025</h4>
            <i
                className="fa-solid fa-xmark"
                style={{
                    fontSize: 'var(--font-size-fa-h4-solid)',
                    color: 'var(--color-on-surface-variant)',
                    cursor: 'pointer',
                }}
            />
        </div>

        {/* Content: Alert + Tabs + Roster Grid */}
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-modal-gap-md)',
                width: '100%',
            }}
        >
            {/* Alert */}
            <One_Time_Session />

            {/* Tabs using ButtonGroup */}
            <div style={{ display: 'flex', width: '100%' }}>
                <ButtonGroup
                    fill="tonal"
                    className="w-100"
                >
                    <Button
                        text="Session info"
                        style="secondary"
                        fill="tonal"
                        block
                    />
                    <Button
                        text="Attendees"
                        active={true}
                        trailingVisual={
                            <Badge text="20" style="secondary" size="b3" />
                        }
                        style="primary"
                        fill="tonal"
                        block
                    />
                </ButtonGroup>
            </div>

            {/* Roster Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--size-modal-gap-md)',
                    height: '250px',
                }}
            >
                {/* Tutor Roster Panel */}
                <div
                    style={{
                        border: 'var(--size-element-border) solid var(--color-outline-variant)',
                        borderRadius: 'var(--size-element-radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}
                >
                    {/* Panel Header */}
                    <div
                        className="d-flex justify-content-between align-items-center"
                        style={{
                            padding: 'var(--size-modal-pad-y-md) var(--size-modal-pad-x-md)',
                        }}
                    >
                        <span className="h6 m-0">Tutor Roster</span>
                        <Badge
                            text="4"
                            style="info"
                            size="b3"
                            leadingVisual={<i className="fa-solid fa-users" />}
                        />
                    </div>

                    {/* Panel Body */}
                    <div className="d-flex" style={{ flex: 1, overflow: 'hidden' }}>
                        <div
                            style={{
                                overflowY: 'auto',
                                flex: 1,
                                padding: '0 var(--size-modal-pad-x-md)',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <AttendanceRosterRow
                                name="Joe Schmoe"
                                type="tutor"
                                isLead
                                showBadge={false}
                            />
                            <AttendanceRosterRow
                                name="Joe Schmoe"
                                type="tutor"
                                showBadge={false}
                            />
                            <AttendanceRosterRow
                                name="Ben Green"
                                type="tutor"
                                showBadge={false}
                            />
                        </div>
                        {/* Scrollbar */}
                        <div className="plus-modal-scrollbar">
                            <div className="plus-modal-scrollbar-track">
                                <div className="plus-modal-scrollbar-bar" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Student Roster Panel */}
                <div
                    style={{
                        border: 'var(--size-element-border) solid var(--color-outline-variant)',
                        borderRadius: 'var(--size-element-radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}
                >
                    {/* Panel Header */}
                    <div
                        className="d-flex justify-content-between align-items-center"
                        style={{
                            padding: 'var(--size-modal-pad-y-md) var(--size-modal-pad-x-md)',
                        }}
                    >
                        <span className="h6 m-0">Student Roster</span>
                        <Badge
                            text="4"
                            style="info"
                            size="b3"
                            leadingVisual={<i className="fa-solid fa-users" />}
                        />
                    </div>

                    {/* Panel Body */}
                    <div className="d-flex" style={{ flex: 1, overflow: 'hidden' }}>
                        <div
                            style={{
                                overflowY: 'auto',
                                flex: 1,
                                padding: '0 var(--size-modal-pad-x-md)',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            {[1, 2, 3, 4].map((i) => (
                                <AttendanceRosterRow
                                    key={i}
                                    name="Ben Green"
                                    type="student"
                                    showBadge={false}
                                />
                            ))}
                        </div>
                        {/* Scrollbar */}
                        <div className="plus-modal-scrollbar">
                            <div className="plus-modal-scrollbar-track">
                                <div className="plus-modal-scrollbar-bar" />
                            </div>
                        </div>
                    </div>
                </div>
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
                <UnavailableButton block />
            </div>
            <div style={{ flex: 1 }}>
                <AvailableButton block />
            </div>
        </div>
    </div>
);

// ─── Story ────────────────────────────────────────────────────

/**
 * Attendees One-Time Session
 * Confirm session availability modal showing the Attendees tab for a one-time session.
 *
 * Layout:
 * - Header: "Lincoln High School - 8/14/2025" + close icon
 * - Warning Alert: "Please re-confirm your availability for this session."
 * - ButtonGroup tabs: Session info | Attendees (20, active)
 * - Roster grid (2 columns):
 *   - Tutor Roster (4): Joe Schmoe (Lead), Joe Schmoe, Ben Green
 *   - Student Roster (4): Ben Green x4
 * - Bottom: Unavailable (danger outline) + Available (success outline)
 *
 * Tokens:
 * - Modal padding: --size-modal-pad-y-lg / --size-modal-pad-x-lg
 * - Modal gap: --size-modal-gap-lg (sections), --size-modal-gap-md (content)
 * - Modal radius: --size-modal-radius-lg
 * - Background: --color-surface-container-high
 * - Title: h4, --color-on-surface
 * - Close icon: fa-xmark, --font-size-fa-h4-solid, --color-on-surface-variant
 * - Panel border: --size-element-border, --color-outline-variant
 * - Panel radius: --size-element-radius-md
 */
export const Attendees_One_Time_Session = () => (
    <Modal
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={<AttendeesOneTimeSessionModalBody />}
    />
);
