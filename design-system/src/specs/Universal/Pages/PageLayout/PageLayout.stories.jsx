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

import React from 'react';
import PageLayout from './PageLayout';
import Card from '../../../../components/Card/Card';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';

export default {
    title: 'Specs/Universal/Pages/PageLayout',
    component: PageLayout,
    tags: ['!dev', '!autodocs'],
    decorators: [
        (Story, context) => (
            <ResponsiveFrame breakpoint={context.args.breakpoint || 'xl'}>
                <Story />
            </ResponsiveFrame>
        ),
    ],
    args: {
        breakpoint: 'xl',
    },
    argTypes: {
        breakpoint: {
            control: 'select',
            options: ['md', 'lg', 'xl'],
            description: 'Simulated viewport width in the preview toolbar',
            table: { category: 'Layout' },
        },
    },
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
 * Shows page layout using the PageLayout component
 */
export const Overview = {
    render: () => (
        <PageLayout
            style={{ minHeight: 'min(680px, calc(100vh - 200px))', height: 'auto' }}
            sidebarConfig={{
                user: 'tutor',
            }}
            topBarConfig={{
                breadcrumbs: [
                    { text: 'Home', href: '#' },
                    { text: 'Dashboard' },
                ],
                user: { name: 'John Doe', counter: true, counterValue: 2 },
            }}
        >
            <h2 className="h3">Page Title</h2>
            <p className="body2-txt mt-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                This demonstrates the PageLayout component with TopBar, Sidebar, and content area.
                The sidebar automatically collapses at breakpoints below 1024px.
            </p>

            <div
                className="mt-4"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '16px',
                }}
            >
                {Array(4).fill(0).map((_, i) => (
                    <Card key={i} className="p-3">
                        <h6 className="h6">Card {i + 1}</h6>
                    </Card>
                ))}
            </div>
        </PageLayout>
    ),
    parameters: {
        layout: 'fullscreen',
    },
};

/**
 * Interactive
 * Full interactive page layout with responsive controls
 */
export const Interactive = {
    render: (args) => (
        <PageLayout
            style={{ minHeight: 'min(680px, calc(100vh - 200px))', height: 'auto' }}
            sidebarConfig={{
                user: args.userType,
            }}
            topBarConfig={{
                breadcrumbs: [
                    { text: 'Home', href: '#' },
                    { text: 'Dashboard' },
                ],
                user: {
                    name: args.userName,
                    counter: true,
                    counterValue: args.notificationCount,
                },
            }}
        >
            <div style={{ padding: '24px' }}>
                <h1 className="h2">Page Title</h1>
                <p className="body1-txt mt-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Use the MD / LG / XL toolbar above to simulate viewport width. The sidebar collapses
                    below 1024px; open it with the menu control to test the narrow overlay behavior.
                </p>

                <div
                    className="mt-4"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '16px',
                    }}
                >
                    {Array(4).fill(0).map((_, i) => (
                        <Card key={i} className="p-3">
                            <h3 className="h5">Card {i + 1}</h3>
                            <p className="body3-txt mt-2" style={{ color: 'var(--color-on-surface-variant)' }}>
                                Content
                            </p>
                        </Card>
                    ))}
                </div>
            </div>
        </PageLayout>
    ),
    args: {
        userType: 'tutor',
        userName: 'Jane Doe',
        notificationCount: 3,
    },
    argTypes: {
        userType: {
            control: { type: 'select' },
            options: ['tutor', 'supervisor'],
            table: { category: 'Design' },
        },
        userName: {
            control: 'text',
            table: { category: 'Content' },
        },
        notificationCount: {
            control: 'number',
            table: { category: 'Content' },
        },
    },
};
