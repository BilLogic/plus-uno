import React from 'react';
import { SidebarTab, UserAvatar, StaticBadgeSmart } from '@/components';

export default {
    title: 'Specs/Universal/Elements',
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Element-level components for universal organisms. These are reusable building blocks used in universal navigation and UI patterns.',
            },
        },
    },
};

/**
 * Sidebar Tab - All States
 * Showing all visual states simultaneously for review.
 */
export const SidebarTabStates = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '300px' }}>
        <SidebarTab text="Enabled" icon="icons" state="enabled" leadingVisual={true} />
        <SidebarTab text="Hover" icon="icons" state="hover" leadingVisual={true} />
        <SidebarTab text="Selected" icon="icons" state="selected" leadingVisual={true} />
        <SidebarTab text="Disabled" icon="icons" state="disabled" leadingVisual={true} />
        <SidebarTab text="Focus" icon="icons" state="focus" leadingVisual={true} />
    </div>
);

/**
 * Sidebar Tab - Interactive
 * Fully interactive playground for SidebarTab props.
 */
export const SidebarTabInteractive = {
    render: (args) => (
        <div style={{ padding: '20px', maxWidth: '300px', backgroundColor: 'var(--color-surface-container)' }}>
            <SidebarTab {...args} />
        </div>
    ),
    argTypes: {
        text: { control: 'text' },
        icon: { control: 'text' },
        state: {
            control: { type: 'select' },
            options: ['enabled', 'hover', 'selected', 'disabled', 'focus']
        },
        leadingVisual: { control: 'boolean' },
        trailingVisual: { control: 'boolean' }
    },
    args: {
        text: 'Tab Title',
        icon: 'icons',
        state: 'enabled',
        leadingVisual: true,
        trailingVisual: false
    }
};

/**
 * User Avatar - Interactive
 * Fully interactive playground for UserAvatar props.
 */
export const UserAvatarInteractive = {
    render: (args) => (
        <UserAvatar {...args} />
    ),
    argTypes: {
        firstChar: { control: 'text' },
        name: { control: 'text' },
        counter: { control: 'boolean' },
        counterValue: { control: 'number', if: { arg: 'counter' } },
        state: {
            control: { type: 'radio' },
            options: ['enabled', 'hover']
        },
        type: {
            control: { type: 'select' },
            options: ['regular tutor', 'lead tutor', 'admin']
        }
    },
    args: {
        firstChar: 'J',
        name: 'John Doe',
        counter: true,
        counterValue: 2,
        state: 'enabled',
        type: 'regular tutor'
    }
};

/**
 * Static Badge Smart - Demo
 */
export const StaticBadgeSmartDemo = () => (
    <div style={{ display: 'flex', gap: '8px' }}>
        <StaticBadgeSmart label="Social-Emotional" type="social-emotional" />
        <StaticBadgeSmart label="Academic" type="academic" />
    </div>
);

