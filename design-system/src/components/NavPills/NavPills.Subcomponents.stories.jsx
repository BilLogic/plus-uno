import React, { useState } from 'react';
import NavPills from './NavPills';
import { Nav } from 'react-bootstrap';

export default {
    title: 'Components/NavPills',
    component: NavPills.Item,
    tags: ['!dev'],
    subcomponents: { 'NavPills.Dropdown': NavPills.Dropdown },
    parameters: {
        docs: {
            description: {
                component: 'Subcomponents for NavPills: Pill Item and Pill Dropdown. Each supports various states including default, hover, pressed, focus, disabled, and selected states.'
            }
        }
    },
    argTypes: {
        eventKey: {
            control: 'text',
            description: 'Unique identifier for the pill item',
            table: { category: 'Behavior' }
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the pill item',
            table: { category: 'State' }
        },
        children: {
            control: 'text',
            description: 'Label text for the pill',
            table: { category: 'Content' }
        }
    }
};

const col = { display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px' };

function PillGroupDemo() {
    const [activeKey, setActiveKey] = useState('1');
    return (
        <NavPills activeKey={activeKey} onSelect={(k) => setActiveKey(k)}>
            <NavPills.Item eventKey="1">Profile</NavPills.Item>
            <NavPills.Item eventKey="2">Settings</NavPills.Item>
            <NavPills.Item eventKey="3">Notifications</NavPills.Item>
            <NavPills.Item eventKey="4" disabled>Archived</NavPills.Item>
        </NavPills>
    );
}

function NavPillsSubInteractionStatesDemos() {
    return (
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Pill item states</h6>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Default, selected, and disabled.
            </p>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div>
                    <p className="body3-txt" style={{ marginBottom: '8px' }}>Default</p>
                    <NavPills defaultActiveKey="none">
                        <NavPills.Item eventKey="1">Pill Label</NavPills.Item>
                    </NavPills>
                </div>
                <div>
                    <p className="body3-txt" style={{ marginBottom: '8px' }}>Selected</p>
                    <NavPills defaultActiveKey="1">
                        <NavPills.Item eventKey="1">Pill Label</NavPills.Item>
                    </NavPills>
                </div>
                <div>
                    <p className="body3-txt" style={{ marginBottom: '8px' }}>Disabled</p>
                    <NavPills defaultActiveKey="none">
                        <NavPills.Item eventKey="1" disabled>Pill Label</NavPills.Item>
                    </NavPills>
                </div>
            </div>
        </section>
    );
}

function NavPillsSubContentDemos() {
    return (
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Pill group</h6>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Controlled group with a disabled item.
            </p>
            <PillGroupDemo />
        </section>
    );
}

function NavPillsSubLayoutDemos() {
    return (
        <>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Dropdown pill</h6>
                <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                    Nested actions inside a pill dropdown.
                </p>
                <NavPills defaultActiveKey="home">
                    <NavPills.Item eventKey="home">Home</NavPills.Item>
                    <NavPills.Dropdown title="More Options" id="pill-dropdown-docs">
                        <Nav.Link eventKey="action-1">Action One</Nav.Link>
                        <Nav.Link eventKey="action-2">Action Two</Nav.Link>
                        <Nav.Link eventKey="action-3">Action Three</Nav.Link>
                    </NavPills.Dropdown>
                    <NavPills.Item eventKey="contact">Contact</NavPills.Item>
                </NavPills>
            </section>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Disabled dropdown</h6>
                <NavPills defaultActiveKey="home">
                    <NavPills.Item eventKey="home">Home</NavPills.Item>
                    <NavPills.Dropdown title="Disabled" id="pill-disabled-dropdown-docs" disabled>
                        <Nav.Link eventKey="action">Action</Nav.Link>
                    </NavPills.Dropdown>
                </NavPills>
            </section>
        </>
    );
}

export const NavPillsItemStates = () => (
    <div style={col}>
        <NavPillsSubInteractionStatesDemos />
    </div>
);

export const NavPillsSubPillGroup = () => (
    <div style={col}>
        <NavPillsSubContentDemos />
    </div>
);

export const NavPillsSubPillDropdowns = () => (
    <div style={col}>
        <NavPillsSubLayoutDemos />
    </div>
);

export const NavPillsSubOverview = () => (
    <div style={col}>
        <NavPillsSubInteractionStatesDemos />
        <NavPillsSubContentDemos />
        <NavPillsSubLayoutDemos />
    </div>
);

export const NavPillsItemInteractive = (args) => {
    const [activeKey, setActiveKey] = useState('selected');

    return (
        <div style={{ maxWidth: '400px' }}>
            <NavPills activeKey={activeKey} onSelect={(k) => setActiveKey(k)}>
                <NavPills.Item eventKey="selected" disabled={args.disabled}>
                    {args.children || 'Pill Label'}
                </NavPills.Item>
                <NavPills.Item eventKey="other">Other Pill</NavPills.Item>
            </NavPills>
        </div>
    );
};
NavPillsItemInteractive.args = {
    children: 'Pill Label',
    disabled: false
};
NavPillsItemInteractive.parameters = {
    docs: {
        description: {
            story: 'Interactive playground - use the controls panel to customize the pill item.'
        }
    }
};
