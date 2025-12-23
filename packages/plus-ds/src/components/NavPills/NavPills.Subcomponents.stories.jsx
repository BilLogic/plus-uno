import React, { useState } from 'react';
import NavPills from './NavPills';
import { Nav } from 'react-bootstrap';

export default {
    title: 'Components/NavPills/Subcomponents',
    component: NavPills.Item,
    subcomponents: { 'NavPills.Dropdown': NavPills.Dropdown },
    tags: ['autodocs'],
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

/**
 * Overview
 * Comprehensive view of all Pill subcomponent variants and states.
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px' }}>
        {/* Pill Item States */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Pill Item States</h6>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Pill items support: default, selected, hover, focus, and disabled states.
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

        {/* Multiple Pills */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Multiple Pills</h6>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Pills in a group with tab navigation.
            </p>
            <PillGroupDemo />
        </section>

        {/* Dropdown Variant */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Dropdown Pills</h6>
            <p className="body2-txt" style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
                Pills can contain dropdown menus for nested navigation.
            </p>
            <NavPills defaultActiveKey="home">
                <NavPills.Item eventKey="home">Home</NavPills.Item>
                <NavPills.Dropdown title="More Options" id="pill-dropdown">
                    <Nav.Link eventKey="action-1">Action One</Nav.Link>
                    <Nav.Link eventKey="action-2">Action Two</Nav.Link>
                    <Nav.Link eventKey="action-3">Action Three</Nav.Link>
                </NavPills.Dropdown>
                <NavPills.Item eventKey="contact">Contact</NavPills.Item>
            </NavPills>
        </section>

        {/* Disabled Dropdown */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Disabled Dropdown</h6>
            <NavPills defaultActiveKey="home">
                <NavPills.Item eventKey="home">Home</NavPills.Item>
                <NavPills.Dropdown title="Disabled" id="pill-disabled-dropdown" disabled>
                    <Nav.Link eventKey="action">Action</Nav.Link>
                </NavPills.Dropdown>
            </NavPills>
        </section>
    </div>
);

// Helper component for controlled pill group
const PillGroupDemo = () => {
    const [activeKey, setActiveKey] = useState('1');
    return (
        <NavPills activeKey={activeKey} onSelect={(k) => setActiveKey(k)}>
            <NavPills.Item eventKey="1">Profile</NavPills.Item>
            <NavPills.Item eventKey="2">Settings</NavPills.Item>
            <NavPills.Item eventKey="3">Notifications</NavPills.Item>
            <NavPills.Item eventKey="4" disabled>Archived</NavPills.Item>
        </NavPills>
    );
};

/**
 * Interactive
 * Playground with controls to customize pill item properties.
 */
export const Interactive = (args) => {
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
Interactive.args = {
    children: 'Pill Label',
    disabled: false
};
Interactive.parameters = {
    docs: {
        description: {
            story: 'Interactive playground - use the controls panel to customize the pill item.'
        }
    }
};
