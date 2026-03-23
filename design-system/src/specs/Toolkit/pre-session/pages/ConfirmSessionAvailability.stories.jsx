import React, { useState } from 'react';
import Button from '../../../../components/Button/Button';
import { PageLayout } from '../../../../specs/Universal/Pages';
import { StatCard } from '../cards/OverviewCard.stories';
import { TableRow, TableHeaderRow } from '../tables/MySessions.stories';
import { NavHorizontal } from '../tables/NavHorizontal.stories';
import { TimeframeFilter } from '../elements/Filters/TimeframeFilter.stories';
import { SiteFilter } from '../elements/Filters/SiteFilter.stories';
import SessionAvailabilitySnackbar from '../../../../components/SessionAvailabilitySnackbar/SessionAvailabilitySnackbar';

export default {
    title: 'Specs/Toolkit/Pre-Session/Pages/Confirm Session Availability',
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: `
# Confirm Session Availability Page

The Confirm Session Availability page is designed for tutors to confirm their availability for sessions.

## Page Structure

The page uses the **PageLayout** component which provides:
- **Top Bar**: Breadcrumbs and user profile
- **Sidebar**: Navigation for tutor role
- **Main Content**: Session data and controls
- **Snackbar**: Session availability confirmation notifications (can be toggled)

## Components Used

| Component | Source | Purpose |
|-----------|--------|---------|
| PageLayout | Universal/Pages | Page structure with sidebar |
| StatCard | OverviewCard.stories | Dashboard statistics |
| NavHorizontal | NavHorizontal.stories | Tab navigation |
| TableRow/TableHeaderRow | MySessions.stories (tables) | Session data display |
| TimeframeFilter | TimeframeFilter.stories | Date range filtering |
| SiteFilter | SiteFilter.stories | School filtering |
| SessionAvailabilitySnackbar | plus-ds/components | Session availability confirmation notifications |
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
- **Snackbar toggle** - Show/hide session availability confirmation notification
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
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 className="h4" style={{ color: 'var(--color-on-surface)', margin: 0 }}>Your Sessions</h4>
            <Button size="default" fill="filled" style="primary" leadingVisual="calendar">
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
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Starting soon' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'In progress' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Starting soon' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Scheduled' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Cancelled' },
];

/**
 * Confirm Session Availability Page - Overview/Static Version
 * Full layout using PageLayout component with sidebar and top bar
 * Includes snackbar notification for session availability confirmation
 */
export const Overview = () => (
    <div style={{ maxWidth: '1440px', margin: '0 auto', position: 'relative' }}>
        <PageLayout
            topBarConfig={{
                breadcrumbs: [
                    { text: 'Home', href: '#' },
                    { text: 'Sessions' }
                ],
                user: { name: 'John Doe' }
            }}
            sidebarConfig={{
                user: 'tutor',
                activeTab: 'sessions'
            }}
            id="confirm-session-availability-page"
        >
            <MainContent
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
            <SessionAvailabilitySnackbar 
                type="one-time session" 
                available={true}
                timestamp="1 mins ago" 
            />
        </div>
    </div>
);

/**
 * Confirm Session Availability Page - Interactive Version
 * Full layout with working state management for:
 * - Snackbar toggle (show/hide session availability confirmation notification)
 * - Tab switching
 * - Dynamic session data per tab
 * - Breakpoint toggle to preview at different screen sizes
 */
export const Interactive = () => {
    const [showSnackbar, setShowSnackbar] = useState(true);
    const [selectedTab, setSelectedTab] = useState('my-sessions');
    const [breakpoint, setBreakpoint] = useState('xl');

    // Breakpoint widths from design system
    const breakpointWidths = {
        'md': 768,
        'lg': 1024,
        'xl': 1440,
    };

    // Different session data per tab
    const sessionsByTab = {
        'my-sessions': [
            { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Starting soon' },
            { date: 'Tue, Sep 9', timeRange: '2:00 PM - 3:00 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'In progress' },
            { date: 'Wed, Sep 10', timeRange: '9:00 AM - 10:00 AM', school: 'Beauxbatons', teacher: 'Mme. Maxime', status: 'Starting soon' },
            { date: 'Wed, Sep 10', timeRange: '2:00 PM - 3:00 PM', school: 'Hogwarts', teacher: 'Prof. Lupin', status: 'Scheduled' },
            { date: 'Thu, Sep 11', timeRange: '10:00 AM - 11:00 AM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Cancelled' },
        ],
        'sign-ups': [
            { date: 'Thu, Sep 11', timeRange: '1:00 PM - 2:00 PM', school: 'Ilvermorny', teacher: 'Prof. Fontaine', status: 'Scheduled' },
            { date: 'Fri, Sep 12', timeRange: '3:00 PM - 4:00 PM', school: 'Mahoutokoro', teacher: 'Sensei Tanaka', status: 'Scheduled' },
            { date: 'Mon, Sep 15', timeRange: '11:00 AM - 12:00 PM', school: 'Castelobruxo', teacher: 'Prof. Silva', status: 'Scheduled' },
        ],
        'fill-ins': [
            { date: 'Tue, Sep 9', timeRange: '4:00 PM - 5:00 PM', school: 'Hogwarts', teacher: 'Prof. McGonagall', status: 'Starting soon' },
            { date: 'Wed, Sep 10', timeRange: '8:00 AM - 9:00 AM', school: 'Beauxbatons', teacher: 'Prof. Dubois', status: 'Scheduled' },
            { date: 'Thu, Sep 11', timeRange: '2:00 PM - 3:00 PM', school: 'Durmstrang', teacher: 'Prof. Ivanov', status: 'Scheduled' },
        ],
        'call-offs': [
            { date: 'Mon, Sep 8', timeRange: '9:00 AM - 10:00 AM', school: 'Hogwarts', teacher: 'Prof. Flitwick', status: 'Cancelled' },
            { date: 'Tue, Sep 9', timeRange: '11:00 AM - 12:00 PM', school: 'Beauxbatons', teacher: 'Mme. Delacour', status: 'Cancelled' },
            { date: 'Wed, Sep 10', timeRange: '3:00 PM - 4:00 PM', school: 'Ilvermorny', teacher: 'Prof. Chen', status: 'Cancelled' },
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
                {/* Snackbar Toggle */}
                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600 }}>
                    Snackbar:
                </span>
                <Button
                    text={showSnackbar ? 'On' : 'Off'}
                    size="small"
                    style="primary"
                    fill={showSnackbar ? 'filled' : 'outline'}
                    onClick={() => setShowSnackbar(!showSnackbar)}
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
                transition: 'width 0.3s ease',
                position: 'relative'
            }}>
                <PageLayout
                    topBarConfig={{
                        breadcrumbs: [
                            { text: 'Home', href: '#' },
                            { text: 'Sessions' }
                        ],
                        user: { name: 'John Doe' }
                    }}
                    sidebarConfig={{
                        user: 'tutor',
                        activeTab: 'sessions'
                    }}
                    id="confirm-session-availability-page-interactive"
                >
                    <MainContent
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
                        <SessionAvailabilitySnackbar 
                            type="one-time session" 
                            available={true}
                            timestamp="1 mins ago"
                            onClose={() => setShowSnackbar(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
