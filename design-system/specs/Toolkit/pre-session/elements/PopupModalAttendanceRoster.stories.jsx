import React from 'react';
import Badge from '../../../../../packages/plus-ds/src/components/Badge';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Pop-up Modal Attendance Roster',
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

/**
 * Attendance Roster Row
 * A single row in the attendance roster showing name and status badge
 */
export const AttendanceRosterRow = ({ name, state = 'unknown', showDropdown = false }) => (
    <div
        className="d-flex justify-content-between align-items-center w-100"
        style={{
            padding: 'var(--size-element-pad-y-lg) 0',
            gap: 'var(--size-element-gap-sm)',
        }}
    >
        {/* Name */}
        <span
            className="body2-txt font-weight-light"
            style={{ color: 'var(--color-on-surface)' }}
        >
            {name}
        </span>

        {/* Status Badge */}
        {state === 'unknown' ? (
            <Badge
                text={showDropdown ? 'Select' : 'N/A'}
                style="secondary"
                size="b2"
                trailingVisual={showDropdown ? <i className="fa-solid fa-caret-down" /> : undefined}
            />
        ) : (
            <Badge
                text={state === 'present' ? 'Present' : 'Absent'}
                style={state === 'present' ? 'success' : 'danger'}
                size="b2"
            />
        )}
    </div>
);

/**
 * Overview
 * Shows all states of the attendance roster row
 */
export const Overview = () => (
    <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>All States</h6>
            <div>
                <AttendanceRosterRow name="Ben Green" state="unknown" />
                <AttendanceRosterRow name="Ben Green" state="unknown" showDropdown={true} />
                <AttendanceRosterRow name="Ben Green" state="present" />
                <AttendanceRosterRow name="Ben Green" state="absent" />
            </div>
        </section>
    </div>
);

/**
 * Interactive
 * Customize the attendance roster row
 */
export const Interactive = {
    render: (args) => (
        <div style={{ width: '380px' }}>
            <AttendanceRosterRow {...args} />
        </div>
    ),
    args: {
        name: 'Ben Green',
        state: 'unknown',
        showDropdown: false,
    },
    argTypes: {
        name: {
            control: 'text',
            description: 'Attendee name',
        },
        state: {
            control: 'select',
            options: ['unknown', 'present', 'absent'],
            description: 'Attendance state',
        },
        showDropdown: {
            control: 'boolean',
            description: 'Show dropdown caret (only for unknown state)',
        },
    },
};
