import React, { useState } from 'react';
import Button from '@/components/forms-and-inputs/Button';
import StatusTag from '@/components/labels/StatusTag';
import { iconClass } from '../../../../lib/icon';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Pre-Session/Tables/My Sessions',
    parameters: {
        layout: 'padded',
    },
};

// Status configuration for badge styling
const getStatusConfig = (status) => {
    const configs = {
        'Scheduled': { style: 'info', icon: 'circle-check' },
        'Live': { style: 'info', icon: 'circle-check' },
        'In progress': { style: 'info', icon: 'play' },
        'Starting soon': { style: 'warning', icon: 'clock' },
        'Canceled': { style: 'danger', icon: 'circle-xmark' }
    };
    return configs[status] || configs['Scheduled'];
};

/**
 * Table Row Component
 * Exact grid layout matching Figma node 1751:110442
 * 7-column grid, 672px total width (col-12)
 * Cell padding: var(--size-table-cell-x), var(--size-table-cell-y)
 * 
 * Interactive states:
 * - Hover: background changes to --ds-background-neutral-subtle-hovered
 * - Active/Pressed: background changes to --ds-background-neutral-subtle-pressed
 */
export const TableRow = ({ date, timeRange, school, teacher, status, state: forcedState, interactive = true }) => {
    const [currentState, setCurrentState] = useState('default');

    // Use forcedState if provided (for static demos), otherwise use interactive state
    const effectiveState = forcedState || currentState;

    const stateStyles = {
        default: {},
        hover: { backgroundColor: 'var(--ds-background-neutral-subtle-hovered)' },
        pressed: { backgroundColor: 'var(--ds-background-neutral-subtle-pressed)' },
        focus: {
            border: 'var(--stroke-2) solid var(--ds-border-focused)'
        },
        // Disabled is a color, not an opacity. The row's text stays readable
        // at 4.5:1 on the subtlest text color, and its controls are disabled
        // themselves, which is what a screen reader announces.
        disabled: { pointerEvents: 'none' }
    };
    const isDisabled = effectiveState === 'disabled';
    const textColor = isDisabled ? 'var(--ds-text-subtlest)' : 'var(--ds-text)';

    const handleMouseEnter = interactive && !forcedState ? () => setCurrentState('hover') : undefined;
    const handleMouseLeave = interactive && !forcedState ? () => setCurrentState('default') : undefined;
    const handleMouseDown = interactive && !forcedState ? () => setCurrentState('pressed') : undefined;
    const handleMouseUp = interactive && !forcedState ? () => setCurrentState('hover') : undefined;

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
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
            {/* Date & Time Cell - spans columns 1-2 */}
            <div
                style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 'var(--stack-sm)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: textColor }}>
                    {date}
                </span>
                <span className="body2-txt" style={{ color: textColor }}>
                    {timeRange}
                </span>
            </div>

            {/* School & Teacher Cell - spans columns 3-4 */}
            <div
                style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 'var(--stack-sm)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: textColor }}>
                    {school}
                </span>
                <span className="body2-txt" style={{ color: textColor }}>
                    {teacher}
                </span>
            </div>

            {/* Status Cell - spans columns 5-6 */}
            <div
                style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <StatusTag appearance={getStatusConfig(status).style} leadingVisual={<i className={iconClass(getStatusConfig(status).icon)} />}>{status}</StatusTag>
            </div>

            {/* Actions Cell - column 7 */}
            <div
                style={{
                    gridColumn: 'span 1',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <Button
                    text="Details"
                    spacing="compact"
                    isDisabled={isDisabled}
                />
            </div>
        </div>
    );
};

/**
 * Table Header Row
 * Matches Figma header styling with sort icons
 */
export const TableHeaderRow = () => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            width: '100%',
            borderRadius: 'var(--size-table-radius-md)'
        }}
    >
        {/* Date & Time Header */}
        <div
            style={{
                gridColumn: 'span 2',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--stack-md)',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-secondary-text)' }}>
                Date & time
            </span>
            <i
                className={iconClass('arrow-up')}
                style={{
                    fontSize: 'var(--font-size-fa-body1-solid)',
                    color: 'var(--color-outline-variant)'
                }}
            />
        </div>

        {/* School & Teacher Header */}
        <div
            style={{
                gridColumn: 'span 2',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--stack-md)',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-secondary-text)' }}>
                School & teacher
            </span>
            <i
                className={iconClass('arrow-up')}
                style={{
                    fontSize: 'var(--font-size-fa-body1-solid)',
                    color: 'var(--color-outline-variant)'
                }}
            />
        </div>

        {/* Status Header */}
        <div
            style={{
                gridColumn: 'span 2',
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-secondary-text)' }}>
                Status
            </span>
        </div>

        {/* Actions Header */}
        <div
            style={{
                gridColumn: 'span 1',
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-secondary-text)' }}>
                Actions
            </span>
        </div>
    </div>
);

// Sample session data matching Figma design
const sampleSessions = [
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Live' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Live' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Live' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Live' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Live' },
];

/**
 * My Sessions Table Overview
 * Built using 7-column CSS grid matching Figma node 1751:110436
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <TableHeaderRow />
        {sampleSessions.map((session, index) => (
            <TableRow
                key={index}
                date={session.date}
                timeRange={session.timeRange}
                school={session.school}
                teacher={session.teacher}
                status={session.status}
            />
        ))}
    </div>
);

/**
 * Row States
 * Shows different visual states for table rows per Figma
 */
export const RowStates = () => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--size-spacing-medium-space-400)',
        padding: 'var(--size-spacing-medium-space-400)'
    }}>
        <h3 className="h5">Table Row States</h3>

        <div>
            <h4 className="h6" style={{ marginBottom: 'var(--space-0625)' }}>Default</h4>
            <TableRow
                date="Tue, Sep 9"
                timeRange="12:30 PM - 1:30 PM"
                school="Hogwarts"
                teacher="Mr. Snape"
                status="Live"
                state="default"
            />
        </div>

        <div>
            <h4 className="h6" style={{ marginBottom: 'var(--space-0625)' }}>Hover</h4>
            <TableRow
                date="Tue, Sep 9"
                timeRange="12:30 PM - 1:30 PM"
                school="Hogwarts"
                teacher="Mr. Snape"
                status="Live"
                state="hover"
            />
        </div>

        <div>
            <h4 className="h6" style={{ marginBottom: 'var(--space-0625)' }}>Pressed</h4>
            <TableRow
                date="Tue, Sep 9"
                timeRange="12:30 PM - 1:30 PM"
                school="Hogwarts"
                teacher="Mr. Snape"
                status="Live"
                state="pressed"
            />
        </div>

        <div>
            <h4 className="h6" style={{ marginBottom: 'var(--space-0625)' }}>Focus</h4>
            <TableRow
                date="Tue, Sep 9"
                timeRange="12:30 PM - 1:30 PM"
                school="Hogwarts"
                teacher="Mr. Snape"
                status="Live"
                state="focus"
            />
        </div>

        <div>
            <h4 className="h6" style={{ marginBottom: 'var(--space-0625)' }}>Disabled</h4>
            <TableRow
                date="Tue, Sep 9"
                timeRange="12:30 PM - 1:30 PM"
                school="Hogwarts"
                teacher="Mr. Snape"
                status="Live"
                state="disabled"
            />
        </div>
    </div>
);
