import React, { useState } from 'react';
import Button from '@/components/actions/Button/Button';
import { PageLayout } from '@/specs/Universal/Pages';
import { StatCard } from '../Cards/OverviewCard.stories';
import { TableRow, TableHeaderRow } from '../Tables/MySessions.stories';
import { NavHorizontal } from '../Tables/NavHorizontal.stories';
import { TimeframeFilter } from '../Elements/Filters/TimeframeFilter.stories';
import { SiteFilter } from '../Elements/Filters/SiteFilter.stories';

// Import Edit Session modals
import { Forming } from '../Modals/EditSession/Forming.stories';
import { Session_Type } from '../Modals/EditSession/SessionType.stories';
import { Attendee_Edit } from '../Modals/EditSession/AttendeeEdit.stories';
import { Reconfirm_Tutor_Availability } from '../Modals/EditSession/ReconfirmTutorAvailability.stories';
import { Unsaved_Warning } from '../Modals/EditSession/UnsavedWarning.stories';
import { SectionTitle, ModalScrim, MissingModal } from './_pageHelpers';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Pre-Session/Pages/Edit Session',
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
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'Cancelled' },
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
                <div style={{ display: 'flex', gap: 'var(--size-element-gap-sm)' }}>
                    <SiteFilter initialSelection="All schools" />
                    <TimeframeFilter initialSelection="This week" />
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
    'forming': Forming,
    'session-type': Session_Type,
    'attendee-edit': Attendee_Edit,
    'reconfirm-tutor': Reconfirm_Tutor_Availability,
    'unsaved-warning': Unsaved_Warning,
};

// ─── Story ───────────────────────────────────────────────────────

/**
 * With Modals
 * Edit Session page with modal overlay showing Edit Session modals.
 * Controls:
 * - Modal: Forming, Session Type, Attendee Edit, Reconfirm Tutor Availability, Unsaved Warning
 * - Breakpoint: MD, LG, XL
 */
export const WithModals = (args) => {
    const [modal, setModal] = useState('forming');
    const [breakpoint, setBreakpoint] = useState('xl');

    const breakpointWidths = {
        'md': 768,
        'lg': 1024,
        'xl': 1440,
    };

    const modalOptions = [
        { id: 'forming', label: 'Forming' },
        { id: 'session-type', label: 'Session Type' },
        { id: 'attendee-edit', label: 'Attendee Edit' },
        { id: 'reconfirm-tutor', label: 'Reconfirm Tutor' },
        { id: 'unsaved-warning', label: 'Unsaved Warning' },
    ];

    const ModalComponent = modalMap[modal] || null;

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

                {/* Modal Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-element-gap-md)', flexWrap: 'wrap' }}>
                    <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600, minWidth: '120px' }}>
                        Modal:
                    </span>
                    {modalOptions.map(m => (
                        <Button
                            key={m.id}
                            text={m.label}
                            size="small"
                            style="primary"
                            fill={modal === m.id ? 'filled' : 'ghost'}
                            onClick={() => setModal(m.id)}
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
                    id="edit-session-with-modals"
                >
                    <BackgroundContent
                        tabs={defaultTabs}
                        selectedTab="my-sessions"
                    />
                </PageLayout>

                {/* Scrim Overlay + Modal */}
                <ModalScrim open={args.open}>
                    {ModalComponent ? <ModalComponent /> : <MissingModal>No modal available for this selection</MissingModal>}
                </ModalScrim>
            </div>
        </div>
    );
};

WithModals.args = { open: false };
WithModals.argTypes = {
    open: { control: 'boolean', description: 'Show the modal overlay on top of the page' },
};
