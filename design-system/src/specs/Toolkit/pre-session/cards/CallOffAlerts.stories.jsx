import React from 'react';
import Checkbox from '../../../../forms/Checkbox';

export default {
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
            backgroundColor: 'var(--color-warning-state-16)',
            border: '1px solid var(--color-warning)',
            borderRadius: 'var(--size-modal-radius-md)',
            padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-card-gap-sm)',
            width: 'var(--size-columns-col-12)'
        }}
    >
        <div className="d-flex align-items-start" style={{ gap: 'var(--size-element-gap-sm)' }}>
            <Checkbox
                size="small"
                required
                checked={checked}
                onChange={onChange}
                style={{ flexShrink: 0, width: 'auto', margin: 0, padding: 0 }}
            />
            <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
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
            backgroundColor: 'var(--color-primary-container-state-16)',
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--size-modal-radius-md)',
            padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
            display: 'flex',
            gap: 'var(--size-card-gap-sm)',
            width: 'var(--size-columns-col-12)'
        }}
    >
        <div
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-element-gap-sm)'
            }}
        >
            <span className="h6" style={{ color: 'var(--color-on-surface)' }}>
                {title}
            </span>
            <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                {description}
            </span>
        </div>
        <button
            onClick={onClose}
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                alignSelf: 'flex-start'
            }}
        >
            <i
                className="fa-solid fa-xmark"
                style={{
                    fontSize: 'var(--font-size-fa-h6-solid)',
                    color: 'var(--color-on-surface-variant)'
                }}
            />
        </button>
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
            backgroundColor: 'var(--color-warning-state-08)',
            border: '1px solid var(--color-warning)',
            borderRadius: 'var(--size-modal-radius-md)',
            padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
            display: 'flex',
            gap: 'var(--size-card-gap-sm)',
            width: 'var(--size-columns-col-12)'
        }}
    >
        <span className="body2-txt" style={{ color: 'var(--color-on-surface)', flex: 1 }}>
            This session begins in <strong>less than 12 hours</strong>. Dropping now may leave students without enough tutors. Please think carefully before submitting your call-off request, as it <strong>may not be excused</strong> and could count toward your absences.
        </span>
        <button
            onClick={onClose}
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                alignSelf: 'flex-start'
            }}
        >
            <i
                className="fa-solid fa-xmark"
                style={{
                    fontSize: 'var(--font-size-fa-h6-solid)',
                    color: 'var(--color-on-surface-variant)'
                }}
            />
        </button>
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
