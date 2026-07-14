import React, { useState } from 'react';
import Button from '@/components/actions/Button/Button';
import { PageLayout } from '@/specs/Universal/Pages';
import { StatCard } from '../Cards/OverviewCard.stories';
import { FillInTableRow, FillInTableHeaderRow } from '../Tables/FillInTable.stories';
import { NavHorizontal } from '../Tables/NavHorizontal.stories';
import { SiteFilter } from '../Elements/Filters/SiteFilter.stories';
import { CapacityFilter } from '../Elements/Filters/CapacityFilter/CapacityFilter.stories';
import { TutorFilter } from '../Elements/Filters/TutorFilter/TutorFilter.stories';
import { SectionTitle } from './_pageHelpers';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Pre-Session/Pages/Fill-In',
    parameters: {
        layout: 'padded',
    },
};


/**
 * Main Content Area for Fill-In Page
 * Uses semantic tokens:
 * - Section gap: --size-section-gap-lg (between major sections)
 * - Section gap: --size-section-gap-sm (within table section)
 * - Card gap: --size-card-gap-md (between stat cards)
 * - Element gap: --size-element-gap-sm (between filter dropdowns)
 * 
 * Props:
 * - user: 'tutor' | 'supervisor' - determines page header and filters
 */
const MainContent = ({
    tabs,
    selectedTab,
    onTabChange,
    sessions,
    filters,
    onFilterChange,
    onFillIn,
    user = 'tutor'
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
            <Button 
                size="default" 
                fill="filled" 
                style="primary" 
                leadingVisual="calendar-plus" 
                text={user === 'supervisor' ? 'Recruit / Fill in' : 'Fill in'} 
            />
        </div>

        {/* Stat Cards - using card gap token */}
        <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)' }}>
            <StatCard title="Today's sessions" value="1" icon="fa-solid fa-calendar-day" />
            <StatCard title="Pending call-offs" value="2" icon="fa-solid fa-hourglass-half" />
            <StatCard title="Open for fill-ins" value="23" icon="fa-solid fa-right-to-bracket" />
        </div>

        {/* Nav Tabs - pass user prop for tutor/supervisor view */}
        <NavHorizontal tabs={tabs} selectedTab={selectedTab} onTabChange={onTabChange} user={user} />

        {/* Table Section - using section gap token */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-sm)' }}>
            {/* Table Header with Title and Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <SectionTitle title="Session Fill-ins" />
                <div style={{ display: 'flex', gap: 'var(--size-element-gap-sm)' }}>
                    {user === 'supervisor' && (
                        <TutorFilter value={filters.tutor} onChange={(val) => onFilterChange?.('tutor', val)} />
                    )}
                    <SiteFilter initialSelection={filters.school} />
                </div>
            </div>

            {/* Fill-In Table */}
            <div>
                <FillInTableHeaderRow />
                {sessions.map((session, index) => (
                    <FillInTableRow
                        key={index}
                        date={session.date}
                        timeRange={session.timeRange}
                        school={session.school}
                        teacher={session.teacher}
                        tutorCount={session.tutorCount}
                        needLead={session.needLead}
                        onFillIn={() => onFillIn?.(index)}
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
    { id: 'reflections', label: 'Reflections', count: 5 },
];

const defaultSessions = [
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', needLead: false },
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', needLead: false },
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', needLead: false },
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', needLead: false },
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', needLead: false },
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', needLead: false },
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', needLead: false },
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', needLead: false },
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', needLead: false },
];

const defaultFilters = {
    tutor: 'All sessions',
    school: 'All schools'
};

// Supervisor tabs (includes "All sessions")
const supervisorTabs = [
    { id: 'my-sessions', label: 'My sessions', count: 3 },
    { id: 'all-sessions', label: 'All sessions', count: 3 },
    { id: 'sign-ups', label: 'Sign-ups', count: 3 },
    { id: 'fill-ins', label: 'Fill-ins', count: 3 },
    { id: 'call-offs', label: 'Call-offs', count: 3 },
];

/**
 * Fill-In Page - Overview/Static Version (Tutor View)
 * Full layout using PageLayout component with sidebar and top bar
 * Tutor view: No "All sessions" tab, "Fill in" button
 */
export const OverviewTutor = () => (
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
            id="fill-in-page"
        >
            <MainContent
                tabs={defaultTabs}
                selectedTab="fill-ins"
                onTabChange={() => {}}
                sessions={defaultSessions}
                filters={defaultFilters}
                onFilterChange={() => {}}
                onFillIn={() => {}}
                user="tutor"
            />
        </PageLayout>
    </div>
);

/**
 * Fill-In Page - Overview/Static Version (Supervisor View)
 * Full layout using PageLayout component with sidebar and top bar
 * Supervisor view: Includes "All sessions" tab, "Recruit / Fill in" button, "All sessions" filter
 */
export const OverviewSupervisor = () => (
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
                user: 'supervisor',
                activeTab: 'sessions'
            }}
            id="fill-in-page-supervisor"
        >
            <MainContent
                tabs={supervisorTabs}
                selectedTab="fill-ins"
                onTabChange={() => {}}
                sessions={defaultSessions}
                filters={defaultFilters}
                onFilterChange={() => {}}
                onFillIn={() => {}}
                user="supervisor"
            />
        </PageLayout>
    </div>
);

/**
 * Fill-In Page - Interactive Version
 * Full layout with working state management for:
 * - Tab switching
 * - Filter changes
 * - Fill-in actions
 * - Breakpoint toggle to preview at different screen sizes
 */
const InteractiveRender = (args) => {
    const [selectedTab, setSelectedTab] = useState('fill-ins');
    const [filters, setFilters] = useState(defaultFilters);
    const [filledInSessions, setFilledInSessions] = useState([]);
    const userView = args.userView;

    const handleFilterChange = (filterKey, value) => {
        setFilters(prev => ({ ...prev, [filterKey]: value }));
    };

    const handleFillIn = (index) => {
        if (!filledInSessions.includes(index)) {
            setFilledInSessions([...filledInSessions, index]);
        }
    };

    // Tabs based on user view
    const tutorTabsInteractive = [
        { id: 'my-sessions', label: 'My sessions', count: 3 },
        { id: 'sign-ups', label: 'Sign-ups', count: 3 },
        { id: 'fill-ins', label: 'Fill-ins', count: defaultSessions.length },
        { id: 'call-offs', label: 'Call-offs', count: 3 },
        { id: 'reflections', label: 'Reflections', count: 5 },
    ];

    const supervisorTabsInteractive = [
        { id: 'my-sessions', label: 'My sessions', count: 3 },
        { id: 'all-sessions', label: 'All sessions', count: 3 },
        { id: 'sign-ups', label: 'Sign-ups', count: 3 },
        { id: 'fill-ins', label: 'Fill-ins', count: defaultSessions.length },
        { id: 'call-offs', label: 'Call-offs', count: 3 },
    ];

    const tabs = userView === 'supervisor' ? supervisorTabsInteractive : tutorTabsInteractive;

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
                    user: userView,
                    activeTab: 'sessions'
                }}
                id="fill-in-page-interactive"
            >
                <MainContent
                    tabs={tabs}
                    selectedTab={selectedTab}
                    onTabChange={setSelectedTab}
                    sessions={defaultSessions}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onFillIn={handleFillIn}
                    user={userView}
                />
            </PageLayout>
        </div>
    );
};

export const Interactive = {
    render: InteractiveRender,
    argTypes: {
        userView: { control: 'radio', options: ['tutor', 'supervisor'], name: 'User view', table: { category: 'View' } },
    },
    args: { userView: 'tutor' },
};
