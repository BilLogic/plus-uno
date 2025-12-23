/**
 * Universal Specs - Elements
 * 
 * Element-level components for universal organisms.
 * These are reusable building blocks used in universal navigation and UI patterns.
 * 
 * Components:
 * - SidebarTab: Sidebar navigation tab with states
 * - UserAvatar: User avatar with name and notification counter
 * - StaticBadgeSmart: SMART competency area badge
 */

import React from 'react';
import SidebarTab from '@/components/SidebarTab';
import UserAvatar from '@/components/UserAvatar';
import StaticBadgeSmart from '@/components/StaticBadgeSmart';

export default {
    title: 'Specs/Universal/Elements',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Element-level components for universal organisms. These are reusable building blocks used in universal navigation and UI patterns.',
            },
        },
    },
};

/**
 * Overview
 * Comprehensive view of universal element components.
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '600px' }}>
        {/* SidebarTab */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>SidebarTab</h6>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Sidebar navigation tabs with icon and text. Supports enabled, hover, selected, disabled, and focus states.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)', maxWidth: '300px' }}>
                <SidebarTab text="Enabled Tab" icon="home" state="enabled" leadingVisual />
                <SidebarTab text="Selected Tab" icon="star" state="selected" leadingVisual />
                <SidebarTab text="Hover Tab" icon="cog" state="hover" leadingVisual />
                <SidebarTab text="Disabled Tab" icon="ban" state="disabled" leadingVisual />
            </div>
        </section>

        {/* UserAvatar */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>UserAvatar</h6>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                User avatar component with name display and optional notification counter.
            </p>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <UserAvatar firstChar="J" name="John Doe" type="regular tutor" />
                <UserAvatar firstChar="S" name="Sarah Admin" type="admin" counter counterValue={5} />
                <UserAvatar firstChar="L" name="Lead Tutor" type="lead tutor" />
            </div>
        </section>

        {/* StaticBadgeSmart */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>StaticBadgeSmart</h6>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                SMART competency area badges for skill categorization.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <StaticBadgeSmart competency="specific" />
                <StaticBadgeSmart competency="measurable" />
                <StaticBadgeSmart competency="attainable" />
                <StaticBadgeSmart competency="relevant" />
                <StaticBadgeSmart competency="timely" />
            </div>
        </section>
    </div>
);

/**
 * SidebarTab States
 * All sidebar tab states: enabled, hover, selected, disabled, focus
 */
export const SidebarTabStates = () => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--size-element-gap-md)',
        padding: 'var(--size-section-pad-y-lg)',
        maxWidth: '300px'
    }}>
        {['enabled', 'hover', 'selected', 'disabled', 'focus'].map(state => (
            <SidebarTab
                key={state}
                text={`${state.charAt(0).toUpperCase() + state.slice(1)} Tab`}
                icon="icons"
                state={state}
                leadingVisual
            />
        ))}
    </div>
);

/**
 * SidebarTab Interactive
 * Interactive sidebar tab with controls
 */
export const SidebarTabInteractive = (args) => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', backgroundColor: 'var(--color-surface)' }}>
        <SidebarTab {...args} />
    </div>
);
SidebarTabInteractive.args = {
    text: 'Tab Title',
    icon: 'icons',
    state: 'enabled',
    leadingVisual: true,
    trailingVisual: false
};
SidebarTabInteractive.argTypes = {
    text: { control: 'text', description: 'Tab label text' },
    icon: { control: 'text', description: 'Icon name (Font Awesome)' },
    state: {
        control: { type: 'select' },
        options: ['enabled', 'hover', 'selected', 'disabled', 'focus'],
        description: 'Tab state'
    },
    leadingVisual: { control: 'boolean', description: 'Show leading icon' },
    trailingVisual: { control: 'boolean', description: 'Show trailing visual' }
};

/**
 * UserAvatar Interactive
 * Interactive user avatar with controls
 */
export const UserAvatarInteractive = (args) => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
        <UserAvatar {...args} />
    </div>
);
UserAvatarInteractive.args = {
    firstChar: 'J',
    name: 'John Doe',
    counter: true,
    counterValue: 2,
    state: 'enabled',
    type: 'regular tutor'
};
UserAvatarInteractive.argTypes = {
    firstChar: { control: 'text', description: 'First character for avatar' },
    name: { control: 'text', description: 'User name' },
    counter: { control: 'boolean', description: 'Show notification counter' },
    counterValue: { control: 'number', description: 'Counter value', if: { arg: 'counter' } },
    state: {
        control: { type: 'radio' },
        options: ['enabled', 'hover'],
        description: 'Component state'
    },
    type: {
        control: { type: 'select' },
        options: ['regular tutor', 'lead tutor', 'admin'],
        description: 'User type (affects badge color)'
    }
};

/**
 * StaticBadgeSmart Variants
 * All SMART competency badge variants
 */
export const StaticBadgeSmartVariants = () => (
    <div style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        padding: 'var(--size-section-pad-y-lg)'
    }}>
        <StaticBadgeSmart competency="specific" />
        <StaticBadgeSmart competency="measurable" />
        <StaticBadgeSmart competency="attainable" />
        <StaticBadgeSmart competency="relevant" />
        <StaticBadgeSmart competency="timely" />
    </div>
);
