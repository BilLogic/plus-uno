import React from 'react';
import { Sidebar, Navbar, Footer } from '@/components';

export default {
    title: 'Specs/Universal/Sections',
    parameters: {
        layout: 'fullscreen',
    },
};

export const SidebarInteractive = (args) => (
    <div style={{ height: '100vh', backgroundColor: 'var(--color-surface-container)' }}>
        <Sidebar {...args} />
    </div>
);
SidebarInteractive.args = {
    user: 'supervisor',
    visible: true,
};

export const TopBarInteractive = (args) => (
    <div style={{ padding: '20px', backgroundColor: 'var(--color-surface-container)' }}>
        <Navbar {...args} />
    </div>
);
TopBarInteractive.args = {
    brand: 'PLUS',
    items: [{ text: 'Universal' }, { text: 'Sections' }],
    components: [{ type: 'custom', content: <span>User Avatar</span> }]
};

export const FooterDefault = (args) => (
    <div style={{ padding: '20px' }}>
        <Footer {...args} />
    </div>
);
FooterDefault.args = {
    version: 'v5.2.0',
    copyright: 'Copyright © Carnegie Mellon University 2024'
};
