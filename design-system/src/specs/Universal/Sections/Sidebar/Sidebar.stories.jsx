/**
 * Sidebar - Universal Section
 *
 * The PLUS sidebar: the foundation Sidebar pattern filled with the Specs item
 * list for each role. Figma Spec: node-id=111-227891.
 *
 * The stories assert the content of each role against the Specs list (plus
 * Toolkit › Students), so a config edit that drops or adds an item turns red.
 */

import React from 'react';
import { expect, within } from 'storybook/test';
import Sidebar from './Sidebar';

export default {
    title: 'Specs/Universal/Sections/Sidebar',
    component: Sidebar,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Navigation sidebar with user-type variants (tutor/supervisor).'
            }
        }
    }
};

const panel = {
    display: 'flex',
    flexDirection: 'column',
    width: 'var(--layout-width-sidebar)',
    boxSizing: 'border-box',
    padding: 'var(--surface-container-pad)',
    backgroundColor: 'var(--surface-sunken)',
};

/** The item labels in each named group, in order. */
const groupItems = (canvasElement, name) => {
    const group = within(canvasElement).getByRole('group', { name });
    return [...group.querySelectorAll('.plus-sidebar-tab__label')].map((el) => el.textContent);
};

/**
 * Overview
 * Shows both sidebar variants side by side
 */
export const Overview = {
    render: () => (
        <div style={{ display: 'flex', gap: 'var(--section-stack-lg)' }}>
            <div>
                <p style={{ font: 'var(--body-small)', fontWeight: 'var(--type-weight-semibold)', marginBottom: 'var(--element-stack-md)' }}>Tutor</p>
                <div style={panel}><Sidebar user="tutor" label="Tutor navigation" /></div>
            </div>
            <div>
                <p style={{ font: 'var(--body-small)', fontWeight: 'var(--type-weight-semibold)', marginBottom: 'var(--element-stack-md)' }}>Supervisor</p>
                <div style={panel}><Sidebar user="supervisor" label="Supervisor navigation" /></div>
            </div>
        </div>
    )
};

/** Tutor: Home · Training (Lessons, Onboarding) · Toolkit (Sessions, Students, Slack ↗). No Admin. */
export const Tutor = {
    render: () => <div style={panel}><Sidebar user="tutor" activeTabId="sessions" /></div>,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Home' })).toBeInTheDocument();
        await expect(groupItems(canvasElement, 'Training')).toEqual(['Lessons', 'Onboarding']);
        await expect(groupItems(canvasElement, 'Toolkit')).toEqual(['Sessions', 'Students', 'Slack']);
        await expect(canvas.queryByRole('group', { name: 'Admin' }), 'no Admin for a tutor').toBeNull();
        await expect(canvas.queryByText('Reviews'), 'not in Specs').toBeNull();
        await expect(canvas.getByRole('button', { name: 'Sessions' })).toHaveAttribute('aria-current', 'page');

        const slack = canvas.getByRole('link', { name: /Slack/ });
        await expect(slack).toHaveAttribute('target', '_blank');
        await expect(slack).toHaveAccessibleName(/opens in a new tab/i);
        await expect(canvas.queryAllByRole('heading'), 'group labels are not headings').toHaveLength(0);
    },
};

/** Supervisor: the tutor's sections, then Admin (Tutors, Sessions, Students, Groups). */
export const Supervisor = {
    render: () => <div style={panel}><Sidebar user="supervisor" activeTabId="students" /></div>,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(groupItems(canvasElement, 'Training')).toEqual(['Lessons', 'Onboarding']);
        await expect(groupItems(canvasElement, 'Toolkit')).toEqual(['Sessions', 'Students', 'Slack']);
        await expect(groupItems(canvasElement, 'Admin')).toEqual(['Tutors', 'Sessions', 'Students', 'Groups']);
        await expect(canvas.queryByText('Compliance'), 'not in Specs').toBeNull();

        // Admin › Students is selected, not Toolkit › Students.
        const current = canvasElement.querySelectorAll('[aria-current="page"]');
        await expect(current).toHaveLength(1);
        await expect(within(canvas.getByRole('group', { name: 'Admin' })).getByRole('button', { name: 'Students' }))
            .toHaveAttribute('aria-current', 'page');
        const icon = current[0].querySelector('i');
        await expect(icon).toHaveClass('fa-users');
    },
};

/** With `showItemsNotInSpecs`, the two code-only items come back: Reviews and Compliance. */
export const WithItemsNotInSpecs = {
    render: () => <div style={panel}><Sidebar user="supervisor" showItemsNotInSpecs /></div>,
    play: async ({ canvasElement }) => {
        await expect(groupItems(canvasElement, 'Toolkit')).toEqual(['Sessions', 'Students', 'Reviews', 'Slack']);
        await expect(groupItems(canvasElement, 'Admin')).toEqual(['Tutors', 'Sessions', 'Students', 'Groups', 'Compliance']);
    },
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    render: (args) => (
        <div
            style={{
                ...panel,
                height: 'var(--size-5400)',
                overflow: 'hidden',
                borderRadius: 'var(--surface-radius)',
            }}
        >
            <Sidebar
                user={args.user}
                visible={args.visible}
                showItemsNotInSpecs={args.showItemsNotInSpecs}
                onHomeClick={() => console.log('Home clicked')}
                onTabClick={(tabName) => console.log('Tab clicked:', tabName)}
            />
        </div>
    ),
    args: {
        user: 'tutor',
        visible: true,
        showItemsNotInSpecs: false,
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
        },
        showItemsNotInSpecs: {
            control: 'boolean',
            table: { category: 'Content' }
        }
    }
};
