import React, { useState } from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import NavTabs from './NavTabs';

export default {
    title: 'Components/Navigation/Nav tabs',
    component: NavTabs,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'NavTabs provides tab-style navigation with support for individual items and dropdown menus. Uses React Bootstrap Nav under the hood with custom styling per Figma specs.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        contentPreset: {
            control: 'select',
            options: ['tabs-only', 'with-dropdown'],
            description: 'Preset navigation structure for the interactive demo',
            table: { category: 'Content' }
        },
        mode: {
            control: 'inline-radio',
            options: ['navigation', 'tabs'],
            description:
                '`navigation` renders anchors and no tab semantics — the default, and what existing callers get. `tabs` renders a `role="tablist"` of buttons with `aria-selected`, roving tabindex and arrow keys. A dropdown is not a tab, so the dropdown preset only applies in navigation mode.',
            table: { category: 'Behavior' }
        },
        alignment: {
            control: 'select',
            options: ['left', 'center', 'right', 'justified'],
            description: 'Horizontal alignment of nav items',
            table: { category: 'Layout' }
        },
        activeKey: {
            table: { disable: true, category: 'Development' }
        },
        defaultActiveKey: {
            table: { disable: true, category: 'Development' }
        },
        onSelect: {
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        }
    }
};

const col = { display: 'flex', flexDirection: 'column', gap: '48px' };

function NavTabsContentDemos() {
    const [activeKey, setActiveKey] = useState('1');

    return (
        <>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">STANDARD TABS</span>
                <NavTabs activeKey={activeKey} onSelect={(k) => setActiveKey(k)}>
                    <NavTabs.Item eventKey="1">Home</NavTabs.Item>
                    <NavTabs.Item eventKey="2">Profile</NavTabs.Item>
                    <NavTabs.Item eventKey="3">Messages</NavTabs.Item>
                    <NavTabs.Item eventKey="4" disabled>Disabled</NavTabs.Item>
                </NavTabs>
            </section>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">WITH DROPDOWN</span>
                <NavTabs defaultActiveKey="home">
                    <NavTabs.Item eventKey="home">Home</NavTabs.Item>
                    <NavTabs.Dropdown title="More Options" id="nav-tab-dropdown">
                        <NavTabs.Dropdown.Item eventKey="action">Action</NavTabs.Dropdown.Item>
                        <NavTabs.Dropdown.Item eventKey="another">Another action</NavTabs.Dropdown.Item>
                        <NavTabs.Dropdown.Divider />
                        <NavTabs.Dropdown.Item eventKey="separated">Separated link</NavTabs.Dropdown.Item>
                    </NavTabs.Dropdown>
                </NavTabs>
            </section>
        </>
    );
}

function NavTabsLayoutDemo() {
    return (
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">JUSTIFIED TABS</span>
            <NavTabs alignment="justified" defaultActiveKey="1">
                <NavTabs.Item eventKey="1">Tab One</NavTabs.Item>
                <NavTabs.Item eventKey="2">Tab Two</NavTabs.Item>
                <NavTabs.Item eventKey="3">Tab Three</NavTabs.Item>
            </NavTabs>
        </section>
    );
}

function NavTabsInteractionStatesDemos() {
    return (
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">INTERACTION STATES</span>
            <p className="body2-txt" style={{ marginBottom: '24px', color: 'var(--color-on-surface-variant)' }}>
                States below are artificially forced for demonstration.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                    <p className="body3-txt" style={{ marginBottom: '16px', fontWeight: 'bold' }}>Unselected tab states</p>
                    <NavTabs defaultActiveKey="none">
                        <NavTabs.Item eventKey="default">Default</NavTabs.Item>
                        <NavTabs.Item eventKey="hover" className="pseudo-hover">Hovered</NavTabs.Item>
                        <NavTabs.Item eventKey="focus" className="pseudo-focus">Focused</NavTabs.Item>
                        <NavTabs.Item eventKey="pressed" className="pseudo-pressed">Pressed</NavTabs.Item>
                    </NavTabs>
                </div>
                <div>
                    <p className="body3-txt" style={{ marginBottom: '16px', fontWeight: 'bold' }}>Active tab states</p>
                    <NavTabs defaultActiveKey="none">
                        <NavTabs.Item eventKey="active-default" active>Active (Default)</NavTabs.Item>
                        <NavTabs.Item eventKey="active-hover" active className="pseudo-hover">Active (Hovered)</NavTabs.Item>
                        <NavTabs.Item eventKey="active-focus" active className="pseudo-focus">Active (Focused)</NavTabs.Item>
                        <NavTabs.Item eventKey="active-pressed" active className="pseudo-pressed">Active (Pressed)</NavTabs.Item>
                    </NavTabs>
                </div>
            </div>
        </section>
    );
}

export const Content = () => (
    <div style={col}>
        <NavTabsContentDemos />
    </div>
);

export const Layout = () => (
    <div style={col}>
        <NavTabsLayoutDemo />
    </div>
);

export const InteractionStates = () => (
    <div style={col}>
        <NavTabsInteractionStatesDemos />
    </div>
);

export const Overview = () => {
    const [activeKey, setActiveKey] = useState('1');

    return (
        <NavTabs activeKey={activeKey} onSelect={(k) => setActiveKey(k)}>
            <NavTabs.Item eventKey="1">Home</NavTabs.Item>
            <NavTabs.Item eventKey="2">Profile</NavTabs.Item>
            <NavTabs.Item eventKey="3">Messages</NavTabs.Item>
        </NavTabs>
    );
};
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.navTabs }
    }
};

/**
 * Semantics: the same three tabs in each mode, side by side.
 *
 * The difference is not visual, which is the point — inspect the two, or reach
 * them with a keyboard. Navigation gives three anchors and three stops in the
 * tab sequence, with the selected one carried by colour alone. Tabs gives one
 * stop, arrow keys within the strip, `aria-selected`, and a panel each tab is
 * wired to.
 */
export const Semantics = () => {
    const [nav, setNav] = useState('1');
    const [tabs, setTabs] = useState('1');

    return (
        <div style={col}>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">
                    NAVIGATION (DEFAULT) — ANCHORS, NO TAB SEMANTICS
                </span>
                <NavTabs activeKey={nav} onSelect={(k) => setNav(k)}>
                    <NavTabs.Item eventKey="1">Overview</NavTabs.Item>
                    <NavTabs.Item eventKey="2">Sessions</NavTabs.Item>
                    <NavTabs.Item eventKey="3">Reports</NavTabs.Item>
                </NavTabs>
            </section>

            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">
                    TABS — ROLE=TABLIST, ROVING TABINDEX, ARROW KEYS
                </span>
                <NavTabs mode="tabs" activeKey={tabs} onSelect={(k) => setTabs(k)}>
                    <NavTabs.Item eventKey="1">Overview</NavTabs.Item>
                    <NavTabs.Item eventKey="2">Sessions</NavTabs.Item>
                    <NavTabs.Item eventKey="3" disabled>
                        Reports
                    </NavTabs.Item>
                    <NavTabs.Panel eventKey="1">Everything at a glance.</NavTabs.Panel>
                    <NavTabs.Panel eventKey="2">The sessions on the books.</NavTabs.Panel>
                    <NavTabs.Panel eventKey="3">Nothing to report.</NavTabs.Panel>
                </NavTabs>
            </section>
        </div>
    );
};

export const Interactive = (args) => {
    const [activeKey, setActiveKey] = useState('1');
    // A dropdown is not a tab, and there is no valid ARIA for one inside a
    // tablist, so the preset only applies to navigation mode.
    const withDropdown = args.contentPreset === 'with-dropdown' && args.mode !== 'tabs';

    return (
        <NavTabs
            mode={args.mode}
            activeKey={activeKey}
            onSelect={(k) => setActiveKey(k)}
            alignment={args.alignment}
        >
            <NavTabs.Item eventKey="1">Tab 1</NavTabs.Item>
            <NavTabs.Item eventKey="2">Tab 2</NavTabs.Item>
            <NavTabs.Item eventKey="3">Tab 3</NavTabs.Item>
            {withDropdown ? (
                <NavTabs.Dropdown title="More" id="interactive-nav-tabs-dropdown">
                    <NavTabs.Dropdown.Item eventKey="action">Action</NavTabs.Dropdown.Item>
                    <NavTabs.Dropdown.Item eventKey="another">Another action</NavTabs.Dropdown.Item>
                </NavTabs.Dropdown>
            ) : null}
        </NavTabs>
    );
};

Interactive.args = {
    contentPreset: 'tabs-only',
    mode: 'navigation',
    alignment: 'left'
};
