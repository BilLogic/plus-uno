import React, { useMemo, useState } from 'react';

import {
    Avatar,
    Button,
    CountTag,
    EmptyState,
    Heading,
    IconButton,
    NotificationItem,
    Sidebar,
    StaticTable,
    StatusTag,
    Tabs,
    Tile,
} from '@/components';
import {
    Frame,
    Section,
    PanelBody,
    PanelCloseAction,
    PanelContainer,
    PanelHeader,
    PanelOverlay,
} from '@/templates';
import { DemoPageHeader } from '../../templates/Page/pageDemo.jsx';
import { WINDOW_HEIGHT } from '@/storybook-docs/lib/multi-step-task.jsx';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';

/**
 * The Inbox picture the Notifications pattern and the Panel template both show:
 * the Sidebar's bell opens the Inbox as a start-side PanelOverlay, 360 wide
 * (`--inbox-width`), over the page with no Blanket. It is drawn with the real
 * Frame, Sidebar, Panel parts and NotificationItem.
 */

/** Inside BrowserWindow (2px border), 1080 leaves 1078 >= 1024 so the Frame docks the Sidebar. */
export const INBOX_STAGE = 1080; // docs-literal: stage width in px

const noop = () => {};

const INBOX_SEED = [
    {
        id: 'ana',
        day: 'Today',
        kind: 'person',
        name: 'Ana Ruiz',
        title: "Ana Ruiz moved Thursday's session",
        meta: 'Sessions · 2m',
        unread: true,
        href: '#session-thu',
    },
    {
        id: 'notes-due',
        day: 'Today',
        kind: 'system',
        icon: 'calendar-check',
        color: 'blue',
        title: 'Session notes are due Friday at 5:00 PM',
        meta: 'Compliance · 1h',
        unread: true,
        href: '#notes-due',
    },
    {
        id: 'ben',
        day: 'Yesterday',
        kind: 'person',
        name: 'Ben Okafor',
        color: 'purple',
        title: 'Ben Okafor mentioned you in a session note',
        meta: 'Notes · Yesterday',
        unread: true,
        href: '#note-ben',
    },
    {
        id: 'chloe',
        day: 'Yesterday',
        kind: 'person',
        name: 'Chloe Tran',
        color: 'teal',
        title: 'Chloe Tran confirmed Friday at 3:30 PM',
        meta: 'Sessions · Yesterday',
        unread: false,
        href: '#session-fri',
    },
];

const DAYS = ['Today', 'Yesterday'];

const SESSIONS_BEHIND = [
    ['Ana Ruiz', 'Thu 4:30 PM', { content: <StatusTag appearance="success">Confirmed</StatusTag> }],
    ['Ben Okafor', 'Thu 5:00 PM', { content: <StatusTag appearance="warning">Needs a tutor</StatusTag> }],
    ['Chloe Tran', 'Fri 3:30 PM', { content: <StatusTag appearance="success">Confirmed</StatusTag> }],
];

const actorFor = (item) => (
    item.kind === 'system'
        ? <Tile icon={item.icon} size={32} color={item.color} />
        : <Avatar name={item.name} size={32} color={item.color} />
);

const SIDEBAR_GROUPS = [
    {
        id: 'home',
        items: [
            { id: 'home', text: 'Home', icon: 'house' },
            { id: 'slack', text: 'Slack', icon: 'fa-brands fa-slack', href: '#slack', external: true },
        ],
    },
    {
        id: 'toolkit',
        title: 'Toolkit',
        collapsible: true,
        items: [
            { id: 'sessions', text: 'Sessions', icon: 'video' },
            { id: 'students', text: 'Students', icon: 'users' },
            { id: 'notes', text: 'Session notes', icon: 'file-lines' },
        ],
    },
];

const groupByDay = (items) =>
    DAYS
        .map((day) => ({ day, items: items.filter((item) => item.day === day) }))
        .filter((group) => group.items.length > 0);

const InboxDayList = ({ items, onMarkRead }) => {
    const groups = groupByDay(items);
    if (groups.length === 0) {
        return (
            <EmptyState
                spacing="compact"
                icon="circle-check"
                header="You are all caught up."
                description="New updates from your sessions and supervisors will show up here."
            />
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
            {groups.map((group) => (
                <section key={group.day} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                    <div style={{ paddingInline: 'var(--pad-x-md)' }}>
                        <Heading size="xxs">{group.day}</Heading>
                    </div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                        {group.items.map((item) => (
                            <li key={item.id}>
                                <NotificationItem
                                    actor={actorFor(item)}
                                    title={item.title}
                                    meta={item.meta}
                                    unread={item.unread}
                                    href={item.href}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        if (item.unread) onMarkRead(item.id);
                                    }}
                                    onMarkRead={() => onMarkRead(item.id)}
                                />
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
};

/** The Inbox Panel itself: 360px (--inbox-width), Mark all as read, settings, close, Unread/All tabs and day groups. */
export const NotificationsInboxPanel = ({
    items,
    onMarkRead,
    onMarkAllRead,
    onSettings = noop,
    onClose = noop,
}) => {
    const [tab, setTab] = useState('unread');
    const unreadItems = items.filter((item) => item.unread);
    const unreadCount = unreadItems.length;

    return (
        <PanelContainer>
            <PanelHeader
                title="Inbox"
                actions={(
                    <>
                        {unreadCount > 0 ? (
                            <Button
                                text="Mark all as read"
                                appearance="subtle"
                                spacing="compact"
                                onClick={onMarkAllRead}
                            />
                        ) : null}
                        <IconButton
                            icon="gear"
                            label="Notification settings"
                            tooltip="Notification settings"
                            appearance="subtle"
                            spacing="compact"
                            onClick={onSettings}
                        />
                        <PanelCloseAction onClick={onClose} />
                    </>
                )}
            />
            <Tabs
                activeKey={tab}
                onSelect={setTab}
                style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, width: '100%' }}
            >
                <Tabs.Tab eventKey="unread">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--inline-sm)' }}>
                        <span>Unread</span>
                        {unreadCount > 0 ? <CountTag value={unreadCount} /> : null}
                    </span>
                </Tabs.Tab>
                <Tabs.Tab eventKey="all">All</Tabs.Tab>

                <Tabs.Panel eventKey="unread" style={{ flex: '1 1 auto', minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column' }}>
                    <PanelBody style={{ padding: 'var(--pad-x-md)' }}>
                        <InboxDayList items={unreadItems} onMarkRead={onMarkRead} />
                    </PanelBody>
                </Tabs.Panel>

                <Tabs.Panel eventKey="all" style={{ flex: '1 1 auto', minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column' }}>
                    <PanelBody style={{ padding: 'var(--pad-x-md)' }}>
                        <InboxDayList items={items} onMarkRead={onMarkRead} />
                    </PanelBody>
                </Tabs.Panel>
            </Tabs>
        </PanelContainer>
    );
};

/** The bell beside the account name opens the Inbox beside the Sidebar: a start-side PanelOverlay, over the page with no Blanket. */
export const InboxInSidebar = ({ defaultOpen = true, initialAllRead = false }) => {
    const [open, setOpen] = useState(defaultOpen);
    const [host, setHost] = useState(null);
    const [items, setItems] = useState(() => (
        initialAllRead ? INBOX_SEED.map((item) => ({ ...item, unread: false })) : INBOX_SEED
    ));

    const unreadCount = items.filter((item) => item.unread).length;

    const markOneRead = (id) => {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, unread: false } : item)));
    };

    const markAllRead = () => {
        setItems((prev) => prev.map((item) => (item.unread ? { ...item, unread: false } : item)));
    };

    // The bell lives inside the Sidebar's account row; the overlay reads it when it must return focus.
    const bellRef = useMemo(() => ({
        get current() { return host?.querySelector('.plus-sidebar-account__bell') ?? null; },
    }), [host]);

    return (
        <BrowserWindow address="app.plus.org/sessions" height={WINDOW_HEIGHT}>
            <div ref={setHost} style={{ position: 'relative', height: '100%' }}>
                <Frame
                    sidebar={(
                        <Sidebar
                            groups={SIDEBAR_GROUPS}
                            activeId="sessions"
                            inboxCount={unreadCount}
                            isInboxOpen={open}
                            onInbox={() => setOpen((prev) => !prev)}
                            account={{ name: 'Maya Chen', role: 'Tutor' }}
                            storageKey={null}
                        />
                    )}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
                        <DemoPageHeader title="Sessions" description="This week" />
                        <Section title="Upcoming sessions">
                            <StaticTable
                                headers={['Student', 'Time', 'Status']}
                                rows={SESSIONS_BEHIND}
                            />
                        </Section>
                    </div>
                </Frame>

                {host ? (
                    <PanelOverlay
                        isOpen={open}
                        onOpenChange={setOpen}
                        placement="start"
                        label="Inbox"
                        container={host}
                        triggerRef={bellRef}
                    >
                        <NotificationsInboxPanel
                            items={items}
                            onMarkRead={markOneRead}
                            onMarkAllRead={markAllRead}
                            onClose={() => setOpen(false)}
                        />
                    </PanelOverlay>
                ) : null}
            </div>
        </BrowserWindow>
    );
};
