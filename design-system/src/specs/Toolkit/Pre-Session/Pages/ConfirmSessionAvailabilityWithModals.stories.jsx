import React, { useState } from 'react';
import Button from '@/components/forms-and-inputs/Button/Button';
import { PageLayout } from '@/specs/Universal/Pages';
import { StatCard } from '../Cards/OverviewCard.stories';
import { TableRow, TableHeaderRow } from '../Tables/MySessions.stories';
import { NavHorizontal } from '../Tables/NavHorizontal.stories';
import { TimeframeFilter } from '../Elements/Filters/TimeframeFilter.stories';
import { SiteFilter } from '../Elements/Filters/SiteFilter.stories';

// Import Confirm Session Availability modals
import { Session_Details_One_Time_Session } from '../Modals/ConfirmSessionAvailability/SessionDetailsOneTimeSession.stories';
import { Session_Details_Recurring_Session } from '../Modals/ConfirmSessionAvailability/SessionDetailsRecurringSession.stories';
import { Attendees_One_Time_Session } from '../Modals/ConfirmSessionAvailability/AttendeesOneTimeSession.stories';
import { Attendees_Recurring_Session } from '../Modals/ConfirmSessionAvailability/AttendeesRecurringSession.stories';
import { Session_Details_NA } from '../Modals/ConfirmSessionAvailability/SessionDetailsNA.stories';
import { SectionTitle, ModalBlanket, MissingModal } from './_pageHelpers';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Pre-Session/Pages/Confirm Session Availability',
    parameters: {
        layout: 'padded',
    },
};

// ─── Shared Components ───────────────────────────────────────────


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
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Canceled' },
];

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
            <h2 className="h4" style={{ color: 'var(--ds-text)', margin: 0 }}>Your Sessions</h2>
            <div style={{ display: 'flex', gap: 'var(--stack-md)' }}>
                <Button iconBefore="plus">
                    Create New Sessions
                </Button>
                <Button appearance="primary" iconBefore="calendar">
                    Fill in
                </Button>
            </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)' }}>
            <StatCard title="Today's sessions" value="1" icon="fa-solid fa-calendar-day" />
            <StatCard title="Pending call-offs" value="2" icon="fa-solid fa-hourglass-half" />
            <StatCard title="Open for fill-ins" value="23" icon="fa-solid fa-right-to-bracket" />
        </div>

        {/* Nav Tabs */}
        <NavHorizontal tabs={tabs} selectedTab={selectedTab} onTabChange={() => {}} />

        {/* Table Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <SectionTitle title="My Sessions" />
                <div style={{ display: 'flex', gap: 'var(--stack-md)' }}>
                    <SiteFilter />
                    <TimeframeFilter />
                </div>
            </div>

            <div>
                <TableHeaderRow />
                {defaultSessions.map((session, index) => (
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

// ─── Modal Mapping ───────────────────────────────────────────────

const modalMap = {
    'session-details-one-time': Session_Details_One_Time_Session,
    'session-details-recurring': Session_Details_Recurring_Session,
    'attendees-one-time': Attendees_One_Time_Session,
    'attendees-recurring': Attendees_Recurring_Session,
    'session-details-na': Session_Details_NA,
};

// ─── Story ───────────────────────────────────────────────────────

/**
 * With Modals
 * Confirm Session Availability page with modal overlay.
 * Controls:
 * - Modal: Session Details One-Time, Session Details Recurring, Attendees One-Time, Attendees Recurring, Session Details NA
 * - Breakpoint: MD, LG, XL
 */
export const WithModals = (args) => {
    const [modal, setModal] = useState('session-details-one-time');
    const [breakpoint, setBreakpoint] = useState('xl');

    const breakpointWidths = {
        'md': 768,
        'lg': 1024,
        'xl': 1440,
    };

    const modalOptions = [
        { id: 'session-details-one-time', label: 'Session Details (One-Time)' },
        { id: 'session-details-recurring', label: 'Session Details (Recurring)' },
        { id: 'attendees-one-time', label: 'Attendees (One-Time)' },
        { id: 'attendees-recurring', label: 'Attendees (Recurring)' },
        { id: 'session-details-na', label: 'Session Details NA' },
    ];

    const ModalComponent = modalMap[modal] || null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
            {/* Controls */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-0625)',
                padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                backgroundColor: 'var(--ds-surface-container)',
                borderRadius: 'var(--size-card-radius-sm)',
            }}>
                {/* Breakpoint Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-0625)', flexWrap: 'wrap' }}>
                    <span className="body2-txt" style={{ color: 'var(--ds-text-subtle)', fontWeight: 600, minWidth: '120px' }}>
                        Breakpoint:
                    </span>
                    {Object.entries(breakpointWidths).map(([bp, width]) => (
                        <Button
                            key={bp}
                            text={`${bp.toUpperCase()} (${width}px)`}
                            spacing="compact"
                            isSelected={breakpoint === bp}
                            onClick={() => setBreakpoint(bp)}
                        />
                    ))}
                </div>

                {/* Modal Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-0625)', flexWrap: 'wrap' }}>
                    <span className="body2-txt" style={{ color: 'var(--ds-text-subtle)', fontWeight: 600, minWidth: '120px' }}>
                        Modal:
                    </span>
                    {modalOptions.map(m => (
                        <Button
                            key={m.id}
                            text={m.label}
                            spacing="compact"
                            appearance="subtle" isSelected={modal === m.id}
                            onClick={() => setModal(m.id)}
                        />
                    ))}
                </div>

                {/* Current State Info */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--stack-lg)',
                    padding: 'var(--pad-y-md) 0',
                    borderTop: '1px solid var(--color-outline-variant)',
                }}>
                    <span className="body2-txt" style={{ color: 'var(--ds-text-subtle)' }}>
                        Showing: <strong>{modalOptions.find(m => m.id === modal)?.label}</strong>
                    </span>
                </div>
            </div>

            {/* Page Preview with Modal */}
            <div style={{
                position: 'relative',
                width: `${breakpointWidths[breakpoint]}px`,
                height: '100%',
                margin: '0 auto',
                border: '2px dashed var(--color-outline-variant)',
                borderRadius: 'var(--size-card-radius-sm)',
                overflow: 'hidden',
                transition: 'width 0.3s ease'
            }}>
                {/* Background Page */}
                <PageLayout
                    title="Sessions"
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
                    id="confirm-availability-with-modals"
                >
                    <BackgroundContent
                        tabs={defaultTabs}
                        selectedTab="my-sessions"
                    />
                </PageLayout>

                {/* Blanket Overlay + Modal */}
                <ModalBlanket open={args.open}>
                    {ModalComponent ? <ModalComponent /> : <MissingModal>No modal available for this selection</MissingModal>}
                </ModalBlanket>
            </div>
        </div>
    );
};

WithModals.args = { open: false };
WithModals.argTypes = {
    open: { control: 'boolean', description: 'Show the modal overlay on top of the page' },
};
