import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { expectMenuFade } from '@/storybook-docs/lib/overlay-motion-plays';
import FilterMenu, { FILTER_MENU_LAYOUTS, FILTER_MENU_PLACEMENTS, FILTER_MENU_WIDTHS } from './FilterMenu';
import { LONG_SCHOOL, expectNoSilentClip } from '../../_internal/overflowPlays';

const SIDE_BY_SIDE = [
    { id: 'status', label: 'Status', options: ['Upcoming', 'Completed', 'Canceled'] },
    { id: 'site', label: 'Site', options: ['Lincoln Middle', 'North High', 'Riverside Academy'] },
    { id: 'format', label: 'Format', options: ['Online', 'In person'] },
];

const STACKED = [
    ...SIDE_BY_SIDE,
    { id: 'grade', label: 'Grade', options: ['6', '7', '8', '9'] },
    { id: 'tutor', label: 'Tutor', options: ['Maya Chen', 'Leo Park', 'Ava Brooks', 'Sam Diaz'] },
];

const SESSIONS = [
    { name: 'Lincoln Middle with Maya', status: 'Upcoming', site: 'Lincoln Middle', format: 'Online' },
    { name: 'Lincoln Middle with Leo', status: 'Upcoming', site: 'Lincoln Middle', format: 'In person' },
    { name: 'Riverside Academy with Ava', status: 'Completed', site: 'Riverside Academy', format: 'Online' },
    { name: 'North High with Sam', status: 'Canceled', site: 'North High', format: 'In person' },
];

/* token gap: demo canvas size, no role token */
const DEMO_SIZE = { pad: '48px', minHeight: '640px', minHeightTall: '896px' };
const pad = { padding: DEMO_SIZE.pad, minHeight: DEMO_SIZE.minHeight };
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
        await expect(canvas.getByText('Lincoln Middle with Maya')).toBeInTheDocument();
        const counted = canvas.getByRole('button', { name: 'Filters, 2 applied' });
        await waitFor(() => expect(counted).toHaveFocus());
    },
};

/** It opens and closes with a plain fade on appearance.fast: no clip, scale or travel. */
export const OpensWithAFade = {
    render: () => <SessionsBar />,
    play: async ({ canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'Filters' }));
        const menu = await openMenu(canvasElement);
        await expectMenuFade(menu, 'enter');
        await userEvent.keyboard('{Escape}');
        await expectMenuFade(menu, 'exit');
        await menuClosed(canvasElement);
    },
};

/** Escape drops what was ticked; Clear clears the boxes without applying. */
export const Staging = {
    render: () => <SessionsBar />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Filters' }));
        let menu = await openMenu(canvasElement);
        await userEvent.click(within(menu).getByRole('checkbox', { name: 'Lincoln Middle' }));
        await userEvent.keyboard('{Escape}');
        await menuClosed(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Filters' }), 'nothing applied').toBeInTheDocument();

        await userEvent.click(canvas.getByRole('button', { name: 'Filters' }));
        menu = await openMenu(canvasElement);
        await expect(within(menu).getByRole('checkbox', { name: 'Lincoln Middle' }), 'the next open starts from what is applied')
            .not.toBeChecked();
        await userEvent.click(within(menu).getByRole('checkbox', { name: 'Lincoln Middle' }));
        await userEvent.click(within(menu).getByRole('button', { name: 'Apply' }));
        await menuClosed(canvasElement);
        await expect(canvas.getAllByRole('listitem')).toHaveLength(2);

        await userEvent.click(canvas.getByRole('button', { name: 'Filters, 1 applied' }));
        menu = await openMenu(canvasElement);
        await expect(within(menu).getByRole('checkbox', { name: 'Lincoln Middle' })).toBeChecked();
        await userEvent.click(within(menu).getByRole('button', { name: 'Clear' }));
        await expect(within(menu).getByRole('checkbox', { name: 'Lincoln Middle' })).not.toBeChecked();
        await expect(canvas.getAllByRole('listitem'), 'Clear does not apply').toHaveLength(2);
        await userEvent.click(within(menu).getByRole('button', { name: 'Apply' }));
        await menuClosed(canvasElement);
        await expect(canvas.getAllByRole('listitem')).toHaveLength(4);
        await expect(canvas.getByRole('button', { name: 'Filters' })).toBeInTheDocument();
    },
};

/** Four or more categories stack, at 3-col or up to 4-col. */
export const Stacked = {
    render: () => (
        <div style={{ ...pad, minHeight: DEMO_SIZE.minHeightTall }}>
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

/** The menu opens 4 under the Filter icon, its end edge on the trigger's; compact Clear and Apply sit at the end of the bottom row. */
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
        await expect(menuBox.top - triggerBox.bottom, 'offset 4').toBeCloseTo(tokenLength(canvasElement, '--popup-offset'), 0);

        const clear = within(menu).getByRole('button', { name: 'Clear' });
        const apply = within(menu).getByRole('button', { name: 'Apply' });
        await expect(clear.className, 'Clear is Subtle').toContain('subtle');
        await expect(apply.className, 'Apply is Default, no Primary').toContain('default');
        await expect(clear.getBoundingClientRect().height, 'compact is 24').toBeCloseTo(tokenLength(canvasElement, '--control-sm'), 0);
        await expect(apply.getBoundingClientRect().right, 'at the end').toBeLessThan(menuBox.right);
        await expect(clear.getBoundingClientRect().left, 'Clear then Apply').toBeLessThan(apply.getBoundingClientRect().left);
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

/** Wrap: an option longer than its column takes more lines beside its checkbox, and the menu stays inside the window. */
export const Overflow = {
    render: () => (
        <div style={pad}>
            <FilterMenu
                id="filter-menu-overflow"
                label="Filters"
                defaultOpen
                width="3-col"
                categories={[
                    { id: 'site', label: 'Site', options: [LONG_SCHOOL, 'Lincoln Middle'] },
                    { id: 'format', label: 'Format', options: ['Online', 'In person'] },
                ]}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const menu = await openMenu(canvasElement);
        const doc = canvasElement.ownerDocument;
        await expectNoSilentClip(menu);
        await expect(menu.scrollWidth).toBeLessThanOrEqual(menu.clientWidth + 1);
        await expect(menu.getBoundingClientRect().right).toBeLessThanOrEqual(doc.documentElement.clientWidth);
        await expect(menu).toHaveTextContent(LONG_SCHOOL);
        const options = within(menu).getAllByRole('checkbox');
        await expect(options).toHaveLength(4);
        for (const option of options) await expect(option.getBoundingClientRect().width).toBeGreaterThan(0);
        await userEvent.keyboard('{Escape}');
        await menuClosed(canvasElement);
    },
};
