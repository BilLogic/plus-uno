import React, { useState } from 'react';
import Button from '../../../../../packages/plus-ds/src/components/Button/Button';
import Badge from '../../../../../packages/plus-ds/src/components/Badge/Badge';

export default {
    title: 'Specs/Toolkit/Pre-Session/Tables/Call-Offs',
    parameters: {
        layout: 'padded',
    },
};

/**
 * Call-Offs Table Header Row
 * 13-column grid layout matching Figma:
 * - Session/Tutor: col 1-5 (span 5)
 * - Type: col 6-8 (span 3)
 * - Late/Status: col 9-11 (span 3)
 * - Actions: col 12-13 (span 2)
 */
export const CallOffsTableHeaderRow = ({
    user = 'tutors', // 'tutors' | 'supervisors'
    callOffState = 'pending' // 'pending' | 'past'
}) => {
    const firstColumnLabel = user === 'tutors' ? 'Session' : 'Tutor';
    const thirdColumnLabel = callOffState === 'pending' ? 'Late' : 'Status';

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(13, 1fr)',
                width: '100%',
                borderRadius: 'var(--size-table-radius-md)'
            }}
        >
            {/* Session/Tutor Header - spans 5 columns */}
            <div
                style={{
                    gridColumn: 'span 5',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    {firstColumnLabel}
                </span>
            </div>

            {/* Type Header - spans 3 columns */}
            <div
                style={{
                    gridColumn: 'span 3',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    Type
                </span>
            </div>

            {/* Late/Status Header - spans 3 columns */}
            <div
                style={{
                    gridColumn: 'span 3',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    {thirdColumnLabel}
                </span>
            </div>

            {/* Actions Header - spans 2 columns */}
            <div
                style={{
                    gridColumn: 'span 2',
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
 * Call-Offs Table Row
 * 13-column grid layout matching Figma:
 * - Session/Tutor: col 1-5 (span 5)
 * - Type: col 6-8 (span 3)
 * - Late/Status: col 9-11 (span 3)
 * - Actions: col 12-13 (span 2)
 * 
 * Props:
 * - user: 'tutors' | 'supervisors'
 * - callOffState: 'pending' | 'past'
 * - For tutors: schoolName, date, timeRange
 * - For supervisors: tutorName, schoolName, date, timeRange
 * - type: 'one-time' | 'recurring'
 * - late: boolean (for pending)
 * - status: 'un-excused' | 'approved' (for past)
 */
export const CallOffsTableRow = ({
    user = 'tutors',
    callOffState = 'pending',
    schoolName,
    date,
    timeRange,
    tutorName,
    type = 'one-time',
    late = true,
    status = 'approved',
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

    // Determine action button text based on user type and call-off state
    const getActionButtonText = () => {
        if (callOffState === 'past') return 'Details';
        if (user === 'tutors') return 'Withdraw';
        return 'Review';
    };

    // Determine badge style based on status/late
    const getBadgeStyle = () => {
        if (callOffState === 'pending') {
            return late ? 'danger' : 'success';
        }
        return status === 'approved' ? 'success' : 'danger';
    };

    // Determine badge text
    const getBadgeText = () => {
        if (callOffState === 'pending') {
            return late ? 'Late' : '';
        }
        return status === 'approved' ? 'Approved' : 'Un-excused';
    };

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(13, 1fr)',
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
            {/* Session/Tutor - spans 5 columns */}
            <div
                style={{
                    gridColumn: 'span 5',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 'var(--size-table-cell-gap)',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                    overflow: 'hidden'
                }}
            >
                {user === 'tutors' ? (
                    <>
                        <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                            {schoolName}
                        </span>
                        <span className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface)' }}>
                            {date} · {timeRange}
                        </span>
                    </>
                ) : (
                    <>
                        <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                            {tutorName}
                        </span>
                        <span className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface)' }}>
                            {schoolName} · {date} · {timeRange}
                        </span>
                    </>
                )}
            </div>

            {/* Type - spans 3 columns */}
            <div
                style={{
                    gridColumn: 'span 3',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <span className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface)' }}>
                    {type === 'one-time' ? 'One-time' : 'Recurring'}
                </span>
            </div>

            {/* Late/Status - spans 3 columns */}
            <div
                style={{
                    gridColumn: 'span 3',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                {(callOffState === 'pending' && late) || callOffState === 'past' ? (
                    <Badge
                        text={getBadgeText()}
                        style={getBadgeStyle()}
                        size="b2"
                    />
                ) : null}
            </div>

            {/* Actions - spans 2 columns */}
            <div
                style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <Button
                    text={getActionButtonText()}
                    size="small"
                    style="secondary"
                    fill="outline"
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
 * Shows all table states for different user types and call-off states
 */
export const Overview = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)'
        }}
    >
        {/* Tutor View - Pending */}
        <section>
            <h5 className="h5" style={{ marginBottom: 'var(--size-section-gap-sm)' }}>Tutor View - Pending Call-offs</h5>
            
            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Default State</h6>
                <CallOffsTableHeaderRow user="tutors" callOffState="pending" />
                <CallOffsTableRow
                    user="tutors"
                    callOffState="pending"
                    schoolName="School name"
                    date="Fri, Sep 5"
                    timeRange="1:00 PM - 1:50 PM"
                    type="one-time"
                    late={true}
                    state="default"
                />
            </div>

            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Hover State</h6>
                <CallOffsTableRow
                    user="tutors"
                    callOffState="pending"
                    schoolName="School name"
                    date="Fri, Sep 5"
                    timeRange="1:00 PM - 1:50 PM"
                    type="one-time"
                    late={true}
                    state="hover"
                />
            </div>
        </section>

        {/* Tutor View - Past */}
        <section>
            <h5 className="h5" style={{ marginBottom: 'var(--size-section-gap-sm)' }}>Tutor View - Past Call-offs</h5>
            
            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Un-excused Status</h6>
                <CallOffsTableHeaderRow user="tutors" callOffState="past" />
                <CallOffsTableRow
                    user="tutors"
                    callOffState="past"
                    schoolName="School name"
                    date="Fri, Sep 5"
                    timeRange="1:00 PM - 1:50 PM"
                    type="one-time"
                    status="un-excused"
                    state="default"
                />
            </div>

            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Approved Status</h6>
                <CallOffsTableRow
                    user="tutors"
                    callOffState="past"
                    schoolName="School name"
                    date="Fri, Sep 5"
                    timeRange="1:00 PM - 1:50 PM"
                    type="recurring"
                    status="approved"
                    state="default"
                />
            </div>

            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Hover State</h6>
                <CallOffsTableRow
                    user="tutors"
                    callOffState="past"
                    schoolName="School name"
                    date="Fri, Sep 5"
                    timeRange="1:00 PM - 1:50 PM"
                    type="recurring"
                    status="approved"
                    state="hover"
                />
            </div>
        </section>

        {/* Supervisor View - Pending */}
        <section>
            <h5 className="h5" style={{ marginBottom: 'var(--size-section-gap-sm)' }}>Supervisor View - Pending Call-offs</h5>
            
            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Default State</h6>
                <CallOffsTableHeaderRow user="supervisors" callOffState="pending" />
                <CallOffsTableRow
                    user="supervisors"
                    callOffState="pending"
                    tutorName="Tutor name"
                    schoolName="School name"
                    date="Fridays"
                    timeRange="1:00 P..."
                    type="one-time"
                    late={true}
                    state="default"
                />
            </div>

            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Hover State</h6>
                <CallOffsTableRow
                    user="supervisors"
                    callOffState="pending"
                    tutorName="Tutor name"
                    schoolName="School name"
                    date="Fridays"
                    timeRange="1:00 P..."
                    type="one-time"
                    late={true}
                    state="hover"
                />
            </div>
        </section>

        {/* Supervisor View - Past */}
        <section>
            <h5 className="h5" style={{ marginBottom: 'var(--size-section-gap-sm)' }}>Supervisor View - Past Call-offs</h5>
            
            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Approved Status</h6>
                <CallOffsTableHeaderRow user="supervisors" callOffState="past" />
                <CallOffsTableRow
                    user="supervisors"
                    callOffState="past"
                    tutorName="Tutor name"
                    schoolName="School name"
                    date="Fridays"
                    timeRange="1:00 P..."
                    type="recurring"
                    status="approved"
                    state="default"
                />
            </div>

            <div>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Hover State</h6>
                <CallOffsTableRow
                    user="supervisors"
                    callOffState="past"
                    tutorName="Tutor name"
                    schoolName="School name"
                    date="Fridays"
                    timeRange="1:00 P..."
                    type="recurring"
                    status="approved"
                    state="hover"
                />
            </div>
        </section>
    </div>
);

/**
 * Interactive Story
 * Demonstrates interactive call-off functionality
 */
export const Interactive = () => {
    const [userType, setUserType] = useState('tutors');
    const [callOffState, setCallOffState] = useState('pending');

    const tutorPendingData = [
        { schoolName: 'Central High School', date: 'Fri, Sep 5', timeRange: '1:00 PM - 1:50 PM', type: 'one-time', late: true },
        { schoolName: 'Lincoln Middle School', date: 'Mon, Sep 8', timeRange: '2:00 PM - 2:50 PM', type: 'one-time', late: true },
        { schoolName: 'Washington Elementary', date: 'Wed, Sep 10', timeRange: '3:00 PM - 3:50 PM', type: 'recurring', late: false },
    ];

    const tutorPastData = [
        { schoolName: 'Central High School', date: 'Fri, Aug 29', timeRange: '1:00 PM - 1:50 PM', type: 'one-time', status: 'un-excused' },
        { schoolName: 'Lincoln Middle School', date: 'Mon, Aug 25', timeRange: '2:00 PM - 2:50 PM', type: 'recurring', status: 'approved' },
        { schoolName: 'Washington Elementary', date: 'Wed, Aug 20', timeRange: '3:00 PM - 3:50 PM', type: 'one-time', status: 'approved' },
    ];

    const supervisorPendingData = [
        { tutorName: 'John Smith', schoolName: 'Central High', date: 'Fridays', timeRange: '1:00 P...', type: 'one-time', late: true },
        { tutorName: 'Jane Doe', schoolName: 'Lincoln Middle', date: 'Mondays', timeRange: '2:00 P...', type: 'one-time', late: true },
        { tutorName: 'Bob Johnson', schoolName: 'Washington Elem', date: 'Wednesdays', timeRange: '3:00 P...', type: 'recurring', late: false },
    ];

    const supervisorPastData = [
        { tutorName: 'John Smith', schoolName: 'Central High', date: 'Fridays', timeRange: '1:00 P...', type: 'one-time', status: 'un-excused' },
        { tutorName: 'Jane Doe', schoolName: 'Lincoln Middle', date: 'Mondays', timeRange: '2:00 P...', type: 'recurring', status: 'approved' },
        { tutorName: 'Bob Johnson', schoolName: 'Washington Elem', date: 'Wednesdays', timeRange: '3:00 P...', type: 'one-time', status: 'approved' },
    ];

    const getData = () => {
        if (userType === 'tutors') {
            return callOffState === 'pending' ? tutorPendingData : tutorPastData;
        }
        return callOffState === 'pending' ? supervisorPendingData : supervisorPastData;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
            {/* Controls */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--size-element-gap-md)',
                padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                backgroundColor: 'var(--color-surface-container-low)',
                borderRadius: 'var(--size-card-radius-sm)',
                flexWrap: 'wrap'
            }}>
                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
                    User Type:
                </span>
                <Button
                    text="Tutors"
                    size="small"
                    style="primary"
                    fill={userType === 'tutors' ? 'filled' : 'outline'}
                    onClick={() => setUserType('tutors')}
                />
                <Button
                    text="Supervisors"
                    size="small"
                    style="primary"
                    fill={userType === 'supervisors' ? 'filled' : 'outline'}
                    onClick={() => setUserType('supervisors')}
                />

                <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-outline-variant)', margin: '0 var(--size-element-gap-sm)' }} />

                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
                    Call-off State:
                </span>
                <Button
                    text="Pending"
                    size="small"
                    style="primary"
                    fill={callOffState === 'pending' ? 'filled' : 'outline'}
                    onClick={() => setCallOffState('pending')}
                />
                <Button
                    text="Past"
                    size="small"
                    style="primary"
                    fill={callOffState === 'past' ? 'filled' : 'outline'}
                    onClick={() => setCallOffState('past')}
                />
            </div>

            {/* Table */}
            <div>
                <CallOffsTableHeaderRow user={userType} callOffState={callOffState} />
                {getData().map((item, index) => (
                    <CallOffsTableRow
                        key={index}
                        user={userType}
                        callOffState={callOffState}
                        schoolName={item.schoolName}
                        date={item.date}
                        timeRange={item.timeRange}
                        tutorName={item.tutorName}
                        type={item.type}
                        late={item.late}
                        status={item.status}
                        onAction={() => alert(`Action clicked for row ${index + 1}`)}
                    />
                ))}
            </div>
        </div>
    );
};
