import React from 'react';
import Badge from '../../../../../components/Badge/Badge';
import { AttendanceDropdown } from '../AttendanceDropdown.jsx';
import { AttendanceBadge } from '../badges/AttendanceBadge.jsx';
import { LeadBadge, CountBadge } from '../badges/TutorBadges.jsx';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Session Attendee List Items',
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

/**
 * Session Attendee List Item Component
 * Displays an attendee with name, optional badges, and attendance status
 * Refactored to reuse Toolkit components
 */
const SessionAttendeeListItem = ({
    name = 'Savannah Nguyen',
    userType = 'tutor', // 'tutor' | 'student'
    tab = 'attendance', // 'attendance' | 'assignment'
    mode = 'default', // 'default' | 'edit'
    leadTutor = false,
    calledOff = false,
    newStudent = false,
    showAttendanceControl = true,
    attendanceStatus = 'present', // 'present' | 'unknown' | 'absent'
    assignmentCount = null, // number for assignment tab
}) => {
    const isEditMode = mode === 'edit';

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--size-element-gap-sm)',
                padding: isEditMode
                    ? 'var(--size-element-pad-y-lg) var(--size-element-pad-x-sm)'
                    : 'var(--size-element-pad-y-lg) 0',
                borderRadius: 'var(--size-element-radius-md)',
                backgroundColor: isEditMode ? 'var(--color-surface-container-highest)' : 'transparent',
                width: '100%'
            }}
        >
            {/* Drag Handle (Edit Mode Only) */}
            {isEditMode && (
                <i
                    className="fa-solid fa-grip-vertical"
                    style={{
                        fontSize: 'var(--font-size-fa-body2-solid)',
                        color: 'var(--color-on-surface-variant)',
                        cursor: 'grab'
                    }}
                />
            )}

            {/* Name */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--size-element-gap-sm)',
                    minWidth: 0
                }}
            >
                <span
                    className={tab === 'assignment' && userType === 'tutor' ? 'body2-txt' : 'body2-txt font-weight-light'}
                    style={{
                        color: 'var(--color-on-surface)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {name}
                </span>
            </div>

            {/* Lead Tutor Badge (Tutor only) */}
            {userType === 'tutor' && leadTutor && (
                <LeadBadge />
            )}

            {/* New Student Badge (Student only) */}
            {userType === 'student' && newStudent && (
                <Badge text="New" style="info" size="b3" />
            )}

            {/* Assignment Count (Assignment tab, Tutor) */}
            {tab === 'assignment' && userType === 'tutor' && assignmentCount !== null && (
                <CountBadge count={assignmentCount} />
            )}

            {/* Attendance Control */}
            {showAttendanceControl && tab === 'attendance' && (
                !calledOff && mode !== 'static' ? ( // 'static' mode forces Badge only
                    // Tutors (active) and Students use interactive dropdown
                    <AttendanceDropdown
                        initialStatus={attendanceStatus}
                        className="pdropdown"
                    />
                ) : (
                    // Called-off tutors OR static mode uses static badge
                    <AttendanceBadge
                        status={attendanceStatus}
                        showDropdown={false} // Static
                    />
                )
            )}
        </div>
    );
};

export { SessionAttendeeListItem }; // Export for re-use if needed

/**
 * Overview
 * Shows all states of the Session Attendee List Items component
 */
export const Overview = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)',
            maxWidth: '400px'
        }}
    >
        {/* Tutor - Attendance Tab States */}
        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Tutor - Attendance Tab</h6>
            <p className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--size-card-gap-md)' }}>
                Tutor list items with attendance dropdown and status badges.
            </p>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-element-gap-sm)',
                padding: 'var(--size-card-pad-y-lg) var(--size-card-pad-x-lg)',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: 'var(--size-card-radius-md)'
            }}>
                {/* Default Tutor with Select dropdown */}
                <SessionAttendeeListItem
                    name="Savannah Nguyen"
                    userType="tutor"
                    tab="attendance"
                    attendanceStatus="unknown"
                />

                {/* Lead Tutor */}
                <SessionAttendeeListItem
                    name="Savannah Nguyen"
                    userType="tutor"
                    tab="attendance"
                    leadTutor={true}
                    attendanceStatus="present"
                />

                {/* Called Off Tutor */}
                <SessionAttendeeListItem
                    name="Savannah Nguyen"
                    userType="tutor"
                    tab="attendance"
                    calledOff={true}
                    attendanceStatus="na"
                />
            </div>
        </section>

        {/* Tutor - Assignment Tab States */}
        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Tutor - Assignment Tab</h6>
            <p className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--size-card-gap-md)' }}>
                Tutor list items showing assignment count.
            </p>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-element-gap-sm)',
                padding: 'var(--size-card-pad-y-lg) var(--size-card-pad-x-lg)',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: 'var(--size-card-radius-md)'
            }}>
                {/* Tutor with assignment count */}
                <SessionAttendeeListItem
                    name="Savannah Nguyen"
                    userType="tutor"
                    tab="assignment"
                    assignmentCount={4}
                    showAttendanceControl={false}
                />

                {/* Lead Tutor with assignment count */}
                <SessionAttendeeListItem
                    name="Savannah Nguyen"
                    userType="tutor"
                    tab="assignment"
                    leadTutor={true}
                    assignmentCount={4}
                    showAttendanceControl={false}
                />
            </div>
        </section>

        {/* Student - Attendance Tab States */}
        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Student - Attendance Tab</h6>
            <p className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--size-card-gap-md)' }}>
                Student list items with attendance status badges.
            </p>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-element-gap-sm)',
                padding: 'var(--size-card-pad-y-lg) var(--size-card-pad-x-lg)',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: 'var(--size-card-radius-md)'
            }}>
                {/* Student - Unknown status */}
                <SessionAttendeeListItem
                    name="Savannah Nguyen"
                    userType="student"
                    tab="attendance"
                    attendanceStatus="unknown"
                />

                {/* Student - Present status */}
                <SessionAttendeeListItem
                    name="Savannah Nguyen"
                    userType="student"
                    tab="attendance"
                    attendanceStatus="present"
                />

                {/* New Student - Present status */}
                <SessionAttendeeListItem
                    name="Savannah Nguyen"
                    userType="student"
                    tab="attendance"
                    newStudent={true}
                    attendanceStatus="present"
                />

                {/* Student - N/A status */}
                <SessionAttendeeListItem
                    name="Savannah Nguyen"
                    userType="student"
                    tab="attendance"
                    attendanceStatus="na"
                />

                {/* Student - Static Present (No Dropdown) */}
                <SessionAttendeeListItem
                    name="Savannah Nguyen"
                    userType="student"
                    tab="attendance"
                    mode="static"
                    attendanceStatus="present"
                />

                {/* Student - Static Absent (No Dropdown) */}
                <SessionAttendeeListItem
                    name="Savannah Nguyen"
                    userType="student"
                    tab="attendance"
                    mode="static"
                    attendanceStatus="absent"
                />
            </div>
        </section>

        {/* Student - Assignment Tab States */}
        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Student - Assignment Tab</h6>
            <p className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--size-card-gap-md)' }}>
                Student list items in assignment view with edit mode.
            </p>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-element-gap-sm)',
                padding: 'var(--size-card-pad-y-lg) var(--size-card-pad-x-lg)',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: 'var(--size-card-radius-md)'
            }}>
                {/* Student - Default mode */}
                <SessionAttendeeListItem
                    name="Savannah Nguyen"
                    userType="student"
                    tab="assignment"
                    attendanceStatus="present"
                />

                {/* Student - Edit mode (draggable) */}
                <SessionAttendeeListItem
                    name="Savannah Nguyen"
                    userType="student"
                    tab="assignment"
                    mode="edit"
                    attendanceStatus="present"
                />

                {/* New Student - Edit mode */}
                <SessionAttendeeListItem
                    name="Savannah Nguyen"
                    userType="student"
                    tab="assignment"
                    mode="edit"
                    newStudent={true}
                    attendanceStatus="present"
                />
            </div>
        </section>
    </div>
);
