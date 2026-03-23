/**
 * Universal Organism - Overview
 * 
 * Universal organisms are higher-level compositions used across multiple product pillars.
 * They combine molecules and elements into reusable navigation and page structure components.
 */

import React from 'react';

export default {
    title: 'Specs/Universal',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Universal organisms - higher-level components for navigation and page structure. Navigate to each subcategory (Elements, Sections, Pages) to see individual components.',
            },
        },
    },
};

/**
 * Overview
 * Main overview of the Universal organism structure
 */
export const Overview = () => (
    <div className="p-4" style={{ maxWidth: '800px' }}>
        <h1 className="h1 mb-4">Universal Organism</h1>

        <p className="body1-txt mb-4">
            Universal organisms are higher-level compositions used across multiple product pillars.
            They combine molecules and elements into reusable navigation and page structure components.
        </p>

        <div className="d-flex flex-column gap-3">
            {/* Elements */}
            <div
                className="p-3"
                style={{
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: 'var(--size-card-radius-sm)',
                    backgroundColor: 'var(--color-surface-container)',
                }}
            >
                <h3 className="h4 mb-2">Elements</h3>
                <p className="body2-txt mb-2">Reusable building blocks for universal UI patterns:</p>
                <ul className="body2-txt mb-0 ps-4">
                    <li><strong>SidebarTab</strong> - Navigation tab with icon, text, and state</li>
                    <li><strong>UserAvatar</strong> - User display with initial, name, and counter</li>
                    <li><strong>StaticBadgeSmart</strong> - SMART competency area badges</li>
                </ul>
            </div>

            {/* Sections */}
            <div
                className="p-3"
                style={{
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: 'var(--size-card-radius-sm)',
                    backgroundColor: 'var(--color-surface-container)',
                }}
            >
                <h3 className="h4 mb-2">Sections</h3>
                <p className="body2-txt mb-2">Larger container components:</p>
                <ul className="body2-txt mb-0 ps-4">
                    <li><strong>Sidebar</strong> - Navigation sidebar (tutor/supervisor variants)</li>
                    <li><strong>TopBar</strong> - Breadcrumb + user avatar header</li>
                    <li><strong>Footer</strong> - Version, copyright, and terms</li>
                </ul>
            </div>

            {/* Pages */}
            <div
                className="p-3"
                style={{
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: 'var(--size-card-radius-sm)',
                    backgroundColor: 'var(--color-surface-container)',
                }}
            >
                <h3 className="h4 mb-2">Pages</h3>
                <p className="body2-txt mb-2">Complete page layouts:</p>
                <ul className="body2-txt mb-0 ps-4">
                    <li><strong>PageLayout</strong> - Standard layout with Sidebar, TopBar, Content, Footer</li>
                </ul>
            </div>
        </div>

        <p className="body2-txt mt-4" style={{ color: 'var(--color-on-surface-variant)' }}>
            Navigate to each category in the sidebar to see the individual components and their stories.
        </p>
    </div>
);
