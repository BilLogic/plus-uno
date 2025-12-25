/**
 * TopBar - Universal Section
 * 
 * Top navigation bar with sidebar control, breadcrumbs, and user avatar.
 * Figma Spec: node-id=111-227860, 111-227866
 */

import React, { useState } from 'react';
import TopBar from './TopBar';

export default {
    title: 'Specs/Universal/Sections/TopBar',
    component: TopBar,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Top navigation bar composed of:
- **Button** (ghost) for sidebar control - click to toggle mode
- **Breadcrumb** for navigation
- **UserAvatar** for user info`
            }
        }
    }
};

/**
 * Overview
 * Shows TopBar in expanded and collapsed modes using proper components
 */
export const Overview = {
    render: () => {
        const [mode, setMode] = useState('expanded');

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <section>
                    <h6 className="h6" style={{ marginBottom: '12px' }}>Interactive TopBar (click button to toggle)</h6>
                    <div style={{
                        backgroundColor: 'var(--color-surface-container)',
                        padding: '12px 16px',
                        borderRadius: '8px'
                    }}>
                        <TopBar
                            mode={mode}
                            onToggle={(newMode) => setMode(newMode)}
                            breadcrumbs={[
                                { text: 'Home', href: '#' },
                                { text: 'Dashboard' }
                            ]}
                            user={{ name: 'John Doe', counter: true, counterValue: 2 }}
                        />
                    </div>
                    <p className="body3-txt mt-2" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Current mode: <strong>{mode}</strong>
                    </p>
                </section>
            </div>
        );
    }
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    render: (args) => {
        const [mode, setMode] = useState(args.initialMode);

        return (
            <div>
                <div style={{
                    backgroundColor: 'var(--color-surface-container)',
                    padding: '12px 16px',
                    borderRadius: '8px'
                }}>
                    <TopBar
                        mode={mode}
                        onToggle={(newMode) => setMode(newMode)}
                        breadcrumbs={[
                            { text: 'Home', href: '#' },
                            { text: args.currentPage }
                        ]}
                        user={{
                            name: args.userName,
                            counter: args.showCounter,
                            counterValue: args.counterValue
                        }}
                    />
                </div>
                <p className="body3-txt mt-2" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Mode: <strong>{mode}</strong>
                </p>
            </div>
        );
    },
    args: {
        initialMode: 'expanded',
        currentPage: 'Dashboard',
        userName: 'John Doe',
        showCounter: true,
        counterValue: 3
    },
    argTypes: {
        initialMode: {
            control: { type: 'select' },
            options: ['expanded', 'collapsed'],
            table: { category: 'Design' }
        },
        currentPage: {
            control: 'text',
            table: { category: 'Content' }
        },
        userName: {
            control: 'text',
            table: { category: 'Content' }
        },
        showCounter: {
            control: 'boolean',
            table: { category: 'Content' }
        },
        counterValue: {
            control: 'number',
            if: { arg: 'showCounter' },
            table: { category: 'Content' }
        }
    }
};


