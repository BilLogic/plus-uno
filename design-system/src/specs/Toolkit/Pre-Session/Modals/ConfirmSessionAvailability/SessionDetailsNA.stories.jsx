import React from 'react';
import Modal from '@/components/messaging/Modal';
import ButtonGroup from '@/components/forms-and-inputs/ButtonGroup';
import Button from '@/components/forms-and-inputs/Button';
import CountTag from '@/components/labels/CountTag';
import { SessionInfoCard } from '@/specs/Toolkit/Pre-Session/Cards/SessionInfoCard.stories';
import { RequestCallOffButton, JoinSessionButton } from '@/specs/Toolkit/Pre-Session/Elements/CTATutorViewButtons.stories';
import { SupervisorControlsDropdown } from '@/specs/Toolkit/Pre-Session/Elements/SupervisorControls/SupervisorControls.stories';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Pre-Session/Modals/Confirm Session Availability',
    component: Modal,
    parameters: {
        layout: 'centered',
    },
};

// ─── Custom Time Card with Change ────────────────────────────

const TimeCardWithChange = () => (
    <div
        className="d-flex align-items-center"
        style={{
            gap: 'var(--size-modal-gap-md)',
            padding: 'var(--size-modal-pad-y-lg) var(--pad-x-lg)',
        }}
    >
        {/* Icon Container */}
        <div
            style={{
                width: 'var(--size-spacing-medium-space-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <i
                className="fa-regular fa-clock"
                style={{
                    fontSize: 'var(--font-size-fa-h4-solid)',
                    color: 'var(--ds-icon-subtle)',
                    lineHeight: 'var(--font-line-height-fa-h4-solid)',
                }}
            />
        </div>

        {/* Content Container */}
        <div
            className="d-flex flex-column"
            style={{ gap: 'var(--size-spacing-small-space-025)' }}
        >
            <span
                className="body2-txt font-weight-semibold"
                style={{ color: 'var(--ds-text)' }}
            >
                Time
            </span>
            <span
                className="body2-txt font-weight-light"
                style={{
                    color: 'var(--ds-text)',
                    textDecoration: 'line-through',
                }}
            >
                1:30 PM – 2:20 PM (Thursday)
            </span>
            <span
                className="body2-txt font-weight-semibold"
                style={{ color: 'var(--color-warning)' }}
            >
                2:00 PM - 2:50 PM (Thursday)
            </span>
        </div>
    </div>
);

// ─── Modal Body ───────────────────────────────────────────────

const SessionDetailsNAModalBody = () => (
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
            <h4 className="h4 m-0">Lincoln High School - 8/14/2025</h4>
            <div
                className="d-flex align-items-center"
                style={{ gap: 'var(--space-0625)' }}
            >
                <SupervisorControlsDropdown />
                <i
                    className="fa-solid fa-xmark"
                    style={{
                        fontSize: 'var(--font-size-fa-h4-solid)',
                        color: 'var(--ds-icon-subtle)',
                        cursor: 'pointer',
                    }}
                />
            </div>
        </div>

        {/* Content: Tabs + Info Grid */}
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-modal-gap-md)',
                width: '100%',
            }}
        >
            {/* Tabs using ButtonGroup */}
            <div style={{ display: 'flex', width: '100%' }}>
                <ButtonGroup
                    className="w-100"
                >
                    <Button
                        text="Session info"
                        isSelected={true}
                        shouldFitContainer
                    />
                    <Button
                        text="Attendees"
                        iconAfter={
                            <CountTag value={20} />
                        }
                        shouldFitContainer
                    />
                </ButtonGroup>
            </div>

            {/* Session Info Grid */}
            <div
                style={{
                    border: 'var(--border-default) solid var(--color-outline-variant)',
                    borderRadius: 'var(--size-modal-radius-md)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--stack-md)',
                    overflow: 'hidden',
                }}
            >
                {/* Row 1 */}
                <TimeCardWithChange />
                <SessionInfoCard
                    icon="fa-solid fa-graduation-cap"
                    title="Teacher"
                    content="Mr. Snape"
                />

                {/* Row 2 */}
                <SessionInfoCard
                    icon="fa-solid fa-person"
                    title="Tutor Count"
                    content="5/5 (Leads: 1/1)"
                />
                <SessionInfoCard
                    icon="fa-solid fa-users"
                    title="Student Count"
                    content="25"
                />

                {/* Row 3 */}
                <SessionInfoCard
                    icon="fa-solid fa-video"
                    title="Session Link"
                    content="{zoom url}"
                    contentLink="#"
                    showCopyButton={true}
                />
                <SessionInfoCard
                    icon="fa-solid fa-key"
                    title="Session Passcode"
                    content="123 456 789"
                    showCopyButton={true}
                />
            </div>
        </div>

        {/* Bottom Buttons */}
        <div
            className="d-flex"
            style={{
                gap: 'var(--size-modal-gap-md)',
                width: '100%',
            }}
        >
            <RequestCallOffButton />
            <JoinSessionButton shouldFitContainer />
        </div>
    </div>
);

// ─── Story ────────────────────────────────────────────────────

/**
 * Session Details NA
 * Session details modal without availability confirmation alert.
 * Shows session info tab with time change, gear settings icon, and
 * Request Call-off / Join session buttons.
 *
 * Layout:
 * - Header: "Lincoln High School - 8/14/2025" + gear icon + close icon
 * - ButtonGroup tabs: Session info (active) | Attendees (20)
 * - Session info grid (2 columns):
 *   - Time (with old time struck through, new time in warning)
 *   - Teacher, Tutor Count, Student Count
 *   - Session Link (with copy), Session Passcode (with copy)
 * - Bottom: Request Call-off (danger outline) + Join session (primary filled)
 *
 * Tokens:
 * - Modal padding: --size-modal-pad-y-lg / --size-modal-pad-x-lg
 * - Modal gap: --size-modal-gap-lg (sections), --size-modal-gap-md (content)
 * - Modal radius: --size-modal-radius-lg
 * - Background: --color-surface-container-high
 * - Title: h4, --color-on-surface
 * - Icons: fa-gear + fa-xmark, --font-size-fa-h4-solid, --color-on-surface-variant
 * - Time change: --color-warning (new time), line-through (old time)
 */
export const Session_Details_NA = () => (
    <Modal
        renderAs="inline"
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={<SessionDetailsNAModalBody />}
    />
);
