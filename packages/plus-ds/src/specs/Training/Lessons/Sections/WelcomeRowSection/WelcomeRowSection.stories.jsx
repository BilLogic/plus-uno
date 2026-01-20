/**
 * WelcomeRowSection - Training Lessons Section
 * 
 * Welcome section with tabs and jumbotron content.
 * Matches Figma design exactly.
 */

import React from 'react';
import WelcomeRowSection from './WelcomeRowSection';

export default {
    title: 'Specs/Training/Lessons/Sections/WelcomeRowSection',
    component: WelcomeRowSection,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Welcome section with horizontal tab navigation and jumbotron content. Includes greeting, description, and call-to-action buttons. Matches Figma design exactly.'
            }
        }
    },
    argTypes: {
        userName: {
            control: 'text',
            description: 'User name for greeting',
            table: { category: 'Content' }
        },
        activeTab: {
            control: { type: 'select' },
            options: ['signup', 'session', 'reflection'],
            description: 'Currently active tab',
            table: { category: 'State' }
        }
    }
};

/**
 * Docs
 * Documentation page
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg, 32px)' }}>
            <h3 className="h3" style={{ marginBottom: '16px' }}>WelcomeRowSection</h3>
            <p className="body2-txt" style={{ marginBottom: '24px' }}>
                Welcome section with tabs and jumbotron content for the training lessons dashboard.
            </p>
            <ul className="body2-txt" style={{ marginBottom: '24px', paddingLeft: '20px' }}>
                <li>Horizontal tab navigation with active state</li>
                <li>Tab with badge showing count (Session links: 20)</li>
                <li>H3 greeting with dynamic user name</li>
                <li>Body text description</li>
                <li>Two action buttons: "Sign up now" (primary filled with icon) and "View schedule" (secondary tonal)</li>
                <li>Divider line extending to fill remaining width</li>
            </ul>
        </div>
    )
};

/**
 * Overview
 * Default section with sample data
 */
export const Overview = {
    render: () => (
        <div style={{ 
            padding: 'var(--size-section-pad-y-lg, 32px)', 
            backgroundColor: 'var(--color-surface)'
        }}>
            <WelcomeRowSection 
                onSignUp={() => console.log('Sign up clicked')}
                onViewSchedule={() => console.log('View schedule clicked')}
            />
        </div>
    )
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    render: (args) => (
        <div style={{ 
            padding: 'var(--size-section-pad-y-lg, 32px)', 
            backgroundColor: 'var(--color-surface)'
        }}>
            <WelcomeRowSection
                userName={args.userName}
                activeTab={args.activeTab}
                onSignUp={() => alert('Sign up clicked')}
                onViewSchedule={() => alert('View schedule clicked')}
                onTabChange={(tabId) => console.log('Tab changed:', tabId)}
            />
        </div>
    ),
    args: {
        userName: 'Charmaine',
        activeTab: 'signup'
    }
};

/**
 * DifferentUser
 * Section with different user name
 */
export const DifferentUser = {
    render: () => (
        <div style={{ 
            padding: 'var(--size-section-pad-y-lg, 32px)', 
            backgroundColor: 'var(--color-surface)'
        }}>
            <WelcomeRowSection 
                userName="Sarah"
                onSignUp={() => console.log('Sign up clicked')}
                onViewSchedule={() => console.log('View schedule clicked')}
            />
        </div>
    )
};

/**
 * SessionTabActive
 * Section with Session links tab active
 */
export const SessionTabActive = {
    render: () => (
        <div style={{ 
            padding: 'var(--size-section-pad-y-lg, 32px)', 
            backgroundColor: 'var(--color-surface)'
        }}>
            <WelcomeRowSection 
                userName="Charmaine"
                activeTab="session"
                onSignUp={() => console.log('Sign up clicked')}
                onViewSchedule={() => console.log('View schedule clicked')}
            />
        </div>
    )
};
