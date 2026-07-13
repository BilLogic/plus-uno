import React, { useState } from 'react';
import Button from '@/components/actions/Button/Button';
import { PageLayout } from '@/specs/Universal/Pages';
import { StatCard } from '../Cards/OverviewCard.stories';
import { FillInTableRow, FillInTableHeaderRow } from '../Tables/FillInTable.stories';
import { NavHorizontal } from '../Tables/NavHorizontal.stories';
import { SiteFilter } from '../Elements/Filters/SiteFilter.stories';

// Import Session Fill-ins modals
import * as FillInModals from '../Modals/SessionFillIns/SessionFillIns.stories';
import { SectionTitle, ModalScrim, MissingModal } from './_pageHelpers';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Pre-Session/Pages/Fill-In',
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
    { id: 'reflections', label: 'Reflections', count: 5 },
];

const defaultSessions = [
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', needLead: false },
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', needLead: false },
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', needLead: false },
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', needLead: false },
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', needLead: false },
    { date: 'Tue, Sep 9', timeRange: '1:00 PM - 1:50 PM', school: 'Hogwarts', teacher: 'Mr. Snape', tutorCount: '1/5', needLead: false },
];

const defaultFilters = {
    school: 'All schools'
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
                <SectionTitle title="Session Fill-ins" />
                <div style={{ display: 'flex', gap: 'var(--size-element-gap-sm)' }}>
                    <SiteFilter initialSelection={defaultFilters.school} />
                </div>
            </div>

            <div>
                <FillInTableHeaderRow />
                {defaultSessions.map((session, index) => (
                    <FillInTableRow
                        key={index}
                        date={session.date}
                        timeRange={session.timeRange}
                        school={session.school}
                        teacher={session.teacher}
                        tutorCount={session.tutorCount}
                        needLead={session.needLead}
                        onFillIn={() => {}}
                    />
                ))}
            </div>
        </div>
    </div>
);

// ─── Modal Mapping ───────────────────────────────────────────────

const modalMap = {
    'empty-state': FillInModals.FillIn_EmptyState,
    'fill-in': FillInModals.FillIn,
    'session-details': FillInModals.SessionDetails,
    'consent-form': FillInModals.ConsentForm,
    'confirmation': FillInModals.Confirmation,
    'success': FillInModals.Success,
};

const modalLabels = {
    'empty-state': 'Empty State',
    'fill-in': 'Fill In',
    'session-details': 'Session Details',
    'consent-form': 'Consent Form',
    'confirmation': 'Confirmation',
    'success': 'Success',
};

// ─── Story ───────────────────────────────────────────────────────

/**
 * With Modals
 * Fill-In page with modal overlay showing Session Fill-in modals.
 * Controls:
 * - Breakpoint: MD / LG / XL
 * - Modal Step: Empty State, Fill In, Session Details, Consent Form, Confirmation, Success
 */
export const WithModals = (args) => {
    const [modalStep, setModalStep] = useState('fill-in');
    const [breakpoint, setBreakpoint] = useState('xl');

    const breakpointWidths = {
        'md': 768,
        'lg': 1024,
        'xl': 1440,
    };

    const ModalComponent = modalMap[modalStep] || null;

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

                {/* Modal Step Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-element-gap-md)', flexWrap: 'wrap' }}>
                    <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', fontWeight: 600, minWidth: '120px' }}>
                        Modal Step:
                    </span>
                    {Object.entries(modalLabels).map(([key, label]) => (
                        <Button
                            key={key}
                            text={label}
                            size="small"
                            style="primary"
                            fill={modalStep === key ? 'filled' : 'ghost'}
                            onClick={() => setModalStep(key)}
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
                        Showing: <strong>{modalLabels[modalStep]}</strong> @ <strong>{breakpointWidths[breakpoint]}px</strong>
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
                        user: { name: 'John Doe', role: 'Lead' }
                    }}
                    sidebarConfig={{
                        user: 'tutor',
                        activeTab: 'sessions'
                    }}
                    id="fill-in-with-modals"
                >
                    <BackgroundContent
                        tabs={defaultTabs}
                        selectedTab="fill-ins"
                    />
                </PageLayout>

                {/* Scrim Overlay + Modal */}
                <ModalScrim open={args.open}>
                    {ModalComponent ? <ModalComponent /> : <MissingModal>No modal available for: {modalStep}</MissingModal>}
                </ModalScrim>
            </div>
        </div>
    );
};

WithModals.args = { open: false };
WithModals.argTypes = {
    open: { control: 'boolean', description: 'Show the modal overlay on top of the page' },
};
