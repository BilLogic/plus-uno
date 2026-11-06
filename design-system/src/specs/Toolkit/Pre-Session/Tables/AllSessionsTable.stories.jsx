import React, { useState } from 'react';
import Button from '@/components/forms-and-inputs/Button/Button';
import StatusTag from '@/components/labels/StatusTag';
import { iconClass } from '../../../../lib/icon';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Pre-Session/Tables/All Sessions',
    parameters: {
        layout: 'padded',
    },
};

/**
 * Column Header Component
 * Reusable header cell with optional sort icon
 */
const ColumnHeader = ({ label, sortable = true, span = 1 }) => (
    <div
        style={{
            gridColumn: `span ${span}`,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--stack-md)',
            padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
            borderRadius: 'var(--size-border-radius-radius-100)'
        }}
    >
        <span className="body2-txt font-weight-semibold" style={{ color: 'var(--ds-text)', textTransform: 'capitalize' }}>
            {label}
        </span>
        {sortable && (
            <i
                className={iconClass('arrow-up')}
                style={{
                    fontSize: 'var(--font-size-fa-body1-solid)',
                    color: 'var(--ds-icon-subtle)'
                }}
            />
        )}
    </div>
);

/**
 * All Sessions Table Header Row
 * 9-column grid layout matching Figma:
 * - Date & time: col 1-2 (span 2)
 * - School & teacher: col 3-4 (span 2)
 * - Status: col 5-6 (span 2)
 * - Tutor: col 7 (span 1)
 * - Student: col 8 (span 1)
 * - Actions: col 9 (span 1)
 */
export const AllSessionsTableHeaderRow = () => {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(9, 1fr)',
                width: '100%',
                borderRadius: 'var(--size-table-radius-md)'
            }}
        >
            {/* Date & time Header - spans 2 columns */}
            <ColumnHeader label="Date & time" span={2} />

            {/* School & teacher Header - spans 2 columns */}
            <ColumnHeader label="School & teacher" span={2} />

            {/* Status Header - spans 2 columns */}
            <ColumnHeader label="Status" span={2} />

            {/* Tutor Header - spans 1 column */}
            <ColumnHeader label="Tutor" span={1} />

            {/* Student Header - spans 1 column */}
            <ColumnHeader label="Student" span={1} />

            {/* Actions Header - spans 1 column (no sort icon) */}
            <ColumnHeader label="Actions" span={1} sortable={false} />
        </div>
    );
};

/**
 * All Sessions Table Row
 * 9-column grid layout matching Figma:
 * - Date & time: col 1-2 (span 2)
 * - School & teacher: col 3-4 (span 2)
 * - Status: col 5-6 (span 2)
 * - Tutor: col 7 (span 1)
 * - Student: col 8 (span 1)
 * - Actions: col 9 (span 1)
 * 
 * Props:
 * - date: string (e.g., "Tue, Sep 9")
 * - timeRange: string (e.g., "1:00 PM - 1:50 PM")
 * - school: string (e.g., "Hogwarts")
 * - teacher: string (e.g., "Mr. Snape")
 * - status: 'in-progress' | 'upcoming' | 'completed' | 'canceled'
 * - tutorCount: string (e.g., "1/5")
 * - needLead: boolean - shows "Need Lead" badge
 * - studentCount: number (e.g., 25)
 */
export const AllSessionsTableRow = ({
    date,
    timeRange,
    school,
    teacher,
    status = 'in-progress',
    tutorCount,
    needLead = false,
    studentCount,
    state: forcedState,
    interactive = true,
    onDetails
}) => {
    const [currentState, setCurrentState] = useState('default');
    const effectiveState = forcedState || currentState;

    const stateStyles = {
        default: {},
        hover: { backgroundColor: 'var(--ds-background-neutral-subtle-hovered)' },
        pressed: { backgroundColor: 'var(--ds-background-neutral-subtle-pressed)' }
    };

    const handleMouseEnter = interactive && !forcedState ? () => setCurrentState('hover') : undefined;
    const handleMouseLeave = interactive && !forcedState ? () => setCurrentState('default') : undefined;
    const handleMouseDown = interactive && !forcedState ? () => setCurrentState('pressed') : undefined;
    const handleMouseUp = interactive && !forcedState ? () => setCurrentState('hover') : undefined;

    // Status badge configuration
    const getStatusConfig = () => {
        switch (status) {
            case 'in-progress':
                return { text: 'In progress', style: 'info' };
            case 'upcoming':
                return { text: 'Upcoming', style: 'neutral' };
            case 'completed':
                return { text: 'Completed', style: 'success' };
            case 'canceled':
                return { text: 'Canceled', style: 'danger' };
            default:
                return { text: 'In progress', style: 'info' };
        }
    };

    const statusConfig = getStatusConfig();

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(9, 1fr)',
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
            {/* Date & Time - spans 2 columns */}
            <div
                style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 'var(--size-table-cell-gap)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                    overflow: 'hidden'
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--ds-text)' }}>
                    {date}
                </span>
                <span className="body2-txt font-weight-light" style={{ color: 'var(--ds-text)' }}>
                    {timeRange}
                </span>
            </div>

            {/* School & Teacher - spans 2 columns */}
            <div
                style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 'var(--size-table-cell-gap)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                    overflow: 'hidden'
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--ds-text)' }}>
                    {school}
                </span>
                <span className="body2-txt font-weight-light" style={{ color: 'var(--ds-text)' }}>
                    {teacher}
                </span>
            </div>

            {/* Status - spans 2 columns */}
            <div
                style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--size-table-cell-gap)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <StatusTag appearance={statusConfig.style}>{statusConfig.text}</StatusTag>
            </div>

            {/* Tutor Count - spans 1 column */}
            <div
                style={{
                    gridColumn: 'span 1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--size-table-cell-gap)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <span className="body2-txt font-weight-light" style={{ color: 'var(--ds-text)' }}>
                    {tutorCount}
                </span>
                {needLead && (
                    <StatusTag appearance="warning">Need Lead</StatusTag>
                )}
            </div>

            {/* Student Count - spans 1 column */}
            <div
                style={{
                    gridColumn: 'span 1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--size-table-cell-gap)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <span className="body2-txt font-weight-light" style={{ color: 'var(--ds-text)' }}>
                    {studentCount}
                </span>
            </div>

            {/* Actions - spans 1 column */}
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
                    onClick={(e) => {
                        e.stopPropagation();
                        onDetails?.();
                    }}
                />
            </div>
        </div>
    );
};

/**
 * Overview Story
 * Shows all table states for different session statuses
 */
export const Overview = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)'
        }}
    >
        {/* In Progress Status */}
        <section>
            <h5 className="h5" style={{ marginBottom: 'var(--size-section-gap-sm)' }}>In Progress Sessions</h5>
            
            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--space-0625)' }}>Default State</h6>
                <AllSessionsTableHeaderRow />
                <AllSessionsTableRow
                    date="Tue, Sep 9"
                    timeRange="1:00 PM - 1:50 PM"
                    school="Hogwarts"
                    teacher="Mr. Snape"
                    status="in-progress"
                    tutorCount="1/5"
                    studentCount={25}
                    state="default"
                />
            </div>

            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--space-0625)' }}>Hover State</h6>
                <AllSessionsTableRow
                    date="Tue, Sep 9"
                    timeRange="1:00 PM - 1:50 PM"
                    school="Hogwarts"
                    teacher="Mr. Snape"
                    status="in-progress"
                    tutorCount="1/5"
                    studentCount={25}
                    state="hover"
                />
            </div>

            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--space-0625)' }}>Pressed State</h6>
                <AllSessionsTableRow
                    date="Tue, Sep 9"
                    timeRange="1:00 PM - 1:50 PM"
                    school="Hogwarts"
                    teacher="Mr. Snape"
                    status="in-progress"
                    tutorCount="1/5"
                    studentCount={25}
                    state="pressed"
                />
            </div>
        </section>

        {/* With Need Lead Badge */}
        <section>
            <h5 className="h5" style={{ marginBottom: 'var(--size-section-gap-sm)' }}>Sessions Needing Lead</h5>
            
            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--space-0625)' }}>With Need Lead Badge</h6>
                <AllSessionsTableHeaderRow />
                <AllSessionsTableRow
                    date="Tue, Sep 9"
                    timeRange="1:00 PM - 1:50 PM"
                    school="Hogwarts"
                    teacher="Mr. Snape"
                    status="in-progress"
                    tutorCount="1/5"
                    needLead={true}
                    studentCount={25}
                    state="default"
                />
            </div>
        </section>

        {/* Different Statuses */}
        <section>
            <h5 className="h5" style={{ marginBottom: 'var(--size-section-gap-sm)' }}>All Status Types</h5>
            <AllSessionsTableHeaderRow />
            <AllSessionsTableRow
                date="Tue, Sep 9"
                timeRange="1:00 PM - 1:50 PM"
                school="Hogwarts"
                teacher="Mr. Snape"
                status="in-progress"
                tutorCount="1/5"
                studentCount={25}
                interactive={false}
            />
            <AllSessionsTableRow
                date="Wed, Sep 10"
                timeRange="2:00 PM - 2:50 PM"
                school="Xavier School"
                teacher="Prof. Xavier"
                status="upcoming"
                tutorCount="3/5"
                studentCount={18}
                interactive={false}
            />
            <AllSessionsTableRow
                date="Mon, Sep 8"
                timeRange="10:00 AM - 10:50 AM"
                school="Baxter Building"
                teacher="Mr. Richards"
                status="completed"
                tutorCount="5/5"
                studentCount={30}
                interactive={false}
            />
            <AllSessionsTableRow
                date="Fri, Sep 5"
                timeRange="3:00 PM - 3:50 PM"
                school="Daily Bugle"
                teacher="Mr. Jameson"
                status="canceled"
                tutorCount="0/5"
                studentCount={0}
                interactive={false}
            />
        </section>

        {/* Mixed Table Example */}
        <section>
            <h5 className="h5" style={{ marginBottom: 'var(--size-section-gap-sm)' }}>Mixed Sessions Table</h5>
            <AllSessionsTableHeaderRow />
            <AllSessionsTableRow
                date="Tue, Sep 9"
                timeRange="1:00 PM - 1:50 PM"
                school="Hogwarts"
                teacher="Mr. Snape"
                status="in-progress"
                tutorCount="1/5"
                studentCount={25}
                interactive={false}
            />
            <AllSessionsTableRow
                date="Tue, Sep 9"
                timeRange="1:00 PM - 1:50 PM"
                school="Hogwarts"
                teacher="Mr. Snape"
                status="in-progress"
                tutorCount="1/5"
                studentCount={25}
                interactive={false}
            />
            <AllSessionsTableRow
                date="Tue, Sep 9"
                timeRange="1:00 PM - 1:50 PM"
                school="Hogwarts"
                teacher="Mr. Snape"
                status="in-progress"
                tutorCount="1/5"
                needLead={true}
                studentCount={25}
                interactive={false}
            />
        </section>
    </div>
);

/**
 * Interactive Story
 * Demonstrates interactive session functionality
 */
export const Interactive = () => {
    const [sessions, setSessions] = useState([
        { id: 1, date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'in-progress', tutorCount: '1/5', needLead: false, studentCount: 25 },
        { id: 2, date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'in-progress', tutorCount: '1/5', needLead: false, studentCount: 25 },
        { id: 3, date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'in-progress', tutorCount: '1/5', needLead: true, studentCount: 25 },
        { id: 4, date: 'Wed, Sep 10', timeRange: '2:00 PM - 2:50 PM', school: 'Xavier School', teacher: 'Prof. Xavier', status: 'upcoming', tutorCount: '3/5', needLead: false, studentCount: 18 },
        { id: 5, date: 'Mon, Sep 8', timeRange: '10:00 AM - 10:50 AM', school: 'Baxter Building', teacher: 'Mr. Richards', status: 'completed', tutorCount: '5/5', needLead: false, studentCount: 30 },
    ]);

    const [statusFilter, setStatusFilter] = useState('all');

    const handleDetails = (id) => {
        const session = sessions.find(s => s.id === id);
        alert(`Viewing details for ${session.school} - ${session.date} (${session.status})`);
    };

    // Filter sessions based on status
    const filteredSessions = statusFilter === 'all' 
        ? sessions 
        : sessions.filter(s => s.status === statusFilter);

    // Count by status
    const statusCounts = {
        'in-progress': sessions.filter(s => s.status === 'in-progress').length,
        'upcoming': sessions.filter(s => s.status === 'upcoming').length,
        'completed': sessions.filter(s => s.status === 'completed').length,
        'canceled': sessions.filter(s => s.status === 'canceled').length,
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
            {/* Status Summary */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--stack-lg)',
                padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                backgroundColor: 'var(--ds-surface-container)',
                borderRadius: 'var(--size-card-radius-sm)',
                flexWrap: 'wrap'
            }}>
                <span className="body2-txt" style={{ color: 'var(--ds-text-subtle)' }}>
                    Total Sessions: <strong>{sessions.length}</strong>
                </span>
                <span className="body2-txt" style={{ color: 'var(--color-info)' }}>
                    In Progress: <strong>{statusCounts['in-progress']}</strong>
                </span>
                <span className="body2-txt" style={{ color: 'var(--color-secondary)' }}>
                    Upcoming: <strong>{statusCounts['upcoming']}</strong>
                </span>
                <span className="body2-txt" style={{ color: 'var(--color-success)' }}>
                    Completed: <strong>{statusCounts['completed']}</strong>
                </span>
            </div>

            {/* Filter Controls */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-0625)',
                padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                backgroundColor: 'var(--ds-surface-container)',
                borderRadius: 'var(--size-card-radius-sm)',
                flexWrap: 'wrap'
            }}>
                <span className="body2-txt" style={{ color: 'var(--ds-text-subtle)', fontWeight: 600 }}>
                    Filter by Status:
                </span>
                {['all', 'in-progress', 'upcoming', 'completed', 'canceled'].map(status => (
                    <Button
                        key={status}
                        text={status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                        spacing="compact"
                        isSelected={statusFilter === status}
                        onClick={() => setStatusFilter(status)}
                    />
                ))}
            </div>

            {/* Instructions */}
            <div style={{
                padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                backgroundColor: 'var(--ds-surface-container)',
                borderRadius: 'var(--size-card-radius-sm)'
            }}>
                <span className="body2-txt" style={{ color: 'var(--ds-text-subtle)' }}>
                    Click "Details" to view session information. Hover over rows to see interactive states.
                </span>
            </div>

            {/* Table */}
            <div>
                <AllSessionsTableHeaderRow />
                {filteredSessions.map((session) => (
                    <AllSessionsTableRow
                        key={session.id}
                        date={session.date}
                        timeRange={session.timeRange}
                        school={session.school}
                        teacher={session.teacher}
                        status={session.status}
                        tutorCount={session.tutorCount}
                        needLead={session.needLead}
                        studentCount={session.studentCount}
                        onDetails={() => handleDetails(session.id)}
                    />
                ))}
                {filteredSessions.length === 0 && (
                    <div style={{
                        padding: 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)',
                        textAlign: 'center',
                        color: 'var(--ds-text-subtle)'
                    }}>
                        <span className="body2-txt">No sessions found for the selected filter.</span>
                    </div>
                )}
            </div>
        </div>
    );
};
