import React, { useState } from 'react';
import Button from '@/components/actions/Button/Button';
import Dropdown from '@/components/forms-and-inputs/Dropdown/Dropdown';
import { PageLayout } from '@/specs/Universal/Pages';
import { TableRow, TableHeaderRow } from '../Tables/StudentList.stories';
import SessionControlsConsolidated from '../Elements/SessionControlsConsolidated/SessionControlsConsolidated';
import { SortingOptions } from '../Elements/SortingOptions.stories';
import MATHiaGoalStatusBanner from '../Elements/MATHiaGoalStatusBanner';
import { Toast } from '@/components/messaging/Toast';

import * as InSessionModals from '../Modals/InSessionPopUpModal.stories';
import { StartingZoomSession } from '../Modals/StartingZoomSession.stories';
import { AddTutor, AddStudent } from '../Modals/AddModal.stories';

export default {
    tags: ['!dev', '!autodocs'],
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
| SessionControlsConsolidated | in-session/elements | Role-aware header: count badges + Manage session / overflow |
| TableRow/TableHeaderRow | StudentList.stories | Student data with dropdowns |
| AttendanceDropdown | in-session/elements | Attendance status selection |
| EngagementDropdown | in-session/elements | Engagement status selection |
| SortingOptions | in-session/elements | Sort by Name, Status, Bookmark, Progress |
| Dropdown | plus-ds/components | Status filter |
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
- **Status filter dropdown** - Filter students by status
- **Consolidated session controls** - role-aware header (count badges + Manage session / overflow menu)
- **Attendance/Engagement dropdowns** - Update student status
- **Mark Helped buttons** - Track student assistance
                `,
            },
        },
    },
};

// Session Selector removed per the Session Controls Consolidation spec — the low-usage
// session-selection dropdown is gone; the consolidated header controls replace it.

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

            {/* Right: consolidated session controls (badge cluster + Manage session / overflow) */}
            <SessionControlsConsolidated
                role={isLeadTutor ? 'lead' : 'tutor'}
                studentCount={`${students.filter((s) => s.attendanceStatus === 'present').length}/${students.length}`}
            />
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

    // Breakpoint/responsive width is provided by the global Breakpoint toolbar via the
    // ResponsiveFrame decorator — the story renders the page directly.
    return (
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
 * - Gap between text and button: 16px (--size-section-gap-md)
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
                <SessionControlsConsolidated
                    role="tutor"
                    studentCount={`${students.filter((s) => s.attendanceStatus === 'present').length}/${students.length}`}
                />
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
                <SessionControlsConsolidated role="tutor" studentCount="0/0" />
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
                <SessionControlsConsolidated
                    role="lead"
                    studentCount={`${students.filter((s) => s.attendanceStatus === 'present').length}/${students.length}`}
                />
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
                <SessionControlsConsolidated role="lead" studentCount="0/0" />
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
const RegularTutorViewRender = (args) => {
    const [currentSession, setCurrentSession] = useState(defaultSessions[0]);
    const [students, setStudents] = useState(defaultStudents);

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

    const viewState = args.viewState;
    const showBanner = args.goalBanner;
    const bannerSessionType = args.sessionType;

    return (
        // Fixed-height frame so PageLayout (height:100%) has a definite height in the docs well.
        // Width + breakpoint come from the global Breakpoint toolbar (ResponsiveFrame decorator).
        <div style={{ height: '1024px', width: '100%', position: 'relative', overflow: 'hidden', borderRadius: 'var(--size-card-radius-sm)' }}>
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

                {/* Toast — only in loaded state; visibility driven by the `toast` arg. */}
                {viewState === 'loaded' && args.toast && (
                    <div style={{
                        position: 'fixed',
                        bottom: 'var(--size-section-gap-lg)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1050,
                        width: '672px',
                    }}>
                        {args.toastType === 'assignment-all' ? (
                            <Toast style="secondary" title="Review Assignments" timestamp="11 mins ago" show autohide={false} onClose={() => {}} className="w-100">
                                <span className="body3-txt font-weight-light" style={{ color: 'var(--color-on-surface)' }}>
                                    Your student roster was just updated. Take a moment to review your new assignments.
                                </span>
                            </Toast>
                        ) : (
                            <Toast style="info" title="Warmup phase in progress." show autohide={false} onClose={() => {}} className="w-100">
                                <span className="body3-txt font-weight-light" style={{ color: 'var(--color-on-surface)' }}>
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
    );
};

export const RegularTutorView = {
    render: RegularTutorViewRender,
    argTypes: {
        viewState: { control: 'radio', options: ['loaded', 'empty'], name: 'View state', table: { category: 'State' } },
        goalBanner: { control: 'boolean', name: 'Goal banner', table: { category: 'State' } },
        sessionType: { control: 'radio', options: ['goal-setting', 'non-goal-setting'], name: 'Session type', table: { category: 'State' } },
        toast: { control: 'boolean', name: 'Toast', table: { category: 'State' } },
        toastType: { control: 'radio', options: ['assignment-all', 'goal-setting-warmup'], name: 'Toast type', table: { category: 'State' } },
    },
    args: { viewState: 'loaded', goalBanner: true, sessionType: 'goal-setting', toast: false, toastType: 'assignment-all' },
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

const LeadSupervisorViewRender = (args) => {
    const [currentSession, setCurrentSession] = useState(defaultSessions[0]);
    const [students, setStudents] = useState(defaultStudents);

    const handleAttendanceChange = (studentId, newStatus) => {
        setStudents(prev => prev.map(s => (s.id === studentId ? { ...s, attendanceStatus: newStatus } : s)));
    };
    const handleEngagementChange = (studentId, newStatus) => {
        setStudents(prev => prev.map(s => (s.id === studentId ? { ...s, engagementStatus: newStatus } : s)));
    };

    const viewState = args.viewState;
    const showBanner = args.goalBanner;
    const bannerSessionType = args.sessionType;
    const Scrim1Modal = args.scrim1 !== 'none' ? scrim1ModalMap[args.scrim1] : null;
    const Scrim2Modal = args.scrim2 !== 'none' ? scrim2ModalMap[args.scrim2] : null;

    return (
        // Fixed-height frame so PageLayout resolves height:100% in the docs well; width/breakpoint
        // come from the global Breakpoint toolbar (ResponsiveFrame decorator).
        <div style={{ height: '1024px', width: '100%', position: 'relative', overflow: 'hidden', borderRadius: 'var(--size-card-radius-sm)' }}>
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
                sidebarConfig={{ user: 'lead', activeTab: 'sessions' }}
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

            {/* Toast — loaded state only; visibility driven by the `toast` arg. */}
            {viewState === 'loaded' && args.toast && (
                <div style={{ position: 'fixed', bottom: 'var(--size-section-gap-lg)', left: '50%', transform: 'translateX(-50%)', zIndex: 1050, width: '672px' }}>
                    {args.toastType === 'assignment-leads' ? (
                        <Toast style="secondary" title="Review Assignments" timestamp="11 mins ago" show autohide={false} onClose={() => {}} className="w-100">
                            <span className="body3-txt font-weight-light" style={{ color: 'var(--color-on-surface)' }}>
                                It&apos;s been 10 minutes since the session started. Would you like to{' '}
                                <a href="#" className="body3-txt font-weight-bold" style={{ color: 'var(--color-on-surface)', textDecoration: 'underline' }} onClick={(e) => e.preventDefault()}>review and adjust assignments</a>?{' '}
                            </span>
                        </Toast>
                    ) : (
                        <Toast style="info" title="Warmup phase in progress." show autohide={false} onClose={() => {}} className="w-100">
                            <span className="body3-txt font-weight-light" style={{ color: 'var(--color-on-surface)' }}>
                                Students are working toward default IXL expectations (e.g., 40 min/week, 2 skills/week).
                                Personalized goals will be available in a few weeks.{' '}
                                <span className="body3-txt font-weight-semibold">Remember to check in with each student and mark them as helped.</span>
                            </span>
                        </Toast>
                    )}
                </div>
            )}

            {/* Scrim 1 — in-session pop-up modal; select via the `scrim1` arg. */}
            {Scrim1Modal && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--size-section-pad-x-lg)', zIndex: 1000 }}>
                    <Scrim1Modal />
                </div>
            )}

            {/* Scrim 2 — stacks on Scrim 1; select via the `scrim2` arg. */}
            {Scrim1Modal && Scrim2Modal && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--size-section-pad-x-lg)', zIndex: 1100 }}>
                    <Scrim2Modal />
                </div>
            )}
        </div>
    );
};

export const LeadSupervisorView = {
    render: LeadSupervisorViewRender,
    argTypes: {
        viewState: { control: 'radio', options: ['loaded', 'empty'], name: 'View state', table: { category: 'State' } },
        goalBanner: { control: 'boolean', name: 'Goal banner', table: { category: 'State' } },
        sessionType: { control: 'radio', options: ['goal-setting', 'non-goal-setting'], name: 'Session type', table: { category: 'State' } },
        toast: { control: 'boolean', name: 'Toast', table: { category: 'State' } },
        toastType: { control: 'radio', options: ['assignment-leads', 'goal-setting-warmup'], name: 'Toast type', table: { category: 'State' } },
        scrim1: { control: 'select', options: ['none', ...Object.keys(scrim1ModalMap)], name: 'Scrim 1 modal', table: { category: 'Scrims' } },
        scrim2: { control: 'select', options: ['none', ...Object.keys(scrim2ModalMap)], name: 'Scrim 2 modal (needs Scrim 1)', table: { category: 'Scrims' } },
    },
    args: { viewState: 'loaded', goalBanner: true, sessionType: 'goal-setting', toast: false, toastType: 'assignment-leads', scrim1: 'none', scrim2: 'none' },
};
