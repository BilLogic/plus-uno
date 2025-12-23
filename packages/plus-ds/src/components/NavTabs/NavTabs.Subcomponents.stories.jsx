import React, { useState } from 'react';
import NavTabs from './NavTabs';
import { Nav } from 'react-bootstrap';

export default {
    title: 'Components/NavTabs/Subcomponents',
    component: NavTabs.Item,
    subcomponents: { 'NavTabs.Dropdown': NavTabs.Dropdown },
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Subcomponents for NavTabs: Tab Item and Tab Dropdown. Each supports various states including default, hover, pressed, focus, disabled, and selected states with underline indicator.'
            }
        }
    },
    argTypes: {
        eventKey: {
            control: 'text',
            description: 'Unique identifier for the tab item',
            table: { category: 'Behavior' }
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the tab item',
            table: { category: 'State' }
        },
        children: {
            control: 'text',
            description: 'Label text for the tab',
            table: { category: 'Content' }
        }
    }
};

/**
 * Overview
 * Comprehensive view of all Tab subcomponent variants and states.
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px' }}>
        {/* Tab Item States */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Tab Item States</h6>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Tab items support: default, selected (with underline), hover, focus, and disabled states.
            </p>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div>
                    <p className="body3-txt" style={{ marginBottom: '8px' }}>Default</p>
                    <NavTabs defaultActiveKey="none">
                        <NavTabs.Item eventKey="1">Tab Label</NavTabs.Item>
                    </NavTabs>
                </div>
                <div>
                    <p className="body3-txt" style={{ marginBottom: '8px' }}>Selected</p>
                    <NavTabs defaultActiveKey="1">
                        <NavTabs.Item eventKey="1">Tab Label</NavTabs.Item>
                    </NavTabs>
                </div>
                <div>
                    <p className="body3-txt" style={{ marginBottom: '8px' }}>Disabled</p>
                    <NavTabs defaultActiveKey="none">
                        <NavTabs.Item eventKey="1" disabled>Tab Label</NavTabs.Item>
                    </NavTabs>
                </div>
            </div>
        </section>

        {/* Multiple Tabs */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Multiple Tabs</h6>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Tabs in a group with keyboard navigation. Active tab shows underline indicator.
            </p>
            <TabGroupDemo />
        </section>

        {/* Dropdown Variant */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Dropdown Tabs</h6>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Tabs can contain dropdown menus for nested navigation.
            </p>
            <NavTabs defaultActiveKey="home">
                <NavTabs.Item eventKey="home">Home</NavTabs.Item>
                <NavTabs.Dropdown title="More Options" id="tab-dropdown">
                    <Nav.Link eventKey="action-1">Action One</Nav.Link>
                    <Nav.Link eventKey="action-2">Action Two</Nav.Link>
                    <Nav.Link eventKey="action-3">Action Three</Nav.Link>
                </NavTabs.Dropdown>
                <NavTabs.Item eventKey="contact">Contact</NavTabs.Item>
            </NavTabs>
        </section>

        {/* Disabled Dropdown */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Disabled Dropdown</h6>
            <NavTabs defaultActiveKey="home">
                <NavTabs.Item eventKey="home">Home</NavTabs.Item>
                <NavTabs.Dropdown title="Disabled" id="tab-disabled-dropdown" disabled>
                    <Nav.Link eventKey="action">Action</Nav.Link>
                </NavTabs.Dropdown>
            </NavTabs>
        </section>
    </div>
);

// Helper component for controlled tab group
const TabGroupDemo = () => {
    const [activeKey, setActiveKey] = useState('1');
    return (
        <NavTabs activeKey={activeKey} onSelect={(k) => setActiveKey(k)}>
            <NavTabs.Item eventKey="1">Profile</NavTabs.Item>
            <NavTabs.Item eventKey="2">Settings</NavTabs.Item>
            <NavTabs.Item eventKey="3">Notifications</NavTabs.Item>
            <NavTabs.Item eventKey="4" disabled>Archived</NavTabs.Item>
        </NavTabs>
    );
};

/**
 * Interactive
 * Playground with controls to customize tab item properties.
 */
export const Interactive = (args) => {
    const [activeKey, setActiveKey] = useState('selected');

    return (
        <div style={{ maxWidth: '400px' }}>
            <NavTabs activeKey={activeKey} onSelect={(k) => setActiveKey(k)}>
                <NavTabs.Item eventKey="selected" disabled={args.disabled}>
                    {args.children || 'Tab Label'}
                </NavTabs.Item>
                <NavTabs.Item eventKey="other">Other Tab</NavTabs.Item>
            </NavTabs>
        </div>
    );
};
Interactive.args = {
    children: 'Tab Label',
    disabled: false
};
Interactive.parameters = {
    docs: {
        description: {
            story: 'Interactive playground - use the controls panel to customize the tab item.'
        }
    }
};
