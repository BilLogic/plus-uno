/**
 * Universal Specs - Pages
 * 
 * Standard page layout template using Sidebar, TopBar, and Footer.
 * Handles responsive sidebar visibility and page structure.
 */

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Breadcrumb from '@/components/Breadcrumb';
import UserAvatar from '@/components/UserAvatar';
import Footer from '@/components/Footer';
import Card from '@/components/Card';

export default {
    title: 'Specs/Universal/Pages',
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Standard page layout component that composes Sidebar, TopBar, Content, and Footer. Handles responsive sidebar visibility.',
            },
        },
    },
};

/**
 * PageLayout Component
 * Reusable page layout with sidebar, topbar, content, and footer.
 */
const PageLayout = ({
    userType = 'tutor',
    userName = 'John Doe',
    sidebarVisible = true,
    breadcrumbItems = [],
    children
}) => {
    const [isSidebarVisible, setSidebarVisible] = useState(sidebarVisible);

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            backgroundColor: 'var(--color-surface)'
        }}>
            {/* Sidebar */}
            <div style={{
                width: isSidebarVisible ? '250px' : '0',
                flexShrink: 0,
                backgroundColor: 'var(--color-surface-container)',
                transition: 'width 0.3s',
                overflow: 'hidden'
            }}>
                <Sidebar
                    user={userType}
                    visible={isSidebarVisible}
                    onHomeClick={() => console.log('Home clicked')}
                />
            </div>

            {/* Main Content Area */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0
            }}>
                {/* TopBar */}
                <header style={{
                    backgroundColor: 'var(--color-surface-container)',
                    padding: 'var(--size-section-pad-y-sm) var(--size-section-pad-x-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--color-outline-variant)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                            className="btn btn-ghost"
                            style={{ padding: '8px' }}
                            onClick={() => setSidebarVisible(!isSidebarVisible)}
                        >
                            <i className={`fas fa-${isSidebarVisible ? 'times' : 'bars'}`} />
                        </button>
                        <Breadcrumb>
                            {breadcrumbItems.map((item, idx) => (
                                <Breadcrumb.Item
                                    key={idx}
                                    href={item.href}
                                    active={idx === breadcrumbItems.length - 1}
                                >
                                    {item.text}
                                </Breadcrumb.Item>
                            ))}
                        </Breadcrumb>
                    </div>
                    <UserAvatar
                        firstChar={userName.charAt(0)}
                        name={userName}
                        type={userType}
                        counter
                        counterValue={2}
                    />
                </header>

                {/* Page Content */}
                <main style={{
                    flex: 1,
                    padding: 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)',
                    overflowY: 'auto'
                }}>
                    {children}
                </main>

                {/* Footer */}
                <footer style={{
                    backgroundColor: 'var(--color-surface-container)',
                    padding: 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)',
                    borderTop: '1px solid var(--color-outline-variant)'
                }}>
                    <Footer
                        version="v1.0.0"
                        copyright="Copyright © Carnegie Mellon University 2024"
                        termsText="Terms of Use"
                        termsUrl="#"
                    />
                </footer>
            </div>
        </div>
    );
};

/**
 * Overview
 * Standard page layout demonstration.
 */
export const Overview = () => (
    <PageLayout
        userType="tutor"
        userName="Jane Doe"
        breadcrumbItems={[
            { text: 'Home', href: '#' },
            { text: 'Training', href: '#' },
            { text: 'Overview' }
        ]}
    >
        <div>
            <h1 className="h2">Page Title</h1>
            <p className="body1-txt" style={{ marginTop: '16px' }}>
                This is a sample page content area. The layout automatically handles the positioning of the Sidebar, TopBar, and Footer.
            </p>
            <div style={{
                marginTop: '32px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '16px'
            }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <Card key={i} style={{ padding: '24px' }}>
                        <h3 className="h4">Card {i}</h3>
                        <p className="body2-txt" style={{ marginTop: '8px' }}>
                            Sample card content to demonstrate layout scrolling and responsiveness.
                        </p>
                    </Card>
                ))}
            </div>
        </div>
    </PageLayout>
);

/**
 * Page Layout Interactive
 * Interactive page layout with controls.
 */
export const PageLayoutInteractive = (args) => (
    <PageLayout
        userType={args.userType}
        userName={args.userName}
        sidebarVisible={args.sidebarVisible}
        breadcrumbItems={[
            { text: 'Universal', href: '#' },
            { text: 'Pages', href: '#' },
            { text: 'Layout' }
        ]}
    >
        <div>
            <h1 className="h2">Interactive Page Layout</h1>
            <p className="body1-txt" style={{ marginTop: '16px' }}>
                Use the controls panel to modify the page layout settings.
                Click the hamburger menu to toggle sidebar visibility.
            </p>
            <div style={{
                marginTop: '32px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '16px'
            }}>
                {[1, 2, 3, 4].map(i => (
                    <Card key={i} style={{ padding: '24px' }}>
                        <h3 className="h4">Content Card {i}</h3>
                        <p className="body2-txt" style={{ marginTop: '8px' }}>
                            Sample content demonstrating responsive grid layout.
                        </p>
                    </Card>
                ))}
            </div>
        </div>
    </PageLayout>
);
PageLayoutInteractive.args = {
    userType: 'tutor',
    userName: 'Jane Doe',
    sidebarVisible: true
};
PageLayoutInteractive.argTypes = {
    userType: {
        control: { type: 'select' },
        options: ['tutor', 'supervisor'],
        description: 'User type for sidebar variant'
    },
    userName: {
        control: 'text',
        description: 'User name displayed in top bar'
    },
    sidebarVisible: {
        control: 'boolean',
        description: 'Initial sidebar visibility'
    }
};
