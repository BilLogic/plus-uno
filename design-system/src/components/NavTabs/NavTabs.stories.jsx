import React, { useState } from 'react';
import NavTabs from './NavTabs';

export default {
    title: 'Components/NavTabs',
    component: NavTabs,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: 'NavTabs provides tab-style navigation with support for individual items and dropdown menus. Uses React Bootstrap Nav under the hood with custom styling per Figma specs.'
            }
        }
    },
    argTypes: {
        contentPreset: {
            control: 'select',
            options: ['tabs-only', 'with-dropdown'],
            description: 'Preset navigation structure for the interactive demo',
            table: { category: 'Content' }
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
        children: {
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
                <h6 className="h6" style={{ marginBottom: '16px' }}>Standard tabs</h6>
                <NavTabs activeKey={activeKey} onSelect={(k) => setActiveKey(k)}>
                    <NavTabs.Item eventKey="1">Home</NavTabs.Item>
                    <NavTabs.Item eventKey="2">Profile</NavTabs.Item>
                    <NavTabs.Item eventKey="3">Messages</NavTabs.Item>
                    <NavTabs.Item eventKey="4" disabled>Disabled</NavTabs.Item>
                </NavTabs>
            </section>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>With dropdown</h6>
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
            <h6 className="h6" style={{ marginBottom: '16px' }}>Justified tabs</h6>
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
            <h6 className="h6" style={{ marginBottom: '16px' }}>Interaction states</h6>
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

export const Overview = () => (
    <div style={col}>
        <NavTabsContentDemos />
        <NavTabsLayoutDemo />
        <NavTabsInteractionStatesDemos />
    </div>
);

export const Interactive = (args) => {
    const [activeKey, setActiveKey] = useState('1');

    return (
        <NavTabs
            activeKey={activeKey}
            onSelect={(k) => setActiveKey(k)}
            alignment={args.alignment}
        >
            <NavTabs.Item eventKey="1">Tab 1</NavTabs.Item>
            <NavTabs.Item eventKey="2">Tab 2</NavTabs.Item>
            <NavTabs.Item eventKey="3">Tab 3</NavTabs.Item>
            {args.contentPreset === 'with-dropdown' ? (
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
    alignment: 'left'
};
