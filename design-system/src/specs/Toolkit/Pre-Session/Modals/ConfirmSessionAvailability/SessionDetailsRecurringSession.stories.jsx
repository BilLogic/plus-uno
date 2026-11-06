import React from 'react';
import Modal from '@/components/messaging/Modal';
import ButtonGroup from '@/components/forms-and-inputs/ButtonGroup';
import Button from '@/components/forms-and-inputs/Button';
import CountTag from '@/components/labels/CountTag';
import { SessionInfoCard } from '@/specs/Toolkit/Pre-Session/Cards/SessionInfoCard.stories';
import { AvailableButton, UnavailableButton } from '@/specs/Toolkit/Pre-Session/Elements/CTATutorsButton.stories';
import { Recurring_Session } from '@/specs/Toolkit/Pre-Session/Cards/TutorViewSessionManagement.stories';
import { iconClass } from '../../../../../lib/icon';

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

const SessionDetailsRecurringSessionModalBody = () => (
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
            <h4 className="h4 m-0">Lincoln High School - Thursdays</h4>
            <i
                className="fa-solid fa-xmark"
                style={{
                    fontSize: 'var(--font-size-fa-h4-solid)',
                    color: 'var(--ds-icon-subtle)',
                    cursor: 'pointer',
                }}
            />
        </div>

        {/* Content: Alert + Tabs + Info Grid + Buttons */}
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-modal-gap-md)',
                width: '100%',
            }}
        >
            {/* Alert */}
            <Recurring_Session />

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
                    icon={iconClass('graduation-cap')}
                    title="Teacher"
                    content="Mr. Snape"
                />

                {/* Row 2 */}
                <SessionInfoCard
                    icon={iconClass('person')}
                    title="Tutor Count"
                    content="5/5 (Leads: 1/1)"
                />
                <SessionInfoCard
                    icon={iconClass('users')}
                    title="Student Count"
                    content="25"
                />

                {/* Row 3 */}
                <SessionInfoCard
                    icon={iconClass('video')}
                    title="Session Link"
                    content="{zoom url}"
                    contentLink="#"
                    showCopyButton={true}
                />
                <SessionInfoCard
                    icon={iconClass('key')}
                    title="Session Passcode"
                    content="123 456 789"
                    showCopyButton={true}
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
                <UnavailableButton shouldFitContainer />
            </div>
            <div style={{ flex: 1 }}>
                <AvailableButton shouldFitContainer />
            </div>
        </div>
    </div>
);

// ─── Story ────────────────────────────────────────────────────

/**
 * Session Details Recurring Session
 * Confirm session availability modal for a recurring session.
 * Shows session info tab with time change highlighted in warning color.
 *
 * Layout:
 * - Header: "Lincoln High School - Thursdays" + close icon
 * - Warning Alert: "Please re-confirm your availability for this recurring session."
 * - ButtonGroup tabs: Session info (active) | Attendees (20)
 * - Session info grid (2 columns):
 *   - Time (with old time struck through, new time in warning)
 *   - Teacher, Tutor Count, Student Count
 *   - Session Link (with copy), Session Passcode (with copy)
 * - Bottom: Unavailable (danger outline) + Available (success outline)
 *
 * Tokens:
 * - Modal padding: --size-modal-pad-y-lg / --size-modal-pad-x-lg
 * - Modal gap: --size-modal-gap-lg (sections), --size-modal-gap-md (content)
 * - Modal radius: --size-modal-radius-lg
 * - Background: --color-surface-container-high
 * - Title: h4, --color-on-surface
 * - Close icon: fa-xmark, --font-size-fa-h4-solid, --color-on-surface-variant
 * - Time change: --color-warning (new time), line-through (old time)
 */
export const Session_Details_Recurring_Session = () => (
    <Modal
        renderAs="inline"
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={<SessionDetailsRecurringSessionModalBody />}
    />
);
