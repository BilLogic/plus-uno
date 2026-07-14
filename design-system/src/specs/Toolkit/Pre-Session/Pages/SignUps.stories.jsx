import React, { useState } from 'react';
import Button from '@/components/actions/Button/Button';
import { PageLayout } from '@/specs/Universal/Pages';
import { StatCard } from '../Cards/OverviewCard.stories';
import { SignInTableRow, SignInTableHeaderRow } from '../Tables/SignInTable.stories';
import { NavHorizontal } from '../Tables/NavHorizontal.stories';
import { TutorFilter } from '../Elements/Filters/TutorFilter/TutorFilter.stories';
import { SiteFilter } from '../Elements/Filters/SiteFilter.stories';
import { DaysFilter } from '../Elements/Filters/DaysFilter/DaysFilter.stories';
import { CapacityFilter } from '../Elements/Filters/CapacityFilter/CapacityFilter.stories';
import { SectionTitle } from './_pageHelpers';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Pre-Session/Pages/Sign-Ups',
    parameters: {
        layout: 'padded',
    },
};


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
    { id: 'reflections', label: 'Reflections', count: 20 },
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
    <div style={{ maxWidth: '1440px', height: '100%', margin: '0 auto' }}>
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
const InteractiveRender = (args) => {
    const selectedTab = args.tab;
    const [filters, setFilters] = useState(defaultFilters);

    const handleFilterChange = (filterKey, value) => {
        setFilters(prev => ({ ...prev, [filterKey]: value }));
    };

    const tabs = [
        { id: 'my-sessions', label: 'My sessions', count: 3 },
        { id: 'sign-ups', label: 'Sign-ups', count: defaultSessions.length },
        { id: 'fill-ins', label: 'Fill-ins', count: 3 },
        { id: 'call-offs', label: 'Call-offs', count: 3 },
        { id: 'reflections', label: 'Reflections', count: 20 },
    ];

    return (
        <div style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden', borderRadius: 'var(--size-card-radius-sm)' }}>
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
                    onTabChange={() => {}}
                    sessions={defaultSessions}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                />
            </PageLayout>
        </div>
    );
};

export const Interactive = {
    render: InteractiveRender,
    argTypes: {
        tab: {
            control: 'select',
            options: ['my-sessions', 'sign-ups', 'fill-ins', 'call-offs', 'reflections'],
            name: 'Active tab',
            table: { category: 'State' },
        },
    },
    args: { tab: 'sign-ups' },
};
