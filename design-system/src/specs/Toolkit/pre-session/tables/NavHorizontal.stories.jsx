import React, { useState } from 'react';
import Badge from '../../../../components/Badge/Badge';

export default {
    title: 'Specs/Toolkit/Pre-Session/Tables/Nav Horizontal',
    tags: ['!autodocs'],
    parameters: {
        layout: 'padded',
    },
};

const defaultTabs = [
    { id: 'my-sessions', label: 'My sessions', count: 3 },
    { id: 'all-sessions', label: 'All sessions', count: 3 },
    { id: 'sign-ups', label: 'Sign-ups', count: 3 },
    { id: 'fill-ins', label: 'Fill-ins', count: 3 },
    { id: 'call-offs', label: 'Call-offs', count: 3 },
    { id: 'reflections', label: 'Reflections', count: 20 },
];

/**
 * Tab Item
 * Individual tab with label and counter badge
 * Uses semantic tokens:
 * - Gap: --size-element-gap-lg
 * - Padding: --size-element-pad-y-lg, --size-element-pad-x-lg
 * - Radius: --size-element-radius-md (top corners)
 * - Border: --color-secondary (selected indicator)
 * - Colors: --color-secondary-text (selected), --color-on-surface-variant (default)
 * - Typography: body1-txt font-weight-semibold
 */
const TabItem = ({ label, count, isSelected, onClick }) => (
    <button
        onClick={onClick}
        style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--size-element-gap-lg)',
            padding: 'var(--size-element-pad-y-lg) var(--size-element-pad-x-lg)',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: isSelected ? '2px solid var(--color-secondary)' : '2px solid transparent',
            borderRadius: 'var(--size-element-radius-md) var(--size-element-radius-md) 0 0',
            cursor: 'pointer',
            color: isSelected ? 'var(--color-secondary-text)' : 'var(--color-on-surface-variant)',
            whiteSpace: 'nowrap',
            minWidth: '120px'
        }}
        className="body1-txt font-weight-semibold"
    >
        {label}
        <span style={{ display: 'flex', alignItems: 'center' }}>
            <Badge
                text={String(count)}
                style={isSelected ? 'primary' : 'secondary'}
                size="b3"
                className="py-0"
            />
        </span>
    </button>
);

/**
 * Nav Horizontal Component
 * Horizontal tab navigation with counters
 * Uses semantic tokens:
 * - Border: --color-outline-variant (bottom divider)
 * 
 * Props:
 * - tabs: Array of { id, label, count }
 * - selectedTab: Currently selected tab id
 * - onTabChange: Callback when tab is clicked
 */
export const NavHorizontal = ({
    tabs = defaultTabs,
    selectedTab = 'my-sessions',
    onTabChange
}) => (
    <div
        style={{
            width: '100%',
            borderBottom: '1px solid var(--color-outline-variant)',
            boxSizing: 'border-box',
            overflowX: 'auto',
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none' /* IE/Edge */
        }}
        className="hide-scrollbar"
    >
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-end',
                minWidth: 'max-content'
            }}
        >
            {tabs.map((tab) => (
                <TabItem
                    key={tab.id}
                    label={tab.label}
                    count={tab.count}
                    isSelected={selectedTab === tab.id}
                    onClick={onTabChange ? () => onTabChange(tab.id) : undefined}
                />
            ))}
        </div>
    </div>
);

/**
 * Overview - All States
 */
export const Overview = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)'
        }}
    >
        <section>
            <h6 className="h6 mb-3">Default State (My sessions selected)</h6>
            <NavHorizontal selectedTab="my-sessions" />
        </section>

        <section>
            <h6 className="h6 mb-3">All sessions selected</h6>
            <NavHorizontal selectedTab="all-sessions" />
        </section>

        <section>
            <h6 className="h6 mb-3">Call-offs selected</h6>
            <NavHorizontal selectedTab="call-offs" />
        </section>
    </div>
);

/**
 * Interactive Demo
 */
export const Interactive = () => {
    const [selectedTab, setSelectedTab] = useState('my-sessions');

    return (
        <div>
            <h6 className="h6 mb-3">Interactive Demo</h6>
            <p className="body2-txt mb-4">Click on tabs to switch between them.</p>
            <NavHorizontal
                selectedTab={selectedTab}
                onTabChange={setSelectedTab}
            />
        </div>
    );
};
