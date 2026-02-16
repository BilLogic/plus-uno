import React, { useState } from 'react';
import Button from '../../../../components/Button/Button';
import Dropdown from '../../../../components/Dropdown/Dropdown';
import { PageLayout } from '../../../Universal/Pages';
import { TableRow, TableHeaderRow } from '../tables/StudentList.stories';
import { SessionControls } from '../elements/SessionControls.stories';

export default {
    title: 'Specs/Toolkit/In-Session/Pages/Student Dashboard',
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: `
# Student Dashboard Page

The Student Dashboard is the primary view for tutors during an active session to manage student attendance, engagement, and goals.

## Page Structure

The page uses the **PageLayout** component which provides:
- **Top Bar**: Breadcrumbs showing session path and user profile with role badge
- **Sidebar**: Navigation for tutor/lead role
- **Main Content**: Student list with controls

## Components Used

| Component | Source | Purpose |
|-----------|--------|---------|
| PageLayout | Universal/Pages | Page structure with sidebar |
| SessionControls | in-session/elements | Copy assignments & Manage Session buttons |
| TableRow/TableHeaderRow | StudentList.stories | Student data with dropdowns |
| AttendanceDropdown | in-session/elements | Attendance status selection |
| EngagementDropdown | in-session/elements | Engagement status selection |
| Dropdown | plus-ds/components | Status filter & session selector |
| Button | plus-ds/components | Mark Helped action |

## Design System Tokens

### Section Spacing
- \`--size-section-gap-lg\`: Between major sections
- \`--size-section-gap-sm\`: Within content areas

### Element Spacing
- \`--size-element-gap-sm\`: Between controls
- \`--size-element-gap-md\`: Between button groups

## Interactive Features

The Interactive story includes:
- **Session selector dropdown** - Switch between sessions
- **Status filter dropdown** - Filter students by status
- **Session controls** - Copy assignments with success state, Manage Session
- **Attendance/Engagement dropdowns** - Update student status
- **Mark Helped buttons** - Track student assistance
                `,
            },
        },
    },
};

/**
 * Session Selector Dropdown
 * Displays current session with school, teacher, time, and date
 */
const SessionSelector = ({ currentSession, sessions, onSelect, isInteractive = false }) => {
    const items = sessions.map(session => ({
        label: `${session.school} (${session.teacher}), ${session.time}, ${session.date}`,
        selected: session.id === currentSession.id,
        onClick: () => isInteractive && onSelect(session)
    }));

    return (
        <div style={{ minWidth: '300px' }}>
            <style>{`
                .session-selector-dropdown .dropdown-menu {
                    max-width: 400px !important;
                    min-width: 350px !important;
                }
                .session-selector-dropdown .dropdown-item {
                    white-space: normal !important;
                    word-wrap: break-word !important;
                    line-height: 1.4 !important;
                }
            `}</style>
            <Dropdown
                buttonText={`${currentSession.school} (${currentSession.teacher}), ${currentSession.time}, ${currentSession.date}`}
                items={items}
                style="primary"
                fill="outline"
                size="small"
                className="session-selector-dropdown"
            />
        </div>
    );
};

/**
 * Status Filter Dropdown
 * Filter students by their current status
 */
const StatusFilter = ({ currentStatus, onSelect, isInteractive = false }) => {
    const statusOptions = [
        { id: 'all', label: 'All' },
        { id: 'needs-motivation', label: 'Needs motivation' },
        { id: 'needs-goals', label: 'Needs to set goals' },
        { id: 'on-track', label: 'On track' },
        { id: 'exceeding', label: 'Exceeding goals' }
    ];

    const items = statusOptions.map(status => ({
        label: status.label,
        selected: status.id === currentStatus,
        onClick: () => isInteractive && onSelect(status.id)
    }));

    return (
        <Dropdown
            buttonText="Status"
            items={items}
            style="secondary"
            fill="ghost"
            size="small"
        />
    );
};

/**
 * Main Content Area
 * Uses semantic tokens:
 * - Section gap: --size-section-gap-lg (between major sections)
 * - Element gap: --size-element-gap-sm (between controls)
 */
const MainContent = ({
    students,
    currentSession,
    sessions,
    statusFilter,
    onSessionChange,
    onStatusFilterChange,
    onAttendanceChange,
    onEngagementChange,
    onMarkHelped,
    isInteractive = false,
    isLeadTutor = true
}) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)',
            width: '100%'
        }}
    >
        {/* Page Header Row */}
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 'var(--size-element-gap-md)'
            }}
        >
            {/* Left: Title and Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-element-gap-md)' }}>
                <h4 className="h4" style={{ color: 'var(--color-on-surface)', margin: 0 }}>Your Students</h4>
                <StatusFilter
                    currentStatus={statusFilter}
                    onSelect={onStatusFilterChange}
                    isInteractive={isInteractive}
                />
            </div>

            {/* Right: Session Selector and Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--size-element-gap-sm)' }}>
                <SessionSelector
                    currentSession={currentSession}
                    sessions={sessions}
                    onSelect={onSessionChange}
                    isInteractive={isInteractive}
                />

                {/* Session Controls - only show for lead tutors */}
                {isLeadTutor && (
                    <div style={{ display: 'flex', gap: 'var(--size-element-gap-sm)' }}>
                        <SessionControls action="copy assignments" user="lead & supervisors" />
                        <SessionControls action="manage session" user="lead & supervisors" />
                    </div>
                )}
            </div>
        </div>

        {/* Student Table */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <TableHeaderRow />
            {students.map((student, index) => (
                <TableRow
                    key={student.id || index}
                    studentName={student.name}
                    isNew={student.isNew}
                    status={student.status}
                    attendanceStatus={student.attendanceStatus}
                    engagementStatus={student.engagementStatus}
                    onAttendanceChange={isInteractive ? (val) => onAttendanceChange(student.id, val) : undefined}
                    onEngagementChange={isInteractive ? (val) => onEngagementChange(student.id, val) : undefined}
                />
            ))}
        </div>
    </div>
);

// Default session data
const defaultSessions = [
    { id: 1, school: 'Hogwarts', teacher: 'Prof. Snape', time: '11:25 - 12:25pm', date: '12/21/2023' },
    { id: 2, school: 'Hogwarts', teacher: 'Prof. McGonagall', time: '1:00 - 2:00pm', date: '12/21/2023' },
    { id: 3, school: 'Beauxbatons', teacher: 'Mme. Maxime', time: '3:00 - 4:00pm', date: '12/21/2023' }
];

// Default student data matching Figma design
const defaultStudents = [
    { id: 1, name: 'Arlene McCoy', isNew: false, status: 'needs-motivation', attendanceStatus: 'unknown', engagementStatus: 'unknown' },
    { id: 2, name: 'Morgan Reed', isNew: false, status: 'needs-motivation', attendanceStatus: 'unknown', engagementStatus: 'unknown' },
    { id: 3, name: 'Taylor Brooks', isNew: false, status: 'needs-motivation', attendanceStatus: 'unknown', engagementStatus: 'unknown' },
    { id: 4, name: 'Casey Jordan', isNew: false, status: 'needs-motivation', attendanceStatus: 'unknown', engagementStatus: 'unknown' },
    { id: 5, name: 'Jordan Avery', isNew: false, status: 'needs-motivation', attendanceStatus: 'unknown', engagementStatus: 'unknown' }
];

/**
 * Student Dashboard - Overview/Static Version
 * Full layout using PageLayout component with sidebar and top bar
 */
export const Overview = () => (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        <PageLayout
            topBarConfig={{
                breadcrumbs: [
                    { text: 'Home', href: '#' },
                    { text: 'Sessions', href: '#' },
                    { text: 'Hogwarts (Prof. Snape), 11:25 - 12:25p...' }
                ],
                user: { name: 'John Doe', role: 'Lead' }
            }}
            sidebarConfig={{
                user: 'lead',
                activeTab: 'sessions'
            }}
            id="student-dashboard-page"
        >
            <MainContent
                students={defaultStudents}
                currentSession={defaultSessions[0]}
                sessions={defaultSessions}
                statusFilter="all"
                onSessionChange={() => { }}
                onStatusFilterChange={() => { }}
                onAttendanceChange={() => { }}
                onEngagementChange={() => { }}
                onMarkHelped={() => { }}
                isLeadTutor={true}
            />
        </PageLayout>
    </div>
);

/**
 * Student Dashboard - Interactive Version
 * Full layout with working state management for:
 * - Session switching
 * - Status filtering
 * - Attendance/Engagement updates
 * - Breakpoint toggle
 */
export const Interactive = () => {
    const [currentSession, setCurrentSession] = useState(defaultSessions[0]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [students, setStudents] = useState(defaultStudents);
    const [breakpoint, setBreakpoint] = useState('xl');

    const breakpointWidths = {
        'md': 768,
        'lg': 1024,
        'xl': 1440,
    };

    const handleAttendanceChange = (studentId, newStatus) => {
        setStudents(prev => prev.map(s =>
            s.id === studentId ? { ...s, attendanceStatus: newStatus } : s
        ));
    };

    const handleEngagementChange = (studentId, newStatus) => {
        setStudents(prev => prev.map(s =>
            s.id === studentId ? { ...s, engagementStatus: newStatus } : s
        ));
    };

    // Filter students based on status filter
    const filteredStudents = statusFilter === 'all'
        ? students
        : students.filter(s => s.status === statusFilter);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
            {/* Breakpoint Toggle Controls */}
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
                    Breakpoint:
                </span>
                {Object.entries(breakpointWidths).map(([bp, width]) => (
                    <Button
                        key={bp}
                        text={`${bp.toUpperCase()} (${width}px)`}
                        size="small"
                        style="primary"
                        fill={breakpoint === bp ? 'filled' : 'outline'}
                        onClick={() => setBreakpoint(bp)}
                    />
                ))}
            </div>

            {/* Status Display */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--size-element-gap-lg)',
                padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                backgroundColor: 'var(--color-surface-container-low)',
                borderRadius: 'var(--size-card-radius-sm)'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="small text-muted fw-bold">Current Session:</span>
                    <span className="body2-txt">{currentSession.school} ({currentSession.teacher})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="small text-muted fw-bold">Status Filter:</span>
                    <span className="body2-txt">{statusFilter === 'all' ? 'All Students' : statusFilter}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="small text-muted fw-bold">Students Shown:</span>
                    <span className="body2-txt">{filteredStudents.length} of {students.length}</span>
                </div>
            </div>

            {/* Page Container with dynamic width */}
            <div style={{
                maxWidth: `${breakpointWidths[breakpoint]}px`,
                margin: '0 auto',
                width: '100%',
                transition: 'max-width 0.3s ease'
            }}>
                <PageLayout
                    topBarConfig={{
                        breadcrumbs: [
                            { text: 'Home', href: '#' },
                            { text: 'Sessions', href: '#' },
                            { text: `${currentSession.school} (${currentSession.teacher}), ${currentSession.time}...` }
                        ],
                        user: { name: 'John Doe', role: 'Lead' }
                    }}
                    sidebarConfig={{
                        user: 'lead',
                        activeTab: 'sessions'
                    }}
                    id="student-dashboard-page-interactive"
                >
                    <MainContent
                        students={filteredStudents}
                        currentSession={currentSession}
                        sessions={defaultSessions}
                        statusFilter={statusFilter}
                        onSessionChange={setCurrentSession}
                        onStatusFilterChange={setStatusFilter}
                        onAttendanceChange={handleAttendanceChange}
                        onEngagementChange={handleEngagementChange}
                        onMarkHelped={() => { }}
                        isInteractive={true}
                        isLeadTutor={true}
                    />
                </PageLayout>
            </div>
        </div>
    );
};

/**
 * Regular Tutor View
 * Shows the page without session management controls (Copy assignments, Manage Session)
 */
export const RegularTutorView = () => (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        <PageLayout
            topBarConfig={{
                breadcrumbs: [
                    { text: 'Home', href: '#' },
                    { text: 'Sessions', href: '#' },
                    { text: 'Hogwarts (Prof. Snape), 11:25 - 12:25p...' }
                ],
                user: { name: 'Jane Smith', role: 'Tutor' }
            }}
            sidebarConfig={{
                user: 'tutor',
                activeTab: 'sessions'
            }}
            id="student-dashboard-page-tutor"
        >
            <MainContent
                students={defaultStudents}
                currentSession={defaultSessions[0]}
                sessions={defaultSessions}
                statusFilter="all"
                onSessionChange={() => { }}
                onStatusFilterChange={() => { }}
                onAttendanceChange={() => { }}
                onEngagementChange={() => { }}
                onMarkHelped={() => { }}
                isLeadTutor={false}
            />
        </PageLayout>
    </div>
);
