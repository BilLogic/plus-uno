import React, { useState } from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import SidebarTab from '@/components/SidebarTab';

export default {
    title: 'Components/SidebarTab',
    component: SidebarTab,
    tags: ['!dev'],
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        state: {
            control: { type: 'select' },
            options: ['enabled', 'selected', 'disabled'],
            table: { category: 'Behavior' }
        },
        icon: { control: 'text', table: { category: 'Content' } },
        text: { control: 'text', table: { category: 'Content' } },
        leadingVisual: { control: 'boolean', table: { category: 'Content' } },
        trailingVisual: { control: 'boolean', table: { category: 'Content' } },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
    },
    // Add gap to decorator for better spacing in list
    decorators: [
        (Story) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <Story />
            </div>
        )
    ]
};

const sidebarSurface = {
    display: 'inline-flex',
    backgroundColor: 'var(--color-surface-container)',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid var(--color-outline-variant)',
};

export const InSidebar = () => {
    const [selected, setSelected] = useState('dashboard');
    const items = [
        { id: 'dashboard', text: 'Dashboard', icon: 'home' },
        { id: 'reports', text: 'Reports', icon: 'chart-bar' },
        { id: 'settings', text: 'Settings', icon: 'cog' },
    ];
    return (
        <div style={sidebarSurface}>
            <nav
                aria-label="Example sidebar navigation"
                style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}
            >
                {items.map((item) => (
                    <SidebarTab
                        key={item.id}
                        text={item.text}
                        icon={item.icon}
                        state={selected === item.id ? 'selected' : 'enabled'}
                        onClick={() => setSelected(item.id)}
                    />
                ))}
            </nav>
        </div>
    );
};
InSidebar.parameters = {
    docs: {
        disable: true
    }
};

export const Default = {
    args: {
        text: 'Dashboard',
        icon: 'home',
        state: 'enabled',
    },
    parameters: {
        docs: {
            disable: true
        }
    }
};

export const Overview = {
    ...Default,
    parameters: {
        docs: {
            source: { language: 'html', code: webAppSourceSnippets.sidebarTab }
        }
    }
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

export const Interactive = {
    args: {
        text: 'Dashboard',
        icon: 'home',
        state: 'enabled',
        leadingVisual: true,
        trailingVisual: false,
    },
    render: (args) => <SidebarTab {...args} />,
};
