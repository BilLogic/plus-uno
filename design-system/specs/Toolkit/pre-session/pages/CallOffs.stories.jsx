import React, { useState } from 'react';
import Button from '../../../../../packages/plus-ds/src/components/Button/Button';
import ButtonGroup from '../../../../../packages/plus-ds/src/components/ButtonGroup/ButtonGroup';
import { PageLayout } from '../../../../../packages/plus-ds/src/specs/Universal/Pages';
import { StatCard } from '../cards/OverviewCard.stories';
import { CallOffsTableRow, CallOffsTableHeaderRow } from '../tables/CallOffsTable.stories';
import { NavHorizontal } from '../tables/NavHorizontal.stories';
import { TimeframeFilter } from '../elements/Filters/TimeframeFilter.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Pages/Call-Offs',
    parameters: {
        layout: 'padded',
    },
};

/**
 * Section Title with Info Icon
 */
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

/**
 * Button Group for Pending/Past toggle
 */
const CallOffStateToggle = ({ selected, onSelect, interactive = true }) => {
    const buttons = [
        {
            text: 'Pending',
            active: selected === 'pending',
            onClick: interactive ? () => onSelect('pending') : undefined
        },
        {
            text: 'Past',
            active: selected === 'past',
            onClick: interactive ? () => onSelect('past') : undefined
        }
    ];

    return (
        <ButtonGroup
            buttons={buttons}
            size="small"
            style="primary"
            fill="tonal"
            ariaLabel="Call-off state toggle"
        />
    );
};

/**
 * Main Content Area for Call-Offs Page
 * Uses semantic tokens:
 * - Section gap: --size-section-gap-lg (between major sections)
 * - Section gap: --size-section-gap-sm (within table section)
 * - Card gap: --size-card-gap-md (between stat cards)
 * - Element gap: --size-element-gap-sm (between filter elements)
 */
const MainContent = ({
    tabs,
    selectedTab,
    onTabChange,
    callOffs,
    callOffState,
    onCallOffStateChange,
    timeframe,
    onTimeframeChange,
    onAction,
    interactive = true
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
            <Button size="default" fill="filled" style="primary" leadingVisual="calendar-plus" text="Fill in" />
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
                <SectionTitle title="Call-off requests" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-element-gap-sm)' }}>
                    <CallOffStateToggle
                        selected={callOffState}
                        onSelect={onCallOffStateChange}
                        interactive={interactive}
                    />
                    <TimeframeFilter
                        initialSelection={timeframe}
                        interactive={interactive}
                    />
                </div>
            </div>

            {/* Call-Offs Table */}
            <div>
                <CallOffsTableHeaderRow user="tutors" callOffState={callOffState} />
                {callOffs.map((callOff, index) => (
                    <CallOffsTableRow
                        key={index}
                        user="tutors"
                        callOffState={callOffState}
                        schoolName={callOff.schoolName}
                        date={callOff.date}
                        timeRange={callOff.timeRange}
                        type={callOff.type}
                        late={callOff.late}
                        status={callOff.status}
                        onAction={() => onAction?.(index)}
                        interactive={interactive}
                    />
                ))}
            </div>
        </div>
    </div>
);

// Default data
const defaultTabs = [
    { id: 'my-sessions', label: 'My sessions', count: 20 },
    { id: 'sign-ups', label: 'Sign-ups', count: 3 },
    { id: 'fill-ins', label: 'Fill-ins', count: 3 },
    { id: 'call-offs', label: 'Call-offs', count: 20 },
    { id: 'reflections', label: 'Reflections', count: 8 },
];

const defaultPendingCallOffs = [
    { schoolName: 'School name', date: 'Fri, Sep 5', timeRange: '1:00 PM - 1:50 PM', type: 'one-time', late: true },
    { schoolName: 'School name', date: 'Fri, Sep 5', timeRange: '1:00 PM - 1:50 PM', type: 'one-time', late: true },
    { schoolName: 'School name', date: 'Fri, Sep 5', timeRange: '1:00 PM - 1:50 PM', type: 'one-time', late: true },
    { schoolName: 'School name', date: 'Fri, Sep 5', timeRange: '1:00 PM - 1:50 PM', type: 'one-time', late: true },
    { schoolName: 'School name', date: 'Fri, Sep 5', timeRange: '1:00 PM - 1:50 PM', type: 'one-time', late: true },
    { schoolName: 'School name', date: 'Fri, Sep 5', timeRange: '1:00 PM - 1:50 PM', type: 'one-time', late: true },
    { schoolName: 'School name', date: 'Fri, Sep 5', timeRange: '1:00 PM - 1:50 PM', type: 'one-time', late: true },
    { schoolName: 'School name', date: 'Fri, Sep 5', timeRange: '1:00 PM - 1:50 PM', type: 'one-time', late: true },
    { schoolName: 'School name', date: 'Fri, Sep 5', timeRange: '1:00 PM - 1:50 PM', type: 'one-time', late: true },
];

const defaultPastCallOffs = [
    { schoolName: 'School name', date: 'Fri, Aug 29', timeRange: '1:00 PM - 1:50 PM', type: 'one-time', status: 'un-excused' },
    { schoolName: 'School name', date: 'Fri, Aug 29', timeRange: '1:00 PM - 1:50 PM', type: 'recurring', status: 'approved' },
    { schoolName: 'School name', date: 'Fri, Aug 29', timeRange: '1:00 PM - 1:50 PM', type: 'one-time', status: 'approved' },
    { schoolName: 'School name', date: 'Fri, Aug 29', timeRange: '1:00 PM - 1:50 PM', type: 'recurring', status: 'un-excused' },
    { schoolName: 'School name', date: 'Fri, Aug 29', timeRange: '1:00 PM - 1:50 PM', type: 'one-time', status: 'approved' },
];

/**
 * Call-Offs Page - Overview/Static Version
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
                user: { name: 'John Doe', role: 'Lead' }
            }}
            sidebarConfig={{
                user: 'tutor',
                activeTab: 'sessions'
            }}
            id="call-offs-page"
        >
            <MainContent
                tabs={defaultTabs}
                selectedTab="call-offs"
                onTabChange={() => {}}
                callOffs={defaultPendingCallOffs}
                callOffState="pending"
                onCallOffStateChange={() => {}}
                timeframe="This week"
                onTimeframeChange={() => {}}
                onAction={() => {}}
                interactive={false}
            />
        </PageLayout>
    </div>
);

/**
 * Call-Offs Page - Interactive Version
 * Full layout with working state management for:
 * - Tab switching
 * - Call-off state toggle (Pending/Past)
 * - Timeframe filter
 * - Action buttons
 * - Breakpoint toggle to preview at different screen sizes
 */
export const Interactive = () => {
    const [selectedTab, setSelectedTab] = useState('call-offs');
    const [callOffState, setCallOffState] = useState('pending');
    const [timeframe, setTimeframe] = useState('This week');
    const [breakpoint, setBreakpoint] = useState('xl');

    // Breakpoint widths from design system
    const breakpointWidths = {
        'md': 768,
        'lg': 1024,
        'xl': 1440,
    };

    const tabs = [
        { id: 'my-sessions', label: 'My sessions', count: 20 },
        { id: 'sign-ups', label: 'Sign-ups', count: 3 },
        { id: 'fill-ins', label: 'Fill-ins', count: 3 },
        { id: 'call-offs', label: 'Call-offs', count: callOffState === 'pending' ? defaultPendingCallOffs.length : defaultPastCallOffs.length },
        { id: 'reflections', label: 'Reflections', count: 8 },
    ];

    const currentCallOffs = callOffState === 'pending' ? defaultPendingCallOffs : defaultPastCallOffs;

    const handleAction = (index) => {
        const action = callOffState === 'pending' ? 'Withdraw' : 'Details';
        alert(`${action} clicked for call-off ${index + 1}`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
            {/* Breakpoint Toggle Controls */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--size-element-gap-md)',
                padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                backgroundColor: 'var(--color-surface-container-low)',
                borderRadius: 'var(--size-card-radius-sm)',
                flexWrap: 'wrap'
            }}>
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

            {/* Current State Info */}
            <div style={{
                padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
                backgroundColor: 'var(--color-surface-container-low)',
                borderRadius: 'var(--size-card-radius-sm)',
                display: 'flex',
                gap: 'var(--size-element-gap-lg)'
            }}>
                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Call-off State: <strong>{callOffState}</strong>
                </span>
                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Timeframe: <strong>{timeframe}</strong>
                </span>
                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Showing: <strong>{currentCallOffs.length}</strong> call-offs
                </span>
            </div>

            {/* Page Preview Container */}
            <div style={{
                width: `${breakpointWidths[breakpoint]}px`,
                margin: '0 auto',
                border: '2px dashed var(--color-outline-variant)',
                borderRadius: 'var(--size-card-radius-sm)',
                overflow: 'hidden',
                transition: 'width 0.3s ease'
            }}>
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
                    id="call-offs-page-interactive"
                >
                    <MainContent
                        tabs={tabs}
                        selectedTab={selectedTab}
                        onTabChange={setSelectedTab}
                        callOffs={currentCallOffs}
                        callOffState={callOffState}
                        onCallOffStateChange={setCallOffState}
                        timeframe={timeframe}
                        onTimeframeChange={setTimeframe}
                        onAction={handleAction}
                        interactive={true}
                    />
                </PageLayout>
            </div>
        </div>
    );
};
