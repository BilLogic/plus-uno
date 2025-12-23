/**
 * Login Specs Overview
 * 
 * Login organisms for authentication flows and portal interfaces.
 */

import React from 'react';

export default {
    title: 'Specs/Login',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Login organisms are specific to authentication interfaces. Components are organized by type: Elements, Cards, and Pages.',
            },
        },
    },
};

/**
 * Overview
 * Login specs organization and available components.
 */
export const Overview = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
        <h2 className="h2" style={{ marginBottom: 'var(--size-section-pad-y-md)' }}>
            Login Organisms
        </h2>

        <p className="body1-txt" style={{ marginBottom: 'var(--size-card-gap-lg)' }}>
            Login organisms are specific to authentication interfaces.
            Components are organized by type: Elements, Cards, and Pages.
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
                    <li><strong>InstitutionSelection</strong> - Dropdown for institution search</li>
                    <li><strong>AccessCodeForm</strong> - Access code entry form</li>
                    <li><strong>LoginButtons</strong> - Action buttons (log in, continue, back)</li>
                    <li><strong>AuthButtons</strong> - OAuth provider buttons (Google, Clever)</li>
                    <li><strong>LoginAlert</strong> - Error/warning messages</li>
                    <li><strong>LoginFooter</strong> - Footer for login pages</li>
                </ul>
            </section>

            {/* Cards */}
            <section style={{
                padding: '24px',
                backgroundColor: 'var(--color-surface-container)',
                borderRadius: '8px'
            }}>
                <h4 className="h4" style={{ marginBottom: '12px' }}>Cards</h4>
                <ul className="body2-txt" style={{ paddingLeft: '20px', margin: 0 }}>
                    <li><strong>LoginPortal</strong> - Multi-step login portal card</li>
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
                    <li><strong>SignInPortal</strong> - Complete sign-in page with multi-step flow</li>
                </ul>
            </section>
        </div>
    </div>
);
