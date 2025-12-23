/**
 * Universal Specs Overview
 * 
 * Universal organisms are shared building blocks used across all product pillars.
 * They include navigation, layout, and foundational UI patterns.
 */

import React from 'react';

export default {
    title: 'Specs/Universal',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Universal organisms are specific to universal interfaces and functionality. These components are organized by type: Elements, Sections, and Pages.',
            },
        },
    },
};

/**
 * Overview
 * Universal specs organization and available components.
 */
export const Overview = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
        <h2 className="h2" style={{ marginBottom: 'var(--size-section-pad-y-md)' }}>
            Universal Organisms
        </h2>

        <p className="body1-txt" style={{ marginBottom: 'var(--size-card-gap-lg)' }}>
            Universal organisms are specific to universal interfaces and functionality.
            These components are organized by type: Elements, Sections, and Pages.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Elements */}
            <section style={{
                padding: '24px',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: '8px'
            }}>
                <h4 className="h4" style={{ marginBottom: '12px' }}>Elements</h4>
                <ul className="body2-txt" style={{ paddingLeft: '20px', margin: 0 }}>
                    <li><strong>SidebarTab</strong> - Sidebar navigation tab with states</li>
                    <li><strong>UserAvatar</strong> - User avatar with name and notification counter</li>
                    <li><strong>StaticBadgeSmart</strong> - SMART competency area badge</li>
                </ul>
            </section>

            {/* Sections */}
            <section style={{
                padding: '24px',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: '8px'
            }}>
                <h4 className="h4" style={{ marginBottom: '12px' }}>Sections</h4>
                <ul className="body2-txt" style={{ paddingLeft: '20px', margin: 0 }}>
                    <li><strong>Sidebar</strong> - Navigation sidebar with tutor/supervisor variants</li>
                    <li><strong>TopBar</strong> - Top navigation bar with breadcrumb and user</li>
                    <li><strong>Footer</strong> - Page footer with copyright and version</li>
                </ul>
            </section>

            {/* Pages */}
            <section style={{
                padding: '24px',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: '8px'
            }}>
                <h4 className="h4" style={{ marginBottom: '12px' }}>Pages</h4>
                <ul className="body2-txt" style={{ paddingLeft: '20px', margin: 0 }}>
                    <li><strong>PageLayout</strong> - Complete page layout with sidebar, topbar, content, footer</li>
                </ul>
            </section>
        </div>
    </div>
);
