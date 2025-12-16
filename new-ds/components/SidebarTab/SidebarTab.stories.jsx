import React from 'react';
import SidebarTab from '@/components/SidebarTab';

export default {
    title: 'Components/Navigation/SidebarTab',
    component: SidebarTab,
    tags: ['autodocs'],
    argTypes: {
        state: {
            control: { type: 'select' },
            options: ['enabled', 'hover', 'selected', 'disabled', 'focus']
        },
        icon: { control: 'text' },
    },
};

export const Default = {
    args: {
        text: 'Dashboard',
        icon: 'home',
        state: 'enabled',
    },
};

export const Selected = {
    args: {
        text: 'Dashboard',
        icon: 'home',
        state: 'selected',
    },
};

export const Hover = {
    args: {
        text: 'Reports',
        icon: 'chart-bar',
        state: 'hover',
    },
};

export const Disabled = {
    args: {
        text: 'Settings',
        icon: 'cog',
        state: 'disabled',
    },
};

export const NoIcon = {
    args: {
        text: 'Log Out',
        leadingVisual: false,
    },
};

export const WithTrailingIcon = {
    args: {
        text: 'External Link',
        icon: 'external-link-alt',
        trailingVisual: true,
    },
};
