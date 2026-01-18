import React, { useState } from 'react';
import Button from '../../../../../packages/plus-ds/src/components/Button/Button';
import { PageLayout } from '../../../../../packages/plus-ds/src/specs/Universal/Pages';
import { StatCard } from '../cards/OverviewCard.stories';
import { TableRow, TableHeaderRow } from '../tables/MySessions.stories';
import { NavHorizontal } from '../tables/NavHorizontal.stories';
import { TimeframeFilter } from '../elements/TimeframeFilter.stories';
import { SiteFilter } from '../elements/SiteFilter.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Pages/My Sessions',
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

// StatCard is imported from OverviewCard.stories.jsx
// NavHorizontal is imported from NavHorizontal.stories.jsx

// TableRow and TableHeaderRow are imported from '../tables/MySessions.stories'

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
    { id: 'all-sessions', label: 'All sessions', count: 3 },
    { id: 'sign-ups', label: 'Sign-ups', count: 3 },
    { id: 'fill-ins', label: 'Fill-ins', count: 3 },
    { id: 'call-offs', label: 'Call-offs', count: 3 },
    { id: 'reflections', label: 'Reflections', count: 20 },
];

const defaultSessions = [
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Scheduled' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Starting soon' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Scheduled' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Cancelled' },
];

/**
 * My Sessions Page - Overview/Static Version
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
                user: { name: 'John Doe' }
            }}
            sidebarConfig={{
                user: 'tutor',
                activeTab: 'sessions'
            }}
            id="my-sessions-page"
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
    </div>
);

/**
 * My Sessions Page - Interactive Version
 * Full layout with working state management for:
 * - Dismissable alert
 * - Tab switching
 * - Dynamic session data per tab
 */
export const Interactive = () => {
    const [showAlert, setShowAlert] = useState(true);
    const [selectedTab, setSelectedTab] = useState('my-sessions');

    // Different session data per tab
    const sessionsByTab = {
        'my-sessions': [
            { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Scheduled' },
            { date: 'Tue, Sep 9', timeRange: '2:00 PM - 3:00 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Starting soon' },
            { date: 'Wed, Sep 10', timeRange: '9:00 AM - 10:00 AM', school: 'Beauxbatons', teacher: 'Mme. Maxime', status: 'Scheduled' },
            { date: 'Wed, Sep 10', timeRange: '2:00 PM - 3:00 PM', school: 'Hogwarts', teacher: 'Prof. Lupin', status: 'Cancelled' },
        ],
        'all-sessions': [
            { date: 'Mon, Sep 8', timeRange: '10:00 AM - 11:00 AM', school: 'Durmstrang', teacher: 'Igor Karkaroff', status: 'Scheduled' },
            { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Scheduled' },
            { date: 'Tue, Sep 9', timeRange: '2:00 PM - 3:00 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Starting soon' },
            { date: 'Wed, Sep 10', timeRange: '9:00 AM - 10:00 AM', school: 'Beauxbatons', teacher: 'Mme. Maxime', status: 'Scheduled' },
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
        { id: 'all-sessions', label: 'All sessions', count: sessionsByTab['all-sessions'].length },
        { id: 'sign-ups', label: 'Sign-ups', count: sessionsByTab['sign-ups'].length },
        { id: 'fill-ins', label: 'Fill-ins', count: sessionsByTab['fill-ins'].length },
        { id: 'call-offs', label: 'Call-offs', count: sessionsByTab['call-offs'].length },
        { id: 'reflections', label: 'Reflections', count: 20 },
    ];

    return (
        <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
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
                id="my-sessions-page-interactive"
            >
                <MainContent
                    showAlert={showAlert}
                    onAlertClose={() => setShowAlert(false)}
                    tabs={tabs}
                    selectedTab={selectedTab}
                    onTabChange={setSelectedTab}
                    sessions={sessionsByTab[selectedTab] || []}
                />
            </PageLayout>
        </div>
    );
};
