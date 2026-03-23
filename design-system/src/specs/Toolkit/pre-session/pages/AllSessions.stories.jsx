import React, { useState } from 'react';
import Button from '../../../../components/Button/Button';
import { PageLayout } from '../../../../specs/Universal/Pages';
import { StatCard } from '../cards/OverviewCard.stories';
import { AllSessionsTableRow, AllSessionsTableHeaderRow } from '../tables/AllSessionsTable.stories';
import { NavHorizontal } from '../tables/NavHorizontal.stories';
import { SessionStatusFilter } from '../elements/Filters/SessionStatusFilter.stories';
import { TutorFilter } from '../elements/Filters/Tutor Filter/TutorFilter.stories';
import { SiteFilter } from '../elements/Filters/SiteFilter.stories';
import { TimeframeFilter } from '../elements/Filters/TimeframeFilter.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Pages/All Sessions',
    parameters: {
        layout: 'padded',
    },
};

/**
 * Update Alert Component
 * Uses semantic tokens:
 * - Background: --color-primary-container-state-16 (primary tonal)
 * - Border: --color-primary (primary color)
 * - Radius: --size-modal-radius-md (modal/card radius)
 * - Padding: --size-card-pad-y-sm, --size-card-pad-x-sm (card padding)
 * - Gap: --size-card-gap-sm (internal card gap)
 * - Typography: h6, body2-txt
 */
const UpdateAlert = ({ title, description, onClose }) => (
    <div
        style={{
            backgroundColor: 'var(--color-primary-container-state-16)',
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--size-modal-radius-md)',
            padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
            display: 'flex',
            gap: 'var(--size-card-gap-sm)',
            width: '100%'
        }}
    >
        <div
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-element-gap-sm)'
            }}
        >
            <span className="h6" style={{ color: 'var(--color-on-surface)' }}>
                {title}
            </span>
            <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>
                {description}
            </span>
        </div>
        <button
            onClick={onClose}
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                alignSelf: 'flex-start'
            }}
        >
            <i
                className="fa-solid fa-xmark"
                style={{
                    fontSize: 'var(--font-size-fa-h6-solid)',
                    color: 'var(--color-on-surface-variant)'
                }}
            />
        </button>
    </div>
);

/**
 * Section Title with Info Icon
 */
const SectionTitle = ({ title }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-element-gap-sm)' }}>
        <h4 className="h4 font-weight-semibold" style={{ color: 'var(--color-on-surface)', margin: 0 }}>
            {title}
        </h4>
        <i
            className="fa-solid fa-circle-info"
            style={{
                fontSize: 'var(--font-size-fa-h6-solid)',
                color: 'var(--color-on-surface-variant)',
                cursor: 'pointer'
            }}
        />
    </div>
);

/**
 * Main Content Area for All Sessions Page
 * Uses semantic tokens:
 * - Section gap: --size-section-gap-lg (between major sections)
 * - Section gap: --size-section-gap-sm (within table section)
 * - Card gap: --size-card-gap-md (between stat cards)
 * - Element gap: --size-element-gap-sm (between filter dropdowns)
 */
const MainContent = ({
    showAlert = true,
    onAlertClose,
    tabs,
    selectedTab,
    onTabChange,
    sessions,
    filters,
    onFilterChange,
    onDetails
}) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)',
            width: '100%'
        }}
    >
        {/* Update Alert */}
        {showAlert && (
            <UpdateAlert
                title="Update on your call-off request"
                description="There's an update to your recent call-off request. Please visit the Call-offs tab to review the latest status and details."
                onClose={onAlertClose}
            />
        )}

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 className="h4" style={{ color: 'var(--color-on-surface)', margin: 0 }}>Your Sessions</h4>
            <Button 
                size="default" 
                fill="filled" 
                style="primary" 
                leadingVisual="calendar-plus"
                text="Fill in"
            />
        </div>

        {/* Stat Cards - using card gap token */}
        <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)' }}>
            <StatCard title="Today's sessions" value="1" icon="fa-solid fa-calendar-day" />
            <StatCard title="Pending call-offs" value="2" icon="fa-solid fa-hourglass-half" />
            <StatCard title="Open for fill-ins" value="23" icon="fa-solid fa-right-to-bracket" />
        </div>

        {/* Nav Tabs - supervisor view with All sessions tab */}
        <NavHorizontal tabs={tabs} selectedTab={selectedTab} onTabChange={onTabChange} user="supervisor" />

        {/* Table Section - using section gap token */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-sm)' }}>
            {/* Table Header with Title and Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <SectionTitle title="All Sessions" />
                <div style={{ display: 'flex', gap: 'var(--size-element-gap-sm)' }}>
                    <SessionStatusFilter initialSelection={filters.status} />
                    <TutorFilter value={filters.tutor} onChange={(val) => onFilterChange?.('tutor', val)} />
                    <SiteFilter initialSelection={filters.school} />
                    <TimeframeFilter value={filters.timeframe} onChange={(val) => onFilterChange?.('timeframe', val)} />
                </div>
            </div>

            {/* All Sessions Table */}
            <div>
                <AllSessionsTableHeaderRow />
                {sessions.map((session, index) => (
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
                        onDetails={() => onDetails?.(index)}
                    />
                ))}
            </div>
        </div>
    </div>
);

// Default tabs for supervisor view (includes "All sessions")
const defaultTabs = [
    { id: 'my-sessions', label: 'My sessions', count: 3 },
    { id: 'all-sessions', label: 'All sessions', count: 3 },
    { id: 'sign-ups', label: 'Sign-ups', count: 3 },
    { id: 'fill-ins', label: 'Fill-ins', count: 3 },
    { id: 'call-offs', label: 'Call-offs', count: 3 },
];

// Default session data
const defaultSessions = [
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'in-progress', tutorCount: '1/5', needLead: false, studentCount: 25 },
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'in-progress', tutorCount: '1/5', needLead: false, studentCount: 25 },
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'in-progress', tutorCount: '1/5', needLead: false, studentCount: 25 },
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
 * All Sessions Page - Overview/Static Version
 * Full layout using PageLayout component with sidebar and top bar
 * This is the supervisor view showing the All Sessions tab
 */
export const Overview = () => (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
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
            id="all-sessions-page"
        >
            <MainContent
                showAlert={true}
                onAlertClose={() => {}}
                tabs={defaultTabs}
                selectedTab="all-sessions"
                onTabChange={() => {}}
                sessions={defaultSessions}
                filters={defaultFilters}
                onFilterChange={() => {}}
                onDetails={() => {}}
            />
        </PageLayout>
    </div>
);

/**
 * All Sessions Page - Interactive Version
 * Full layout with working state management for:
 * - Tab switching
 * - Filter changes
 * - Details actions
 * - Breakpoint toggle to preview at different screen sizes
 */
export const Interactive = () => {
    const [showAlert, setShowAlert] = useState(true);
    const [selectedTab, setSelectedTab] = useState('all-sessions');
    const [breakpoint, setBreakpoint] = useState('xl');
    const [filters, setFilters] = useState(defaultFilters);

    // Breakpoint widths from design system
    const breakpointWidths = {
        'md': 768,
        'lg': 1024,
        'xl': 1440,
    };

    const handleFilterChange = (filterKey, value) => {
        setFilters(prev => ({ ...prev, [filterKey]: value }));
    };

    const handleDetails = (index) => {
        alert(`Viewing details for session ${index + 1}`);
    };

    const tabs = [
        { id: 'my-sessions', label: 'My sessions', count: 3 },
        { id: 'all-sessions', label: 'All sessions', count: defaultSessions.length },
        { id: 'sign-ups', label: 'Sign-ups', count: 3 },
        { id: 'fill-ins', label: 'Fill-ins', count: 3 },
        { id: 'call-offs', label: 'Call-offs', count: 3 },
    ];

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
                {/* Alert Toggle */}
                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
                    Alert:
                </span>
                <Button
                    text={showAlert ? 'On' : 'Off'}
                    size="small"
                    style="primary"
                    fill={showAlert ? 'filled' : 'outline'}
                    onClick={() => setShowAlert(!showAlert)}
                />

                <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-outline-variant)', margin: '0 var(--size-element-gap-sm)' }} />

                {/* Breakpoint Toggle */}
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
                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', marginLeft: 'auto' }}>
                    Current: <strong>{breakpointWidths[breakpoint]}px</strong>
                </span>
            </div>

            {/* Page Preview Container */}
            <div style={{
                width: `${breakpointWidths[breakpoint]}px`,
                margin: '0 auto',
                border: '2px dashed var(--color-outline-variant)',
                borderRadius: 'var(--size-card-radius-sm)',
                overflow: 'hidden',
                transition: 'width 0.3s ease'
            }}>
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
                    id="all-sessions-page-interactive"
                >
                    <MainContent
                        showAlert={showAlert}
                        onAlertClose={() => setShowAlert(false)}
                        tabs={tabs}
                        selectedTab={selectedTab}
                        onTabChange={setSelectedTab}
                        sessions={defaultSessions}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onDetails={handleDetails}
                    />
                </PageLayout>
            </div>
        </div>
    );
};
