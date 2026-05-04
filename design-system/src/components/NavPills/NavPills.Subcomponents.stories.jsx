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
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        eventKey: {
            control: 'text',
            description: 'Unique identifier for the pill item',
            table: { category: 'Behavior' }
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the pill item',
            table: { category: 'State' }
        },}
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
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">PILL ITEM STATES</span>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                States below are artificially forced for demonstration.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                    <p className="body3-txt" style={{ marginBottom: '12px', fontWeight: 'bold' }}>Unselected pill states</p>
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        <div>
                            <p className="body3-txt" style={{ marginBottom: '8px' }}>Default</p>
                            <NavPills defaultActiveKey="none">
                                <NavPills.Item eventKey="1">Pill</NavPills.Item>
                            </NavPills>
                        </div>
                        <div>
                            <p className="body3-txt" style={{ marginBottom: '8px' }}>Hovered</p>
                            <NavPills defaultActiveKey="none">
                                <NavPills.Item eventKey="1" className="pseudo-hover">Pill</NavPills.Item>
                            </NavPills>
                        </div>
                        <div>
                            <p className="body3-txt" style={{ marginBottom: '8px' }}>Focused</p>
                            <NavPills defaultActiveKey="none">
                                <NavPills.Item eventKey="1" className="pseudo-focus">Pill</NavPills.Item>
                            </NavPills>
                        </div>
                        <div>
                            <p className="body3-txt" style={{ marginBottom: '8px' }}>Pressed</p>
                            <NavPills defaultActiveKey="none">
                                <NavPills.Item eventKey="1" className="pseudo-pressed">Pill</NavPills.Item>
                            </NavPills>
                        </div>
                    </div>
                </div>

                <div>
                    <p className="body3-txt" style={{ marginBottom: '12px', fontWeight: 'bold' }}>Selected pill states</p>
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        <div>
                            <p className="body3-txt" style={{ marginBottom: '8px' }}>Selected (Default)</p>
                            <NavPills defaultActiveKey="1">
                                <NavPills.Item eventKey="1">Pill</NavPills.Item>
                            </NavPills>
                        </div>
                        <div>
                            <p className="body3-txt" style={{ marginBottom: '8px' }}>Selected (Hovered)</p>
                            <NavPills defaultActiveKey="1">
                                <NavPills.Item eventKey="1" className="pseudo-hover">Pill</NavPills.Item>
                            </NavPills>
                        </div>
                        <div>
                            <p className="body3-txt" style={{ marginBottom: '8px' }}>Selected (Focused)</p>
                            <NavPills defaultActiveKey="1">
                                <NavPills.Item eventKey="1" className="pseudo-focus">Pill</NavPills.Item>
                            </NavPills>
                        </div>
                        <div>
                            <p className="body3-txt" style={{ marginBottom: '8px' }}>Selected (Pressed)</p>
                            <NavPills defaultActiveKey="1">
                                <NavPills.Item eventKey="1" className="pseudo-pressed">Pill</NavPills.Item>
                            </NavPills>
                        </div>
                        <div>
                            <p className="body3-txt" style={{ marginBottom: '8px' }}>Disabled</p>
                            <NavPills defaultActiveKey="none">
                                <NavPills.Item eventKey="1" disabled>Pill</NavPills.Item>
                            </NavPills>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function NavPillsSubContentDemos() {
    return (
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">PILL GROUP</span>
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
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DROPDOWN PILL</span>
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
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DISABLED DROPDOWN</span>
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
NavPillsSubOverview.parameters = {
    docs: {
        disable: true
    }
};

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
