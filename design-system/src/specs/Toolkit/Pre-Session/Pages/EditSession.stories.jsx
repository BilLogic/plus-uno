import React, { useState } from 'react';
import Button from '@/components/actions/Button/Button';
import { PageLayout } from '@/specs/Universal/Pages';
import { StatCard } from '../Cards/OverviewCard.stories';
import { TableRow, TableHeaderRow } from '../Tables/MySessions.stories';
import { NavHorizontal } from '../Tables/NavHorizontal.stories';
import { TimeframeFilter } from '../Elements/Filters/TimeframeFilter.stories';
import { SiteFilter } from '../Elements/Filters/SiteFilter.stories';
import SessionManagementSnackbar from '@/components/_internal/SessionManagementSnackbar/SessionManagementSnackbar';
import { UpdateAlert } from './_pageHelpers';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Pre-Session/Pages/Edit Session',
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: `
# Edit Session Page

The Edit Session page is designed for supervisors to edit and manage existing sessions.

## Page Structure

The page uses the **PageLayout** component which provides:
- **Top Bar**: Breadcrumbs and user profile
- **Sidebar**: Navigation for supervisor role
- **Main Content**: Session data and controls
- **Snackbar**: Session updated notifications (can be toggled)

## Components Used

| Component | Source | Purpose |
|-----------|--------|---------|
| PageLayout | Universal/Pages | Page structure with sidebar |
| StatCard | OverviewCard.stories | Dashboard statistics |
| NavHorizontal | NavHorizontal.stories | Tab navigation |
| TableRow/TableHeaderRow | MySessions.stories (tables) | Session data display |
| TimeframeFilter | TimeframeFilter.stories | Date range filtering |
| SiteFilter | SiteFilter.stories | School filtering |
| SessionManagementSnackbar | plus-ds/components | Session updated notifications |
| Button | plus-ds/components | Actions |

## Design System Tokens

### Section Spacing
- \`--size-section-gap-lg\`: Between major sections
- \`--size-section-gap-sm\`: Within table section

### Card Spacing
- \`--size-card-gap-md\`: Between stat cards

### Element Spacing
- \`--size-element-gap-sm\`: Between filter dropdowns

## Interactive Features

The Interactive story includes:
- **Snackbar toggle** - Show/hide session updated notification
- **Tab switching** - Navigate between session views
- **Breakpoint toggle** - Preview at MD (768px), LG (1024px), XL (1440px)
                `,
            },
        },
    },
};


/**
 * Main Content Area
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
    sessions
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
            <div style={{ display: 'flex', gap: 'var(--size-element-gap-sm)' }}>
                <Button size="default" fill="outline" style="primary" leadingVisual="plus">
                    Create New Sessions
                </Button>
                <Button size="default" fill="filled" style="primary" leadingVisual="calendar">
                    Fill in
                </Button>
            </div>
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
                <h4 className="h4 font-weight-semibold" style={{ color: 'var(--color-on-surface)', margin: 0 }}>My Sessions</h4>
                <div style={{ display: 'flex', gap: 'var(--size-element-gap-sm)' }}>
                    <SiteFilter initialSelection="All schools" />
                    <TimeframeFilter initialSelection="This week" />
                </div>
            </div>

            {/* Table - using imported components from Toolkit tables */}
            <div>
                <TableHeaderRow />
                {sessions.map((session, index) => (
                    <TableRow
                        key={index}
                        date={session.date}
                        timeRange={session.timeRange}
                        school={session.school}
                        teacher={session.teacher}
                        status={session.status}
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
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'In progress' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Starting soon' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Scheduled' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Cancelled' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'In progress' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Starting soon' },
];

/**
 * Edit Session Page - Overview/Static Version
 * Full layout using PageLayout component with sidebar and top bar
 * Includes snackbar notification for session updated
 */
export const Overview = () => (
    <div style={{ maxWidth: '1440px', height: '100%', margin: '0 auto', position: 'relative' }}>
        <PageLayout
            topBarConfig={{
                breadcrumbs: [
                    { text: 'Home', href: '#' },
                    { text: 'Sessions' }
                ],
                user: { name: 'John Doe' }
            }}
            sidebarConfig={{
                user: 'supervisor',
                activeTab: 'sessions'
            }}
            id="edit-session-page"
        >
            <MainContent
                showAlert={true}
                onAlertClose={() => { }}
                tabs={defaultTabs}
                selectedTab="my-sessions"
                onTabChange={() => { }}
                sessions={defaultSessions}
            />
        </PageLayout>

        {/* Snackbar - positioned at bottom center */}
        <div
            style={{
                position: 'absolute',
                bottom: 'var(--size-section-gap-lg)',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000
            }}
        >
            <SessionManagementSnackbar type="session updated" timestamp="11 mins ago" />
        </div>
    </div>
);

/**
 * Edit Session Page - Interactive Version
 * Full layout with working state management for:
 * - Snackbar toggle (show/hide session updated notification)
 * - Alert toggle (show/hide update alert)
 * - Tab switching
 * - Dynamic session data per tab
 * - Breakpoint toggle to preview at different screen sizes
 */
const InteractiveRender = (args) => {
    const showSnackbar = args.snackbar;
    const showAlert = args.alert;
    const [selectedTab, setSelectedTab] = useState('my-sessions');

    // Different session data per tab
    const sessionsByTab = {
        'my-sessions': [
            { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'In progress' },
            { date: 'Tue, Sep 9', timeRange: '2:00 PM - 3:00 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Starting soon' },
            { date: 'Wed, Sep 10', timeRange: '9:00 AM - 10:00 AM', school: 'Beauxbatons', teacher: 'Mme. Maxime', status: 'Scheduled' },
            { date: 'Wed, Sep 10', timeRange: '2:00 PM - 3:00 PM', school: 'Hogwarts', teacher: 'Prof. Lupin', status: 'Cancelled' },
            { date: 'Thu, Sep 11', timeRange: '10:00 AM - 11:00 AM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'In progress' },
            { date: 'Thu, Sep 11', timeRange: '1:00 PM - 2:00 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Starting soon' },
        ],
        'sign-ups': [
            { date: 'Thu, Sep 11', timeRange: '1:00 PM - 2:00 PM', school: 'Ilvermorny', teacher: 'Prof. Fontaine', status: 'Scheduled' },
            { date: 'Fri, Sep 12', timeRange: '3:00 PM - 4:00 PM', school: 'Mahoutokoro', teacher: 'Sensei Tanaka', status: 'Scheduled' },
            { date: 'Mon, Sep 15', timeRange: '11:00 AM - 12:00 PM', school: 'Castelobruxo', teacher: 'Prof. Silva', status: 'Scheduled' },
            { date: 'Tue, Sep 16', timeRange: '10:00 AM - 11:00 AM', school: 'Uagadou', teacher: 'Prof. Amara', status: 'Starting soon' },
        ],
        'fill-ins': [
            { date: 'Tue, Sep 9', timeRange: '4:00 PM - 5:00 PM', school: 'Hogwarts', teacher: 'Prof. McGonagall', status: 'Starting soon' },
            { date: 'Wed, Sep 10', timeRange: '8:00 AM - 9:00 AM', school: 'Beauxbatons', teacher: 'Prof. Dubois', status: 'Scheduled' },
            { date: 'Thu, Sep 11', timeRange: '2:00 PM - 3:00 PM', school: 'Durmstrang', teacher: 'Prof. Ivanov', status: 'Scheduled' },
            { date: 'Fri, Sep 12', timeRange: '1:00 PM - 2:00 PM', school: 'Hogwarts', teacher: 'Prof. Sprout', status: 'Scheduled' },
        ],
        'call-offs': [
            { date: 'Mon, Sep 8', timeRange: '9:00 AM - 10:00 AM', school: 'Hogwarts', teacher: 'Prof. Flitwick', status: 'Cancelled' },
            { date: 'Tue, Sep 9', timeRange: '11:00 AM - 12:00 PM', school: 'Beauxbatons', teacher: 'Mme. Delacour', status: 'Cancelled' },
            { date: 'Wed, Sep 10', timeRange: '3:00 PM - 4:00 PM', school: 'Ilvermorny', teacher: 'Prof. Chen', status: 'Cancelled' },
            { date: 'Thu, Sep 11', timeRange: '9:00 AM - 10:00 AM', school: 'Mahoutokoro', teacher: 'Sensei Yamamoto', status: 'Cancelled' },
        ],
        'reflections': [],
    };

    const tabs = [
        { id: 'my-sessions', label: 'My sessions', count: sessionsByTab['my-sessions'].length },
        { id: 'sign-ups', label: 'Sign-ups', count: sessionsByTab['sign-ups'].length },
        { id: 'fill-ins', label: 'Fill-ins', count: sessionsByTab['fill-ins'].length },
        { id: 'call-offs', label: 'Call-offs', count: sessionsByTab['call-offs'].length },
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
                    user: { name: 'John Doe' }
                }}
                sidebarConfig={{
                    user: 'supervisor',
                    activeTab: 'sessions'
                }}
                id="edit-session-page-interactive"
            >
                <MainContent
                    showAlert={showAlert}
                    onAlertClose={() => {}}
                    tabs={tabs}
                    selectedTab={selectedTab}
                    onTabChange={setSelectedTab}
                    sessions={sessionsByTab[selectedTab] || []}
                />
            </PageLayout>

            {/* Snackbar - positioned at bottom center */}
            {showSnackbar && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 'var(--size-section-gap-lg)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1000
                    }}
                >
                    <SessionManagementSnackbar
                        type="session updated"
                        timestamp="11 mins ago"
                        onClose={() => {}}
                    />
                </div>
            )}
        </div>
    );
};

export const Interactive = {
    render: InteractiveRender,
    argTypes: {
        snackbar: { control: 'boolean', name: 'Session-updated snackbar', table: { category: 'State' } },
        alert: { control: 'boolean', name: 'Update alert', table: { category: 'State' } },
    },
    args: { snackbar: true, alert: true },
};
