import React, { useEffect, useRef, useState } from 'react';

import {
    Avatar,
    Banner,
    Button,
    CountTag,
    EmptyState,
    Flag,
    FlagGroup,
    Heading,
    IconButton,
    NotificationItem,
    PanelBody,
    PanelCloseAction,
    PanelContainer,
    PanelHeader,
    SectionMessage,
    StaticTable,
    StatusTag,
    Tabs,
    Tile,
} from '@/components';
import { Frame, PatternSection, PatternSidebar } from '@/patterns';
import { DemoPageHeader } from '../../../patterns/Page/pageDemo.jsx';
import { WINDOW_HEIGHT } from '@/storybook-docs/lib/focused-task.jsx';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';
import { StudentsTable, ViewBar } from '@/storybook-docs/lib/view-bar.jsx';

/**
 * The Notifications pattern's examples, drawn with the real Flag, Banner,
 * SectionMessage, NotificationItem and Panel.
 *
 *   FlagTopRight      one Flag at the top right, over the page
 *   FlagStack         several Flags, newest on top
 *   FlagWithActions   a Flag with up to two verbs
 *   FlagUndo          the timed Undo Flag, then the plain "restored" Flag
 *   MustStay          a SectionMessage with dismiss off, by the action it informs
 *   InboxInSidebar    the 360px (--inbox-width) Inbox Panel beside the Sidebar
 *   TierPicture       one Banner at the Frame, Page or Section tier
 *   SeverityRow       the four statuses on SectionMessage
 *   FlagDo / FlagDont, BannerDo / BannerDont  the do and don't pairs
 */

/** The width a picture lays out at, in px: docs geometry. */
export const STAGE = 1024; // docs-literal: stage width in px

/** Inside BrowserWindow (2px border), 1080 leaves 1078 >= 1024 so the Frame docks the Sidebar. */
export const INBOX_STAGE = 1080; // docs-literal: stage width in px

/** The width the small pictures lay out at, so their words stay legible at card size. Docs geometry, in px. */
export const PLACE_STAGE = 600; // docs-literal: card stage width in px

/** Docs geometry, in px: the window height of the picture whose Flag sits over the page; the others hug their content. */
const WINDOW = 260; // docs-literal: window height in px

const noop = () => {};
const pad = { padding: 'var(--page-pad)', boxSizing: 'border-box' };

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

const buildSidebarGroups = (unreadCount) => [
    {
        id: 'home',
        items: [
            { id: 'home', text: 'Home', icon: 'house' },
            {
                id: 'inbox',
                text: 'Inbox',
                icon: 'bell',
                ...(unreadCount > 0
                    ? {
                        count: unreadCount,
                        countLabel: `${unreadCount} unread ${unreadCount === 1 ? 'notification' : 'notifications'}`,
                    }
                    : {}),
            },
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
                        <Heading size="xxsmall">{group.day}</Heading>
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
        <PanelContainer width="var(--inbox-width)" aria-label="Inbox">
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
                        {unreadCount > 0 ? <CountTag value={unreadCount} spacing="compact" /> : null}
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

/** The Inbox opening from the Sidebar at the start, 360px wide (--inbox-width), over the page with no Backdrop. */
export const InboxInSidebar = ({ defaultOpen = true, initialAllRead = false }) => {
    const [open, setOpen] = useState(defaultOpen);
    const [items, setItems] = useState(() => (
        initialAllRead ? INBOX_SEED.map((item) => ({ ...item, unread: false })) : INBOX_SEED
    ));
    const rootRef = useRef(null);
    const inboxWrapRef = useRef(null);

    const unreadCount = items.filter((item) => item.unread).length;

    const markOneRead = (id) => {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, unread: false } : item)));
    };

    const markAllRead = () => {
        setItems((prev) => prev.map((item) => (item.unread ? { ...item, unread: false } : item)));
    };

    const findInboxTrigger = () => {
        const buttons = rootRef.current?.querySelectorAll('nav[aria-label="Main"] button') ?? [];
        return Array.from(buttons).find((btn) => btn.textContent?.startsWith('Inbox')) ?? null;
    };

    const closeFromInside = () => {
        const wasInside = inboxWrapRef.current?.contains(document.activeElement);
        setOpen(false);
        if (wasInside) {
            findInboxTrigger()?.focus();
        }
    };

    useEffect(() => {
        if (!open) return undefined;

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.stopPropagation();
                closeFromInside();
            }
        };

        const onPointerDown = (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;
            if (inboxWrapRef.current?.contains(target)) return;
            const clickedSidebarInbox = Boolean(
                target.closest('nav[aria-label="Main"] button')?.textContent?.startsWith('Inbox')
            );
            if (clickedSidebarInbox) return;
            setOpen(false);
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('pointerdown', onPointerDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('pointerdown', onPointerDown);
        };
    }, [open]);

    return (
        <BrowserWindow address="app.plus.org/sessions" height={WINDOW_HEIGHT}>
            <div ref={rootRef} style={{ position: 'relative', height: '100%' }}>
                <Frame
                    sidebar={(
                        <PatternSidebar
                            groups={buildSidebarGroups(unreadCount)}
                            activeId={open ? 'inbox' : 'sessions'}
                            onSelect={(id) => {
                                if (id === 'inbox') setOpen((prev) => !prev);
                            }}
                            account={{ name: 'Maya Chen', role: 'tutor' }}
                            storageKey={null}
                            label="Main"
                        />
                    )}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
                        <DemoPageHeader title="Sessions" description="This week" />
                        <PatternSection title="Upcoming sessions">
                            <StaticTable
                                headers={['Student', 'Time', 'Status']}
                                rows={SESSIONS_BEHIND}
                            />
                        </PatternSection>
                    </div>
                </Frame>

                {open ? (
                    <div
                        ref={inboxWrapRef}
                        style={{
                            position: 'absolute',
                            insetBlock: 0,
                            insetInlineStart: 'var(--frame-sidebar-width)',
                            zIndex: 'var(--layer-dialog)',
                            display: 'flex',
                            boxShadow: 'var(--ds-shadow-overlay)',
                            borderInlineEnd: 'var(--border-default) solid var(--ds-border)',
                        }}
                    >
                        <NotificationsInboxPanel
                            items={items}
                            onMarkRead={markOneRead}
                            onMarkAllRead={markAllRead}
                            onClose={closeFromInside}
                        />
                    </div>
                ) : null}
            </div>
        </BrowserWindow>
    );
};

/** A Flag stack at the top right, held in the picture. */
const TopRight = ({ children }) => (
    <div style={{ ...pad, display: 'flex', justifyContent: 'flex-end' }}>
        <FlagGroup position="top-end" containerPosition="static">
            {children}
        </FlagGroup>
    </div>
);

/** One passing notice: the title names the event, one line gives the next step. */
export const FlagTopRight = () => (
    <TopRight>
        <Flag icon="circle-check" title="Session logged" autohide={false} show>
            Maya's supervisor will see it Friday.
        </Flag>
    </TopRight>
);

/** Several Flags, newest on top, each its own message. A stack is all default flags, each with its ×. */
export const FlagStack = () => (
    <TopRight>
        <Flag icon="circle-check" title="Note saved" autohide={false} show>
            Maya can read it now.
        </Flag>
        <Flag title="Schedule updated" autohide={false} show>
            Thursday moved to 4:30 PM.
        </Flag>
    </TopRight>
);

/** A Flag with two verbs. */
export const FlagWithActions = () => (
    <TopRight>
        <Flag
            icon="circle-check"
            title="Session deleted"
            autohide={false}
            show
            actions={[{ text: 'Undo', onClick: noop }, { text: 'View sessions', onClick: noop }]}
        >
            Lincoln Middle on Tuesday.
        </Flag>
    </TopRight>
);

/** Undo: a timed Flag with Undo first, then the plain Flag that replaces it once Undo is pressed. */
export const FlagUndo = () => (
    <TopRight>
        <Flag title="Session deleted" timer delay={60000} show actions={[{ text: 'Undo', onClick: noop }]} />
        <Flag icon="circle-check" title="Session restored" autohide={false} show />
    </TopRight>
);

/** A SectionMessage that stays: dismiss off, placed by the action it informs. */
export const MustStay = () => (
    <div style={{ ...pad, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', maxInlineSize: 'var(--card-min-width-lg)' }}>
        <SectionMessage appearance="warning" title="Sessions can't be moved after 3:00 PM" dismissible={false}>
            Move Thursday's session before then, or ask a supervisor.
        </SectionMessage>
    </div>
);

/** The four statuses on one carrier: information, success, warning, danger. The words say it too. */
export const SeverityRow = () => (
    <div style={{ ...pad, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
        <SectionMessage appearance="info" title="Schedule updated" dismissible={false}>Thursday moved to 4:30 PM.</SectionMessage>
        <SectionMessage appearance="success" title="Session logged" dismissible={false}>Maya's supervisor will see it Friday.</SectionMessage>
        <SectionMessage appearance="warning" title="Notes are due Friday" dismissible={false}>Two sessions have no note yet.</SectionMessage>
        <SectionMessage appearance="danger" title="Couldn't save your note" dismissible={false}>Check your connection and try again.</SectionMessage>
    </div>
);

/** The Frame tier: system news across the whole width, above the page. The Frame's own banner slot is Planned, so the picture sets the Banner above the Frame's content. */
export const TierFrame = () => (
    <BrowserWindow address="app.plus.org/sessions">
        <Banner appearance="announcement">Scheduled maintenance Saturday 2–4 AM ET.</Banner>
        <div style={pad}>
            <DemoPageHeader title="Sessions" description="This week" />
        </div>
    </BrowserWindow>
);

/** The Page tier: under the page header, about this page. */
export const TierPage = () => (
    <BrowserWindow address="app.plus.org/sessions">
        <div style={pad}>
            <DemoPageHeader title="Sessions" description="This week" />
            <Banner appearance="warning">Tutoring sessions move to the new calendar on Friday.</Banner>
        </div>
    </BrowserWindow>
);

/** The Section tier: at the top of one collection, about that collection. */
export const TierSection = () => (
    <BrowserWindow address="app.plus.org/students">
        <div style={pad}>
            <DemoPageHeader title="Students" description="Lincoln Middle" />
            <PatternSection title="Students" tabs={<ViewBar views={['All students']} filters={null} primary={null} />}>
                <Banner appearance="warning">Two students have no guardian contact on file.</Banner>
                <StudentsTable count={2} />
            </PatternSection>
        </div>
    </BrowserWindow>
);

/** Do: a finished action on the default Flag, the event in the title and the next step below. */
export const FlagDo = () => (
    <TopRight>
        <Flag icon="circle-check" title="Session logged" autohide={false} show>Maya's supervisor will see it Friday.</Flag>
    </TopRight>
);

/** Don't: a decision in a Flag, which is gone before it is answered. */
export const FlagDont = () => (
    <TopRight>
        <Flag title="Move this session to 4:30 PM?" autohide={false} show actions={[{ text: 'Move', onClick: noop }, { text: 'Keep', onClick: noop }]} />
    </TopRight>
);

/** Do: one Banner, one line, at the tier it concerns. */
export const BannerDo = () => (
    <div style={pad}>
        <Banner appearance="danger">We lost the connection. Your work is kept on this device.</Banner>
    </div>
);

/** Don't: two Banners stacked, pushing the page down. */
export const BannerDont = () => (
    <div style={pad}>
        <Banner appearance="warning">Tutoring sessions move to the new calendar on Friday.</Banner>
        <Banner appearance="danger">We lost the connection. Your work is kept on this device.</Banner>
    </div>
);

/** A page whose Flag has found the person at the top right: the page behind them. */
export const FlagOnPage = () => (
    <BrowserWindow address="app.plus.org/sessions" height={WINDOW}>
        <div style={pad}>
            <DemoPageHeader title="Sessions" description="This week" />
            <TopRight>
                <Flag icon="circle-check" title="Session logged" autohide={false} show>
                    Maya's supervisor will see it Friday.
                </Flag>
            </TopRight>
        </div>
    </BrowserWindow>
);
