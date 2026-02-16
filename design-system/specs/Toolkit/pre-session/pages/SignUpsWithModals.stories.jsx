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

// Import Sign-Ups modals
import * as SignUpsModals from '../modals/Sign-Ups/SignUps.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Pages/Sign-Ups',
    parameters: {
        layout: 'padded',
    },
};

// ─── Shared Components ───────────────────────────────────────────

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
];

const defaultFilters = {
    tutor: 'All tutors',
    school: 'All schools',
    days: 'All days',
    capacity: 'Not filled'
};

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
            <Button size="default" fill="filled" style="primary" leadingVisual="calendar-plus" text="Fill in" />
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
                <SectionTitle title="Session Sign-ups" />
                <div style={{ display: 'flex', gap: 'var(--size-element-gap-sm)' }}>
                    <TutorFilter value={defaultFilters.tutor} />
                    <SiteFilter initialSelection={defaultFilters.school} />
                    <DaysFilter value={defaultFilters.days} />
                    <CapacityFilter value={defaultFilters.capacity} />
                </div>
            </div>

            <div>
                <SignInTableHeaderRow />
                {defaultSessions.map((session, index) => (
                    <SignInTableRow
                        key={index}
                        day={session.day}
                        timeRange={session.timeRange}
                        school={session.school}
                        tutorCount={session.tutorCount}
                        onSignUp={() => {}}
                    />
                ))}
            </div>
        </div>
    </div>
);

// ─── Modal Mapping ───────────────────────────────────────────────

const modalMap = {
    'session-info': {
        'regular-tutors': SignUpsModals.SessionInfo_RegularTutors,
        'leads-supervisors': SignUpsModals.SessionInfo_LeadsSupervisors,
    },
    'attendees': {
        'leads-supervisors': SignUpsModals.Attendees_LeadsSupervisors,
    },
    'confirm': {
        'all': SignUpsModals.ConfirmAll,
    },
    'success': {
        'all': SignUpsModals.SuccessAll,
    },
};

// ─── Story ───────────────────────────────────────────────────────

/**
 * With Modals
 * Sign-Ups page with modal overlay showing Sign-Up modals.
 * Controls:
 * - Tab: Session Info, Attendees, Confirm, Success
 * - User: Regular Tutors, Leads & Supervisors, All
 */
export const WithModals = () => {
    const [tab, setTab] = useState('session-info');
    const [user, setUser] = useState('regular-tutors');
    const [breakpoint, setBreakpoint] = useState('xl');

    const breakpointWidths = {
        'md': 768,
        'lg': 1024,
        'xl': 1440,
    };

    // Tab options
    const tabOptions = [
        { id: 'session-info', label: 'Session Info' },
        { id: 'attendees', label: 'Attendees' },
        { id: 'confirm', label: 'Confirm' },
        { id: 'success', label: 'Success' },
    ];

    // User options
    const userOptions = [
        { id: 'regular-tutors', label: 'Regular Tutors' },
        { id: 'leads-supervisors', label: 'Leads & Supervisors' },
        { id: 'all', label: 'All' },
    ];

    // Get the current modal component based on selections
    const getModalComponent = () => {
        const tabModals = modalMap[tab];
        if (!tabModals) return null;

        return tabModals[user] || null;
    };

    const ModalComponent = getModalComponent();

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

                {/* Tab Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-element-gap-md)', flexWrap: 'wrap' }}>
                    <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600, minWidth: '120px' }}>
                        Tab:
                    </span>
                    {tabOptions.map(t => (
                        <Button
                            key={t.id}
                            text={t.label}
                            size="small"
                            style="primary"
                            fill={tab === t.id ? 'filled' : 'ghost'}
                            onClick={() => setTab(t.id)}
                        />
                    ))}
                </div>

                {/* User Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-element-gap-md)', flexWrap: 'wrap' }}>
                    <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600, minWidth: '120px' }}>
                        User:
                    </span>
                    {userOptions.map(u => (
                        <Button
                            key={u.id}
                            text={u.label}
                            size="small"
                            style="primary"
                            fill={user === u.id ? 'filled' : 'ghost'}
                            onClick={() => setUser(u.id)}
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
                        Showing: <strong>{tab} / {user}</strong>
                    </span>
                    {!ModalComponent && (
                        <span className="body2-txt" style={{ color: 'var(--color-danger)' }}>
                            No modal available for this combination
                        </span>
                    )}
                </div>
            </div>

            {/* Page Preview with Modal */}
            <div style={{
                position: 'relative',
                width: `${breakpointWidths[breakpoint]}px`,
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
                        user: { name: 'John Doe', role: 'Lead' }
                    }}
                    sidebarConfig={{
                        user: 'tutor',
                        activeTab: 'sessions'
                    }}
                    id="sign-ups-with-modals"
                >
                    <BackgroundContent
                        tabs={defaultTabs}
                        selectedTab="sign-ups"
                    />
                </PageLayout>

                {/* Scrim Overlay + Modal */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 'var(--size-section-pad-x-lg)',
                    zIndex: 1000
                }}>
                    {ModalComponent ? (
                        <ModalComponent />
                    ) : (
                        <div style={{
                            backgroundColor: 'var(--color-surface-container-high)',
                            borderRadius: 'var(--size-modal-radius-lg)',
                            padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                            width: '672px',
                            textAlign: 'center',
                        }}>
                            <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', margin: 0 }}>
                                No modal available for: {tab} / {user}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
