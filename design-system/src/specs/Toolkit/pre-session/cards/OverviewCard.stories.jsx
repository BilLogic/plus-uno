import React from 'react';

export default {
    title: 'Specs/Toolkit/Pre-Session/Cards/Overview Card',
    parameters: {
        layout: 'padded',
    },
};

/**
 * Icon Button Component
 * Small circular button with icon, matching Figma design
 */
export const IconButton = ({ icon = 'fa-table-cells-large' }) => (
    <button
        className="d-flex align-items-center justify-content-center"
        style={{
            backgroundColor: 'var(--color-primary-state-08)',
            borderRadius: 'var(--size-element-radius-full)',
            padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)',
            border: 'none',
            cursor: 'pointer'
        }}
    >
        <i
            className={`fa-solid ${icon}`}
            style={{
                fontSize: 'var(--font-size-fa-h6-solid)',
                color: 'var(--color-secondary-text)',
                lineHeight: 1
            }}
        />
    </button>
);

/**
 * Stat Card Component
 * Top portion with title, icon button, and large stat number
 */
export const StatCard = ({ title = 'Card title', value = '{#}', icon }) => (
    <div
        style={{
            backgroundColor: 'var(--color-surface-container-lowest)',
            borderRadius: 'var(--size-card-radius-sm)',
            padding: 'var(--size-card-pad-y-lg) var(--size-card-pad-x-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-element-gap-md)',
            flex: 1
        }}
    >
        {/* Header row with title and icon */}
        <div className="d-flex align-items-center justify-content-between">
            <span
                className="h6"
                style={{ color: 'var(--color-on-surface)' }}
            >
                {title}
            </span>
            <IconButton icon={icon} />
        </div>

        {/* Large stat value */}
        <span
            className="h1"
            style={{ color: 'var(--color-on-surface)' }}
        >
            {value}
        </span>
    </div>
);

/**
 * Field Row Component
 * Displays a label and value stacked vertically
 */
const FieldRow = ({ label, value }) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-element-gap-xs)'
        }}
    >
        <span
            className="body2-txt font-weight-semibold"
            style={{ color: 'var(--color-on-surface)' }}
        >
            {label}
        </span>
        <span
            className="body2-txt"
            style={{ color: 'var(--color-on-surface)' }}
        >
            {value}
        </span>
    </div>
);

/**
 * Session Details Card Component
 * Bottom portion with session info and date/time
 */
const SessionDetailsCard = ({ session = 'Hogwarts', dateTime = 'Mon, Sep 15 at 3:30 PM - 4:20 PM' }) => (
    <div
        style={{
            backgroundColor: 'var(--color-surface-variant)',
            borderRadius: 'var(--size-card-radius-sm)',
            padding: 'var(--size-card-pad-y-lg) var(--size-card-pad-x-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-card-gap-md)'
        }}
    >
        <FieldRow label="Session:" value={session} />
        <FieldRow label="Date & Time" value={dateTime} />
    </div>
);

/**
 * Overview Card - Default Variant
 * Complete card with stats section and session details
 */
export const Overview = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-spacing-small-space-025)',
            width: 'var(--size-columns-col-4)'
        }}
    >
        <StatCard title="Card title" value="{#}" />
        <SessionDetailsCard
            session="Hogwarts"
            dateTime="Mon, Sep 15 at 3:30 PM - 4:20 PM"
        />
    </div>
);

/**
 * Stats Card Only
 * Isolated stat card component
 */
export const StatsCardOnly = () => (
    <div style={{ width: 'var(--size-columns-col-4)' }}>
        <StatCard title="Total Sessions" value="42" />
    </div>
);

/**
 * Session Details Only
 * Isolated session details component
 */
export const SessionDetailsOnly = () => (
    <div style={{ width: 'var(--size-columns-col-4)' }}>
        <SessionDetailsCard
            session="Hogwarts"
            dateTime="Mon, Sep 15 at 3:30 PM - 4:20 PM"
        />
    </div>
);
