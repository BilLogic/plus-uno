import React from 'react';
import { NavTabs, NavPills } from '@/components';

/**
 * The one place this prototype reaches for the tab components. The Tabs
 * family (ADS Tabs, spec #1604) has not landed, so this wraps NavTabs and
 * NavPills behind the Tabs shape: `items` are `{ key, label }`, `appearance`
 * is `tabs` (page level) or `pills` (a filter inside a section). When Tabs
 * lands, this file becomes a re-export and no caller changes.
 */
const Tabs = ({ items, value, onChange, appearance = 'tabs', label }) => {
    const Nav = appearance === 'pills' ? NavPills : NavTabs;
    return (
        <Nav activeKey={value} onSelect={onChange} aria-label={label}>
            {items.map((t) => (
                <Nav.Item key={t.key} eventKey={t.key} active={value === t.key}>
                    {t.label}
                </Nav.Item>
            ))}
        </Nav>
    );
};

export default Tabs;
