import React, { useState } from 'react';
import Button from '../../../../components/Button/Button';

export default {
    title: 'Specs/Toolkit/Pre-Session/Tables/Sign-In Table',
    parameters: {
        layout: 'padded',
    },
};

/**
 * Regular Tutors Table Row
 * 11-column grid layout matching Figma:
 * - Day & time: col 1-3 (span 3)
 * - School: col 4-6 (span 3)
 * - Tutor count: col 7-9 (span 3)
 * - Actions: col 10-11 (span 2)
 */
export const SignInTableRow = ({
    day,
    timeRange,
    school,
    tutorCount,
    state: forcedState,
    interactive = true,
    onSignUp
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

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(11, 1fr)',
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
            {/* Day & Time - spans 3 columns */}
            <div
                style={{
                    gridColumn: 'span 3',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                    overflow: 'hidden'
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    {day}
                </span>
                <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                    {timeRange}
                </span>
            </div>
            {/* School - spans 3 columns */}
            <div
                style={{
                    gridColumn: 'span 3',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                    overflow: 'hidden'
                }}
            >
                <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                    {school}
                </span>
            </div>
            {/* Tutor count - spans 3 columns */}
            <div
                style={{
                    gridColumn: 'span 3',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                    {tutorCount}
                </span>
            </div>
            {/* Actions - spans 2 columns */}
            <div
                style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <Button
                    text="Sign Up"
                    style="primary"
                    fill="outline"
                    size="small"
                    onClick={onSignUp}
                />
            </div>
        </div>
    );
};

/**
 * Supervisors/Lead Tutors Table Row
 * 14-column grid layout matching Figma:
 * - Day & time: col 1-3 (span 3)
 * - School & teacher: col 4-6 (span 3)
 * - Tutor count: col 7-9 (span 3)
 * - Student count: col 10-12 (span 3)
 * - Actions: col 13-14 (span 2)
 */
const SignInTableRowSupervisor = ({
    day,
    timeRange,
    school,
    teacher,
    tutorCount,
    studentCount,
    state: forcedState,
    interactive = true,
    onSignUp
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

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(14, 1fr)',
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
            {/* Day & Time - spans 3 columns */}
            <div
                style={{
                    gridColumn: 'span 3',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                    overflow: 'hidden'
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    {day}
                </span>
                <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                    {timeRange}
                </span>
            </div>
            {/* School & Teacher - spans 3 columns */}
            <div
                style={{
                    gridColumn: 'span 3',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                    overflow: 'hidden'
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    {school}
                </span>
                <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                    {teacher}
                </span>
            </div>
            {/* Tutor count - spans 3 columns */}
            <div
                style={{
                    gridColumn: 'span 3',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                    {tutorCount}
                </span>
            </div>
            {/* Student count - spans 3 columns */}
            <div
                style={{
                    gridColumn: 'span 3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                    {studentCount}
                </span>
            </div>
            {/* Actions - spans 2 columns */}
            <div
                style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <Button
                    text="Sign Up"
                    style="primary"
                    fill="outline"
                    size="small"
                    onClick={onSignUp}
                />
            </div>
        </div>
    );
};

/** Regular Tutors Header - 11-column grid */
export const SignInTableHeaderRow = () => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(11, 1fr)',
            width: '100%',
            borderRadius: 'var(--size-table-radius-md)'
        }}
    >
        <div style={{ gridColumn: 'span 3', display: 'flex', alignItems: 'center', padding: 'var(--size-table-cell-y) var(--size-table-cell-x)' }}>
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>Day & time</span>
        </div>
        <div style={{ gridColumn: 'span 3', display: 'flex', alignItems: 'center', padding: 'var(--size-table-cell-y) var(--size-table-cell-x)' }}>
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>School</span>
        </div>
        <div style={{ gridColumn: 'span 3', display: 'flex', alignItems: 'center', padding: 'var(--size-table-cell-y) var(--size-table-cell-x)' }}>
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>Tutor count</span>
        </div>
        <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: 'var(--size-table-cell-y) var(--size-table-cell-x)' }}>
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>Actions</span>
        </div>
    </div>
);

/** Supervisors Header - 14-column grid */
const TableHeaderRowSupervisor = () => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(14, 1fr)',
            width: '100%',
            borderRadius: 'var(--size-table-radius-md)'
        }}
    >
        <div style={{ gridColumn: 'span 3', display: 'flex', alignItems: 'center', padding: 'var(--size-table-cell-y) var(--size-table-cell-x)' }}>
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>Day & time</span>
        </div>
        <div style={{ gridColumn: 'span 3', display: 'flex', alignItems: 'center', padding: 'var(--size-table-cell-y) var(--size-table-cell-x)' }}>
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>School & teacher</span>
        </div>
        <div style={{ gridColumn: 'span 3', display: 'flex', alignItems: 'center', padding: 'var(--size-table-cell-y) var(--size-table-cell-x)' }}>
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>Tutor count</span>
        </div>
        <div style={{ gridColumn: 'span 3', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--size-table-cell-y) var(--size-table-cell-x)' }}>
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>Student count</span>
        </div>
        <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: 'var(--size-table-cell-y) var(--size-table-cell-x)' }}>
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>Actions</span>
        </div>
    </div>
);

/**
 * Modal Version - Regular Tutors Table Row
 * 10-column grid layout for modal (no action column):
 * - Day & time: col 1-3 (span 3)
 * - School & teacher: col 4-6 (span 3)
 * - Tutor count: col 7-8 (span 2)
 * - Student count: col 9-10 (span 2)
 */
export const SignInTableRowModal = ({
    day,
    timeRange,
    school,
    teacher,
    tutorCount,
    studentCount,
    state: forcedState,
    interactive = true
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

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(10, 1fr)',
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
            {/* Day & Time - spans 3 columns */}
            <div
                style={{
                    gridColumn: 'span 3',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                    overflow: 'hidden'
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    {day}
                </span>
                <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                    {timeRange}
                </span>
            </div>

            {/* School & Teacher - spans 3 columns */}
            <div
                style={{
                    gridColumn: 'span 3',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)',
                    overflow: 'hidden'
                }}
            >
                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    {school}
                </span>
                {teacher && (
                    <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                        {teacher}
                    </span>
                )}
            </div>

            {/* Tutor Count - spans 2 columns */}
            <div
                style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                    {tutorCount}
                </span>
            </div>

            {/* Student Count - spans 2 columns */}
            <div
                style={{
                    gridColumn: 'span 2',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
                }}
            >
                <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                    {studentCount}
                </span>
            </div>
        </div>
    );
};

/**
 * Modal Version - Table Header Row
 * 10-column grid layout for modal (no action column)
 * Supports both "School" only and "School & teacher" variants
 */
export const SignInTableHeaderRowModal = ({ showTeacher = false }) => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            width: '100%',
            borderRadius: 'var(--size-table-radius-md)'
        }}
    >
        {/* Day & Time Header - spans 3 columns */}
        <div
            style={{
                gridColumn: 'span 3',
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                Day & time
            </span>
        </div>

        {/* School Header - spans 3 columns */}
        <div
            style={{
                gridColumn: 'span 3',
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                {showTeacher ? 'School & teacher' : 'School'}
            </span>
        </div>

        {/* Tutor Count Header - spans 2 columns */}
        <div
            style={{
                gridColumn: 'span 2',
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                Tutor count
            </span>
        </div>

        {/* Student Count Header - spans 2 columns */}
        <div
            style={{
                gridColumn: 'span 2',
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--size-table-cell-y) var(--size-table-cell-x)'
            }}
        >
            <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                Student count
            </span>
        </div>
    </div>
);

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-xl)', padding: 'var(--size-spacing-space-400)' }}>
        <section>
            <h5 className="h5 mb-4">Regular Tutors Table</h5>
            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Default State</h6>
                <SignInTableHeaderRow />
                <SignInTableRow day="Mondays" timeRange="1:00 PM - 1:50 PM" school="Central High School" tutorCount="1/5" state="default" />
            </div>
            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Hover State</h6>
                <SignInTableRow day="Mondays" timeRange="1:00 PM - 1:50 PM" school="Central High School" tutorCount="1/5" state="hover" />
            </div>
            <div>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Pressed State</h6>
                <SignInTableRow day="Mondays" timeRange="1:00 PM - 1:50 PM" school="Central High School" tutorCount="1/5" state="pressed" />
            </div>
        </section>
        <section>
            <h5 className="h5 mb-4">Supervisors / Lead Tutors Table</h5>
            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Default State</h6>
                <TableHeaderRowSupervisor />
                <SignInTableRowSupervisor day="Mondays" timeRange="1:00 PM - 1:50 PM" school="Hogwarts" teacher="Mr. Snape" tutorCount="1/5" studentCount="25" state="default" />
            </div>
            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Hover State</h6>
                <SignInTableRowSupervisor day="Mondays" timeRange="1:00 PM - 1:50 PM" school="Hogwarts" teacher="Mr. Snape" tutorCount="1/5" studentCount="25" state="hover" />
            </div>
            <div>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Pressed State</h6>
                <SignInTableRowSupervisor day="Mondays" timeRange="1:00 PM - 1:50 PM" school="Hogwarts" teacher="Mr. Snape" tutorCount="1/5" studentCount="25" state="pressed" />
            </div>
        </section>
        <section>
            <h5 className="h5 mb-4">Modal Version - Regular Tutors</h5>
            <p className="body2-txt mb-4" style={{ color: 'var(--color-on-surface-variant)' }}>
                10-column layout for modal display (no action column, includes student count)
            </p>
            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Default State</h6>
                <SignInTableHeaderRowModal />
                <SignInTableRowModal day="Mondays" timeRange="1:00 PM - 1:50 PM" school="Central High School" tutorCount="1/5" studentCount="25" state="default" />
            </div>
            <div style={{ marginBottom: 'var(--size-section-gap-lg)' }}>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Hover State</h6>
                <SignInTableRowModal day="Mondays" timeRange="1:00 PM - 1:50 PM" school="Central High School" tutorCount="1/5" studentCount="25" state="hover" />
            </div>
            <div>
                <h6 className="h6" style={{ marginBottom: 'var(--size-element-gap-md)' }}>Pressed State</h6>
                <SignInTableRowModal day="Mondays" timeRange="1:00 PM - 1:50 PM" school="Central High School" tutorCount="1/5" studentCount="25" state="pressed" />
            </div>
        </section>
    </div>
);

export const InteractiveRegularTutors = () => {
    const [signedUpSessions, setSignedUpSessions] = useState([]);
    const sampleSessions = [
        { day: 'Mondays', timeRange: '1:00 PM - 1:50 PM', school: 'Central High School', tutorCount: '1/5' },
        { day: 'Mondays', timeRange: '1:00 PM - 1:50 PM', school: 'Central High School', tutorCount: '1/5' },
        { day: 'Mondays', timeRange: '1:00 PM - 1:50 PM', school: 'Central High School', tutorCount: '1/5' },
    ];
    const handleSignUp = (index) => {
        if (!signedUpSessions.includes(index)) {
            setSignedUpSessions([...signedUpSessions, index]);
        }
    };
    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <h6 className="h6 mb-3">Regular Tutors - Interactive</h6>
            <p className="body2-txt mb-4" style={{ color: 'var(--color-on-surface-variant)' }}>Click Sign Up to register for a session.</p>
            <SignInTableHeaderRow />
            {sampleSessions.map((session, index) => (
                <SignInTableRow key={index} day={session.day} timeRange={session.timeRange} school={session.school} tutorCount={session.tutorCount} onSignUp={() => handleSignUp(index)} />
            ))}
            <div style={{ marginTop: 'var(--size-spacing-space-400)', padding: 'var(--size-spacing-space-200)' }}>
                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>Signed up for: {signedUpSessions.length} session(s)</span>
            </div>
        </div>
    );
};

export const InteractiveSupervisors = () => {
    const [signedUpSessions, setSignedUpSessions] = useState([]);
    const sampleSessions = [
        { day: 'Mondays', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', studentCount: '25' },
        { day: 'Mondays', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', studentCount: '25' },
        { day: 'Mondays', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', studentCount: '25' },
    ];
    const handleSignUp = (index) => {
        if (!signedUpSessions.includes(index)) {
            setSignedUpSessions([...signedUpSessions, index]);
        }
    };
    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <h6 className="h6 mb-3">Supervisors / Lead Tutors - Interactive</h6>
            <p className="body2-txt mb-4" style={{ color: 'var(--color-on-surface-variant)' }}>Click Sign Up to register for a session.</p>
            <TableHeaderRowSupervisor />
            {sampleSessions.map((session, index) => (
                <SignInTableRowSupervisor key={index} day={session.day} timeRange={session.timeRange} school={session.school} teacher={session.teacher} tutorCount={session.tutorCount} studentCount={session.studentCount} onSignUp={() => handleSignUp(index)} />
            ))}
            <div style={{ marginTop: 'var(--size-spacing-space-400)', padding: 'var(--size-spacing-space-200)' }}>
                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>Signed up for: {signedUpSessions.length} session(s)</span>
            </div>
        </div>
    );
};
