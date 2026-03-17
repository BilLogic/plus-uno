/**
 * Profile - Elements - Clearance Status
 * 
 * Displays the user's clearance verification status with an icon and message.
 * 
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=5667-26454&m=dev
 * 
 * Typography:
 * - Label: body3-txt (Merriweather Sans Regular, 12px, line-height 1.667)
 * - Icon: Font Awesome 7 Free Solid, 10px, line-height 2 (--font-size-fa-body3-solid)
 * - Message: body3-txt font-weight-light (Merriweather Sans Light, 12px, line-height 1.667)
 * 
 * Colors:
 * - Label: --color-on-surface
 * - Verified icon/text: --color-success-text
 * - Expired icon/text: --color-danger-text
 * - In Progress icon/text: --color-warning-text
 * 
 * Spacing:
 * - Vertical gap (label to message): var(--size-small-gap-xs, 4px)
 * - Horizontal gap (icon to text): var(--size-small-gap-xs, 4px)
 * 
 * Width: 200px (fixed from Figma)
 */
import React from 'react';

export default {
    title: 'Specs/Profile/Elements/Clearance Status',
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

/**
 * ClearanceStatus Element
 * Renders a label "Clearance Status" and a status message with icon.
 * 
 * @param {Object} props
 * @param {'verified' | 'expired' | 'in-progress'} props.status - The clearance status
 * @param {string} props.date - The date string (e.g., "March 16, 2026")
 */
const ClearanceStatus = ({ status = 'verified', date = 'March 16, 2026' }) => {
    const statusConfig = {
        verified: {
            icon: 'fa-solid fa-circle-check',
            color: 'var(--color-success-text)',
            text: `Verified: ${date}`,
        },
        expired: {
            icon: 'fa-solid fa-triangle-exclamation',
            color: 'var(--color-danger-text)',
            text: `Expired: ${date}`,
        },
        'in-progress': {
            icon: 'fa-solid fa-triangle-exclamation',
            color: 'var(--color-warning-text)',
            text: 'In Progress',
        },
    };

    const config = statusConfig[status] || statusConfig.verified;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-small-gap-xs, 4px)',
                alignItems: 'flex-start',
                width: '200px',
            }}
        >
            {/* Label */}
            <div
                style={{
                    display: 'flex',
                    gap: 'var(--size-small-gap-xs, 4px)',
                    alignItems: 'flex-start',
                }}
            >
                <span
                    className="body3-txt"
                    style={{ color: 'var(--color-on-surface)' }}
                >
                    Clearance Status
                </span>
            </div>
            {/* Message: Icon + Status Text */}
            <div
                style={{
                    display: 'flex',
                    gap: 'var(--size-small-gap-xs, 4px)',
                    alignItems: 'flex-start',
                }}
            >
                <i
                    className={config.icon}
                    style={{
                        fontSize: 'var(--font-size-fa-body3-solid)',
                        lineHeight: '2',
                        color: config.color,
                    }}
                    aria-hidden="true"
                />
                <span
                    className="body3-txt font-weight-light"
                    style={{ color: config.color }}
                >
                    {config.text}
                </span>
            </div>
        </div>
    );
};

/**
 * Verified State
 * Clearance has been verified with a valid date.
 */
export const Verified = () => (
    <ClearanceStatus status="verified" date="March 16, 2026" />
);
Verified.storyName = 'Verified';

/**
 * Expired State
 * Clearance has expired with the expiration date shown.
 */
export const Expired = () => (
    <ClearanceStatus status="expired" date="Feb 16, 2026" />
);
Expired.storyName = 'Expired';

/**
 * In Progress State
 * Clearance verification is currently in progress.
 */
export const InProgress = () => (
    <ClearanceStatus status="in-progress" />
);
InProgress.storyName = 'In Progress';

/**
 * All States Overview
 * Shows all three clearance status states for comparison.
 */
export const AllStates = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-md, 16px)',
            padding: 'var(--size-element-pad-y-lg, 12px)',
        }}
    >
        <ClearanceStatus status="verified" date="March 16, 2026" />
        <ClearanceStatus status="expired" date="Feb 16, 2026" />
        <ClearanceStatus status="in-progress" />
    </div>
);
AllStates.storyName = 'All States';
