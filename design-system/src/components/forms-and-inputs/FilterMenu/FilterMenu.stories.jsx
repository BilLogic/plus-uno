import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { tokenLength } from '@/storybook-docs/lib/style-probes.js';
import FilterMenu, { FILTER_MENU_LAYOUTS, FILTER_MENU_PLACEMENTS, FILTER_MENU_WIDTHS } from './FilterMenu';

const SIDE_BY_SIDE = [
    { id: 'status', label: 'Status', options: ['Upcoming', 'Completed', 'Canceled'] },
    { id: 'subject', label: 'Subject', options: ['Math', 'Reading', 'Science'] },
    { id: 'format', label: 'Format', options: ['Online', 'In person'] },
];

const STACKED = [
    ...SIDE_BY_SIDE,
    { id: 'grade', label: 'Grade', options: ['6', '7', '8', '9'] },
    { id: 'tutor', label: 'Tutor', options: ['Maya Chen', 'Leo Park', 'Ava Brooks', 'Sam Diaz'] },
];

const SESSIONS = [
    { name: 'Algebra I with Maya', status: 'Upcoming', subject: 'Math', format: 'Online' },
    { name: 'Geometry with Leo', status: 'Upcoming', subject: 'Math', format: 'In person' },
    { name: 'Reading with Ava', status: 'Completed', subject: 'Reading', format: 'Online' },
    { name: 'Biology with Sam', status: 'Canceled', subject: 'Science', format: 'In person' },
];

const pad = { padding: 'var(--space-300)', minHeight: 'calc(var(--space-400) * 10)' };
const bar = { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 'var(--inline-md)' };

/** The sessions the applied filters keep: within a category any pick matches, across categories all must. */
const shownSessions = (applied) => SESSIONS.filter((session) => Object.entries(applied)
    .every(([category, picked]) => picked.length === 0 || picked.includes(session[category])));

/** The open menu, found in the document it portals to. */
const openMenu = async (canvasElement) => {
    const doc = canvasElement.ownerDocument;
    await waitFor(() => expect(doc.querySelector('.plus-filter-menu')).not.toBeNull());
    const menu = doc.querySelector('.plus-filter-menu');
    await waitFor(() => expect(menu.contains(doc.activeElement)).toBe(true));
    return menu;
};

const menuClosed = (canvasElement) => waitFor(
    () => expect(canvasElement.ownerDocument.querySelector('.plus-filter-menu')).toBeNull(),
);

export default {
    title: 'Components/Forms and inputs/Filter menu',
    component: FilterMenu,
    tags: ['!dev', '!autodocs', 'new'],
    parameters: {
        docs: { toc: { title: 'On this page' } },
    },
    argTypes: {
        label: { control: 'text', table: { category: 'Content' } },
        categories: { control: 'object', table: { category: 'Content' } },
        placement: { control: 'inline-radio', options: FILTER_MENU_PLACEMENTS, table: { category: 'Layout' } },
        layout: { control: 'inline-radio', options: FILTER_MENU_LAYOUTS, table: { category: 'Layout' } },
        width: { control: 'inline-radio', options: FILTER_MENU_WIDTHS, table: { category: 'Layout' } },
        spacing: { control: 'inline-radio', options: ['default', 'compact'], table: { category: 'Design' } },
        trigger: { table: { disable: true } },
        value: { table: { disable: true } },
        defaultValue: { table: { disable: true } },
        onApply: { table: { disable: true } },
        onOpenChange: { table: { disable: true } },
    },
    args: {
        label: 'Filters',
        categories: SIDE_BY_SIDE,
        placement: 'bottom-end',
        spacing: 'default',
    },
};

/** A view bar with the Filter icon at its end, and the sessions it filters under it. */
const SessionsBar = ({ categories = SIDE_BY_SIDE, ...props }) => {
    const [applied, setApplied] = useState({});
    const shown = shownSessions(applied);
    return (
        <div style={pad}>
            <div style={bar}>
                <FilterMenu categories={categories} value={applied} onApply={setApplied} {...props} />
            </div>
            <ul id="filter-menu-sessions" aria-live="polite">
                {shown.map((session) => <li key={session.name}>{session.name}</li>)}
            </ul>
        </div>
    );
};

/**
 * Three categories side by side. Ticks wait for Apply; Apply closes the menu
 * and the sessions under it swap in place once.
 */
export const Overview = {
    parameters: { docs: { source: { language: 'jsx', code: webAppSourceSnippets.filterMenu } } },
    render: () => <SessionsBar />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { name: 'Filters' });
        await expect(canvas.getAllByRole('listitem')).toHaveLength(4);

        await userEvent.click(trigger);
        const menu = await openMenu(canvasElement);
        await expect(menu).toHaveClass('plus-filter-menu--side-by-side', 'plus-popup--3-col');
        await expect(within(menu).getByRole('group', { name: 'Status' })).toBeInTheDocument();

        await userEvent.click(within(menu).getByRole('checkbox', { name: 'Upcoming' }));
        await userEvent.click(within(menu).getByRole('checkbox', { name: 'Online' }));
        await expect(canvas.getAllByRole('listitem'), 'held until Apply').toHaveLength(4);

        await userEvent.click(within(menu).getByRole('button', { name: 'Apply' }));
        await menuClosed(canvasElement);
        await expect(canvas.getAllByRole('listitem')).toHaveLength(1);
        await expect(canvas.getByText('Algebra I with Maya')).toBeInTheDocument();
        const counted = canvas.getByRole('button', { name: 'Filters, 2 applied' });
        await waitFor(() => expect(counted).toHaveFocus());
    },
};

/** Escape drops what was ticked; Reset clears the boxes without applying. */
export const Staging = {
    render: () => <SessionsBar />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Filters' }));
        let menu = await openMenu(canvasElement);
        await userEvent.click(within(menu).getByRole('checkbox', { name: 'Math' }));
        await userEvent.keyboard('{Escape}');
        await menuClosed(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Filters' }), 'nothing applied').toBeInTheDocument();

        await userEvent.click(canvas.getByRole('button', { name: 'Filters' }));
        menu = await openMenu(canvasElement);
        await expect(within(menu).getByRole('checkbox', { name: 'Math' }), 'the next open starts from what is applied')
            .not.toBeChecked();
        await userEvent.click(within(menu).getByRole('checkbox', { name: 'Math' }));
        await userEvent.click(within(menu).getByRole('button', { name: 'Apply' }));
        await menuClosed(canvasElement);
        await expect(canvas.getAllByRole('listitem')).toHaveLength(2);

        await userEvent.click(canvas.getByRole('button', { name: 'Filters, 1 applied' }));
        menu = await openMenu(canvasElement);
        await expect(within(menu).getByRole('checkbox', { name: 'Math' })).toBeChecked();
        await userEvent.click(within(menu).getByRole('button', { name: 'Reset' }));
        await expect(within(menu).getByRole('checkbox', { name: 'Math' })).not.toBeChecked();
        await expect(canvas.getAllByRole('listitem'), 'Reset does not apply').toHaveLength(2);
        await userEvent.click(within(menu).getByRole('button', { name: 'Apply' }));
        await menuClosed(canvasElement);
        await expect(canvas.getAllByRole('listitem')).toHaveLength(4);
        await expect(canvas.getByRole('button', { name: 'Filters' })).toBeInTheDocument();
    },
};

/** Four or more categories stack, at 3-col or up to 4-col. */
export const Stacked = {
    render: () => (
        <div style={{ ...pad, minHeight: 'calc(var(--space-400) * 14)' }}>
            <div style={bar}>
                <FilterMenu categories={STACKED} label="Filters" defaultOpen id="filter-menu-stacked" width="4-col" />
            </div>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const menu = await openMenu(canvasElement);
        await expect(menu).toHaveClass('plus-filter-menu--stacked', 'plus-popup--4-col');
        const groups = within(menu).getAllByRole('group');
        await expect(groups).toHaveLength(5);
        const [first, second] = groups.map((group) => group.getBoundingClientRect());
        await expect(second.top, 'one under another').toBeGreaterThan(first.bottom - 1);
        await expect(second.left).toBeCloseTo(first.left, 0);
    },
};

/** The menu opens 4 under the Filter icon, its end edge on the trigger's; Reset and Apply span the bottom half each. */
export const Placement = {
    render: () => (
        <div style={pad}>
            <div style={bar}>
                <FilterMenu categories={SIDE_BY_SIDE} defaultOpen />
            </div>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { name: 'Filters' });
        const menu = await openMenu(canvasElement);
        const triggerBox = trigger.getBoundingClientRect();
        const menuBox = menu.getBoundingClientRect();
        await expect(menuBox.right, 'end edge meets the trigger').toBeCloseTo(triggerBox.right, 0);
        await expect(menuBox.top - triggerBox.bottom, 'offset 4').toBeCloseTo(tokenLength(canvasElement, '--popover-offset'), 0);

        const reset = within(menu).getByRole('button', { name: 'Reset' }).getBoundingClientRect();
        const apply = within(menu).getByRole('button', { name: 'Apply' }).getBoundingClientRect();
        await expect(reset.left, 'full bleed').toBeCloseTo(menuBox.left, 0);
        await expect(apply.right, 'full bleed').toBeCloseTo(menuBox.right, 0);
        await expect(apply.bottom, 'full bleed').toBeCloseTo(menuBox.bottom, 0);
        await expect(reset.width).toBeCloseTo(apply.width, 0);
        await userEvent.keyboard('{Escape}');
        await menuClosed(canvasElement);
    },
};

export const Interactive = {
    render: (args) => (
        <div style={pad}>
            <div style={bar}>
                <FilterMenu {...args} />
            </div>
        </div>
    ),
    parameters: { docs: { source: { language: 'jsx', code: webAppSourceSnippets.filterMenu } } },
};
