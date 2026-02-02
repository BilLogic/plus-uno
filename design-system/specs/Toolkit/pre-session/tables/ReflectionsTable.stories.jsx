import React, { useState } from 'react';
import Button from '../../../../../packages/plus-ds/src/components/Button/Button';
import Badge from '../../../../../packages/plus-ds/src/components/Badge/Badge';

export default {
    title: 'Specs/Toolkit/Pre-Session/Tables/Reflections',
    parameters: {
        layout: 'padded',
    },
};

/**
 * Reflections Table Header Row
 * 7-column grid layout matching Figma:
 * - Date & time: col 1-2 (span 2)
 * - School & teacher: col 3-4 (span 2)
 * - Status: col 5-6 (span 2)
 * - Actions: col 7 (span 1)
 */
export const ReflectionsTableHeaderRow = () => {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                width: '100%',
                borderRadius: 'var(--size-table-radius-md)'
            }}
        >
            {/* Date & time Header - spans 2 columns */}
            <div
                style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    Date & time
                </span>
            </div>

            {/* School & teacher Header - spans 2 columns */}
            <div
                style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    School & teacher
                </span>
            </div>

            {/* Status Header - spans 2 columns */}
            <div
                style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    Status
                </span>
            </div>

            {/* Actions Header - spans 1 column */}
            <div
                style={{
                    gridColumn: 'span 1',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    Actions
                </span>
            </div>
        </div>
    );
};

/**
 * Reflections Table Row
 * 7-column grid layout matching Figma:
 * - Date & time: col 1-2 (span 2)
 * - School & teacher: col 3-4 (span 2)
 * - Status: col 5-6 (span 2)
 * - Actions: col 7 (span 1)
 * 
 * Props:
 * - date: string (e.g., "Tue, Sep 9")
 * - timeRange: string (e.g., "12:30 PM - 1:30 PM")
 * - school: string (e.g., "Hogwarts")
 * - teacher: string (e.g., "Mr. Snape")
 * - status: 'completed' | 'incomplete'
 */
export const ReflectionsTableRow = ({
    date,
    timeRange,
    school,
    teacher,
    status = 'completed',
    state: forcedState,
    interactive = true,
    onAction
}) => {
    const [currentState, setCurrentState] = useState('default');
    const effectiveState = forcedState || currentState;

    const stateStyles = {
        default: {},
        hover: { backgroundColor: 'var(--color-on-surface-state-08)' },
        pressed: { backgroundColor: 'var(--color-on-surface-state-12)' }
    };

    const handleMouseEnter = interactive && !forcedState ? () => setCurrentState('hover') : undefined;
    const handleMouseLeave = interactive && !forcedState ? () => setCurrentState('default') : undefined;
    const handleMouseDown = interactive && !forcedState ? () => setCurrentState('pressed') : undefined;
    const handleMouseUp = interactive && !forcedState ? () => setCurrentState('hover') : undefined;

    // Determine badge style and text based on status
    const getBadgeStyle = () => status === 'completed' ? 'success' : 'danger';
    const getBadgeText = () => status === 'completed' ? 'Completed' : 'Incomplete';

    // Determine action button based on status
    const getActionButtonText = () => status === 'completed' ? 'Details' : 'Start';
    const getActionButtonFill = () => status === 'completed' ? 'outline' : 'outline';
    const getActionButtonStyle = () => status === 'completed' ? 'secondary' : 'primary';

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
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    {date}
                </span>
                <span className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface)' }}>
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
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    {school}
                </span>
                <span className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface)' }}>
                    {teacher}
                </span>
            </div>

            {/* Status - spans 2 columns */}
            <div
                style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <Badge
                    text={getBadgeText()}
                    style={getBadgeStyle()}
                    size="b2"
                />
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
                    text={getActionButtonText()}
                    size="small"
                    style={getActionButtonStyle()}
                    fill={getActionButtonFill()}
                    onClick={(e) => {
                        e.stopPropagation();
                        onAction?.();
                    }}
                />
            </div>
        </div>
    );
};

/**
 * Overview Story
 * Shows all table states for different reflection statuses
 */
export const Overview = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)'
        }}
    >
        {/* Completed Status */}
        <section>
            <h5 className="h5" style={{ marginBottom: 'var(--size-section-gap-sm)' }}>Completed Reflections</h5>
            
            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Default State</h6>
                <ReflectionsTableHeaderRow />
                <ReflectionsTableRow
                    date="Tue, Sep 9"
                    timeRange="12:30 PM - 1:30 PM"
                    school="Hogwarts"
                    teacher="Mr. Snape"
                    status="completed"
                    state="default"
                />
            </div>

            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Hover State</h6>
                <ReflectionsTableRow
                    date="Tue, Sep 9"
                    timeRange="12:30 PM - 1:30 PM"
                    school="Hogwarts"
                    teacher="Mr. Snape"
                    status="completed"
                    state="hover"
                />
            </div>
        </section>

        {/* Incomplete Status */}
        <section>
            <h5 className="h5" style={{ marginBottom: 'var(--size-section-gap-sm)' }}>Incomplete Reflections</h5>
            
            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Default State</h6>
                <ReflectionsTableHeaderRow />
                <ReflectionsTableRow
                    date="Tue, Sep 9"
                    timeRange="12:30 PM - 1:30 PM"
                    school="Hogwarts"
                    teacher="Mr. Snape"
                    status="incomplete"
                    state="default"
                />
            </div>

            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Hover State</h6>
                <ReflectionsTableRow
                    date="Tue, Sep 9"
                    timeRange="12:30 PM - 1:30 PM"
                    school="Hogwarts"
                    teacher="Mr. Snape"
                    status="incomplete"
                    state="hover"
                />
            </div>
        </section>

        {/* Mixed Table Example */}
        <section>
            <h5 className="h5" style={{ marginBottom: 'var(--size-section-gap-sm)' }}>Mixed Reflections Table</h5>
            <ReflectionsTableHeaderRow />
            <ReflectionsTableRow
                date="Tue, Sep 9"
                timeRange="12:30 PM - 1:30 PM"
                school="Hogwarts"
                teacher="Mr. Snape"
                status="completed"
                interactive={false}
            />
            <ReflectionsTableRow
                date="Tue, Sep 9"
                timeRange="12:30 PM - 1:30 PM"
                school="Hogwarts"
                teacher="Mr. Snape"
                status="completed"
                interactive={false}
            />
            <ReflectionsTableRow
                date="Tue, Sep 9"
                timeRange="12:30 PM - 1:30 PM"
                school="Hogwarts"
                teacher="Mr. Snape"
                status="incomplete"
                interactive={false}
            />
            <ReflectionsTableRow
                date="Tue, Sep 9"
                timeRange="12:30 PM - 1:30 PM"
                school="Hogwarts"
                teacher="Mr. Snape"
                status="incomplete"
                interactive={false}
            />
        </section>
    </div>
);

/**
 * Interactive Story
 * Demonstrates interactive reflection functionality
 */
export const Interactive = () => {
    const [reflections, setReflections] = useState([
        { id: 1, date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'completed' },
        { id: 2, date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'completed' },
        { id: 3, date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'incomplete' },
        { id: 4, date: 'Wed, Sep 10', timeRange: '1:00 PM - 2:00 PM', school: 'Xavier School', teacher: 'Prof. Xavier', status: 'incomplete' },
        { id: 5, date: 'Thu, Sep 11', timeRange: '2:00 PM - 3:00 PM', school: 'Baxter Building', teacher: 'Mr. Richards', status: 'incomplete' },
    ]);

    const handleAction = (id) => {
        const reflection = reflections.find(r => r.id === id);
        if (reflection.status === 'incomplete') {
            // Mark as completed when "Start" is clicked
            setReflections(prev => prev.map(r => 
                r.id === id ? { ...r, status: 'completed' } : r
            ));
            alert(`Starting reflection for ${reflection.school} - ${reflection.date}`);
        } else {
            alert(`Viewing details for ${reflection.school} - ${reflection.date}`);
        }
    };

    const completedCount = reflections.filter(r => r.status === 'completed').length;
    const incompleteCount = reflections.filter(r => r.status === 'incomplete').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
            {/* Status Summary */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--size-element-gap-lg)',
                padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                backgroundColor: 'var(--color-surface-container-low)',
                borderRadius: 'var(--size-card-radius-sm)'
            }}>
                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Total Reflections: <strong>{reflections.length}</strong>
                </span>
                <span className="body2-txt" style={{ color: 'var(--color-success)' }}>
                    Completed: <strong>{completedCount}</strong>
                </span>
                <span className="body2-txt" style={{ color: 'var(--color-error)' }}>
                    Incomplete: <strong>{incompleteCount}</strong>
                </span>
            </div>

            {/* Instructions */}
            <div style={{
                padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                backgroundColor: 'var(--color-surface-container-low)',
                borderRadius: 'var(--size-card-radius-sm)'
            }}>
                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Click "Start" on incomplete reflections to mark them as completed. Click "Details" to view completed reflections.
                </span>
            </div>

            {/* Table */}
            <div>
                <ReflectionsTableHeaderRow />
                {reflections.map((reflection) => (
                    <ReflectionsTableRow
                        key={reflection.id}
                        date={reflection.date}
                        timeRange={reflection.timeRange}
                        school={reflection.school}
                        teacher={reflection.teacher}
                        status={reflection.status}
                        onAction={() => handleAction(reflection.id)}
                    />
                ))}
            </div>
        </div>
    );
};
