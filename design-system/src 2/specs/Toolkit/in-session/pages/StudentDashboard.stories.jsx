import React, { useState } from 'react';
import Button from '../../../../components/Button/Button';
import Dropdown from '../../../../components/Dropdown/Dropdown';
import { PageLayout } from '../../../Universal/Pages';
import { TableRow, TableHeaderRow } from '../tables/StudentList.stories';
import { SessionControls } from '../elements/SessionControls.stories';
import { SortingOptions } from '../elements/SortingOptions.stories';
import MATHiaGoalStatusBanner from '../elements/MATHiaGoalStatusBanner';
import { Toast } from '../../../../components/Toast';

import * as InSessionModals from '../modals/InSessionPopUpModal.stories';
import { StartingZoomSession } from '../modals/StartingZoomSession.stories';
import { AddTutor, AddStudent } from '../modals/AddModal.stories';

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
| SortingOptions | in-session/elements | Sort by Name, Status, Bookmark, Progress |
| Dropdown | plus-ds/components | Status filter & session selector |
| Button | plus-ds/components | Mark Helped action |
| MATHiaGoalStatusBanner | in-session/elements | Goal status banner |

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
 * Main Content Area (used by Overview and Interactive stories)
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
    isLeadTutor = true,
    showBanner = false,
    bannerSessionType = 'goal-setting',
}) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)',
            width: '100%'
        }}
    >
        {/* MATHia Goal Status Banner */}
        {showBanner && (
            <MATHiaGoalStatusBanner
                type="dashboard"
                sessionType={bannerSessionType}
            />
        )}

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

/* ====================================================================
 * EMPTY STATE COMPONENTS
 * ==================================================================== */

/**
 * Empty State Placeholder for Regular Tutors
 * Centered content area shown when no students are assigned yet.
 *
 * Figma node: 3999:207376
 *
 * Design tokens:
 * - Icon: fa-user-clock, 128px, color: --color-outline-variant
 * - Title: h4 (Lato SemiBold, 24px), color: --color-on-surface
 * - Body: body1-txt (Merriweather Sans Light, 16px), color: --color-on-surface-variant
 * - Button: outlined primary, default size with leading icon (refresh)
 * - Content width: 332px centered
 * - Gap between text and button: 16px (--size-spacing-within-component-spacer-4-5)
 */
const RegularTutorEmptyState = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            flex: 1,
        }}
    >
        {/* Icon */}
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <i
                className="fa-solid fa-user-clock"
                style={{
                    fontSize: '128px',
                    lineHeight: 1.875,
                    color: 'var(--color-outline-variant)',
                }}
            />
        </div>

        {/* Content Blurb */}
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                width: '332px',
            }}
        >
            {/* Text Container */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    textAlign: 'center',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        paddingTop: '8px',
                        paddingBottom: '4px',
                    }}
                >
                    <h4
                        className="h4"
                        style={{
                            color: 'var(--color-on-surface)',
                            margin: 0,
                            textAlign: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Your students are on the way
                    </h4>
                </div>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                    }}
                >
                    <p
                        className="body1-txt"
                        style={{
                            color: 'var(--color-on-surface-variant)',
                            margin: 0,
                            textAlign: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        The lead tutor is finalizing assignments.
                        <br />
                        {"They'll appear here once you're matched."}
                    </p>
                </div>
            </div>

            {/* Refresh Button */}
            <Button
                text="Refresh"
                style="primary"
                fill="outline"
                size="medium"
                leadingVisual="rotate"
                onClick={() => window.location.reload()}
            />
        </div>
    </div>
);

/**
 * Lead & Supervisor Empty State Placeholder
 * Centered content area shown when no students are loaded yet for lead/supervisor.
 *
 * Figma node: 3999:204238
 *
 * Design tokens:
 * - Icon: fa-user-gear, 128px, color: --color-outline-variant
 * - Title: h4 (Lato SemiBold, 24px), color: --color-on-surface
 * - Body: body1-txt (Merriweather Sans Light, 16px), color: --color-on-surface-variant
 * - Button: outlined primary, medium size with leading icon (pen-to-square)
 * - Content width: 332px centered
 * - Gap between text and button: 16px
 */
const LeadSupervisorEmptyState = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            flex: 1,
        }}
    >
        {/* Icon */}
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <i
                className="fa-solid fa-user-gear"
                style={{
                    fontSize: '128px',
                    lineHeight: 1.875,
                    color: 'var(--color-outline-variant)',
                }}
            />
        </div>

        {/* Content Blurb */}
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                width: '332px',
            }}
        >
            {/* Text Container */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    textAlign: 'center',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        paddingTop: '8px',
                        paddingBottom: '4px',
                    }}
                >
                    <h4
                        className="h4"
                        style={{
                            color: 'var(--color-on-surface)',
                            margin: 0,
                            textAlign: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Ready to manage this session?
                    </h4>
                </div>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                    }}
                >
                    <p
                        className="body1-txt"
                        style={{
                            color: 'var(--color-on-surface-variant)',
                            margin: 0,
                            textAlign: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        Review assignments, confirm attendance,
                        <br />
                        and launch Zoom when you're ready.
                    </p>
                </div>
            </div>

            {/* Manage Session Button */}
            <Button
                text="Manage Session"
                style="primary"
                fill="outline"
                size="medium"
                leadingVisual="pen-to-square"
            />
        </div>
    </div>
);

/* ====================================================================
 * LOADED CONTENT COMPONENTS (with SortingOptions)
 * ==================================================================== */

/**
 * Regular Tutor Main Content - Loaded State
 * Similar to MainContent but with "View Session info" button instead of lead controls.
 *
 * Figma node: 4551:56695
 */
const RegularTutorLoadedContent = ({
    students,
    currentSession,
    sessions,
    onSessionChange,
    onAttendanceChange,
    onEngagementChange,
    isInteractive = false,
    showBanner = false,
    bannerSessionType = 'goal-setting',
}) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)',
            width: '100%',
            flex: 1,
            minHeight: 0,
        }}
    >
        {/* MATHia Goal Status Banner */}
        {showBanner && (
            <MATHiaGoalStatusBanner
                type="dashboard"
                sessionType={bannerSessionType}
            />
        )}

        {/* Page Header Row */}
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 'var(--size-section-gap-md)',
            }}
        >
            {/* Title */}
            <h4 className="h4" style={{ color: 'var(--color-on-surface)', margin: 0 }}>Your Students</h4>

            {/* Right: Control Buttons */}
            <div
                style={{
                    display: 'flex',
                    flex: '1 0 0',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 'var(--size-element-gap-sm)',
                }}
            >
                <SortingOptions initialSort="status" initialOrder="needs_motivation" isInteractive={true} />
                <SessionSelector
                    currentSession={currentSession}
                    sessions={sessions}
                    onSelect={onSessionChange}
                    isInteractive={isInteractive}
                />
                <SessionControls action="view session info" user="regular tutors" />
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

/**
 * Regular Tutor Main Content - Empty State
 * Shows the empty state when no students are assigned yet.
 *
 * Figma node: 4147:243340
 */
const RegularTutorEmptyContent = ({
    currentSession,
    sessions,
    onSessionChange,
    isInteractive = false,
    showBanner = false,
    bannerSessionType = 'goal-setting',
}) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)',
            width: '100%',
            minHeight: '900px',
        }}
    >
        {/* MATHia Goal Status Banner */}
        {showBanner && (
            <MATHiaGoalStatusBanner
                type="dashboard"
                sessionType={bannerSessionType}
            />
        )}

        {/* Page Header Row */}
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 'var(--size-section-gap-md)',
            }}
        >
            {/* Title */}
            <h4 className="h4" style={{ color: 'var(--color-on-surface)', margin: 0 }}>Your Students</h4>

            {/* Right: Control Buttons */}
            <div
                style={{
                    display: 'flex',
                    flex: '1 0 0',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 'var(--size-element-gap-sm)',
                }}
            >
                <SortingOptions initialSort="status" initialOrder="needs_motivation" isInteractive={true} />
                <SessionSelector
                    currentSession={currentSession}
                    sessions={sessions}
                    onSelect={onSessionChange}
                    isInteractive={isInteractive}
                />
                <SessionControls action="view session info" user="regular tutors" />
            </div>
        </div>

        {/* Empty State Content - centered in remaining space */}
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
            }}
        >
            <RegularTutorEmptyState />
        </div>
    </div>
);

/**
 * Lead & Supervisor Main Content - Loaded State
 * Student list with SortingOptions, Session Selector, Copy assignments & Manage Session buttons.
 *
 * Figma node: 4551:56269
 */
const LeadSupervisorLoadedContent = ({
    students,
    currentSession,
    sessions,
    onSessionChange,
    onAttendanceChange,
    onEngagementChange,
    isInteractive = false,
    showBanner = false,
    bannerSessionType = 'goal-setting',
}) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)',
            width: '100%',
            flex: 1,
            minHeight: 0,
        }}
    >
        {/* MATHia Goal Status Banner */}
        {showBanner && (
            <MATHiaGoalStatusBanner
                type="dashboard"
                sessionType={bannerSessionType}
            />
        )}

        {/* Page Header Row */}
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 'var(--size-section-gap-md)',
            }}
        >
            {/* Title */}
            <h4 className="h4" style={{ color: 'var(--color-on-surface)', margin: 0 }}>Your Students</h4>

            {/* Right: Control Buttons */}
            <div
                style={{
                    display: 'flex',
                    flex: '1 0 0',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 'var(--size-element-gap-sm)',
                }}
            >
                <SortingOptions initialSort="status" initialOrder="needs_motivation" isInteractive={true} />
                <SessionSelector
                    currentSession={currentSession}
                    sessions={sessions}
                    onSelect={onSessionChange}
                    isInteractive={isInteractive}
                />
                <SessionControls action="copy assignments" user="lead & supervisors" />
                <SessionControls action="manage session" user="lead & supervisors" />
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

/**
 * Lead & Supervisor Main Content - Empty State
 * Shows empty state with user-gear icon, message, and Manage Session button.
 *
 * Figma node: 3999:204238
 */
const LeadSupervisorEmptyContent = ({
    currentSession,
    sessions,
    onSessionChange,
    isInteractive = false,
    showBanner = false,
    bannerSessionType = 'goal-setting',
}) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)',
            width: '100%',
            minHeight: '900px',
        }}
    >
        {/* MATHia Goal Status Banner */}
        {showBanner && (
            <MATHiaGoalStatusBanner
                type="dashboard"
                sessionType={bannerSessionType}
            />
        )}

        {/* Page Header Row */}
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 'var(--size-section-gap-md)',
            }}
        >
            {/* Title */}
            <h4 className="h4" style={{ color: 'var(--color-on-surface)', margin: 0 }}>Your Students</h4>

            {/* Right: Control Buttons */}
            <div
                style={{
                    display: 'flex',
                    flex: '1 0 0',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 'var(--size-element-gap-sm)',
                }}
            >
                <SortingOptions initialSort="status" initialOrder="needs_motivation" isInteractive={true} />
                <SessionSelector
                    currentSession={currentSession}
                    sessions={sessions}
                    onSelect={onSessionChange}
                    isInteractive={isInteractive}
                />
                <SessionControls action="copy assignments" user="lead & supervisors" />
                <SessionControls action="manage session" user="lead & supervisors" />
            </div>
        </div>

        {/* Empty State Content - centered in remaining space */}
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
            }}
        >
            <LeadSupervisorEmptyState />
        </div>
    </div>
);

/* ====================================================================
 * INTERACTIVE VIEW STORIES (with Loaded/Empty + Banner toggles)
 * ==================================================================== */

/**
 * Regular Tutor View - Interactive
 *
 * Toggleable between **Loaded** and **Empty** states:
 * - **Loaded**: Student list with SortingOptions, "View Session info" button, attendance/engagement dropdowns
 * - **Empty**: Empty state placeholder with user-clock icon, message, and Refresh button
 *
 * Also includes MATHia Goal Status Banner toggle (Visible/Hidden) and Session Type (Goal Setting/Non-Goal Setting).
 * Includes breakpoint toggle (MD / LG / XL) for responsive preview.
 */
export const RegularTutorView = () => {
    const [viewState, setViewState] = useState('loaded');
    const [showBanner, setShowBanner] = useState(true);
    const [bannerSessionType, setBannerSessionType] = useState('goal-setting');
    const [showToast, setShowToast] = useState(false);
    const [toastType, setToastType] = useState('assignment-all');
    const [currentSession, setCurrentSession] = useState(defaultSessions[0]);
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
            {/* View State Controls */}
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
                    View State:
                </span>
                <Button
                    text="Loaded"
                    size="small"
                    style="primary"
                    fill={viewState === 'loaded' ? 'filled' : 'outline'}
                    onClick={() => setViewState('loaded')}
                />
                <Button
                    text="Empty"
                    size="small"
                    style="primary"
                    fill={viewState === 'empty' ? 'filled' : 'outline'}
                    onClick={() => setViewState('empty')}
                />

                <span style={{
                    width: '1px',
                    height: '20px',
                    backgroundColor: 'var(--color-outline-variant)',
                    margin: '0 var(--size-element-gap-sm)',
                }} />

                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
                    Goal Banner:
                </span>
                <Button
                    text={showBanner ? 'Visible' : 'Hidden'}
                    size="small"
                    style="primary"
                    fill={showBanner ? 'filled' : 'outline'}
                    onClick={() => setShowBanner(!showBanner)}
                />

                {showBanner && (
                    <>
                        <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
                            Session Type:
                        </span>
                        <Button
                            text="Goal Setting"
                            size="small"
                            style="primary"
                            fill={bannerSessionType === 'goal-setting' ? 'filled' : 'outline'}
                            onClick={() => setBannerSessionType('goal-setting')}
                        />
                        <Button
                            text="Non-Goal Setting"
                            size="small"
                            style="primary"
                            fill={bannerSessionType === 'non-goal-setting' ? 'filled' : 'outline'}
                            onClick={() => setBannerSessionType('non-goal-setting')}
                        />
                    </>
                )}

                <span style={{
                    width: '1px',
                    height: '20px',
                    backgroundColor: 'var(--color-outline-variant)',
                    margin: '0 var(--size-element-gap-sm)',
                }} />

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

                {viewState === 'loaded' && (
                    <>
                        <span style={{
                            width: '1px',
                            height: '20px',
                            backgroundColor: 'var(--color-outline-variant)',
                            margin: '0 var(--size-element-gap-sm)',
                        }} />

                        <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
                            Toast:
                        </span>
                        <Button
                            text={showToast ? 'Visible' : 'Hidden'}
                            size="small"
                            style="primary"
                            fill={showToast ? 'filled' : 'outline'}
                            onClick={() => setShowToast(!showToast)}
                        />

                        {showToast && (
                            <>
                                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
                                    Toast Type:
                                </span>
                                <Button
                                    text="Assignment (For All)"
                                    size="small"
                                    style="primary"
                                    fill={toastType === 'assignment-all' ? 'filled' : 'outline'}
                                    onClick={() => setToastType('assignment-all')}
                                />
                                <Button
                                    text="Goal Setting (Warmup)"
                                    size="small"
                                    style="primary"
                                    fill={toastType === 'goal-setting-warmup' ? 'filled' : 'outline'}
                                    onClick={() => setToastType('goal-setting-warmup')}
                                />
                            </>
                        )}
                    </>
                )}

                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', marginLeft: 'auto' }}>
                    Current: <strong>{viewState === 'loaded' ? 'Loaded' : 'Empty'}</strong> @ <strong>{breakpointWidths[breakpoint]}px</strong>
                </span>
            </div>

            {/* Page Container with dynamic width */}
            <div style={{
                maxWidth: `${breakpointWidths[breakpoint]}px`,
                height: '1024px',
                margin: '0 auto',
                width: '100%',
                transition: 'max-width 0.3s ease',
                position: 'relative',
                border: '2px dashed var(--color-outline-variant)',
                borderRadius: 'var(--size-card-radius-sm)',
                overflow: 'hidden',
            }}>
                <PageLayout
                    topBarConfig={{
                        breadcrumbs: viewState === 'loaded'
                            ? [
                                { text: 'Home', href: '#' },
                                { text: 'Sessions', href: '#' },
                                { text: `${currentSession.school} (${currentSession.teacher}), ${currentSession.time}, ${currentSession.date}` }
                            ]
                            : [
                                { text: 'Home', href: '#' },
                                { text: 'Students' }
                            ],
                        user: { name: 'John Doe', role: 'Lead' }
                    }}
                    sidebarConfig={{
                        user: 'tutor',
                        activeTab: 'sessions'
                    }}
                    id="student-dashboard-regular-tutor"
                >
                    {viewState === 'loaded' ? (
                        <RegularTutorLoadedContent
                            students={students}
                            currentSession={currentSession}
                            sessions={defaultSessions}
                            onSessionChange={setCurrentSession}
                            onAttendanceChange={handleAttendanceChange}
                            onEngagementChange={handleEngagementChange}
                            isInteractive={true}
                            showBanner={showBanner}
                            bannerSessionType={bannerSessionType}
                        />
                    ) : (
                        <RegularTutorEmptyContent
                            currentSession={currentSession}
                            sessions={defaultSessions}
                            onSessionChange={setCurrentSession}
                            isInteractive={true}
                            showBanner={showBanner}
                            bannerSessionType={bannerSessionType}
                        />
                    )}
                </PageLayout>

                {/* Toast - only in loaded state */}
                {viewState === 'loaded' && showToast && (
                    <div style={{
                        position: 'fixed',
                        bottom: 'var(--size-section-gap-lg)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1050,
                        width: '672px',
                    }}>
                        {toastType === 'assignment-all' ? (
                            <Toast
                                style="secondary"
                                title="Review Assignments"
                                timestamp="11 mins ago"
                                show={true}
                                autohide={false}
                                onClose={() => setShowToast(false)}
                                className="w-100"
                            >
                                <span
                                    className="body3-txt font-weight-light"
                                    style={{ color: 'var(--color-on-surface)' }}
                                >
                                    Your student roster was just updated. Take a moment to review your new assignments.
                                </span>
                            </Toast>
                        ) : (
                            <Toast
                                style="info"
                                title="Warmup phase in progress."
                                show={true}
                                autohide={false}
                                onClose={() => setShowToast(false)}
                                className="w-100"
                            >
                                <span
                                    className="body3-txt font-weight-light"
                                    style={{ color: 'var(--color-on-surface)' }}
                                >
                                    Students are working toward default IXL expectations (e.g., 40 min/week, 2 skills/week).
                                    Personalized goals will be available in a few weeks.{' '}
                                    <span className="body3-txt font-weight-semibold">
                                        Remember to check in with each student and mark them as helped.
                                    </span>
                                </span>
                            </Toast>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Lead & Supervisor View - Interactive
 *
 * Toggleable between **Loaded** and **Empty** states:
 * - **Loaded**: Student list with SortingOptions, Session Selector, Copy assignments & Manage Session buttons,
 *   attendance/engagement dropdowns, "Mark Helped" actions
 * - **Empty**: Empty state placeholder with user-gear icon, message "Ready to manage this session?", and Manage Session button
 *
 * Also includes MATHia Goal Status Banner toggle (Visible/Hidden) and Session Type (Goal Setting/Non-Goal Setting).
 * Includes breakpoint toggle (MD / LG / XL) for responsive preview.
 *
 * Figma loaded: 4551:56269
 * Figma empty: 3999:204238
 */
const scrim1ModalMap = {
    'attendance-loaded': InSessionModals.AttendanceLoadedLead,
    'attendance-initial': InSessionModals.AttendanceInitialLead,
    'attendance-loading': InSessionModals.AttendanceLoadingLead,
    'assignment-loaded': InSessionModals.AssignmentLoadedLead,
    'assignment-loading': InSessionModals.AssignmentLoadingLead,
    'session-info-loaded': InSessionModals.SessionInfoLoadedLead,
    'session-info-loading': InSessionModals.SessionInfoLoadingLead,
};

const scrim1ModalLabels = {
    'attendance-loaded': 'Attendance (Loaded)',
    'attendance-initial': 'Attendance (Initial)',
    'attendance-loading': 'Attendance (Loading)',
    'assignment-loaded': 'Assignment (Loaded)',
    'assignment-loading': 'Assignment (Loading)',
    'session-info-loaded': 'Session Info (Loaded)',
    'session-info-loading': 'Session Info (Loading)',
};

const scrim2ModalMap = {
    'zoom-session': StartingZoomSession,
    'add-tutor': AddTutor,
    'add-student': AddStudent,
};

const scrim2ModalLabels = {
    'zoom-session': 'Zoom Session',
    'add-tutor': 'Add Tutor',
    'add-student': 'Add Student',
};

export const LeadSupervisorView = () => {
    const [viewState, setViewState] = useState('loaded');
    const [showBanner, setShowBanner] = useState(true);
    const [bannerSessionType, setBannerSessionType] = useState('goal-setting');
    const [showToast, setShowToast] = useState(false);
    const [toastType, setToastType] = useState('assignment-leads');
    const [currentSession, setCurrentSession] = useState(defaultSessions[0]);
    const [students, setStudents] = useState(defaultStudents);
    const [breakpoint, setBreakpoint] = useState('xl');
    const [showScrim1, setShowScrim1] = useState(false);
    const [scrim1Modal, setScrim1Modal] = useState('attendance-loaded');
    const [showScrim2, setShowScrim2] = useState(false);
    const [scrim2Modal, setScrim2Modal] = useState('zoom-session');

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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
            {/* View State Controls */}
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
                    View State:
                </span>
                <Button
                    text="Loaded"
                    size="small"
                    style="primary"
                    fill={viewState === 'loaded' ? 'filled' : 'outline'}
                    onClick={() => setViewState('loaded')}
                />
                <Button
                    text="Empty"
                    size="small"
                    style="primary"
                    fill={viewState === 'empty' ? 'filled' : 'outline'}
                    onClick={() => setViewState('empty')}
                />

                <span style={{
                    width: '1px',
                    height: '20px',
                    backgroundColor: 'var(--color-outline-variant)',
                    margin: '0 var(--size-element-gap-sm)',
                }} />

                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
                    Goal Banner:
                </span>
                <Button
                    text={showBanner ? 'Visible' : 'Hidden'}
                    size="small"
                    style="primary"
                    fill={showBanner ? 'filled' : 'outline'}
                    onClick={() => setShowBanner(!showBanner)}
                />

                {showBanner && (
                    <>
                        <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
                            Session Type:
                        </span>
                        <Button
                            text="Goal Setting"
                            size="small"
                            style="primary"
                            fill={bannerSessionType === 'goal-setting' ? 'filled' : 'outline'}
                            onClick={() => setBannerSessionType('goal-setting')}
                        />
                        <Button
                            text="Non-Goal Setting"
                            size="small"
                            style="primary"
                            fill={bannerSessionType === 'non-goal-setting' ? 'filled' : 'outline'}
                            onClick={() => setBannerSessionType('non-goal-setting')}
                        />
                    </>
                )}

                <span style={{
                    width: '1px',
                    height: '20px',
                    backgroundColor: 'var(--color-outline-variant)',
                    margin: '0 var(--size-element-gap-sm)',
                }} />

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

                {viewState === 'loaded' && (
                    <>
                        <span style={{
                            width: '1px',
                            height: '20px',
                            backgroundColor: 'var(--color-outline-variant)',
                            margin: '0 var(--size-element-gap-sm)',
                        }} />

                        <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
                            Toast:
                        </span>
                        <Button
                            text={showToast ? 'Visible' : 'Hidden'}
                            size="small"
                            style="primary"
                            fill={showToast ? 'filled' : 'outline'}
                            onClick={() => setShowToast(!showToast)}
                        />

                        {showToast && (
                            <>
                                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
                                    Toast Type:
                                </span>
                                <Button
                                    text="Assignment (For Leads)"
                                    size="small"
                                    style="primary"
                                    fill={toastType === 'assignment-leads' ? 'filled' : 'outline'}
                                    onClick={() => setToastType('assignment-leads')}
                                />
                                <Button
                                    text="Goal Setting (Warmup)"
                                    size="small"
                                    style="primary"
                                    fill={toastType === 'goal-setting-warmup' ? 'filled' : 'outline'}
                                    onClick={() => setToastType('goal-setting-warmup')}
                                />
                            </>
                        )}
                    </>
                )}

                <span style={{
                    width: '1px',
                    height: '20px',
                    backgroundColor: 'var(--color-outline-variant)',
                    margin: '0 var(--size-element-gap-sm)',
                }} />

                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
                    Scrim 1:
                </span>
                <Button
                    text={showScrim1 ? 'Visible' : 'Hidden'}
                    size="small"
                    style="primary"
                    fill={showScrim1 ? 'filled' : 'outline'}
                    onClick={() => {
                        setShowScrim1(!showScrim1);
                        if (showScrim1) setShowScrim2(false);
                    }}
                />

                {showScrim1 && (
                    <>
                        <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
                            Modal:
                        </span>
                        {Object.entries(scrim1ModalLabels).map(([key, label]) => (
                            <Button
                                key={key}
                                text={label}
                                size="small"
                                style="primary"
                                fill={scrim1Modal === key ? 'filled' : 'outline'}
                                onClick={() => setScrim1Modal(key)}
                            />
                        ))}

                        <span style={{
                            width: '1px',
                            height: '20px',
                            backgroundColor: 'var(--color-outline-variant)',
                            margin: '0 var(--size-element-gap-sm)',
                        }} />

                        <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
                            Scrim 2:
                        </span>
                        <Button
                            text={showScrim2 ? 'Visible' : 'Hidden'}
                            size="small"
                            style="primary"
                            fill={showScrim2 ? 'filled' : 'outline'}
                            onClick={() => setShowScrim2(!showScrim2)}
                        />

                        {showScrim2 && (
                            <>
                                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
                                    Modal:
                                </span>
                                {Object.entries(scrim2ModalLabels).map(([key, label]) => (
                                    <Button
                                        key={key}
                                        text={label}
                                        size="small"
                                        style="primary"
                                        fill={scrim2Modal === key ? 'filled' : 'outline'}
                                        onClick={() => setScrim2Modal(key)}
                                    />
                                ))}
                            </>
                        )}
                    </>
                )}

                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', marginLeft: 'auto' }}>
                    Current: <strong>{viewState === 'loaded' ? 'Loaded' : 'Empty'}</strong> @ <strong>{breakpointWidths[breakpoint]}px</strong>
                </span>
            </div>

            {/* Page Container with dynamic width */}
            <div style={{
                maxWidth: `${breakpointWidths[breakpoint]}px`,
                height: '1024px',
                margin: '0 auto',
                width: '100%',
                transition: 'max-width 0.3s ease',
                position: 'relative',
                border: '2px dashed var(--color-outline-variant)',
                borderRadius: 'var(--size-card-radius-sm)',
                overflow: 'hidden',
            }}>
                <PageLayout
                    topBarConfig={{
                        breadcrumbs: viewState === 'loaded'
                            ? [
                                { text: 'Home', href: '#' },
                                { text: 'Sessions', href: '#' },
                                { text: `${currentSession.school} (${currentSession.teacher}), ${currentSession.time}, ${currentSession.date}` }
                            ]
                            : [
                                { text: 'Home', href: '#' },
                                { text: 'Students' }
                            ],
                        user: { name: 'John Doe', role: 'Lead' }
                    }}
                    sidebarConfig={{
                        user: 'lead',
                        activeTab: 'sessions'
                    }}
                    id="student-dashboard-lead-supervisor"
                >
                    {viewState === 'loaded' ? (
                        <LeadSupervisorLoadedContent
                            students={students}
                            currentSession={currentSession}
                            sessions={defaultSessions}
                            onSessionChange={setCurrentSession}
                            onAttendanceChange={handleAttendanceChange}
                            onEngagementChange={handleEngagementChange}
                            isInteractive={true}
                            showBanner={showBanner}
                            bannerSessionType={bannerSessionType}
                        />
                    ) : (
                        <LeadSupervisorEmptyContent
                            currentSession={currentSession}
                            sessions={defaultSessions}
                            onSessionChange={setCurrentSession}
                            isInteractive={true}
                            showBanner={showBanner}
                            bannerSessionType={bannerSessionType}
                        />
                    )}
                </PageLayout>

                {/* Toast - only in loaded state */}
                {viewState === 'loaded' && showToast && (
                    <div style={{
                        position: 'fixed',
                        bottom: 'var(--size-section-gap-lg)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1050,
                        width: '672px',
                    }}>
                        {toastType === 'assignment-leads' ? (
                            <Toast
                                style="secondary"
                                title="Review Assignments"
                                timestamp="11 mins ago"
                                show={true}
                                autohide={false}
                                onClose={() => setShowToast(false)}
                                className="w-100"
                            >
                                <span
                                    className="body3-txt font-weight-light"
                                    style={{ color: 'var(--color-on-surface)' }}
                                >
                                    It's been 10 minutes since the session started. Would you like to{' '}
                                    <a
                                        href="#"
                                        className="body3-txt font-weight-bold"
                                        style={{
                                            color: 'var(--color-on-surface)',
                                            textDecoration: 'underline',
                                        }}
                                        onClick={(e) => e.preventDefault()}
                                    >
                                        review and adjust assignments
                                    </a>
                                    ?{' '}
                                </span>
                            </Toast>
                        ) : (
                            <Toast
                                style="info"
                                title="Warmup phase in progress."
                                show={true}
                                autohide={false}
                                onClose={() => setShowToast(false)}
                                className="w-100"
                            >
                                <span
                                    className="body3-txt font-weight-light"
                                    style={{ color: 'var(--color-on-surface)' }}
                                >
                                    Students are working toward default IXL expectations (e.g., 40 min/week, 2 skills/week).
                                    Personalized goals will be available in a few weeks.{' '}
                                    <span className="body3-txt font-weight-semibold">
                                        Remember to check in with each student and mark them as helped.
                                    </span>
                                </span>
                            </Toast>
                        )}
                    </div>
                )}

                {/* Scrim 1 - In-Session Pop-Up Modal */}
                {showScrim1 && (() => {
                    const Scrim1Modal = scrim1ModalMap[scrim1Modal];
                    return (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 'var(--size-section-pad-x-lg)',
                            zIndex: 1000,
                        }}>
                            {Scrim1Modal ? <Scrim1Modal /> : null}
                        </div>
                    );
                })()}

                {/* Scrim 2 - Zoom Session / Add Tutor / Add Student (on top of Scrim 1) */}
                {showScrim1 && showScrim2 && (() => {
                    const Scrim2Modal = scrim2ModalMap[scrim2Modal];
                    return (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 'var(--size-section-pad-x-lg)',
                            zIndex: 1100,
                        }}>
                            {Scrim2Modal ? <Scrim2Modal /> : null}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};
