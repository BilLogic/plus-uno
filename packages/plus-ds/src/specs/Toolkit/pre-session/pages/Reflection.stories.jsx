import React, { useState } from 'react';
import Button from '../../../../components/Button/Button';
import { PageLayout } from '../../../../specs/Universal/Pages';
import { StatCard } from '../cards/OverviewCard.stories';
import { ReflectionsTableRow, ReflectionsTableHeaderRow } from '../tables/ReflectionsTable.stories';
import { NavHorizontal } from '../tables/NavHorizontal.stories';
import { CompletionFilter } from '../elements/Filters/CompletionFilter.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Pages/Reflection',
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
 * Main Content Area for Reflection Page
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
    reflections,
    completionFilter,
    onCompletionFilterChange,
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
        {/* Stat Cards - using card gap token */}
        <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)' }}>
            <StatCard title="Today's sessions" value="1" icon="fa-solid fa-calendar-day" />
            <StatCard title="Pending call-offs" value="2" icon="fa-solid fa-hourglass-half" />
            <StatCard title="Open for fill-ins" value="23" icon="fa-solid fa-right-to-bracket" />
        </div>

        {/* Fill in Button - aligned right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button size="default" fill="filled" style="primary" leadingVisual="user-plus" text="Fill in" />
        </div>

        {/* Nav Tabs */}
        <NavHorizontal tabs={tabs} selectedTab={selectedTab} onTabChange={onTabChange} />

        {/* Table Section - using section gap token */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-sm)' }}>
            {/* Table Header with Title and Filters */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <SectionTitle title="Session Reflections" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-element-gap-sm)' }}>
                    <CompletionFilter
                        initialSelection={completionFilter}
                        interactive={interactive}
                    />
                </div>
            </div>

            {/* Reflections Table */}
            <div>
                <ReflectionsTableHeaderRow />
                {reflections.map((reflection, index) => (
                    <ReflectionsTableRow
                        key={index}
                        date={reflection.date}
                        timeRange={reflection.timeRange}
                        school={reflection.school}
                        teacher={reflection.teacher}
                        status={reflection.status}
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
    { id: 'sign-ups', label: 'Sign-ups', count: 20 },
    { id: 'fill-ins', label: 'Fill-ins', count: 3 },
    { id: 'call-offs', label: 'Call-offs', count: 3 },
    { id: 'reflections', label: 'Reflections' },
];

const defaultReflections = [
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'incomplete' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'incomplete' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'incomplete' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'incomplete' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'incomplete' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'incomplete' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'incomplete' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'incomplete' },
    { date: 'Tue, Sep 9', timeRange: '12:30 PM - 1:30 PM', school: 'Hogwarts', teacher: 'Mr. Snape', status: 'incomplete' },
];

/**
 * Reflection Page - Overview/Static Version
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
            id="reflection-page"
        >
            <MainContent
                tabs={defaultTabs}
                selectedTab="reflections"
                onTabChange={() => {}}
                reflections={defaultReflections}
                completionFilter="Incomplete"
                onCompletionFilterChange={() => {}}
                onAction={() => {}}
                interactive={false}
            />
        </PageLayout>
    </div>
);

/**
 * Reflection Page - Interactive Version
 * Full layout with working state management for:
 * - Tab switching
 * - Completion filter
 * - Action buttons
 * - Breakpoint toggle to preview at different screen sizes
 */
export const Interactive = () => {
    const [selectedTab, setSelectedTab] = useState('reflections');
    const [completionFilter, setCompletionFilter] = useState('Incomplete');
    const [breakpoint, setBreakpoint] = useState('xl');
    const [reflections, setReflections] = useState(defaultReflections);

    // Breakpoint widths from design system
    const breakpointWidths = {
        'md': 768,
        'lg': 1024,
        'xl': 1440,
    };

    const tabs = [
        { id: 'my-sessions', label: 'My sessions', count: 20 },
        { id: 'sign-ups', label: 'Sign-ups', count: 20 },
        { id: 'fill-ins', label: 'Fill-ins', count: 3 },
        { id: 'call-offs', label: 'Call-offs', count: 3 },
        { id: 'reflections', label: 'Reflections', count: reflections.filter(r => r.status === 'incomplete').length },
    ];

    // Filter reflections based on completion filter
    const filteredReflections = reflections.filter(r => {
        if (completionFilter === 'Both') return true;
        if (completionFilter === 'Incomplete') return r.status === 'incomplete';
        if (completionFilter === 'Completed') return r.status === 'completed';
        return true;
    });

    const handleAction = (index) => {
        const reflection = filteredReflections[index];
        if (reflection.status === 'incomplete') {
            // Mark as completed when "Start" is clicked
            setReflections(prev => prev.map((r, i) => {
                // Find the actual index in the original array
                const originalIndex = prev.findIndex(orig => 
                    orig.date === reflection.date && 
                    orig.timeRange === reflection.timeRange && 
                    orig.school === reflection.school
                );
                if (i === originalIndex) {
                    return { ...r, status: 'completed' };
                }
                return r;
            }));
            alert(`Starting reflection for ${reflection.school} - ${reflection.date}`);
        } else {
            alert(`Viewing details for ${reflection.school} - ${reflection.date}`);
        }
    };

    const completedCount = reflections.filter(r => r.status === 'completed').length;
    const incompleteCount = reflections.filter(r => r.status === 'incomplete').length;

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
                    Filter: <strong>{completionFilter}</strong>
                </span>
                <span className="body2-txt" style={{ color: 'var(--color-success)' }}>
                    Completed: <strong>{completedCount}</strong>
                </span>
                <span className="body2-txt" style={{ color: 'var(--color-error)' }}>
                    Incomplete: <strong>{incompleteCount}</strong>
                </span>
                <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Showing: <strong>{filteredReflections.length}</strong> reflections
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
                    id="reflection-page-interactive"
                >
                    <MainContent
                        tabs={tabs}
                        selectedTab={selectedTab}
                        onTabChange={setSelectedTab}
                        reflections={filteredReflections}
                        completionFilter={completionFilter}
                        onCompletionFilterChange={setCompletionFilter}
                        onAction={handleAction}
                        interactive={true}
                    />
                </PageLayout>
            </div>
        </div>
    );
};
