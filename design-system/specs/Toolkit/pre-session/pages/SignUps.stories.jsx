import React, { useState } from 'react';
import Button from '../../../../../packages/plus-ds/src/components/Button/Button';
import { PageLayout } from '../../../../../packages/plus-ds/src/specs/Universal/Pages';
import { StatCard } from '../cards/OverviewCard.stories';
import { SignInTableRow, SignInTableHeaderRow } from '../tables/SignInTable.stories';
import { NavHorizontal } from '../tables/NavHorizontal.stories';
import { TutorFilter } from '../elements/Filters/Tutor Filter/TutorFilter.stories';
import { SiteFilter } from '../elements/Filters/SiteFilter.stories';
import { DaysFilter } from '../elements/Filters/Days Filter/DaysFilter.stories';
import { CapacityFilter } from '../elements/Filters/Capacity Filter/CapacityFilter.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Pages/Sign-Ups',
    parameters: {
        layout: 'padded',
    },
};

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
 * Main Content Area for Sign-Ups Page
 * Uses semantic tokens:
 * - Section gap: --size-section-gap-lg (between major sections)
 * - Section gap: --size-section-gap-sm (within table section)
 * - Card gap: --size-card-gap-md (between stat cards)
 * - Element gap: --size-element-gap-sm (between filter dropdowns)
 */
const MainContent = ({
    tabs,
    selectedTab,
    onTabChange,
    sessions,
    filters,
    onFilterChange
}) => (
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
            <Button size="default" fill="filled" style="primary" leadingIcon="calendar-plus">
                Fill in
            </Button>
        </div>

        {/* Stat Cards - using card gap token */}
        <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)' }}>
            <StatCard title="Today's sessions" value="1" icon="fa-solid fa-calendar-day" />
            <StatCard title="Pending call-offs" value="2" icon="fa-solid fa-hourglass-half" />
            <StatCard title="Open for fill-ins" value="23" icon="fa-solid fa-right-to-bracket" />
        </div>

        {/* Nav Tabs */}
        <NavHorizontal tabs={tabs} selectedTab={selectedTab} onTabChange={onTabChange} />

        {/* Table Section - using section gap token */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-sm)' }}>
            {/* Table Header with Title and Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <SectionTitle title="Session Sign-ups" />
                <div style={{ display: 'flex', gap: 'var(--size-element-gap-sm)' }}>
                    <TutorFilter value={filters.tutor} onChange={(val) => onFilterChange?.('tutor', val)} />
                    <SiteFilter initialSelection={filters.school} />
                    <DaysFilter value={filters.days} onChange={(val) => onFilterChange?.('days', val)} />
                    <CapacityFilter value={filters.capacity} onChange={(val) => onFilterChange?.('capacity', val)} />
                </div>
            </div>

            {/* Sign-In Table */}
            <div>
                <SignInTableHeaderRow />
                {sessions.map((session, index) => (
                    <SignInTableRow
                        key={index}
                        day={session.day}
                        timeRange={session.timeRange}
                        school={session.school}
                        tutorCount={session.tutorCount}
                        onSignUp={() => { }}
                    />
                ))}
            </div>
        </div>
    </div>
);

// Default data
const defaultTabs = [
    { id: 'my-sessions', label: 'My sessions', count: 3 },
    { id: 'sign-ups', label: 'Sign-ups', count: 3 },
    { id: 'fill-ins', label: 'Fill-ins', count: 3 },
    { id: 'call-offs', label: 'Call-offs', count: 3 },
    { id: 'reflections', label: 'Reflections' },
];

const defaultSessions = [
    { day: 'Mondays', timeRange: '1:00 PM - 1:50 PM', school: 'Central High School', tutorCount: '1/5' },
    { day: 'Mondays', timeRange: '1:00 PM - 1:50 PM', school: 'Central High School', tutorCount: '1/5' },
    { day: 'Mondays', timeRange: '1:00 PM - 1:50 PM', school: 'Central High School', tutorCount: '1/5' },
    { day: 'Mondays', timeRange: '1:00 PM - 1:50 PM', school: 'Central High School', tutorCount: '1/5' },
    { day: 'Mondays', timeRange: '1:00 PM - 1:50 PM', school: 'Central High School', tutorCount: '1/5' },
    { day: 'Mondays', timeRange: '1:00 PM - 1:50 PM', school: 'Central High School', tutorCount: '1/5' },
    { day: 'Mondays', timeRange: '1:00 PM - 1:50 PM', school: 'Central High School', tutorCount: '1/5' },
    { day: 'Mondays', timeRange: '1:00 PM - 1:50 PM', school: 'Central High School', tutorCount: '1/5' },
    { day: 'Mondays', timeRange: '1:00 PM - 1:50 PM', school: 'Central High School', tutorCount: '1/5' },
];

const defaultFilters = {
    tutor: 'All tutors',
    school: 'All schools',
    days: 'All days',
    capacity: 'Not filled'
};

/**
 * Sign-Ups Page - Overview/Static Version
 * Full layout using PageLayout component with sidebar and top bar
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
                user: 'tutor',
                activeTab: 'sessions'
            }}
            id="sign-ups-page"
        >
            <MainContent
                tabs={defaultTabs}
                selectedTab="sign-ups"
                onTabChange={() => { }}
                sessions={defaultSessions}
                filters={defaultFilters}
                onFilterChange={() => { }}
            />
        </PageLayout>
    </div>
);

/**
 * Sign-Ups Page - Interactive Version
 * Full layout with working state management for:
 * - Tab switching
 * - Filter changes
 * - Breakpoint toggle to preview at different screen sizes
 */
export const Interactive = () => {
    const [selectedTab, setSelectedTab] = useState('sign-ups');
    const [breakpoint, setBreakpoint] = useState('xxl');
    const [filters, setFilters] = useState(defaultFilters);

    // Breakpoint widths from design system
    const breakpointWidths = {
        'md': 768,
        'lg': 992,
        'xl': 1200,
        'xxl': 1400,
    };

    const handleFilterChange = (filterKey, value) => {
        setFilters(prev => ({ ...prev, [filterKey]: value }));
    };

    const tabs = [
        { id: 'my-sessions', label: 'My sessions', count: 3 },
        { id: 'sign-ups', label: 'Sign-ups', count: defaultSessions.length },
        { id: 'fill-ins', label: 'Fill-ins', count: 3 },
        { id: 'call-offs', label: 'Call-offs', count: 3 },
        { id: 'reflections', label: 'Reflections' },
    ];

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
                        user: 'tutor',
                        activeTab: 'sessions'
                    }}
                    id="sign-ups-page-interactive"
                >
                    <MainContent
                        tabs={tabs}
                        selectedTab={selectedTab}
                        onTabChange={setSelectedTab}
                        sessions={defaultSessions}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                    />
                </PageLayout>
            </div>
        </div>
    );
};
