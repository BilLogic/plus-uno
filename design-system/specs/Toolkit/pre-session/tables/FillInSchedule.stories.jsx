import React, { useState } from 'react';
import Badge from '../../../../../packages/plus-ds/src/components/Badge/Badge';
import Checkbox from '../../../../../packages/plus-ds/src/forms/Checkbox';

export default {
    title: 'Specs/Toolkit/Pre-Session/Tables/Fill-In Schedule',
    parameters: {
        layout: 'padded',
    },
};

/**
 * Table Row Component for Fill-In Schedule
 * 4-column grid with checkbox, date/time, school/teacher, and tutor capacity
 * 
 * Semantic Table Tokens Used:
 * - Cell padding: var(--size-table-cell-x), var(--size-table-cell-y)
 * - Cell gap: var(--size-table-cell-gap)
 * - Row radius: var(--size-table-radius-md)
 * 
 * Interactive states:
 * - Hover: background changes to --color-on-surface-state-08
 * - Active/Pressed: background changes to --color-on-surface-state-12
 */
export const TableRow = ({
    date,
    timeRange,
    school,
    teacher,
    tutorCount,
    leadCount,
    hasNoLead = false,
    checked = false,
    state: forcedState,
    interactive = true,
    onCheckChange
}) => {
    const [currentState, setCurrentState] = useState('default');
    const [isChecked, setIsChecked] = useState(checked);

    // Use forcedState if provided (for static demos), otherwise use interactive state
    const effectiveState = forcedState || currentState;

    const stateStyles = {
        default: {},
        hover: { backgroundColor: 'var(--color-on-surface-state-08)' },
        pressed: { backgroundColor: 'var(--color-on-surface-state-12)' },
        focus: {
            border: 'var(--size-element-stroke-lg) solid var(--color-inverse-primary)',
            backgroundColor: 'var(--color-on-surface-state-12)'
        },
        disabled: { opacity: 0.5, pointerEvents: 'none' }
    };

    const handleMouseEnter = interactive && !forcedState ? () => setCurrentState('hover') : undefined;
    const handleMouseLeave = interactive && !forcedState ? () => setCurrentState('default') : undefined;
    const handleMouseDown = interactive && !forcedState ? () => setCurrentState('pressed') : undefined;
    const handleMouseUp = interactive && !forcedState ? () => setCurrentState('hover') : undefined;

    const handleCheckboxChange = () => {
        setIsChecked(!isChecked);
        onCheckChange?.(!isChecked);
    };

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr 1fr 1fr',
                width: '100%',
                borderRadius: 'var(--size-table-radius-md)',
                cursor: interactive ? 'pointer' : 'default',
                transition: 'background-color 0.15s ease',
                ...stateStyles[effectiveState]
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
        >
            {/* Checkbox Cell - uses design system Checkbox component */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <Checkbox
                    checked={isChecked}
                    onChange={handleCheckboxChange}
                    size="small"
                    disabled={effectiveState === 'disabled'}
                />
            </div>

            {/* Date & Time Cell */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 'var(--size-table-cell-gap)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    {date}
                </span>
                <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                    {timeRange}
                </span>
            </div>

            {/* School & Teacher Cell */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 'var(--size-table-cell-gap)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    {school}
                </span>
                <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                    {teacher}
                </span>
            </div>

            {/* Tutor Capacity Cell */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    gap: 'var(--size-table-cell-gap)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                    {tutorCount} (Leads: {leadCount})
                </span>
                {hasNoLead && (
                    <Badge
                        text="No lead"
                        style="warning"
                        size="b3"
                    />
                )}
            </div>
        </div>
    );
};

/**
 * Table Header Row for Fill-In Schedule
 * Matches Figma header styling with sort icons
 */
export const TableHeaderRow = () => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr 1fr 1fr',
            width: '100%',
            borderRadius: 'var(--size-table-radius-md)'
        }}
    >
        {/* Checkbox Header (empty) */}
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            {/* Empty for alignment */}
        </div>

        {/* Date & Time Header */}
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--size-table-cell-gap)',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-secondary-text)' }}>
                Date & time
            </span>
            <i
                className="fa-solid fa-arrow-up"
                style={{
                    fontSize: 'var(--font-size-fa-b1-solid)',
                    color: 'var(--color-on-surface)'
                }}
            />
        </div>

        {/* School & Teacher Header */}
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--size-table-cell-gap)',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-secondary-text)' }}>
                School & teacher
            </span>
            <i
                className="fa-solid fa-arrow-up"
                style={{
                    fontSize: 'var(--font-size-fa-b1-solid)',
                    color: 'var(--color-outline-variant)'
                }}
            />
        </div>

        {/* Tutor Capacity Header */}
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-secondary-text)' }}>
                Tutor Capacity
            </span>
        </div>
    </div>
);

/**
 * Fill-In Schedule Table Overview
 * Shows all row states (Default, Hover, Pressed, Focus, Disabled) for documentation
 * 
 * Components Used:
 * - Badge (from plus-ds) for "No lead" indicator
 * - Checkbox (from plus-ds/forms) for row selection
 * 
 * Semantic Tokens Used:
 * - --size-table-cell-x, --size-table-cell-y (cell padding)
 * - --size-table-cell-gap (internal cell gap)
 * - --size-table-radius-md (row border radius)
 * - --color-on-surface, --color-secondary-text (text colors)
 * - --color-on-surface-state-08/12 (interactive states)
 */
export const Overview = () => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--size-spacing-space-400)',
        padding: 'var(--size-spacing-space-400)'
    }}>
        <h3 className="h5">Fill-In Schedule Row States</h3>

        <div>
            <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Default</h6>
            <TableHeaderRow />
            <TableRow
                date="Tue, Sep 9"
                timeRange="12:30 PM - 1:30 PM"
                school="Hogwarts"
                teacher="Mr. Snape"
                tutorCount="1/5"
                leadCount="0/1"
                hasNoLead={true}
                state="default"
            />
        </div>

        <div>
            <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Hover</h6>
            <TableRow
                date="Tue, Sep 9"
                timeRange="12:30 PM - 1:30 PM"
                school="Hogwarts"
                teacher="Mr. Snape"
                tutorCount="1/5"
                leadCount="0/1"
                hasNoLead={true}
                state="hover"
            />
        </div>

        <div>
            <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Pressed</h6>
            <TableRow
                date="Tue, Sep 9"
                timeRange="12:30 PM - 1:30 PM"
                school="Hogwarts"
                teacher="Mr. Snape"
                tutorCount="1/5"
                leadCount="0/1"
                hasNoLead={true}
                state="pressed"
            />
        </div>

        <div>
            <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Focus</h6>
            <TableRow
                date="Tue, Sep 9"
                timeRange="12:30 PM - 1:30 PM"
                school="Hogwarts"
                teacher="Mr. Snape"
                tutorCount="1/5"
                leadCount="0/1"
                hasNoLead={true}
                state="focus"
            />
        </div>

        <div>
            <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Disabled</h6>
            <TableRow
                date="Tue, Sep 9"
                timeRange="12:30 PM - 1:30 PM"
                school="Hogwarts"
                teacher="Mr. Snape"
                tutorCount="1/5"
                leadCount="0/1"
                hasNoLead={true}
                state="disabled"
            />
        </div>
    </div>
);

/**
 * Interactive Fill-In Schedule
 * Demonstrates checkbox selection functionality
 */
export const Interactive = () => {
    const [selectedRows, setSelectedRows] = useState([]);

    // Sample fill-in schedule data matching Figma design
    const sampleSchedule = [
        { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', leadCount: '0/1', hasNoLead: true },
        { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', leadCount: '0/1', hasNoLead: true },
        { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', leadCount: '0/1', hasNoLead: true },
    ];

    const handleRowCheck = (index, checked) => {
        if (checked) {
            setSelectedRows([...selectedRows, index]);
        } else {
            setSelectedRows(selectedRows.filter(i => i !== index));
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <TableHeaderRow />
            {sampleSchedule.map((session, index) => (
                <TableRow
                    key={index}
                    date={session.date}
                    timeRange={session.timeRange}
                    school={session.school}
                    teacher={session.teacher}
                    tutorCount={session.tutorCount}
                    leadCount={session.leadCount}
                    hasNoLead={session.hasNoLead}
                    checked={selectedRows.includes(index)}
                    onCheckChange={(checked) => handleRowCheck(index, checked)}
                />
            ))}
            <div style={{ marginTop: 'var(--size-spacing-space-400)', padding: 'var(--size-spacing-space-200)' }}>
                <span className="body2-txt" style={{ color: 'var(--color-secondary-text)' }}>
                    Selected: {selectedRows.length} session(s)
                </span>
            </div>
        </div>
    );
};
