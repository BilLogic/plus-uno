/**
 * Sidebar - Universal Section
 * 
 * Navigation sidebar with tutor and supervisor variants.
 * Figma Spec: node-id=111-227891
 */

import React from 'react';
import Sidebar from '../../../../components/Sidebar/Sidebar';

export default {
    title: 'Specs/Universal/Sections/Sidebar',
    component: Sidebar,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Navigation sidebar with user-type variants (tutor/supervisor).'
            }
        }
    }
};

/**
 * Overview
 * Shows both sidebar variants side by side
 */
export const Overview = {
    render: () => (
        <div style={{ display: 'flex', gap: '32px' }}>
            <div style={{ backgroundColor: 'var(--color-surface-container)', padding: '16px', borderRadius: '8px' }}>
                <p className="body2-txt" style={{ fontWeight: 600, marginBottom: '16px' }}>Tutor</p>
                <Sidebar user="tutor" visible={true} />
            </div>
            <div style={{ backgroundColor: 'var(--color-surface-container)', padding: '16px', borderRadius: '8px' }}>
                <p className="body2-txt" style={{ fontWeight: 600, marginBottom: '16px' }}>Supervisor</p>
                <Sidebar user="supervisor" visible={true} />
            </div>
        </div>
    )
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    render: (args) => (
        <div
            style={{
                width: args.visible ? '250px' : '0px',
                backgroundColor: 'var(--color-surface-container)',
                padding: args.visible ? '16px' : '0px',
                height: '500px',
                overflow: 'hidden',
                transition: 'width 0.3s, padding 0.3s',
                borderRadius: '8px'
            }}
        >
            <Sidebar
                user={args.user}
                visible={args.visible}
                onHomeClick={() => console.log('Home clicked')}
                onTabClick={(tabName) => console.log('Tab clicked:', tabName)}
            />
        </div>
    ),
    args: {
        user: 'tutor',
        visible: true
    },
    argTypes: {
        user: {
            control: { type: 'select' },
            options: ['tutor', 'supervisor'],
            table: { category: 'Design' }
        },
        visible: {
            control: 'boolean',
            table: { category: 'State' }
        }
    }
};
