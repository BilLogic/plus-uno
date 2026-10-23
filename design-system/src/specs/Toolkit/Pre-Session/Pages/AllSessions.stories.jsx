import React, { useCallback, useEffect, useRef, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import Button from '@/components/actions/Button/Button';
import { PageLayout } from '@/specs/Universal/Pages';
import { createOpenTabsStore, OpenTabsProvider, useOpenTabs } from '@/patterns/Sidebar';
import { SessionInfo_PostSignUp } from '../Modals/SessionDetailsAllUser/SessionDetails.stories';
import { StatCard } from '../Cards/OverviewCard.stories';
import { AllSessionsTableRow, AllSessionsTableHeaderRow } from '../Tables/AllSessionsTable.stories';
import { NavHorizontal } from '../Tables/NavHorizontal.stories';
import { SessionStatusFilter } from '../Elements/Filters/SessionStatusFilter.stories';
import { TutorFilter } from '../Elements/Filters/TutorFilter/TutorFilter.stories';
import { SiteFilter } from '../Elements/Filters/SiteFilter.stories';
import { TimeframeFilter } from '../Elements/Filters/TimeframeFilter.stories';
import { SectionTitle, UpdateAlert, ModalScrim } from './_pageHelpers';

/*
 * Open tabs. "Details" on a row opens that session as a temporary tab under
 * Toolkit › Sessions, and the selected session tab is what the page shows: the
 * existing Session Details mock, over the page. Escape or a press on the scrim
 * closes it and selects Sessions again; the tab stays open in the sidebar until
 * its × closes it. Nothing here touches the URL.
 */
const SESSIONS = 'sessions';
const SESSIONS_ROUTE = '/toolkit/sessions';

/** Rows share a school and date in this mock, so a repeated title gets its row number. */
const sessionTitles = (sessions) => sessions.map((s, i) => {
    const base = `${s.school} · ${s.date}`;
    const repeated = sessions.filter((other) => `${other.school} · ${other.date}` === base).length > 1;
    return repeated ? `${base} (${i + 1})` : base;
});

const useSessionTabs = (sessions) => {
    const tabs = useOpenTabs();
    const titles = sessionTitles(sessions);
    const openDetails = (index) => tabs.open(SESSIONS, {
        id: `row-${index + 1}`,
        title: titles[index],
        href: SESSIONS_ROUTE,
        status: sessions[index].status === 'in-progress' ? 'live' : undefined,
    });
    const shownId = tabs.selectedId?.startsWith(`${SESSIONS}:`) ? tabs.selectedId : null;
    const { select } = tabs;
    const closeDetails = useCallback(() => select(SESSIONS), [select]);
    return { openDetails, shownId, closeDetails };
};

/** The opened session's details: the existing Session Details mock, over the page. */
const OpenedSessionDetails = ({ shownId, onClose }) => {
    const dialog = useRef(null);
    useEffect(() => {
        if (!shownId) return undefined;
        dialog.current?.focus();
        const onKey = (event) => { if (event.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [shownId, onClose]);
    if (!shownId) return null;
    return (
        <div onClick={onClose}>
            <ModalScrim open>
                <div
                    ref={dialog}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Session details"
                    tabIndex={-1}
                    onClick={(event) => event.stopPropagation()}
                >
                    <SessionInfo_PostSignUp />
                </div>
            </ModalScrim>
        </div>
    );
};

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Pre-Session/Pages/All Sessions',
    parameters: {
        layout: 'padded',
    },
};



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
            <h2 className="h4" style={{ color: 'var(--color-on-surface)', margin: 0 }}>Your Sessions</h2>
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
                    <SessionStatusFilter defaultValue={filters.status} />
                    <TutorFilter value={filters.tutor} onChange={(val) => onFilterChange?.('tutor', val)} />
                    <SiteFilter defaultValue={filters.school} />
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
    status: [],
    tutor: [],
    school: [],
    timeframe: 'this_week'
};

/**
 * All Sessions Page - Overview/Static Version
 * Full layout using PageLayout component with sidebar and top bar
 * This is the supervisor view showing the All Sessions tab
 */
const OverviewPage = () => {
    const { openDetails, shownId, closeDetails } = useSessionTabs(defaultSessions);
    return (
    <div style={{ position: 'relative', maxWidth: '1440px', height: '100%', margin: '0 auto' }}>
        <PageLayout
            title="Sessions"
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
                onDetails={openDetails}
            />
        </PageLayout>
        <OpenedSessionDetails shownId={shownId} onClose={closeDetails} />
    </div>
    );
};

export const Overview = () => <OverviewPage />;

/**
 * All Sessions Page - Interactive Version
 * Full layout with working state management for:
 * - Tab switching
 * - Filter changes
 * - Details actions
 * - Breakpoint toggle to preview at different screen sizes
 */
const InteractiveRender = (args) => {
    const showAlert = args.alert;
    const [selectedTab, setSelectedTab] = useState('all-sessions');
    const [filters, setFilters] = useState(defaultFilters);

    const handleFilterChange = (filterKey, value) => {
        setFilters(prev => ({ ...prev, [filterKey]: value }));
    };

    const { openDetails: handleDetails, shownId, closeDetails } = useSessionTabs(defaultSessions);

    const tabs = [
        { id: 'my-sessions', label: 'My sessions', count: 3 },
        { id: 'all-sessions', label: 'All sessions', count: defaultSessions.length },
        { id: 'sign-ups', label: 'Sign-ups', count: 3 },
        { id: 'fill-ins', label: 'Fill-ins', count: 3 },
        { id: 'call-offs', label: 'Call-offs', count: 3 },
    ];

    return (
        <div style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden', borderRadius: 'var(--size-card-radius-sm)' }}>
            <PageLayout
                title="Sessions"
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
                    onAlertClose={() => {}}
                    tabs={tabs}
                    selectedTab={selectedTab}
                    onTabChange={setSelectedTab}
                    sessions={defaultSessions}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onDetails={handleDetails}
                />
            </PageLayout>
            <OpenedSessionDetails shownId={shownId} onClose={closeDetails} />
        </div>
    );
};

export const Interactive = {
    render: InteractiveRender,
    argTypes: {
        alert: { control: 'boolean', name: 'Update alert', table: { category: 'State' } },
    },
    args: { alert: true },
};

/**
 * Open session tabs: "Details" opens the session as a tab under Toolkit ›
 * Sessions and shows its details; a live session's tab carries the Live dot.
 * Escape closes the details and selects Sessions; pressing the tab shows them
 * again. The URL never changes. The story keeps its tabs in its own store.
 */
export const OpenSessionTabs = {
    render: () => {
        const [store] = useState(() => {
            try { sessionStorage.removeItem('story:all-sessions-tabs'); } catch { /* blocked storage */ }
            return createOpenTabsStore({ key: 'story:all-sessions-tabs' });
        });
        return (
            <OpenTabsProvider store={store}>
                <OverviewPage />
            </OpenTabsProvider>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const url = window.location.href;
        const toolkit = within(canvas.getByRole('navigation', { name: 'Main' })).getByRole('group', { name: 'Toolkit' });

        const details = canvas.getAllByRole('button', { name: 'Details' });
        await userEvent.click(details[0]);
        await userEvent.click(details[1]);
        const first = await within(toolkit).findByRole('link', { name: /^Hogwarts · Tue, Sep 9 \(1\)/ });
        const second = within(toolkit).getByRole('link', { name: /^Hogwarts · Tue, Sep 9 \(2\)/ });
        await expect(second, 'the last opened is selected').toHaveAttribute('aria-current', 'page');
        await expect(within(first).getByRole('img', { name: 'Live' }), 'an in-progress session is live').toBeInTheDocument();
        await expect(canvas.getByRole('dialog', { name: 'Session details' })).toBeInTheDocument();

        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
        await expect(within(toolkit).getByRole('button', { name: /^Sessions$/ })).toHaveAttribute('aria-current', 'page');
        await expect(within(toolkit).getAllByRole('link', { name: /^Hogwarts/ }), 'the tabs stay open').toHaveLength(2);

        await userEvent.click(first);
        await expect(await canvas.findByRole('dialog', { name: 'Session details' })).toBeInTheDocument();
        await expect(first).toHaveAttribute('aria-current', 'page');
        await expect(window.location.href, 'tabs never route').toBe(url);
        await userEvent.keyboard('{Escape}');
    },
};
