import React, { useState } from 'react';
import NavPills from './NavPills';

export default {
    title: 'Components/NavPills',
    component: NavPills,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: 'NavPills provides pill-style navigation with support for individual items and dropdown menus. Uses React Bootstrap Nav under the hood with custom styling.'
            }
        }
    },
    argTypes: {
        alignment: {
            control: 'select',
            options: ['left', 'center', 'right'],
            description: 'Horizontal alignment of nav items',
            table: { category: 'Layout' }
        },
        direction: {
            control: 'select',
            options: ['horizontal', 'vertical'],
            description: 'Orientation of the navigation',
            table: { category: 'Layout' }
        }
    }
};

const col = { display: 'flex', flexDirection: 'column', gap: '48px' };

function NavPillsContentDemos() {
    const [activeKey, setActiveKey] = useState('1');

    return (
        <>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Horizontal pills</h6>
                <NavPills activeKey={activeKey} onSelect={(k) => setActiveKey(k)}>
                    <NavPills.Item eventKey="1">Home</NavPills.Item>
                    <NavPills.Item eventKey="2">Profile</NavPills.Item>
                    <NavPills.Item eventKey="3">Messages</NavPills.Item>
                    <NavPills.Item eventKey="4" disabled>Disabled</NavPills.Item>
                </NavPills>
            </section>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>With dropdown</h6>
                <NavPills defaultActiveKey="home">
                    <NavPills.Item eventKey="home">Home</NavPills.Item>
                    <NavPills.Dropdown title="More Options" id="nav-dropdown">
                        <NavPills.Dropdown.Item eventKey="action">Action</NavPills.Dropdown.Item>
                        <NavPills.Dropdown.Item eventKey="another">Another action</NavPills.Dropdown.Item>
                        <NavPills.Dropdown.Divider />
                        <NavPills.Dropdown.Item eventKey="separated">Separated link</NavPills.Dropdown.Item>
                    </NavPills.Dropdown>
                </NavPills>
            </section>
        </>
    );
}

function NavPillsLayoutDemo() {
    return (
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Vertical pills</h6>
            <NavPills direction="vertical" defaultActiveKey="1">
                <NavPills.Item eventKey="1">Home</NavPills.Item>
                <NavPills.Item eventKey="2">Profile</NavPills.Item>
                <NavPills.Item eventKey="3">Messages</NavPills.Item>
            </NavPills>
        </section>
    );
}

export const Content = () => (
    <div style={col}>
        <NavPillsContentDemos />
    </div>
);

export const Layout = () => (
    <div style={col}>
        <NavPillsLayoutDemo />
    </div>
);

export const Overview = () => (
    <div style={col}>
        <NavPillsContentDemos />
        <NavPillsLayoutDemo />
    </div>
);

export const Interactive = (args) => {
    const [activeKey, setActiveKey] = useState('1');

    return (
        <NavPills
            activeKey={activeKey}
            onSelect={(k) => setActiveKey(k)}
            alignment={args.alignment}
            direction={args.direction}
        >
            <NavPills.Item eventKey="1">Tab 1</NavPills.Item>
            <NavPills.Item eventKey="2">Tab 2</NavPills.Item>
            <NavPills.Item eventKey="3">Tab 3</NavPills.Item>
        </NavPills>
    );
};

Interactive.args = {
    alignment: 'left',
    direction: 'horizontal'
};
