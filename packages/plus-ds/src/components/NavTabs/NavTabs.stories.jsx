import React, { useState } from 'react';
import NavTabs from './NavTabs';

export default {
    title: 'Components/NavTabs',
    component: NavTabs,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'NavTabs provides tab-style navigation with support for individual items and dropdown menus. Uses React Bootstrap Nav under the hood with custom styling per Figma specs.'
            }
        }
    },
    argTypes: {
        alignment: {
            control: 'select',
            options: ['left', 'center', 'right', 'justified'],
            description: 'Horizontal alignment of nav items',
            table: { category: 'Layout' }
        }
    }
};

export const Overview = () => {
    const [activeKey, setActiveKey] = useState('1');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Standard Tabs</h6>
                <NavTabs activeKey={activeKey} onSelect={(k) => setActiveKey(k)}>
                    <NavTabs.Item eventKey="1">Home</NavTabs.Item>
                    <NavTabs.Item eventKey="2">Profile</NavTabs.Item>
                    <NavTabs.Item eventKey="3">Messages</NavTabs.Item>
                    <NavTabs.Item eventKey="4" disabled>Disabled</NavTabs.Item>
                </NavTabs>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>With Dropdown</h6>
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

            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Justified Tabs</h6>
                <NavTabs alignment="justified" defaultActiveKey="1">
                    <NavTabs.Item eventKey="1">Tab One</NavTabs.Item>
                    <NavTabs.Item eventKey="2">Tab Two</NavTabs.Item>
                    <NavTabs.Item eventKey="3">Tab Three</NavTabs.Item>
                </NavTabs>
            </section>
        </div>
    );
};

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
        </NavTabs>
    );
};

Interactive.args = {
    alignment: 'left'
};
