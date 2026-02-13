import React from 'react';
import Button from '../../../../components/Button/Button';
import Dropdown from '../../../../components/Dropdown/Dropdown';
import { PageLayout } from '../../../Universal/Pages';
import { SessionControls } from '../elements/SessionControls.stories';

export default {
    title: 'Specs/Toolkit/In-Session/Pages/Student Dashboard',
    parameters: {
        layout: 'padded',
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
 * Empty State Placeholder
 * Centered content area shown when no students are assigned yet
 * 
 * Design tokens:
 * - Icon: fa-person-running, 128px, color: --color-on-surface-variant (opacity ~0.2)
 * - Title: h4 (Lato SemiBold, 24px, line-height 1.333), color: --color-on-surface
 * - Body: body1-txt (Merriweather Sans Light, 16px, line-height 1.5), color: --color-on-surface
 * - Button: outlined primary, default size with leading icon
 * - Content width: 332px centered
 * - Gap between text and button: --size-spacing-within-component-spacer-4-5 (16px)
 */
const EmptyStatePlaceholder = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '672px',
            maxWidth: '896px',
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
                className="fa-solid fa-person-running"
                style={{
                    fontSize: '128px',
                    lineHeight: 1.875,
                    color: 'var(--color-on-surface-variant)',
                    opacity: 0.2,
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
                <h4
                    className="h4"
                    style={{
                        color: 'var(--color-on-surface)',
                        margin: 0,
                        width: '100%',
                    }}
                >
                    Hang tight – your students are on the way.
                </h4>
                <p
                    className="body1-txt"
                    style={{
                        color: 'var(--color-on-surface)',
                        margin: 0,
                        width: '100%',
                    }}
                >
                    The lead tutor is finalizing assignments. As soon as you're matched with students, they'll appear here and you can start your session.
                </p>
            </div>

            {/* Refresh Button */}
            <Button
                text="Refresh Page"
                style="primary"
                fill="outline"
                size="default"
                leadingVisual="rotate"
                onClick={() => window.location.reload()}
            />
        </div>
    </div>
);

/**
 * Empty State Main Content Area
 * Uses semantic tokens:
 * - Surface container gap: --size-surface-container-gap-sm (16px)
 * - Surface container padding: --size-surface-container-pad-x-sm, --size-surface-container-pad-y-sm
 * - Section gap: --size-section-gap-lg (between major sections)
 * - Element gap: --size-element-gap-sm (between controls)
 */
const EmptyStateMainContent = ({
    currentSession,
    sessions,
    statusFilter,
    onSessionChange,
    onStatusFilterChange,
    isInteractive = false,
    isLeadTutor = true
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

        {/* Empty State Content - centered in remaining space */}
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
            }}
        >
            <EmptyStatePlaceholder />
        </div>
    </div>
);

// Default session data
const defaultSessions = [
    { id: 1, school: 'Hogwarts', teacher: 'Prof. Snape', time: '11:25 - 12:25pm', date: '12/21/2023' },
    { id: 2, school: 'Hogwarts', teacher: 'Prof. McGonagall', time: '1:00 - 2:00pm', date: '12/21/2023' },
    { id: 3, school: 'Beauxbatons', teacher: 'Mme. Maxime', time: '3:00 - 4:00pm', date: '12/21/2023' }
];

/**
 * Student Dashboard - Empty State
 * Shows the page when a tutor has checked in but has not yet been assigned any students.
 * The lead tutor is finalizing assignments.
 * 
 * Layout matches the default Student Dashboard but replaces the student table
 * with a centered empty state placeholder containing:
 * - Running person icon (fa-person-running)
 * - Title: "Hang tight – your students are on the way."
 * - Description text about lead tutor finalizing assignments
 * - Refresh Page button (outlined primary)
 */
export const EmptyState = () => (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        <PageLayout
            topBarConfig={{
                breadcrumbs: [
                    { text: 'Home', href: '#' },
                    { text: 'Students' }
                ],
                user: { name: 'John Doe', role: 'Lead' }
            }}
            sidebarConfig={{
                user: 'lead',
                activeTab: 'sessions'
            }}
            id="student-dashboard-empty-state"
        >
            <EmptyStateMainContent
                currentSession={defaultSessions[0]}
                sessions={defaultSessions}
                statusFilter="all"
                onSessionChange={() => { }}
                onStatusFilterChange={() => { }}
                isLeadTutor={true}
            />
        </PageLayout>
    </div>
);

// Non-story exports for reuse — attach to default export to avoid Storybook treating them as stories
EmptyState.EmptyStatePlaceholder = EmptyStatePlaceholder;
EmptyState.EmptyStateMainContent = EmptyStateMainContent;
