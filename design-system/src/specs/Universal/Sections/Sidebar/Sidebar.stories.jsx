/**
 * Sidebar - Universal Section
 *
 * The PLUS sidebar: the Sidebar pattern filled with the groups for each role.
 *
 * The stories assert the content of each role, so a config edit that drops or
 * adds a row turns red.
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

const ACCOUNTS = {
    tutor: { id: 'specs-tutor', name: 'John Doe', role: 'Tutor' },
    supervisor: { id: 'specs-supervisor', name: 'John Doe', role: 'Lead' },
};

const panel = {
    display: 'flex',
    flexDirection: 'column',
    width: 'var(--frame-sidebar-width)',
    height: 'var(--size-5400)',
    boxSizing: 'border-box',
    backgroundColor: 'var(--ds-surface-sunken)',
};

/** The row labels in each named group, in order. */
const groupItems = (canvasElement, name) => {
    const group = within(canvasElement).getByRole('group', { name });
    return [...group.querySelectorAll('.plus-pattern-sidebar__label')].map((el) => el.textContent);
};

/** The first group, with no title: its row labels. */
const firstGroupItems = (canvasElement) => [...canvasElement.querySelector('.plus-pattern-sidebar__group').querySelectorAll('.plus-pattern-sidebar__label')].map((el) => el.textContent);

/**
 * Overview
 * Shows both sidebar variants side by side
 */
export const Overview = {
    render: () => (
        <div style={{ display: 'flex', gap: 'var(--section-stack-lg)' }}>
            <div>
                <p style={{ font: 'var(--body-small)', fontWeight: 'var(--type-weight-semibold)', marginBottom: 'var(--stack-md)' }}>Tutor</p>
                <div style={panel}><Sidebar user="tutor" label="Tutor navigation" account={ACCOUNTS.tutor} /></div>
            </div>
            <div>
                <p style={{ font: 'var(--body-small)', fontWeight: 'var(--type-weight-semibold)', marginBottom: 'var(--stack-md)' }}>Supervisor</p>
                <div style={panel}><Sidebar user="supervisor" label="Supervisor navigation" account={ACCOUNTS.supervisor} /></div>
            </div>
        </div>
    )
};

/** Tutor: Home and Slack ↗ · Training (Lessons, Onboarding) · Toolkit (Sessions, Students). No Admin. */
export const Tutor = {
    render: () => <div style={panel}><Sidebar user="tutor" activeTabId="sessions" account={ACCOUNTS.tutor} /></div>,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(firstGroupItems(canvasElement)).toEqual(['Home', 'Slack']);
        await expect(groupItems(canvasElement, 'Training')).toEqual(['Lessons', 'Onboarding']);
        await expect(groupItems(canvasElement, 'Toolkit')).toEqual(['Sessions', 'Students']);
        await expect(canvas.queryByRole('group', { name: 'Admin' }), 'no Admin for a tutor').toBeNull();
        await expect(canvas.getByRole('button', { name: 'Sessions' })).toHaveAttribute('aria-current', 'page');

        const slack = canvas.getByRole('link', { name: /Slack/ });
        await expect(slack).toHaveAttribute('target', '_blank');
        await expect(slack).toHaveAccessibleName(/opens in a new tab/i);
        await expect(slack.querySelector('.fa-brands.fa-slack')).not.toBeNull();
        await expect(canvas.queryAllByRole('heading'), 'section titles are not headings').toHaveLength(0);
    },
};

/** A tutor mid-onboarding: the Toolkit locked with a message that names no number; Training rows count what is left. */
export const TutorOnboarding = {
    render: () => <div style={panel}><Sidebar user="tutor" activeTabId="onboarding" modulesLeft={3} lessonsLeft={2} account={ACCOUNTS.tutor} /></div>,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('img', { name: 'Locked. Complete your assigned training to unlock the Toolkit' })).toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Sessions' })).toHaveAttribute('aria-disabled', 'true');
    },
};

/** Supervisor: the tutor's groups, then Admin (Compliance, Reflections, Tutors, Sessions, Students, Groups). Never locked. */
export const Supervisor = {
    render: () => <div style={panel}><Sidebar user="supervisor" activeTabId="students" modulesLeft={3} account={ACCOUNTS.supervisor} /></div>,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(groupItems(canvasElement, 'Training')).toEqual(['Lessons', 'Onboarding']);
        await expect(groupItems(canvasElement, 'Toolkit')).toEqual(['Sessions', 'Students']);
        await expect(groupItems(canvasElement, 'Admin')).toEqual(['Compliance', 'Reflections', 'Tutors', 'Sessions', 'Students', 'Groups']);
        await expect(canvas.queryByRole('img', { name: /Locked/ }), 'a supervisor is never locked').toBeNull();

        // Admin › Students is selected, not Toolkit › Students.
        const current = canvasElement.querySelectorAll('[aria-current="page"]');
        await expect(current).toHaveLength(1);
        await expect(within(canvas.getByRole('group', { name: 'Admin' })).getByRole('button', { name: 'Students' }))
            .toHaveAttribute('aria-current', 'page');
        const icon = current[0].querySelector('i');
        await expect(icon).toHaveClass('fa-regular', 'fa-address-book');
    },
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    render: (args) => (
        <div style={{ ...panel, overflow: 'hidden' }}>
            <Sidebar
                user={args.user}
                visible={args.visible}
                modulesLeft={args.modulesLeft}
                account={ACCOUNTS[args.user]}
                onHomeClick={() => console.log('Home clicked')}
                onTabClick={(tabName) => console.log('Tab clicked:', tabName)}
            />
        </div>
    ),
    args: {
        user: 'tutor',
        visible: true,
        modulesLeft: 0,
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
        modulesLeft: {
            control: { type: 'number', min: 0 },
            table: { category: 'Content' }
        }
    }
};
