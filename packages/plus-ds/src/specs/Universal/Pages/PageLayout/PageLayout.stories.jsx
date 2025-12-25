/**
 * PageLayout - Universal Page
 * 
 * App Outer Layout per Figma specs.
 * 
 * Figma Specs:
 * - 112-597: Collapsed sidebar (bars icon)
 * - 112-596: Expanded sidebar (angles-left icon)
 * 
 * Container tokens:
 * - Background: surface-container (#edeef0)
 * - Gap: surface-container/gap-sm (16px)
 * - Padding: pad-x-sm (16px), pad-y-sm (12px)
 */

import React, { useState } from 'react';
import Sidebar from '../../../../components/Sidebar/Sidebar';
import Footer from '../../../../components/Footer/Footer';
import Breadcrumb from '../../../../components/Breadcrumb/Breadcrumb';
import UserAvatar from '../../../../components/UserAvatar/UserAvatar';
import Button from '../../../../components/Button/Button';
import Card from '../../../../components/Card/Card';
import PageLayout from '../../../../components/PageLayout/PageLayout';

export default {
    title: 'Specs/Universal/Pages/PageLayout',
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: `App Outer Layout that wraps the entire application.

**Container Structure:**
- Outer: surface-container bg, gap-sm (16px), pad-x-sm (16px), pad-y-sm (12px)
- Inner row: Sidebar + Content area
- TopBar: Sidebar control button + Breadcrumb + UserAvatar`
            }
        }
    }
};

/**
 * Overview
 * Shows page layout per Figma structure
 */
export const Overview = {
    render: () => {
        const [sidebarExpanded, setSidebarExpanded] = useState(true);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', padding: '24px' }}>
                <section>
                    <h6 className="h6" style={{ marginBottom: '16px' }}>App Outer Layout (Interactive)</h6>

                    {/* App Outer Layout Container */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px', // surface-container/gap-sm
                            alignItems: 'flex-start',
                            padding: '12px 16px', // pad-y-sm pad-x-sm
                            backgroundColor: '#edeef0', // surface-container
                            borderRadius: '8px',
                            height: '500px',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Top Bar Row */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px', // surface-container/gap-sm
                                width: '100%',
                                flexShrink: 0
                            }}
                        >
                            {/* Sidebar Control - 168px when expanded */}
                            <div style={{ width: sidebarExpanded ? '168px' : 'auto' }}>
                                <Button
                                    style="ghost"
                                    leadingVisual={<i className={`fas fa-${sidebarExpanded ? 'angles-left' : 'bars'}`} />}
                                    onClick={() => setSidebarExpanded(!sidebarExpanded)}
                                />
                            </div>

                            {/* Page Control - Breadcrumb (flex: 1) */}
                            <div style={{ flex: 1 }}>
                                <Breadcrumb
                                    items={[
                                        { text: 'Home', href: '#' },
                                        { text: 'Dashboard' }
                                    ]}
                                />
                            </div>

                            {/* User Avatar */}
                            <UserAvatar firstChar="J" name="John Doe" counter counterValue={2} />
                        </div>

                        {/* Main Content Row: Sidebar + Content */}
                        <div
                            style={{
                                display: 'flex',
                                gap: '16px', // surface-container/gap-sm
                                flex: 1,
                                width: '100%',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Sidebar - Transparent background (sits on page gray) */}
                            {sidebarExpanded && (
                                <div
                                    style={{
                                        // No background color - transparent per Figma
                                        // No extra padding - relies on component padding + outer gap
                                        width: '200px',
                                        flexShrink: 0,
                                        overflow: 'auto',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                >
                                    <Sidebar user="tutor" visible={true} />
                                </div>
                            )}

                            {/* Content Area - White Surface Card */}
                            <div
                                style={{
                                    flex: 1,
                                    backgroundColor: 'var(--color-surface)',
                                    borderRadius: 'var(--size-card-radius-md)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden'
                                    // No internal padding on the card container itself, content inside handles it
                                }}
                            >
                                {/* Content */}
                                <main style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
                                    <h2 className="h3">Page Title</h2>
                                    <p className="body2-txt mt-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                                        Content area is the only white surface. Sidebar is transparent on the page background.
                                    </p>

                                    <div
                                        className="mt-4"
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                            gap: '12px'
                                        }}
                                    >
                                        {Array(4).fill(0).map((_, i) => (
                                            <Card key={i} className="p-3">
                                                <h6 className="h6">Card {i + 1}</h6>
                                            </Card>
                                        ))}
                                    </div>
                                </main>

                                {/* Footer */}
                                <div style={{ padding: '0 24px 12px' }}>
                                    <Footer version="v5.2.0" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="body3-txt mt-2" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Sidebar: <strong>{sidebarExpanded ? 'Expanded' : 'Collapsed'}</strong>
                    </p>
                </section>
            </div>
        );
    },
    parameters: {
        layout: 'padded'
    }
};

/**
 * Interactive
 * Full interactive page layout with responsive controls
 */
export const Interactive = {
    render: (args) => {
        const [sidebarVisible, setSidebarVisible] = useState(args.sidebarExpanded);

        // Update state when args change (simulating responsive behavior update)
        // Note: In real app, PageLayout handles this via ResizeObserver. 
        // Here we just pass the initial state or let PageLayout handle it.
        // Actually, since PageLayout now has internal state for visibility based on size,
        // we might not need to force it here unless we want to override.
        // But for this story, we are testing the PageLayout component's responsiveness.
        // So we should use the PageLayout component directly if possible?
        // Wait, the 'Overview' story used raw div structure. The 'Interactive' story ALSO uses raw div structure?
        // Ah, I see PageLayout.jsx component exists but the stories were implementing the layout manually!
        // I need to update the story to use the ACTUAL PageLayout component to test it.

        // Checking the file content provided previously:
        // The stories import Sidebar, Footer etc. directly and build the layout inline.
        // AND there is a PageLayout component import that was seemingly unused or I missed it.
        // Let's check imports.

        return (
            <div style={{ width: args.containerWidth, border: '1px dashed #ccc', transition: 'width 0.3s' }}>
                {/* 
                  Using the actual PageLayout component here to test its responsive logic.
                  We pass children and configs.
                */}
                <PageLayout
                    sidebarConfig={{
                        user: args.userType,
                        visible: true // PageLayout internal logic handles the actual display toggling
                    }}
                    topBarConfig={{
                        user: { name: args.userName, firstChar: args.userName.charAt(0) },
                        notificationCount: args.notificationCount
                    }}
                >
                    <div style={{ padding: '24px' }}>
                        <h1 className="h2">Page Title</h1>
                        <p className="body1-txt mt-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                            Resize the container using the controls to see the Sidebar collapse (Breakpoint: 1024px).
                        </p>

                        <div
                            className="mt-4"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '16px'
                            }}
                        >
                            {Array(4).fill(0).map((_, i) => (
                                <Card key={i} className="p-3">
                                    <h3 className="h5">Card {i + 1}</h3>
                                    <p className="body3-txt mt-2" style={{ color: 'var(--color-on-surface-variant)' }}>Content</p>
                                </Card>
                            ))}
                        </div>
                    </div>
                </PageLayout>
            </div>
        );
    },
    args: {
        userType: 'tutor',
        userName: 'Jane Doe',
        notificationCount: 3,
        containerWidth: '100%'
    },
    argTypes: {
        userType: {
            control: { type: 'select' },
            options: ['tutor', 'supervisor'],
            table: { category: 'Design' }
        },
        containerWidth: {
            control: { type: 'select' },
            options: ['100%', '1440px', '1024px', '768px', '375px'],
            mapping: {
                '100%': '100%',
                'Extra Large (>1440px)': '1440px', // using 1440 as base for XL
                'Large (1024px)': '1024px',
                'Medium (768px)': '768px',
                'Small (<768px)': '375px'
            },
            labels: {
                '100%': 'Full Width',
                '1440px': 'Extra Large (>1440px)',
                '1024px': 'Large (1024px)',
                '768px': 'Medium (768px)',
                '375px': 'Small (<768px)'
            },
            name: 'Breakpoint (Simulated Width)',
            table: { category: 'Responsiveness' }
        },
        userName: {
            control: 'text',
            table: { category: 'Content' }
        },
        notificationCount: {
            control: 'number',
            table: { category: 'Content' }
        }
    }
};
