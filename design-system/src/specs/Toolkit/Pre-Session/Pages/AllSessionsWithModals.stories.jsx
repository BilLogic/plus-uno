import React, { useState } from 'react';
import Button from '@/components/actions/Button/Button';
import { PageLayout } from '@/specs/Universal/Pages';
import { StatCard } from '../Cards/OverviewCard.stories';
import { AllSessionsTableRow, AllSessionsTableHeaderRow } from '../Tables/AllSessionsTable.stories';
import { NavHorizontal } from '../Tables/NavHorizontal.stories';
import { SessionStatusFilter } from '../Elements/Filters/SessionStatusFilter.stories';
import { TutorFilter } from '../Elements/Filters/TutorFilter/TutorFilter.stories';
import { SiteFilter } from '../Elements/Filters/SiteFilter.stories';
import { TimeframeFilter } from '../Elements/Filters/TimeframeFilter.stories';

// Import Session Detail modals
import * as SessionDetailsModals from '../Modals/SessionDetailsAllUser/SessionDetails.stories';
import * as OneTimeAttendeesCompletedModal from '../Modals/SessionDetailsAllUser/OneTimeAttendeesCompleted.stories';
import { SectionTitle, ModalScrim, MissingModal } from './_pageHelpers';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Pre-Session/Pages/All Sessions',
    parameters: {
        layout: 'padded',
    },
};

// ─── Shared Components ───────────────────────────────────────────


// Default data
const defaultTabs = [
    { id: 'my-sessions', label: 'My sessions', count: 3 },
    { id: 'all-sessions', label: 'All sessions', count: 3 },
    { id: 'sign-ups', label: 'Sign-ups', count: 3 },
    { id: 'fill-ins', label: 'Fill-ins', count: 3 },
    { id: 'call-offs', label: 'Call-offs', count: 3 },
];

const defaultSessions = [
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'in-progress', tutorCount: '1/5', needLead: false, studentCount: 25 },
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'in-progress', tutorCount: '1/5', needLead: false, studentCount: 25 },
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'in-progress', tutorCount: '1/5', needLead: false, studentCount: 25 },
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'in-progress', tutorCount: '1/5', needLead: false, studentCount: 25 },
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'in-progress', tutorCount: '1/5', needLead: false, studentCount: 25 },
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'in-progress', tutorCount: '1/5', needLead: false, studentCount: 25 },
];

const defaultFilters = {
    status: 'All status',
    tutor: 'All tutors',
    school: 'All schools',
    timeframe: 'This week'
};

/**
 * Background page content for the modal overlay
 */
const BackgroundContent = ({ tabs, selectedTab }) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)',
            width: '100%'
        }}
    >
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 className="h4" style={{ color: 'var(--color-on-surface)', margin: 0 }}>Your Sessions</h4>
            <Button size="default" fill="filled" style="primary" leadingVisual="calendar-plus" text="Fill in" />
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)' }}>
            <StatCard title="Today's sessions" value="1" icon="fa-solid fa-calendar-day" />
            <StatCard title="Pending call-offs" value="2" icon="fa-solid fa-hourglass-half" />
            <StatCard title="Open for fill-ins" value="23" icon="fa-solid fa-right-to-bracket" />
        </div>

        {/* Nav Tabs */}
        <NavHorizontal tabs={tabs} selectedTab={selectedTab} onTabChange={() => {}} user="supervisor" />

        {/* Table Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <SectionTitle title="All Sessions" />
                <div style={{ display: 'flex', gap: 'var(--size-element-gap-sm)' }}>
                    <SessionStatusFilter initialSelection={defaultFilters.status} />
                    <TutorFilter value={defaultFilters.tutor} />
                    <SiteFilter initialSelection={defaultFilters.school} />
                    <TimeframeFilter value={defaultFilters.timeframe} />
                </div>
            </div>

            <div>
                <AllSessionsTableHeaderRow />
                {defaultSessions.map((session, index) => (
                    <AllSessionsTableRow
                        key={index}
                        date={session.date}
                        timeRange={session.timeRange}
                        school={session.school}
                        teacher={session.teacher}
                        status={session.status}
                        tutorCount={session.tutorCount}
                        needLead={session.needLead}
                        studentCount={session.studentCount}
                        onDetails={() => {}}
                    />
                ))}
            </div>
        </div>
    </div>
);

// ─── Modal Mapping ───────────────────────────────────────────────

const modalMap = {
    'one-time': {
        'info': {
            'upcoming': SessionDetailsModals.OneTimeInfo_Upcoming,
        },
        'attendees': {
            'upcoming': SessionDetailsModals.OneTimeAttendees_Upcoming,
            'completed': OneTimeAttendeesCompletedModal.OneTimeAttendeesCompleted,
        },
    },
};

// ─── Story ───────────────────────────────────────────────────────

/**
 * With Modals
 * All Sessions page with modal overlay showing Session Detail modals.
 * Controls:
 * - Session Type: One-time
 * - Tab: Info, Attendees
 * - Session Status: Upcoming, Completed
 */
export const WithModals = (args) => {
    const [sessionType, setSessionType] = useState('one-time');
    const [tab, setTab] = useState('info');
    const [sessionStatus, setSessionStatus] = useState('upcoming');
    const [breakpoint, setBreakpoint] = useState('xl');

    const breakpointWidths = {
        'md': 768,
        'lg': 1024,
        'xl': 1440,
    };

    // Session type options
    const sessionTypes = [
        { id: 'one-time', label: 'One-time' },
    ];

    // Tab options
    const tabOptions = [
        { id: 'info', label: 'Info' },
        { id: 'attendees', label: 'Attendees' },
    ];

    // Session status options
    const statusOptions = [
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'completed', label: 'Completed' },
    ];

    // Get the current modal component based on selections
    const getModalComponent = () => {
        const typeModals = modalMap[sessionType];
        if (!typeModals) return null;

        const tabModals = typeModals[tab];
        if (!tabModals) return null;

        return tabModals[sessionStatus] || null;
    };

    const ModalComponent = getModalComponent();

    // Check which combinations are available
    const isAvailable = (type, t, status) => {
        return modalMap[type]?.[t]?.[status] != null;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
            {/* Controls */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-element-gap-md)',
                padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                backgroundColor: 'var(--color-surface-container-low)',
                borderRadius: 'var(--size-card-radius-sm)',
            }}>
                {/* Breakpoint Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-element-gap-md)', flexWrap: 'wrap' }}>
                    <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600, minWidth: '120px' }}>
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

                {/* Session Type Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-element-gap-md)', flexWrap: 'wrap' }}>
                    <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600, minWidth: '120px' }}>
                        Session Type:
                    </span>
                    {sessionTypes.map(type => (
                        <Button
                            key={type.id}
                            text={type.label}
                            size="small"
                            style="primary"
                            fill={sessionType === type.id ? 'filled' : 'ghost'}
                            onClick={() => setSessionType(type.id)}
                        />
                    ))}
                </div>

                {/* Tab Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-element-gap-md)', flexWrap: 'wrap' }}>
                    <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600, minWidth: '120px' }}>
                        Tab:
                    </span>
                    {tabOptions.map(t => (
                        <Button
                            key={t.id}
                            text={t.label}
                            size="small"
                            style="primary"
                            fill={tab === t.id ? 'filled' : 'ghost'}
                            onClick={() => setTab(t.id)}
                        />
                    ))}
                </div>

                {/* Session Status Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-element-gap-md)', flexWrap: 'wrap' }}>
                    <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600, minWidth: '120px' }}>
                        Session Status:
                    </span>
                    {statusOptions.map(status => (
                        <Button
                            key={status.id}
                            text={status.label}
                            size="small"
                            style="primary"
                            fill={sessionStatus === status.id ? 'filled' : 'ghost'}
                            onClick={() => setSessionStatus(status.id)}
                        />
                    ))}
                </div>

                {/* Current State Info */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--size-element-gap-lg)',
                    padding: 'var(--size-element-pad-y-md) 0',
                    borderTop: '1px solid var(--color-outline-variant)',
                }}>
                    <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Showing: <strong>{sessionType} / {tab} / {sessionStatus}</strong>
                    </span>
                    {!ModalComponent && (
                        <span className="body2-txt" style={{ color: 'var(--color-danger)' }}>
                            No modal available for this combination
                        </span>
                    )}
                </div>
            </div>

            {/* Page Preview with Modal */}
            <div style={{
                position: 'relative',
                width: `${breakpointWidths[breakpoint]}px`,
                margin: '0 auto',
                border: '2px dashed var(--color-outline-variant)',
                borderRadius: 'var(--size-card-radius-sm)',
                overflow: 'hidden',
                transition: 'width 0.3s ease'
            }}>
                {/* Background Page */}
                <PageLayout
                    topBarConfig={{
                        breadcrumbs: [
                            { text: 'Home', href: '#' },
                            { text: 'Sessions' }
                        ],
                        user: { name: 'John Doe', role: 'Lead' }
                    }}
                    sidebarConfig={{
                        user: 'supervisor',
                        activeTab: 'sessions'
                    }}
                    id="all-sessions-with-modals"
                >
                    <BackgroundContent
                        tabs={defaultTabs}
                        selectedTab="all-sessions"
                    />
                </PageLayout>

                {/* Scrim Overlay + Modal */}
                <ModalScrim open={args.open}>
                    {ModalComponent ? <ModalComponent /> : <MissingModal>No modal available for: {sessionType} / {tab} / {sessionStatus}</MissingModal>}
                </ModalScrim>
            </div>
        </div>
    );
};

WithModals.args = { open: false };
WithModals.argTypes = {
    open: { control: 'boolean', description: 'Show the modal overlay on top of the page' },
};
