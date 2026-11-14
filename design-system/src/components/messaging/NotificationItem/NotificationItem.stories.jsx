import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { probe, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { Avatar, Tile } from '@/components';
import NotificationItem from './NotificationItem';

const listStyle = {
    maxWidth: 'var(--inbox-width)',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--stack-sm)',
};

export default {
    title: 'Components/Messaging/Notification item',
    component: NotificationItem,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A single-link row for an update that arrived over time, with an Avatar or Tile actor, who and what in the title, context and time in meta, an unread dot and fill, and a Mark as read action on hover.',
            },
        },
    },
    argTypes: {
        actor: { control: false, table: { category: 'Content' } },
        title: { control: 'text', table: { category: 'Content' } },
        meta: { control: 'text', table: { category: 'Content' } },
        unread: { control: 'boolean', table: { category: 'State' } },
        href: { control: 'text', table: { category: 'Navigation' } },
        onMarkRead: { control: false, table: { category: 'Events' } },
        onClick: { control: false, table: { category: 'Events' } },
        style: { table: { disable: true } },
        className: { control: false, table: { disable: true, category: 'Development' } },
        id: { control: false, table: { disable: true, category: 'Development' } },
        testId: { control: false, table: { disable: true, category: 'Development' } },
    },
};

const INITIAL_ITEMS = [
    {
        id: 'ana',
        actor: <Avatar name="Ana Ruiz" size={32} />,
        title: "Ana Ruiz moved Thursday's session",
        meta: 'Sessions · 2m',
        unread: true,
        href: '#session-thu',
    },
    {
        id: 'system',
        actor: <Tile icon="calendar-check" size={32} color="blue" />,
        title: 'Session notes are due Friday at 5:00 PM',
        meta: 'Compliance · 1h',
        unread: true,
        href: '#notes-due',
    },
    {
        id: 'chloe',
        actor: <Avatar name="Chloe Tran" size={32} color="teal" />,
        title: 'Chloe Tran confirmed Friday at 3:30 PM',
        meta: 'Sessions · Yesterday',
        unread: false,
        href: '#session-fri',
    },
];

const OverviewList = () => {
    const [items, setItems] = useState(INITIAL_ITEMS);
    const markRead = (id) => () => {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, unread: false } : item)));
    };
    return (
        <div style={listStyle}>
            {items.map((item) => (
                <NotificationItem
                    key={item.id}
                    actor={item.actor}
                    title={item.title}
                    meta={item.meta}
                    unread={item.unread}
                    href={item.href}
                    onClick={(event) => {
                        event.preventDefault();
                        markRead(item.id)();
                    }}
                    onMarkRead={markRead(item.id)}
                />
            ))}
        </div>
    );
};

export const Overview = {
    render: () => <OverviewList />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const rows = canvasElement.querySelectorAll('.plus-notification-item');
        await expect(rows).toHaveLength(3);
        for (const row of rows) {
            await expect(within(row).getAllByRole('link'), 'one link per row').toHaveLength(1);
        }
        const firstLink = within(rows[0]).getByRole('link');
        await expect(firstLink).toHaveAccessibleName(/unread/i);
        await userEvent.hover(rows[0]);
        await userEvent.click(within(rows[0]).getByRole('button', { name: 'Mark as read' }));
        await expect(within(rows[0]).getByRole('link')).not.toHaveAccessibleName(/unread/i);
    },
};

export const Actors = {
    render: () => (
        <div style={listStyle}>
            <NotificationItem
                actor={<Avatar name="Ana Ruiz" size={32} />}
                title="Ana Ruiz moved Thursday's session"
                meta="Sessions · 2m"
                unread
                href="#person-actor"
                onClick={(event) => event.preventDefault()}
                onMarkRead={() => {}}
            />
            <NotificationItem
                actor={<Tile icon="calendar-check" size={32} color="blue" />}
                title="Session notes are due Friday at 5:00 PM"
                meta="Compliance · 1h"
                unread
                href="#system-actor"
                onClick={(event) => event.preventDefault()}
                onMarkRead={() => {}}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expect(canvasElement.querySelector('.plus-avatar')).toBeInTheDocument();
        await expect(canvasElement.querySelector('.plus-tile')).toBeInTheDocument();
        await expect(within(canvasElement).getAllByRole('link')).toHaveLength(2);
    },
};

export const Unread = {
    render: () => (
        <div style={listStyle}>
            <NotificationItem
                actor={<Avatar name="Ana Ruiz" size={32} />}
                title="Ana Ruiz moved Thursday's session"
                meta="Sessions · 2m"
                unread
                href="#unread-item"
                onClick={(event) => event.preventDefault()}
                onMarkRead={() => {}}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const link = canvas.getByRole('link');
        const dot = canvasElement.querySelector('.plus-notification-item__dot');
        await expect(link).toHaveAccessibleName(/unread/i);
        await expect(getComputedStyle(link).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-selected'));
        await expect(dot).toBeInTheDocument();
        await expect(getComputedStyle(dot).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-brand-bold'));
    },
};

export const Read = {
    render: () => (
        <div style={listStyle}>
            <NotificationItem
                actor={<Avatar name="Chloe Tran" size={32} color="teal" />}
                title="Chloe Tran confirmed Friday at 3:30 PM"
                meta="Sessions · Yesterday"
                unread={false}
                href="#read-item"
                onClick={(event) => event.preventDefault()}
                onMarkRead={() => {}}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const link = canvas.getByRole('link');
        await expect(link).not.toHaveAccessibleName(/unread/i);
        await expect(canvasElement.querySelector('.plus-notification-item__dot')).toBeNull();
        await expect(canvas.queryByRole('button', { name: 'Mark as read' })).toBeNull();
    },
};

export const Hovered = {
    render: () => (
        <div style={listStyle}>
            <NotificationItem
                data-hovered=""
                actor={<Avatar name="Ben Okafor" size={32} color="purple" />}
                title="Ben Okafor mentioned you in a session note"
                meta="Notes · 1h"
                unread
                href="#hovered-item"
                onClick={(event) => event.preventDefault()}
                onMarkRead={() => {}}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const link = canvas.getByRole('link');
        const actions = canvasElement.querySelector('.plus-notification-item__actions');
        const dot = canvasElement.querySelector('.plus-notification-item__dot');
        await expect(getComputedStyle(link).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-selected-hovered'));
        await expect(getComputedStyle(actions).opacity).toBe('1');
        await expect(getComputedStyle(dot).opacity).toBe('0');
        await expect(canvas.getByRole('button', { name: 'Mark as read' })).toBeInTheDocument();
    },
};

export const Focused = {
    render: () => (
        <div style={listStyle}>
            <NotificationItem
                actor={<Avatar name="Ana Ruiz" size={32} />}
                title="Ana Ruiz moved Thursday's session"
                meta="Sessions · 2m"
                unread
                href="#focused-item"
                onClick={(event) => event.preventDefault()}
                onMarkRead={() => {}}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const link = canvas.getByRole('link');
        await userEvent.tab();
        if (document.activeElement !== link) link.focus();
        await expect(link).toHaveFocus();
        const actions = canvasElement.querySelector('.plus-notification-item__actions');
        await waitFor(() => expect(getComputedStyle(actions).opacity).toBe('1'));
    },
};

export const Pressed = {
    render: () => (
        <div style={listStyle}>
            <NotificationItem
                data-pressed=""
                actor={<Avatar name="Ana Ruiz" size={32} />}
                title="Ana Ruiz moved Thursday's session"
                meta="Sessions · 2m"
                unread
                href="#pressed-unread"
                onClick={(event) => event.preventDefault()}
                onMarkRead={() => {}}
            />
            <NotificationItem
                data-pressed=""
                actor={<Avatar name="Chloe Tran" size={32} color="teal" />}
                title="Chloe Tran confirmed Friday at 3:30 PM"
                meta="Sessions · Yesterday"
                unread={false}
                href="#pressed-read"
                onClick={(event) => event.preventDefault()}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const links = canvasElement.querySelectorAll('.plus-notification-item__link');
        await expect(getComputedStyle(links[0]).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-selected-pressed'));
        await expect(getComputedStyle(links[1]).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-neutral-subtle-pressed'));
    },
};

export const Motion = {
    render: () => (
        <div style={listStyle}>
            <NotificationItem
                actor={<Avatar name="Ana Ruiz" size={32} />}
                title="Ana Ruiz moved Thursday's session"
                meta="Sessions · 2m"
                unread
                href="#motion-item"
                onClick={(event) => event.preventDefault()}
                onMarkRead={() => {}}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const link = canvasElement.querySelector('.plus-notification-item__link');
        await expect(getComputedStyle(link).transitionTimingFunction).toBe(
            probe(link, 'transitionTimingFunction', 'var(--ds-motion-appearance-fast)')
        );
        const hasReducedMotionRule = Array.from(document.styleSheets).some((sheet) => {
            try {
                return Array.from(sheet.cssRules).some(
                    (rule) => rule instanceof CSSMediaRule && rule.conditionText.includes('prefers-reduced-motion: reduce')
                );
            } catch {
                return false;
            }
        });
        await expect(hasReducedMotionRule).toBe(true);
    },
};

export const Interactive = {
    args: {
        title: "Ana Ruiz moved Thursday's session",
        meta: 'Sessions · 2m',
        unread: true,
        href: '#interactive-item',
    },
    render: (args) => (
        <div style={listStyle}>
            <NotificationItem
                {...args}
                actor={<Avatar name="Ana Ruiz" size={32} />}
                onClick={(event) => event.preventDefault()}
                onMarkRead={() => {}}
            />
        </div>
    ),
};
