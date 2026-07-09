/**
 * Profile - Elements - Clearance Status
 *
 * Displays the user's clearance verification status with an icon and message.
 *
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=5667-26454&m=dev
 */
import React from 'react';

export default {
    title: 'Specs/Profile/Elements/ClearanceStatus',
    excludeStories: ['ClearanceStatus'],
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Read-only clearance badge states for tutor profile (verified, expired, in progress). Token notes are preserved in the file header comment.',
            },
        },
    },
};

/**
 * ClearanceStatus Element
 *
 * @param {'verified' | 'expired' | 'in-progress'} props.status
 * @param {string} props.date
 */
export function ClearanceStatus({ status = 'verified', date = 'March 16, 2026' }) {
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
            <div
                style={{
                    display: 'flex',
                    gap: 'var(--size-small-gap-xs, 4px)',
                    alignItems: 'flex-start',
                }}
            >
                <span className="body3-txt" style={{ color: 'var(--color-on-surface)' }}>
                    Clearance Status
                </span>
            </div>
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
                <span className="body3-txt font-weight-light" style={{ color: config.color }}>
                    {config.text}
                </span>
            </div>
        </div>
    );
}

export const Overview = () => (
    <div style={{ padding: 'var(--size-element-pad-y-lg, 12px)' }}>
        <ClearanceStatus status="verified" date="March 16, 2026" />
    </div>
);

export const Variants = () => (
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

export const Interactive = {
    args: {
        status: 'verified',
        date: 'March 16, 2026',
    },
    argTypes: {
        status: {
            control: 'select',
            options: ['verified', 'expired', 'in-progress'],
            description: 'Clearance variant',
            table: { category: 'State' },
        },
        date: {
            control: 'text',
            description: 'Date label for verified / expired (ignored when status is in progress)',
            table: { category: 'State' },
        },
    },
    render: (args) => (
        <div style={{ padding: 'var(--size-element-pad-y-lg, 12px)' }}>
            <ClearanceStatus
                status={args.status}
                date={args.status === 'in-progress' ? undefined : args.date}
            />
        </div>
    ),
};
