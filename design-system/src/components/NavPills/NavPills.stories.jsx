import React, { useEffect, useRef, useState } from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
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
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        contentPreset: {
            control: 'select',
            options: ['tabs-only', 'with-dropdown'],
            description: 'Preset navigation structure for the interactive demo',
            table: { category: 'Content' }
        },
        showDisabledItem: {
            control: 'boolean',
            description: 'Include a disabled pill in the demo',
            table: { category: 'Behavior' }
        },
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

function NavPillsContentDemos() {
    const [activeKey, setActiveKey] = useState('1');

    return (
        <>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">HORIZONTAL PILLS</span>
                <NavPills activeKey={activeKey} onSelect={(k) => setActiveKey(k)}>
                    <NavPills.Item eventKey="1">Home</NavPills.Item>
                    <NavPills.Item eventKey="2">Profile</NavPills.Item>
                    <NavPills.Item eventKey="3">Messages</NavPills.Item>
                    <NavPills.Item eventKey="4" disabled>Disabled</NavPills.Item>
                </NavPills>
            </section>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">WITH DROPDOWN</span>
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
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">VERTICAL PILLS</span>
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

export const Overview = () => {
    const [activeKey, setActiveKey] = useState('1');

    return (
        <NavPills activeKey={activeKey} onSelect={(k) => setActiveKey(k)}>
            <NavPills.Item eventKey="1">Home</NavPills.Item>
            <NavPills.Item eventKey="2">Profile</NavPills.Item>
            <NavPills.Item eventKey="3">Messages</NavPills.Item>
        </NavPills>
    );
};
Overview.parameters = {
    docs: {
        source: { language: 'html', code: webAppSourceSnippets.navPills }
    }
};

const interactiveSectionSurface = {
    marginBottom: '12px',
    padding: '16px',
    minHeight: '100px',
    backgroundColor: 'var(--color-surface-container)',
    borderRadius: 'var(--size-element-radius-md)',
    border: '1px solid var(--color-outline-variant)',
};

export const Interactive = (args) => {
    const [activeKey, setActiveKey] = useState('1');
    const skipScrollRef = useRef(true);

    useEffect(() => {
        if (skipScrollRef.current) {
            skipScrollRef.current = false;
            return;
        }
        const el = document.getElementById(`navpills-interactive-section-${activeKey}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [activeKey]);

    const isVertical = args.direction === 'vertical';

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: isVertical ? 'row' : 'column',
                alignItems: isVertical ? 'flex-start' : 'stretch',
                gap: '16px',
                width: '100%',
                maxWidth: '640px',
            }}
        >
            <NavPills
                activeKey={activeKey}
                onSelect={(k) => setActiveKey(k)}
                alignment={args.alignment}
                direction={args.direction}
            >
                <NavPills.Item eventKey="1">Tab 1</NavPills.Item>
                <NavPills.Item eventKey="2">Tab 2</NavPills.Item>
                <NavPills.Item eventKey="3">Tab 3</NavPills.Item>
                {args.showDisabledItem ? <NavPills.Item eventKey="4" disabled>Disabled</NavPills.Item> : null}
                {args.contentPreset === 'with-dropdown' ? (
                    <NavPills.Dropdown title="More" id="interactive-nav-pills-dropdown">
                        <NavPills.Dropdown.Item eventKey="action">Action</NavPills.Dropdown.Item>
                        <NavPills.Dropdown.Item eventKey="another">Another action</NavPills.Dropdown.Item>
                    </NavPills.Dropdown>
                ) : null}
            </NavPills>
            <div
                style={{
                    flex: isVertical ? 1 : undefined,
                    minWidth: 0,
                    alignSelf: isVertical ? 'stretch' : undefined,
                    maxHeight: '280px',
                    overflowY: 'auto',
                    padding: '12px',
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: 'var(--size-element-radius-md)',
                    backgroundColor: 'var(--color-surface)',
                }}
            >
                <section id="navpills-interactive-section-1" style={interactiveSectionSurface}>
                    <p className="body2-txt m-0 font-semibold">Tab 1</p>
                    <p className="body3-txt mt-2 mb-0 text-on-surface-variant">
                        Content for the first tab. Selecting this pill scrolls this block into view.
                    </p>
                </section>
                <section id="navpills-interactive-section-2" style={interactiveSectionSurface}>
                    <p className="body2-txt m-0 font-semibold">Tab 2</p>
                    <p className="body3-txt mt-2 mb-0 text-on-surface-variant">
                        Second panel. Use the nav pills above to jump here.
                    </p>
                </section>
                <section id="navpills-interactive-section-3" style={interactiveSectionSurface}>
                    <p className="body2-txt m-0 font-semibold">Tab 3</p>
                    <p className="body3-txt mt-2 mb-0 text-on-surface-variant">
                        Third panel.
                    </p>
                </section>
                {args.contentPreset === 'with-dropdown' ? (
                    <>
                        <section id="navpills-interactive-section-action" style={interactiveSectionSurface}>
                            <p className="body2-txt m-0 font-semibold">Dropdown: Action</p>
                            <p className="body3-txt mt-2 mb-0 text-on-surface-variant">
                                Shown when you pick <strong>Action</strong> from the More menu.
                            </p>
                        </section>
                        <section id="navpills-interactive-section-another" style={{ ...interactiveSectionSurface, marginBottom: 0 }}>
                            <p className="body2-txt m-0 font-semibold">Dropdown: Another action</p>
                            <p className="body3-txt mt-2 mb-0 text-on-surface-variant">
                                Shown when you pick <strong>Another action</strong>.
                            </p>
                        </section>
                    </>
                ) : null}
            </div>
        </div>
    );
};

Interactive.args = {
    contentPreset: 'tabs-only',
    showDisabledItem: false,
    alignment: 'left',
    direction: 'horizontal'
};
