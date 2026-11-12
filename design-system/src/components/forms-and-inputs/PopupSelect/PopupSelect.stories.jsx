import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { FilterButton } from '../FilterButton/FilterButton';
import PopupSelect, { POPUP_SELECT_PLACEMENTS, POPUP_SELECT_SPACINGS } from './PopupSelect';

const STATUSES = ['Upcoming', 'Completed', 'Canceled'];

const SESSIONS = [
    { name: 'Algebra I with Maya', status: 'Upcoming' },
    { name: 'Geometry with Leo', status: 'Upcoming' },
    { name: 'Reading with Ava', status: 'Completed' },
    { name: 'Biology with Sam', status: 'Canceled' },
];

const SUBJECTS = [
    'Algebra I', 'Algebra II', 'Geometry', 'Precalculus', 'Calculus', 'Statistics',
    'Biology', 'Chemistry', 'Physics', 'Reading', 'Writing', 'History',
];

const pad = { padding: 'var(--space-300)', minHeight: 'calc(var(--space-400) * 7)' };
const bar = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--inline-md)' };

/** The open menu, found in the document it portals to. */
const openMenu = async (canvasElement) => {
    const doc = canvasElement.ownerDocument;
    await waitFor(() => expect(doc.querySelector('.plus-popup-select')).not.toBeNull());
    const menu = doc.querySelector('.plus-popup-select');
    await waitFor(() => expect(menu.contains(doc.activeElement)).toBe(true));
    return menu;
};

const menuClosed = (canvasElement) => waitFor(
    () => expect(canvasElement.ownerDocument.querySelector('.plus-popup-select')).toBeNull(),
);

export default {
    title: 'Components/Forms and inputs/Popup select',
    component: PopupSelect,
    tags: ['!dev', '!autodocs', 'new'],
    parameters: {
        docs: { toc: { title: 'On this page' } },
    },
    argTypes: {
        label: { control: 'text', table: { category: 'Content' } },
        options: { control: 'object', table: { category: 'Content' } },
        searchPlaceholder: { control: 'text', table: { category: 'Content' } },
        placement: { control: 'inline-radio', options: POPUP_SELECT_PLACEMENTS, table: { category: 'Layout' } },
        spacing: { control: 'inline-radio', options: POPUP_SELECT_SPACINGS, table: { category: 'Design' } },
        isSearchable: { control: 'boolean', table: { category: 'Behavior' } },
        trigger: { table: { disable: true } },
        value: { table: { disable: true } },
        onChange: { table: { disable: true } },
        onOpenChange: { table: { disable: true } },
    },
    args: {
        label: 'Status',
        options: STATUSES,
        placement: 'bottom-start',
        spacing: 'default',
        isSearchable: false,
    },
};

/**
 * The view switch under page tabs: the labeled trigger, a short list, and
 * the content under it swapped in place on a pick.
 */
const ViewSwitch = () => {
    const [status, setStatus] = useState('Upcoming');
    const shown = SESSIONS.filter((session) => session.status === status);
    return (
        <div style={pad}>
            <PopupSelect
                label="Status"
                options={STATUSES}
                value={status}
                onChange={setStatus}
                placement="bottom-start"
                isSearchable={false}
            />
            <ul id="popup-select-sessions" aria-live="polite">
                {shown.map((session) => <li key={session.name}>{session.name}</li>)}
            </ul>
        </div>
    );
};

export const Overview = {
    parameters: { docs: { source: { language: 'jsx', code: webAppSourceSnippets.popupSelect } } },
    render: () => <ViewSwitch />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { name: 'Status: Upcoming' });
        await expect(trigger.querySelector('.fa-chevron-down')).not.toBeNull();
        await expect(canvas.getAllByRole('listitem')).toHaveLength(2);

        await userEvent.click(trigger);
        const menu = await openMenu(canvasElement);
        const list = within(menu).getByRole('listbox', { name: 'Status' });
        await expect(within(list).getByRole('option', { name: 'Upcoming' })).toHaveAttribute('aria-selected', 'true');

        await userEvent.click(within(list).getByRole('option', { name: 'Completed' }));
        await menuClosed(canvasElement);
        const picked = canvas.getByRole('button', { name: 'Status: Completed' });
        await expect(canvas.getAllByRole('listitem')).toHaveLength(1);
        await expect(canvas.getByText('Reading with Ava')).toBeInTheDocument();
        await waitFor(() => expect(picked).toHaveFocus());
    },
};

/** Arrow keys walk the list, Enter picks and closes, Escape closes and keeps the value. */
export const Keyboard = {
    render: () => <ViewSwitch />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        canvas.getByRole('button', { name: 'Status: Upcoming' }).focus();
        await userEvent.keyboard('{Enter}');
        await openMenu(canvasElement);
        await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
        await menuClosed(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Status: Canceled' })).toBeInTheDocument();

        await userEvent.keyboard('{Enter}');
        await openMenu(canvasElement);
        await userEvent.keyboard('{ArrowUp}{Escape}');
        await menuClosed(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Status: Canceled' })).toHaveFocus();
    },
};

/**
 * A filter in a section's view bar, with a trigger of its own. A trigger at
 * the start of the bar opens `bottom-start`; one at the end opens `bottom-end`.
 */
export const Placement = {
    render: () => {
        const Bar = () => {
            const [subject, setSubject] = useState(null);
            const [sort, setSort] = useState('Newest');
            return (
                <div style={{ ...pad, ...bar }}>
                    <PopupSelect
                        label="Subject"
                        options={SUBJECTS}
                        value={subject}
                        onChange={setSubject}
                        placement="bottom-start"
                        defaultOpen
                        id="popup-select-start"
                        trigger={<FilterButton text="Subject" trailingMetric={subject ? 1 : undefined} />}
                    />
                    <PopupSelect
                        label="Sort"
                        options={['Newest', 'Oldest', 'Name']}
                        value={sort}
                        onChange={setSort}
                        placement="bottom-end"
                        isSearchable={false}
                    />
                </div>
            );
        };
        return <Bar />;
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const start = canvas.getByRole('button', { name: 'Subject' });
        const menu = await openMenu(canvasElement);
        const startBox = start.getBoundingClientRect();
        const menuBox = menu.getBoundingClientRect();
        await expect(menuBox.left, 'start edge meets the trigger').toBeCloseTo(startBox.left, 0);
        await expect(menuBox.top - startBox.bottom, 'offset 4').toBeCloseTo(tokenLength(canvasElement, '--popover-offset'), 0);
        await expect(menuBox.width, 'at least the trigger').toBeGreaterThanOrEqual(startBox.width);
        await expect(menuBox.width, 'never under 160').toBeGreaterThanOrEqual(tokenLength(canvasElement, '--popup-min-width'));
        await userEvent.keyboard('{Escape}');
        await menuClosed(canvasElement);

        const end = canvas.getByRole('button', { name: 'Sort: Newest' });
        await userEvent.click(end);
        const endMenu = await openMenu(canvasElement);
        await expect(endMenu.getBoundingClientRect().right, 'end edge meets the trigger')
            .toBeCloseTo(end.getBoundingClientRect().right, 0);
        await userEvent.keyboard('{Escape}');
        await menuClosed(canvasElement);
    },
};

/** A long list keeps its search: typing filters the rows, and Enter picks the first match. */
export const Searchable = {
    render: () => {
        const Demo = () => {
            const [subject, setSubject] = useState(null);
            return (
                <div style={{ ...pad, minHeight: 'calc(var(--space-400) * 12)' }}>
                    <PopupSelect
                        label="Subject"
                        options={SUBJECTS}
                        value={subject}
                        onChange={setSubject}
                        placement="bottom-start"
                    />
                </div>
            );
        };
        return <Demo />;
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Subject' }));
        const menu = await openMenu(canvasElement);
        const search = within(menu).getByRole('combobox', { name: 'Search subject' });
        await expect(search).toHaveFocus();
        await userEvent.type(search, 'alg');
        await waitFor(() => expect(within(menu).getAllByRole('option')).toHaveLength(2));
        await userEvent.keyboard('{Enter}');
        await menuClosed(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Subject: Algebra I' })).toBeInTheDocument();
    },
};

/** Compact draws a 24 trigger and 32 rows, for a dense bar. */
export const Spacing = {
    render: () => (
        <div style={{ ...pad, display: 'flex', gap: 'var(--inline-md)', alignItems: 'flex-start' }}>
            <PopupSelect label="Status" options={STATUSES} defaultValue="Upcoming" isSearchable={false} placement="bottom-start" />
            <PopupSelect label="Status" options={STATUSES} defaultValue="Upcoming" isSearchable={false} placement="bottom-start" spacing="compact" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const [regular, compact] = within(canvasElement).getAllByRole('button', { name: 'Status: Upcoming' });
        await expect(regular.getBoundingClientRect().height).toBe(tokenLength(canvasElement, '--item-height-md'));
        await expect(compact.getBoundingClientRect().height).toBe(tokenLength(canvasElement, '--item-height-sm'));
    },
};

export const Interactive = {
    render: (args) => {
        const Demo = () => {
            const [picked, setPicked] = useState(args.options?.[0]);
            return (
                <div style={pad}>
                    <PopupSelect {...args} value={picked} onChange={setPicked} />
                </div>
            );
        };
        return <Demo />;
    },
    parameters: { docs: { source: { language: 'jsx', code: webAppSourceSnippets.popupSelect } } },
};
