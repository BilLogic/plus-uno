import React from 'react';
import { CloseButton } from '@/components';
import Checkbox from '@/components/forms-and-inputs/Checkbox';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Pre-Session/Cards/Call-off Alerts',
    parameters: {
        layout: 'padded',
    },
};

/**
 * Confirmation Alert Card (Checkbox for recurring call-off)
 * Warning bordered card with small checkbox
 * Reusable component that accepts custom label text
 * Figma node: 221:172584
 */
export const ConfirmationAlert = ({
    checked,
    onChange,
    label = "I have already spoken with my supervisor about dropping this recurring session",
    helperText = "Please contact your supervisor via email/Slack before proceeding.",
    showHelper = true
}) => (
    <div
        style={{
            backgroundColor: 'var(--ds-background-warning)',
            border: '1px solid var(--color-warning-border)',
            borderRadius: 'var(--size-modal-radius-md)',
            padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-card-gap-sm)',
            width: 'var(--col-12)'
        }}
    >
        <div className="d-flex align-items-start" style={{ gap: 'var(--stack-md)' }}>
            {/*
              * The confirmation text is a sibling `<span>`, laid out in the row
              * rather than inside the checkbox, so it cannot be the checkbox's
              * `label` without changing the layout. `aria-label` carries the
              * same string to the accessibility tree (#213).
              */}
            <Checkbox
                isRequired
                isChecked={checked}
                onChange={onChange}
                aria-label={label}
                style={{ flexShrink: 0, width: 'auto', margin: 0, padding: 0 }}/>
            <span className="body2-txt" style={{ color: 'var(--ds-text)' }}>
                {label}
                <span style={{ color: 'var(--color-danger)' }}> *</span>
            </span>
        </div>
        {showHelper && (
            <span
                className="body2-txt"
                style={{
                    color: 'var(--color-danger-text)',
                    marginLeft: 'var(--size-card-pad-x-md)'
                }}
            >
                {helperText}
            </span>
        )}
    </div>
);

/**
 * Update Notification Alert
 * Blue/primary bordered card with title, description and close button
 * Figma node: 221:172588
 */
const UpdateAlert = ({ title, description, onClose }) => (
    <div
        style={{
            backgroundColor: 'var(--ds-background-brand-subtlest)',
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--size-modal-radius-md)',
            padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
            display: 'flex',
            gap: 'var(--size-card-gap-sm)',
            width: 'var(--col-12)'
        }}
    >
        <div
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--stack-md)'
            }}
        >
            <span className="h6" style={{ color: 'var(--ds-text)' }}>
                {title}
            </span>
            <span className="body2-txt" style={{ color: 'var(--ds-text)' }}>
                {description}
            </span>
        </div>
        <CloseButton label="Dismiss alert" onClick={onClose} style={{ alignSelf: 'flex-start' }} />
    </div>
);

/**
 * Time Warning Alert
 * Warning bordered card with bold text highlights
 * Figma node: 221:172590
 */
const TimeWarningAlert = ({ onClose }) => (
    <div
        style={{
            backgroundColor: 'var(--ds-background-warning)',
            border: '1px solid var(--color-warning-border)',
            borderRadius: 'var(--size-modal-radius-md)',
            padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
            display: 'flex',
            gap: 'var(--size-card-gap-sm)',
            width: 'var(--col-12)'
        }}
    >
        <span className="body2-txt" style={{ color: 'var(--ds-text)', flex: 1 }}>
            This session begins in <strong>less than 12 hours</strong>. Dropping now may leave students without enough tutors. Please think carefully before submitting your call-off request, as it <strong>may not be excused</strong> and could count toward your absences.
        </span>
        <CloseButton label="Dismiss alert" onClick={onClose} style={{ alignSelf: 'flex-start' }} />
    </div>
);

/**
 * All Alert Types
 */
export const AllAlerts = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-card-gap-md)'
        }}
    >
        <ConfirmationAlert />
        <UpdateAlert
            title="Update on your call-off request"
            description="There's an update to your recent call-off request. Please visit the Call-offs tab to review the latest status and details."
        />
        <TimeWarningAlert />
    </div>
);

/**
 * Confirmation Alert Only
 */
export const ConfirmationAlertOnly = () => (
    <ConfirmationAlert />
);

/**
 * Update Alert Only
 */
export const UpdateAlertOnly = () => (
    <UpdateAlert
        title="Update on your call-off request"
        description="There's an update to your recent call-off request. Please visit the Call-offs tab to review the latest status and details."
    />
);

/**
 * Time Warning Alert Only
 */
export const TimeWarningAlertOnly = () => (
    <TimeWarningAlert />
);
