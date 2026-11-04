import React from 'react';
import { IconButton } from '@/components';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Pre-Session/Cards/Overview Card',
    parameters: {
        layout: 'padded',
    },
};

/**
 * Stat Card Component
 * Top portion with title, icon button, and large stat number
 */
export const StatCard = ({ title = 'Card title', value = '{#}', icon, iconAriaLabel = 'View options' }) => (
    <div
        style={{
            backgroundColor: 'var(--ds-surface)',
            borderRadius: 'var(--size-card-radius-sm)',
            padding: 'var(--size-card-pad-y-lg) var(--size-card-pad-x-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-0625)',
            flex: 1
        }}
    >
        {/* Header row with title and icon */}
        <div className="d-flex align-items-center justify-content-between">
            <span
                className="h6"
                style={{ color: 'var(--ds-icon)' }}
            >
                {title}
            </span>
            <IconButton icon={(icon || 'fa-table-cells-large').replace(/^(fa-solid\s+)?fa-/, '')} label={iconAriaLabel} shape="circle" appearance="subtle" spacing="compact" />
        </div>

        {/* Large stat value */}
        <span
            className="h1"
            style={{ color: 'var(--ds-icon)' }}
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
            gap: 'var(--stack-sm)'
        }}
    >
        <span
            className="body2-txt font-weight-semibold"
            style={{ color: 'var(--ds-text)' }}
        >
            {label}
        </span>
        <span
            className="body2-txt"
            style={{ color: 'var(--ds-text)' }}
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
            backgroundColor: 'var(--ds-background-neutral)',
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
            width: 'var(--col-4)'
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
    <div style={{ width: 'var(--col-4)' }}>
        <StatCard title="Total Sessions" value="42" />
    </div>
);

/**
 * Session Details Only
 * Isolated session details component
 */
export const SessionDetailsOnly = () => (
    <div style={{ width: 'var(--col-4)' }}>
        <SessionDetailsCard
            session="Hogwarts"
            dateTime="Mon, Sep 15 at 3:30 PM - 4:20 PM"
        />
    </div>
);
