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
import Card from '@/components/layout-and-structure/Card/Card';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { setTestViewport, withTestViewport } from '@/storybook-docs/lib/test-viewport.js';

export default {
    title: 'Specs/Universal/Pages/Page Layout',
    component: PageLayout,
    tags: ['!dev', '!autodocs'],
    decorators: [
        (Story, context) => (
            <ResponsiveFrame breakpoint={context.globals?.plusBreakpoint || context.args.breakpoint || 'native'}>
                <Story />
            </ResponsiveFrame>
        ),
    ],
    args: {
        breakpoint: 'native',
    },
    argTypes: {
        breakpoint: {
            control: 'select',
            options: ['native', 'md', 'lg', 'xl'],
            description: 'Simulated viewport width — Native fills available space; MD/LG/XL set a minimum width',
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
            title="Page Layout"
            style={{ height: '100%', minHeight: '100%' }}
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
                The sidebar docks from 1024px; below that, hover the menu control to peek it and click to dock it.
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
                        <h3 className="h6">Card {i + 1}</h3>
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
 * The page sits in the SurfaceContainer frame: a 32 topbar the avatar fits in,
 * the toggle at (8, 8), and the sidebar docked from 1024 and closed below.
 */
export const Frame = {
    ...Overview,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const sidebar = () => canvas.queryByRole('complementary', { name: 'Sidebar' });
        const check = async (width, docked) => {
            await setTestViewport(width, 900);
            const frame = canvasElement.querySelector('.plus-surface-container');
            const topbar = frame.querySelector('.plus-surface-container__topbar');
            const toggle = canvas.getByRole('button', { name: /sidebar/i });
            const pad = tokenLength(frame, '--surface-container-pad');
            await expect(topbar.getBoundingClientRect().height).toBeCloseTo(tokenLength(frame, '--layout-height-topbar'), 0);
            await expect(toggle.getBoundingClientRect().left - frame.getBoundingClientRect().left).toBeCloseTo(pad, 0);
            await expect(toggle.getBoundingClientRect().top - frame.getBoundingClientRect().top).toBeCloseTo(pad, 0);
            const avatar = frame.querySelector('.plus-user-avatar');
            await expect(avatar.getBoundingClientRect().height, 'the avatar fits the topbar')
                .toBeLessThanOrEqual(topbar.getBoundingClientRect().height + 0.5);
            await waitFor(() => expect(Boolean(sidebar()), `sidebar at ${width} (found ${sidebar()?.className})`).toBe(docked));
            await expect(canvas.getByRole('main')).toBeInTheDocument();
        };
        await withTestViewport(1024, 900, async () => {
            await check(1024, true);
            await check(768, false);
            await userEvent.click(canvas.getByRole('button', { name: /sidebar/i }));
            await waitFor(() => expect(sidebar()).toBeInTheDocument());
        });
    },
};

/**
 * Interactive
 * Full interactive page layout with responsive controls
 */
export const Interactive = {
    render: (args) => (
        <PageLayout
            title="Page Layout"
            style={{ height: '100%', minHeight: '100%' }}
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
                    Use the MD / LG / XL toolbar above to simulate viewport width. The sidebar docks from
                    1024px; below that, hover the menu control to peek it over the page and click to dock it.
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
                            <h2 className="h5">Card {i + 1}</h2>
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
